import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useFacetCatalogStore } from '@/stores/facetCatalogStore'
import catalog from '@/utils/hybridizer/starterCatalog.json'

export type HybridizerIngredient = {
  key: string
  title: string
  taxonomy: string
  facetId?: number | null
  facetGroup?: string
  artState?: string
  sources?: [string, string]
  depth?: number
}

export type HybridizerDiscovery = HybridizerIngredient & {
  sources: [string, string]
  depth: number
  createdAt: string
}

const STARTERS = catalog.entries as HybridizerIngredient[]
const STORAGE_KEY = 'kind-robots-hybridizer-lab-studies-v1'
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
  const leftKey = ref('cat')
  const rightKey = ref('banana')
  const discoveries = ref<HybridizerDiscovery[]>([])
  const resultKey = ref<string | null>(null)
  const working = ref(false)
  const status = ref('Select two ingredients and activate the chamber.')
  const availableArt = ref<Record<string, string>>({})

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

  function save() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(discoveries.value))
    } catch {
      status.value = 'This browser cannot save studies between visits.'
    }
  }

  function hydrate() {
    if (!import.meta.client) return
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      if (!Array.isArray(saved)) return
      discoveries.value = saved
        .filter((entry): entry is HybridizerDiscovery =>
          Boolean(
            entry &&
            typeof entry.key === 'string' &&
              typeof entry.title === 'string' &&
            Array.isArray(entry.sources) &&
            entry.sources.length === 2 &&
              typeof entry.depth === 'number' &&
            entry.depth <= MAX_STUDY_DEPTH,
          ),
        )
        .slice(-200)
    } catch {
      discoveries.value = []
    }
  }

  async function loadArtwork() {
    try {
      const records = await catalogStore.fetchCatalogSlice({
        taxonomies: ['ANIMAL', 'SPECIES', 'OTHER', 'ARCHETYPE'],
      })
      const imageMap: Record<string, string> = {}
      for (const entry of inputs.value) {
        const matching = records.find(
          (record) =>
            (entry.facetId != null && entry.facetId === record.id) ||
            record.title.toLowerCase() === entry.title.toLowerCase(),
        )
        if (matching?.imagePath) imageMap[entry.key] = matching.imagePath
      }
      availableArt.value = imageMap
    } catch {
      status.value =
        'The Facet artwork library is unavailable; lab studies still work.'
    }
  }

  function imageFor(ingredient: HybridizerIngredient | null): string | null {
    return ingredient ? (availableArt.value[ingredient.key] ?? null) : null
  }

  function choose(side: 'left' | 'right', key: string) {
    if (working.value || !byKey.value.has(key)) return
    if (side === 'left') leftKey.value = key
    else rightKey.value = key
    resultKey.value = null
    status.value = 'Ready to combine two specimens.'
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
      status.value =
        'This local concept study is limited to four fusion generations.'
      return
    }
    const key = 'hybrid:' + pairKey(a.key, b.key)
    const existing = discoveries.value.find((entry) => entry.key === key)
    if (existing) {
      resultKey.value = existing.key
      status.value = 'Previously explored in this browser. Study retrieved.'
      return
    }

    working.value = true
    resultKey.value = null
    status.value = 'The fusion chamber is mixing…'
    if (import.meta.client) {
      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches
      await new Promise<void>((resolve) =>
        window.setTimeout(resolve, reducedMotion ? 120 : 1250),
      )
    }
    const discovery: HybridizerDiscovery = {
      key,
      title: displayName(a, b),
      taxonomy: 'HYBRID',
      sources: [a.key, b.key].sort() as [string, string],
      depth,
      createdAt: new Date().toISOString(),
    }
    discoveries.value = [...discoveries.value, discovery].slice(-200)
    resultKey.value = key
    working.value = false
    status.value =
      'Local composition study ready. Generated artwork is not connected yet.'
    save()
  }

  function remix(side: 'left' | 'right') {
    if (!result.value) return
    choose(side, result.value.key)
  }

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
    imageFor,
    hydrate,
    loadArtwork,
    choose,
    fuse,
    remix,
  }
})
