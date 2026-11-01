import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useFacetCatalogStore } from '@/stores/facetCatalogStore'
import { useUserStore } from '@/stores/userStore'
import { useAchievementStore } from '@/stores/achievementStore'
import { performFetch } from '@/stores/utils'
import catalog from '@/utils/hybridizer/starterCatalog.json'
import { localHybridizerStudies } from '@/utils/hybridizer/studyPersistence'

export type HybridizerIngredient = {
  key: string
  title: string
  taxonomy: string
  facetId?: number | null
  facetGroup?: string
  artState?: string
  sources?: [string, string]
  depth?: number
  status?: string
  artImageId?: number | null
  artJobId?: number | null
  imagePath?: string | null
  canRetry?: boolean
  isPublic?: boolean
}

export type HybridizerDiscovery = HybridizerIngredient & {
  sources: [string, string]
  depth: number
  createdAt: string
  status?: string
  artImageId?: number | null
  artJobId?: number | null
  imagePath?: string | null
}

export type HybridizerVersion = {
  jobId: number
  revision: number
  createdAt: string
  status: string
  imagePath: string | null
  artImageId: number | null
  isPrimary: boolean
}

const STARTERS = catalog.entries as HybridizerIngredient[]
const LEGACY_STORAGE_KEY = 'kind-robots-hybridizer-lab-studies-v1'
const STORAGE_KEY = 'kind-robots-hybridizer-lab-studies-v2'
const MAX_STUDY_DEPTH = 4

function pairKey(a: string, b: string): string {
  return JSON.stringify([a, b].sort())
}

function displayName(a: HybridizerIngredient, b: HybridizerIngredient): string {
  const names = [a.title, b.title].sort()
  if (names.includes('Banana') && names.includes('Cat')) return 'Bananacat'
  if (names.includes('Vampire') && names.includes('Bananacat'))
    return 'Vampire Bananacat'
  return names[0] + '–' + names[1] + ' Hybrid'
}

export const useHybridizerStore = defineStore('hybridizer', () => {
  const catalogStore = useFacetCatalogStore()
  const userStore = useUserStore()
  const achievementStore = useAchievementStore()
  const leftKey = ref('cat')
  const rightKey = ref('banana')
  const discoveries = ref<HybridizerDiscovery[]>([])
  const resultKey = ref<string | null>(null)
  const working = ref(false)
  const status = ref('Select two ingredients and activate the chamber.')
  const availableArt = ref<Record<string, string>>({})
  const pendingKeys = ref<string[]>([])
  const readyNotice = ref<HybridizerDiscovery | null>(null)
  const versions = ref<HybridizerVersion[]>([])
  const versionsFor = ref<string | null>(null)
  const canEditResult = ref(false)
  const versionBusy = ref(false)
  const enqueuing = new Set<string>()
  let pollTimer: ReturnType<typeof setInterval> | null = null

  const inputs = computed<HybridizerIngredient[]>(() => [
    ...STARTERS,
    ...discoveries.value,
  ])
  const byKey = computed(
    () => new Map(inputs.value.map((entry) => [entry.key, entry])),
  )
  const left = computed(() => byKey.value.get(leftKey.value) ?? null)
  const right = computed(() => byKey.value.get(rightKey.value) ?? null)
  const result = computed(() =>
    resultKey.value ? (byKey.value.get(resultKey.value) ?? null) : null,
  )
  const starterCount = STARTERS.length

  function scopedStorageKey() {
    return STORAGE_KEY + ':' + (userStore.authenticatedUserId ?? 'guest')
  }

  function save() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(
        scopedStorageKey(),
        JSON.stringify(
          localHybridizerStudies<HybridizerDiscovery>(discoveries.value),
        ),
      )
    } catch {
      status.value = 'This browser cannot save studies between visits.'
    }
  }

  function hydrate() {
    if (!import.meta.client) return
    try {
      // v1 mixed private server data across all accounts. Drop it rather
      // than displaying an earlier account's discoveries to the next user.
      localStorage.removeItem(LEGACY_STORAGE_KEY)
      const saved = JSON.parse(localStorage.getItem(scopedStorageKey()) || '[]')
      discoveries.value = localHybridizerStudies<HybridizerDiscovery>(
        saved,
        MAX_STUDY_DEPTH,
      )
    } catch {
      discoveries.value = []
    }
  }

  async function loadSharedStudies() {
    const viewerId = userStore.authenticatedUserId
    const response = await performFetch<HybridizerDiscovery[]>(
      '/api/hybridizer/fusions?take=100',
    )
    if (viewerId !== userStore.authenticatedUserId) return
    if (!response.success || !response.data) {
      status.value =
        'Shared library unavailable. Local studies remain accessible.'
      return
    }
    const merged = new Map<string, HybridizerDiscovery>()
    for (const entry of [...discoveries.value, ...response.data]) {
      if (entry.key && entry.title && entry.sources?.length === 2) {
        merged.set(entry.key, entry)
      }
    }
    discoveries.value = [...merged.values()].slice(-200)
    pendingKeys.value = [
      ...new Set([
        ...pendingKeys.value,
        ...response.data
          .filter(
            (entry) =>
              entry.artJobId &&
              entry.status !== 'READY' &&
              entry.status !== 'FAILED' &&
              entry.status !== 'CANCELLED',
          )
          .map((entry) => entry.key),
      ]),
    ]
    for (const entry of response.data.slice(0, 10)) {
      if (entry.artJobId && entry.key.startsWith('fusion:'))
        void refreshArtwork(entry.key)
    }
    save()
  }

  async function loadArtwork() {
    try {
      const records = await catalogStore.fetchCatalogSlice({
        taxonomies: ['ANIMAL', 'SPECIES', 'OTHER', 'ARCHETYPE'],
      })
      const imageMap: Record<string, string> = {}
      const byId = new Map(records.map((record) => [record.id, record]))
      for (const entry of inputs.value) {
        // A pinned starter uses its own Facet only: a title lookup could hand
        // "Orange" the COLOR swatch. Every starter is pinned (hybridizer t-006);
        // the title fallback stays for unpinned inputs.
        const matching =
          entry.facetId != null
            ? byId.get(entry.facetId)
            : records.find(
                (record) =>
                  record.title.toLowerCase() === entry.title.toLowerCase(),
              )
        if (matching?.imagePath) imageMap[entry.key] = matching.imagePath
      }
      availableArt.value = { ...availableArt.value, ...imageMap }
    } catch {
      status.value =
        'The Facet artwork library is unavailable; lab studies still work.'
    }
  }

  function imageFor(ingredient: HybridizerIngredient | null): string | null {
    return ingredient ? (availableArt.value[ingredient.key] ?? null) : null
  }

  // True while a starter's Facet art is queued but not yet delivered, so the
  // placeholder can say so instead of implying the art exists.
  function artPending(ingredient: HybridizerIngredient | null): boolean {
    return (
      !!ingredient &&
      ingredient.artState === 'art-queued' &&
      !imageFor(ingredient)
    )
  }

  function updateDiscovery(key: string, patch: Partial<HybridizerDiscovery>) {
    discoveries.value = discoveries.value.map((entry) =>
      entry.key === key ? { ...entry, ...patch } : entry,
    )
    save()
  }

  async function loadVersions(key: string): Promise<void> {
    const viewerId = userStore.authenticatedUserId
    if (!key.startsWith('fusion:')) {
      versions.value = []
      versionsFor.value = null
      canEditResult.value = false
      return
    }
    const response = await performFetch<{
      versions: HybridizerVersion[]
      canEdit: boolean
    }>('/api/hybridizer/fusions/' + key.slice(7) + '/versions')
    if (resultKey.value !== key || viewerId !== userStore.authenticatedUserId)
      return
    if (response.success && response.data) {
      versions.value = response.data.versions
      versionsFor.value = key
      canEditResult.value = response.data.canEdit
    }
  }

  async function openSharedFusion(id: string): Promise<void> {
    if (!/^[a-f0-9]{64}$/.test(id)) return
    const viewerId = userStore.authenticatedUserId
    const response = await performFetch<HybridizerDiscovery>(
      '/api/hybridizer/fusions/' + id,
    )
    if (viewerId !== userStore.authenticatedUserId) return
    if (!response.success || !response.data) {
      status.value = 'That discovery is unavailable or private.'
      return
    }
    const discovery = response.data
    discoveries.value = [
      ...discoveries.value.filter((entry) => entry.key !== discovery.key),
      discovery,
    ].slice(-200)
    resultKey.value = discovery.key
    save()
    await Promise.all([
      refreshArtwork(discovery.key),
      loadVersions(discovery.key),
    ])
  }

  async function resubmit(): Promise<void> {
    const viewerId = userStore.authenticatedUserId
    const key = resultKey.value
    if (
      !key?.startsWith('fusion:') ||
      !canEditResult.value ||
      versionBusy.value
    )
      return
    versionBusy.value = true
    try {
      const response = await performFetch<{ jobId: number; status: string }>(
        '/api/hybridizer/fusions/' + key.slice(7) + '/resubmit',
        { method: 'POST' },
      )
      if (viewerId !== userStore.authenticatedUserId) return
      if (!response.success || !response.data) {
        status.value = response.message || 'Could not queue a new version.'
        return
      }
      updateDiscovery(key, {
        artJobId: response.data.jobId,
        status: 'QUEUED',
      })
      if (!pendingKeys.value.includes(key))
        pendingKeys.value = [...pendingKeys.value, key]
      status.value =
        'New version queued. Previous artwork is saved in the revision gallery.'
      await loadVersions(key)
      void achievementStore.rewardAchievementByCode('hybridizer-art-critic')
    } finally {
      versionBusy.value = false
    }
  }

  async function makePrimary(jobId: number): Promise<void> {
    const viewerId = userStore.authenticatedUserId
    const key = resultKey.value
    if (
      !key?.startsWith('fusion:') ||
      !canEditResult.value ||
      versionBusy.value
    )
      return
    versionBusy.value = true
    try {
      const response = await performFetch<{
        jobId: number
        artImageId: number
        imagePath: string
      }>(
        '/api/hybridizer/fusions/' +
          key.slice(7) +
          '/versions/' +
          jobId +
          '/promote',
        { method: 'POST' },
      )
      if (viewerId !== userStore.authenticatedUserId) return
      if (!response.success || !response.data) {
        status.value = response.message || 'This version cannot become primary.'
        return
      }
      availableArt.value = {
        ...availableArt.value,
        [key]: response.data.imagePath,
      }
      updateDiscovery(key, {
        artJobId: jobId,
        artImageId: response.data.artImageId,
        imagePath: response.data.imagePath,
        status: 'READY',
      })
      pendingKeys.value = pendingKeys.value.filter((entry) => entry !== key)
      status.value =
        'Primary illustration updated. Every earlier version remains available.'
      await loadVersions(key)
    } finally {
      versionBusy.value = false
    }
  }

  async function refreshArtwork(key: string): Promise<void> {
    if (!key.startsWith('fusion:')) return
    const viewerId = userStore.authenticatedUserId
    const response = await performFetch<{
      key: string
      status: string
      artJobId: number | null
      artImageId: number | null
      imagePath: string | null
      canRetry: boolean
    }>('/api/hybridizer/fusions/' + key.slice(7) + '/status')
    if (viewerId !== userStore.authenticatedUserId) return
    if (!response.success || !response.data) return
    const data = response.data
    const prior = discoveries.value.find((entry) => entry.key === key)
    if (data.imagePath) {
      availableArt.value = { ...availableArt.value, [key]: data.imagePath }
    }
    updateDiscovery(key, {
      status: data.status,
      artJobId: data.artJobId,
      artImageId: data.artImageId,
      imagePath: data.imagePath,
      canRetry: data.canRetry,
    })
    if (data.status === 'READY' && prior?.status !== 'READY') {
      readyNotice.value =
        discoveries.value.find((entry) => entry.key === key) ?? null
    }
    if (
      data.status === 'QUEUED' ||
      data.status === 'RENDERING' ||
      data.status === 'DELIVERING'
    ) {
      if (!pendingKeys.value.includes(key))
        pendingKeys.value = [...pendingKeys.value, key]
    } else {
      pendingKeys.value = pendingKeys.value.filter((entry) => entry !== key)
    }
    if (resultKey.value === key) void loadVersions(key)
  }

  async function enqueueArtwork(key: string): Promise<void> {
    if (!key.startsWith('fusion:') || enqueuing.has(key)) return
    const viewerId = userStore.authenticatedUserId
    const discovery = discoveries.value.find((entry) => entry.key === key)
    if (!discovery || discovery.status === 'READY') {
      if (discovery?.status === 'READY') void refreshArtwork(key)
      return
    }
    enqueuing.add(key)
    try {
      const response = await performFetch<{
        key: string
        artJobId: number
        status: string
      }>('/api/hybridizer/fusions/' + key.slice(7) + '/enqueue', {
        method: 'POST',
      })
      if (viewerId !== userStore.authenticatedUserId) return
      if (response.success && response.data) {
        updateDiscovery(key, {
          artJobId: response.data.artJobId,
          status: response.data.status,
        })
        if (!pendingKeys.value.includes(key))
          pendingKeys.value = [...pendingKeys.value, key]
        status.value =
          'Fusion study saved. The artwork is rendering in the background.'
      } else {
        status.value =
          'Fusion saved. Artwork could not be queued: ' +
          (response.message || 'generation unavailable')
      }
    } finally {
      enqueuing.delete(key)
    }
  }

  async function pollArtwork(): Promise<void> {
    await Promise.all(
      pendingKeys.value.slice(0, 5).map((key) => refreshArtwork(key)),
    )
  }

  function startArtworkWatch() {
    if (!import.meta.client || pollTimer) return
    pollTimer = setInterval(() => void pollArtwork(), 10000)
    void pollArtwork()
  }

  function stopArtworkWatch() {
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = null
  }

  function dismissNotice() {
    readyNotice.value = null
  }

  function choose(side: 'left' | 'right', key: string) {
    if (working.value || !byKey.value.has(key)) return
    if (side === 'left') leftKey.value = key
    else rightKey.value = key
    resultKey.value = null
    versions.value = []
    canEditResult.value = false
    status.value = 'Ready to combine two specimens.'
    if (key.startsWith('fusion:')) void refreshArtwork(key)
  }

  async function fuse() {
    const a = left.value
    const b = right.value
    if (working.value || !a || !b) return
    if (a.key === b.key) {
      status.value = 'Choose two different ingredients.'
      return
    }
    const depth = Math.max(a.depth ?? 0, b.depth ?? 0) + 1
    if (depth > MAX_STUDY_DEPTH) {
      status.value = 'Maximum fusion depth reached.'
      return
    }

    const viewerId = userStore.authenticatedUserId
    working.value = true
    resultKey.value = null
    versions.value = []
    canEditResult.value = false
    status.value = 'Checking the shared discovery archive…'
    try {
      const animation = import.meta.client
        ? new Promise<void>((resolve) => {
            const reducedMotion = window.matchMedia(
              '(prefers-reduced-motion: reduce)',
            ).matches
            window.setTimeout(resolve, reducedMotion ? 120 : 1250)
          })
        : Promise.resolve()
      const request = performFetch<HybridizerDiscovery>(
        '/api/hybridizer/fusions',
        {
          method: 'POST',
          body: JSON.stringify({ leftKey: a.key, rightKey: b.key }),
        },
      )
      const [response] = await Promise.all([request, animation])
      if (viewerId !== userStore.authenticatedUserId) return

      if (!response.success || !response.data) {
        const existing = discoveries.value.find(
          (entry) => entry.key === 'hybrid:' + pairKey(a.key, b.key),
        )
        const local: HybridizerDiscovery = existing ?? {
          key: 'hybrid:' + pairKey(a.key, b.key),
          title: displayName(a, b),
          taxonomy: 'HYBRID',
          sources: [a.key, b.key].sort() as [string, string],
          depth,
          createdAt: new Date().toISOString(),
          status: 'LOCAL',
        }
        if (!existing)
          discoveries.value = [...discoveries.value, local].slice(-200)
        resultKey.value = local.key
        status.value =
          'Local study only. Shared archive is unavailable: ' +
          (response.message || 'request failed')
        save()
        return
      }

      const discovery = response.data
      discoveries.value = [
        ...discoveries.value.filter((entry) => entry.key !== discovery.key),
        discovery,
      ].slice(-200)
      resultKey.value = discovery.key
      status.value =
        discovery.status === 'READY'
          ? 'Shared illustrated discovery retrieved.'
          : 'Shared discovery saved. Artwork will render in the background.'
      save()
      void loadVersions(discovery.key)
      void achievementStore.rewardAchievementByCode('hybridizer-first-fusion')
      if (a.depth || b.depth)
        void achievementStore.rewardAchievementByCode(
          'hybridizer-recursive-discovery',
        )
      if (discovery.status === 'READY') void refreshArtwork(discovery.key)
      else if (discovery.artJobId) void refreshArtwork(discovery.key)
      else void enqueueArtwork(discovery.key)
    } finally {
      working.value = false
    }
  }

  function remix(side: 'left' | 'right') {
    if (!result.value) return
    choose(side, result.value.key)
  }

  watch(
    () => userStore.authenticatedUserId,
    () => {
      if (!import.meta.client) return
      discoveries.value = []
      pendingKeys.value = []
      readyNotice.value = null
      resultKey.value = null
      versions.value = []
      versionsFor.value = null
      canEditResult.value = false
      availableArt.value = {}
      hydrate()
      void loadSharedStudies()
      void loadArtwork()
    },
  )

  return {
    leftKey,
    rightKey,
    left,
    right,
    inputs,
    discoveries,
    result,
    resultKey,
    working,
    status,
    starterCount,
    pendingKeys,
    readyNotice,
    versions,
    versionsFor,
    canEditResult,
    versionBusy,
    loadVersions,
    openSharedFusion,
    resubmit,
    makePrimary,
    imageFor,
    artPending,
    hydrate,
    loadArtwork,
    loadSharedStudies,
    startArtworkWatch,
    stopArtworkWatch,
    refreshArtwork,
    enqueueArtwork,
    dismissNotice,
    choose,
    fuse,
    remix,
  }
})
