import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from './utils'
import { useUserStore } from './userStore'
import type {
  MandarinCard,
  MandarinCatalogPayload,
  MandarinCustomSet,
  MandarinStudySet,
} from '@/utils/mandarin'
import { mergeArtJobs, mergeCustomSets } from '@/utils/mandarinCloudMerge'

const STORAGE_KEY = 'kind-robots:mandarin-tutor:v1'
const CANONICAL_ART_RECIPE = 'v2'
const CANONICAL_ART_DIRECTION = 'modern-chinese-picturebook-v2'

type LocalState = {
  customSets: MandarinCustomSet[]
  selectedSetId: string
  artJobs: Record<string, number>
  artImageIds: Record<string, number>
  interactionMode?: InteractionMode
}

export type InteractionMode = 'study' | 'explore'
export type StudyRating = 'again' | 'hard' | 'good' | 'easy'

type StudySessionEntry = {
  cardKey: string
  rating: StudyRating
  ratedAt: string
}

type ArtEnqueueData = {
  jobId?: number
  status?: string
  deduplicated?: boolean
}

type ArtJobData = {
  job?: {
    status?: string
    artImageId?: number | null
  }
}

type MandarinAudioData = {
  id?: string
  url?: string
  cached?: boolean
}

// mandarin-tutor/t-016: customSets and artJobs move off localStorage-only state onto
// /api/mandarin/sets. The server is treated as the record of truth once reachable;
// localStorage remains the first-load cache/offline fallback (see `loadCloudState`).
type MandarinSetsCloudPayload = {
  sets?: MandarinCustomSet[]
  artJobs?: Record<string, number>
}

export type MandarinStudyDiagnosticsData = {
  totalTracked: number
  dueCount: number
  retentionRate: number | null
  weakCardKeys: string[]
}

export type MandarinRequestedCardData = {
  id: number
  card: MandarinCard
  requestText: string
  usageNote?: string | null
  generated: true
  provenance: {
    provider: string
    model: string
    recipeVersion: string
    note: string
  }
  art: {
    prompt: string
    promptVersion: string
    jobId?: number | null
    imageId?: number | null
    imageUrl?: string | null
  }
}

type MandarinRequestedCardsPayload = {
  cards: MandarinRequestedCardData[]
}

type MandarinIllustrationManifestEntry = {
  cardKey: string
  imageUrl?: string
  prompt?: string | null
  strategy: 'illustrate' | 'glyph-only'
  recipeVersion?: string
  artDirectionId?: string
}

type MandarinIllustrationManifestPayload = {
  recipeVersion: string
  artDirection?: {
    id?: string
  }
  entries: MandarinIllustrationManifestEntry[]
}

function safeId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function requestedId(cardKey: string): number | null {
  const match = cardKey.match(/^requested:(\d+)$/)
  if (!match) return null
  const id = Number(match[1])
  return Number.isInteger(id) && id > 0 ? id : null
}

export const useMandarinTutorStore = defineStore('mandarinTutorStore', () => {
  const cards = ref<MandarinCard[]>([])
  const builtInSets = ref<MandarinStudySet[]>([])
  const customSets = ref<MandarinCustomSet[]>([])
  const requestedCards = ref<MandarinRequestedCardData[]>([])
  const selectedSetId = ref('starter-500')
  const studyIndex = ref(0)
  // Interaction mode: 'study' is the deliberate recall loop (challenge -> reveal ->
  // pronunciation -> self-rating -> next); 'explore' is the prior all-purpose page
  // (search, requested words, decomposition/history, provenance, deck curation).
  // mandarin-tutor/t-009: establishes the mode split. `studySessionLog` below is a
  // client-only, in-session record -- durable SRS scheduling and mastery-history
  // persistence is deliberately deferred to a follow-up task (see that task's note).
  const interactionMode = ref<InteractionMode>('study')
  const studyPhase = ref<'challenge' | 'revealed'>('challenge')
  const studySessionLog = ref<StudySessionEntry[]>([])
  // Durable counterpart to studySessionLog: t-015's SM-2-lite schedule, persisted
  // server-side via /api/mandarin/study/rate and /api/mandarin/study/progress.
  const studyDiagnostics = ref<MandarinStudyDiagnosticsData | null>(null)
  const studyDiagnosticsLoading = ref(false)
  const searchQuery = ref('')
  const focusKey = ref<string | null>(null)
  const focusKeys = ref<string[]>([])
  const meaningVisible = ref(false)
  const detailsVisible = ref(false)
  const loading = ref(false)
  const initialized = ref(false)
  const requestingWord = ref(false)
  const error = ref<string | null>(null)
  const speechError = ref<string | null>(null)
  const audioUrls = ref<Record<string, string>>({})
  const audioLoadingKey = ref<string | null>(null)
  const artJobs = ref<Record<string, number>>({})
  const artImageIds = ref<Record<string, number>>({})
  const artImageUrls = ref<Record<string, string>>({})
  const artStatuses = ref<Record<string, string>>({})
  const canonicalArtUrls = ref<Record<string, string>>({})
  const canonicalArtPrompts = ref<Record<string, string>>({})
  const canonicalArtStrategies = ref<
    Record<string, 'illustrate' | 'glyph-only'>
  >({})
  const artQueueingKey = ref<string | null>(null)
  const artRefreshingKey = ref<string | null>(null)
  const canonicalArtProbeInFlight = new Set<string>()
  let activeReferenceAudio: HTMLAudioElement | null = null

  const cardMap = computed(
    () => new Map(cards.value.map((card) => [card.key, card] as const)),
  )

  const requestedSet = computed<MandarinStudySet | null>(() => {
    const cardKeys = requestedCards.value.map((entry) => entry.card.key)
    if (!cardKeys.length) return null
    return {
      id: 'requested',
      label: 'Requested words',
      description:
        'Your generated additions, kept separate from sourced starter vocabulary.',
      cardKeys,
    }
  })

  const allSets = computed<MandarinStudySet[]>(() => [
    ...builtInSets.value,
    ...(requestedSet.value ? [requestedSet.value] : []),
    ...customSets.value.map((set) => ({
      id: `custom:${set.id}`,
      label: set.name,
      description: 'Your custom study set.',
      cardKeys: set.cardKeys,
    })),
  ])

  const selectedSet = computed(
    () =>
      allSets.value.find((set) => set.id === selectedSetId.value) ??
      allSets.value[0] ??
      null,
  )

  const studyCards = computed(() => {
    const keys = selectedSet.value?.cardKeys ?? []
    return keys
      .map((key) => cardMap.value.get(key))
      .filter((card): card is MandarinCard => Boolean(card))
  })

  const currentCard = computed<MandarinCard | null>(() => {
    if (focusKey.value) return cardMap.value.get(focusKey.value) ?? null
    if (!studyCards.value.length) return null
    return studyCards.value[studyIndex.value % studyCards.value.length] ?? null
  })

  const searchResults = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return []
    return cards.value
      .filter((card) => {
        const haystack = [
          card.simplified,
          card.traditional ?? '',
          card.pinyin,
          card.meaning,
          ...card.meanings,
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(query)
      })
      .slice(0, 24)
  })

  const focusPosition = computed(() => {
    const key = focusKey.value
    if (!key) return null
    const validKeys = focusKeys.value.filter((candidate) =>
      cardMap.value.has(candidate),
    )
    const index = validKeys.indexOf(key)
    if (index < 0) return { index: 0, total: 1 }
    return { index, total: validKeys.length }
  })

  const customSetCount = computed(() => customSets.value.length)
  const audioSupported = computed(
    () => import.meta.client && typeof Audio !== 'undefined',
  )

  // In-session diagnostic only (not durable mastery history): how many distinct
  // cards in the current set have been rated since the page loaded.
  const studySessionRatedForSet = computed(() => {
    const keys = new Set(studyCards.value.map((card) => card.key))
    const rated = new Set(
      studySessionLog.value
        .filter((entry) => keys.has(entry.cardKey))
        .map((entry) => entry.cardKey),
    )
    return rated.size
  })

  function resetReveal() {
    meaningVisible.value = false
    detailsVisible.value = false
    studyPhase.value = 'challenge'
    speechError.value = null
  }

  function saveLocalState() {
    if (!import.meta.client) return
    const state: LocalState = {
      customSets: customSets.value,
      selectedSetId: selectedSetId.value,
      artJobs: artJobs.value,
      artImageIds: artImageIds.value,
      interactionMode: interactionMode.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  function loadLocalState() {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as Partial<LocalState>
      if (Array.isArray(parsed.customSets)) customSets.value = parsed.customSets
      if (typeof parsed.selectedSetId === 'string') {
        selectedSetId.value = parsed.selectedSetId
      }
      if (parsed.artJobs && typeof parsed.artJobs === 'object') {
        artJobs.value = parsed.artJobs
      }
      if (parsed.artImageIds && typeof parsed.artImageIds === 'object') {
        artImageIds.value = parsed.artImageIds
      }
      if (
        parsed.interactionMode === 'study' ||
        parsed.interactionMode === 'explore'
      ) {
        interactionMode.value = parsed.interactionMode
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  async function loadCatalog() {
    if (loading.value) return
    loading.value = true
    error.value = null
    try {
      const response = await performFetch<MandarinCatalogPayload>(
        '/api/mandarin',
        {},
        2,
        30_000,
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load Mandarin cards.')
      }
      const requested = cards.value.filter((card) => requestedId(card.key))
      cards.value = [...response.data.cards, ...requested]
      builtInSets.value = response.data.sets
      if (!allSets.value.some((set) => set.id === selectedSetId.value)) {
        selectedSetId.value = builtInSets.value[0]?.id ?? 'starter-500'
      }
      initialized.value = true
      studyIndex.value = 0
      resetReveal()
    } catch (cause) {
      error.value =
        cause instanceof Error
          ? cause.message
          : 'Failed to load Mandarin cards.'
    } finally {
      loading.value = false
    }
  }

  async function loadIllustrationManifest() {
    if (!import.meta.client) return
    try {
      const response = await performFetch<MandarinIllustrationManifestPayload>(
        '/api/mandarin/art-manifest',
        {},
        1,
        30_000,
      )
      const manifest = response.data
      if (!response.success || !manifest || !Array.isArray(manifest.entries))
        return
      if (manifest.recipeVersion !== CANONICAL_ART_RECIPE) return
      if (manifest.artDirection?.id !== CANONICAL_ART_DIRECTION) return

      const urls: Record<string, string> = {}
      const prompts: Record<string, string> = {}
      const strategies: Record<string, 'illustrate' | 'glyph-only'> = {}
      const statusDefaults: Record<string, string> = {}

      for (const entry of manifest.entries) {
        const key = String(entry.cardKey || '').trim()
        if (!key) continue
        strategies[key] = entry.strategy
        if (entry.strategy === 'glyph-only') {
          statusDefaults[key] = 'GLYPH ONLY'
          continue
        }

        const imageUrl = String(entry.imageUrl || '').trim()
        const prompt = String(entry.prompt || '').trim()
        if (imageUrl.startsWith('/images/mandarin-tutor/cards/v2/')) {
          urls[key] = imageUrl
          statusDefaults[key] = 'V2 PENDING'
        }
        if (prompt) prompts[key] = prompt
      }

      canonicalArtUrls.value = urls
      canonicalArtPrompts.value = prompts
      canonicalArtStrategies.value = strategies
      artStatuses.value = { ...statusDefaults, ...artStatuses.value }
    } catch (cause) {
      console.warn('[mandarin] v2 illustration manifest load failed', cause)
    }
  }

  async function probeCanonicalIllustration(
    cardKey: string,
  ): Promise<string | null> {
    if (!import.meta.client || requestedId(cardKey)) return null
    if (artImageUrls.value[cardKey]) return artImageUrls.value[cardKey] || null
    if (canonicalArtProbeInFlight.has(cardKey)) return null

    const url = canonicalArtUrls.value[cardKey]
    if (!url) return null

    canonicalArtProbeInFlight.add(cardKey)
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-store',
      })
      // A missing /images/... path is not a 404 here: Nuxt falls through to the
      // catch-all page and answers 200 text/html. Trusting response.ok alone
      // flips every unrendered card to V2 READY and paints a broken <img> over
      // the Hanzi fallback, which is worse than showing no picture at all. The
      // content type is what actually distinguishes a rendered card.
      const contentType = response.headers.get('content-type') || ''
      if (!response.ok || !contentType.toLowerCase().startsWith('image/')) {
        artStatuses.value = { ...artStatuses.value, [cardKey]: 'V2 PENDING' }
        return null
      }

      artImageUrls.value = { ...artImageUrls.value, [cardKey]: url }
      artStatuses.value = { ...artStatuses.value, [cardKey]: 'V2 READY' }
      return url
    } catch {
      artStatuses.value = { ...artStatuses.value, [cardKey]: 'V2 PENDING' }
      return null
    } finally {
      canonicalArtProbeInFlight.delete(cardKey)
    }
  }

  async function fetchProtectedImage(
    artImageId: number,
  ): Promise<string | null> {
    if (!import.meta.client) return null
    const userStore = useUserStore()
    const token = userStore.token || userStore.user?.token || ''
    const headers = new Headers()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const response = await fetch(`/api/art/images/${artImageId}/file`, {
      headers,
    })
    if (!response.ok) return null
    return URL.createObjectURL(await response.blob())
  }

  async function hydrateRequestedArt(entry: MandarinRequestedCardData) {
    const key = entry.card.key
    const jobId = Number(entry.art.jobId)
    const imageId = Number(entry.art.imageId)

    if (Number.isInteger(jobId) && jobId > 0) {
      artJobs.value = { ...artJobs.value, [key]: jobId }
      if (!entry.art.imageId) {
        artStatuses.value = { ...artStatuses.value, [key]: 'PENDING' }
      }
    }

    if (!Number.isInteger(imageId) || imageId <= 0) return
    artImageIds.value = { ...artImageIds.value, [key]: imageId }
    artStatuses.value = { ...artStatuses.value, [key]: 'DONE' }

    const nextUrl = await fetchProtectedImage(imageId)
    if (!nextUrl) return
    const previousUrl = artImageUrls.value[key]
    if (previousUrl?.startsWith('blob:')) URL.revokeObjectURL(previousUrl)
    artImageUrls.value = { ...artImageUrls.value, [key]: nextUrl }
  }

  async function upsertRequestedCard(entry: MandarinRequestedCardData) {
    requestedCards.value = [
      entry,
      ...requestedCards.value.filter((candidate) => candidate.id !== entry.id),
    ]
    cards.value = [
      ...cards.value.filter((candidate) => candidate.key !== entry.card.key),
      entry.card,
    ]
    await hydrateRequestedArt(entry)
  }

  async function loadRequestedCards() {
    if (!import.meta.client) return
    const userStore = useUserStore()
    const token = userStore.token || userStore.user?.token || ''
    if (!token) return

    try {
      const response = await performFetch<MandarinRequestedCardsPayload>(
        '/api/mandarin/requests',
        {},
        1,
        30_000,
      )
      if (!response.success || !response.data) return

      const existingRequestedKeys = new Set(
        cards.value
          .filter((card) => requestedId(card.key))
          .map((card) => card.key),
      )
      cards.value = cards.value.filter(
        (card) => !existingRequestedKeys.has(card.key),
      )
      requestedCards.value = []
      for (const entry of response.data.cards) {
        await upsertRequestedCard(entry)
      }
    } catch (cause) {
      console.warn('[mandarin] requested-card load failed', cause)
    }
  }

  async function loadStudyDiagnostics() {
    if (!import.meta.client || studyDiagnosticsLoading.value) return
    const userStore = useUserStore()
    if (!userStore.token && !userStore.user?.token) return
    studyDiagnosticsLoading.value = true
    try {
      const response = await performFetch<{
        diagnostics: MandarinStudyDiagnosticsData
      }>('/api/mandarin/study/progress', {}, 1, 20_000)
      if (response.success && response.data?.diagnostics) {
        studyDiagnostics.value = response.data.diagnostics
      }
    } catch (cause) {
      console.warn('[mandarin] study diagnostics load failed', cause)
    } finally {
      studyDiagnosticsLoading.value = false
    }
  }

  // mandarin-tutor/t-016: pulls the learner's server-side customSets/artJobs
  // (MandarinCustomSet/MandarinArtJobLink) and treats them as authoritative once
  // reachable. Any locally-known set or art-job link the server doesn't have yet
  // (created while offline, or before this device last synced) is kept rather than
  // dropped, and re-pushed so it isn't silently lost.
  async function loadCloudState() {
    if (!import.meta.client) return
    const userStore = useUserStore()
    if (!userStore.token && !userStore.user?.token) return
    try {
      const response = await performFetch<MandarinSetsCloudPayload>(
        '/api/mandarin/sets',
        {},
        1,
        20_000,
      )
      if (!response.success || !response.data) return

      const setsResult = mergeCustomSets(
        response.data.sets ?? [],
        customSets.value,
      )
      customSets.value = setsResult.merged
      for (const set of setsResult.unsynced) void persistCustomSet(set)

      const artJobsResult = mergeArtJobs(
        response.data.artJobs ?? {},
        artJobs.value,
      )
      artJobs.value = artJobsResult.merged
      for (const [cardKey, jobId] of artJobsResult.unsynced)
        void persistArtJobLink(cardKey, jobId)

      saveLocalState()
    } catch (cause) {
      console.warn('[mandarin] cloud custom-set load failed', cause)
    }
  }

  async function persistCustomSet(set: MandarinCustomSet) {
    if (!import.meta.client) return
    try {
      const response = await performFetch(
        '/api/mandarin/sets',
        {
          method: 'POST',
          body: JSON.stringify({
            clientId: set.id,
            name: set.name,
            cardKeys: set.cardKeys,
          }),
        },
        1,
        20_000,
      )
      if (!response.success) {
        throw new Error(response.message || 'Failed to save the custom set.')
      }
    } catch (cause) {
      // Durability nice-to-have on top of the already-saved local state -- a save
      // failure (offline, not logged in, transient 5xx) must never block the
      // learner's current-session edit.
      console.warn('[mandarin] failed to persist custom set', cause)
    }
  }

  async function persistArtJobLink(cardKey: string, jobId: number) {
    if (!import.meta.client) return
    try {
      const response = await performFetch(
        '/api/mandarin/sets/art-jobs',
        {
          method: 'POST',
          body: JSON.stringify({ cardKey, jobId }),
        },
        1,
        20_000,
      )
      if (!response.success) {
        throw new Error(response.message || 'Failed to save the art job link.')
      }
    } catch (cause) {
      console.warn('[mandarin] failed to persist art job link', cause)
    }
  }

  async function initialize() {
    if (initialized.value || loading.value) return
    loadLocalState()
    await loadCatalog()
    await loadIllustrationManifest()
    await loadRequestedCards()
    void loadStudyDiagnostics()
    void loadCloudState()
    const key = currentCard.value?.key
    if (key) await probeCanonicalIllustration(key)
  }

  function selectSet(id: string) {
    if (!allSets.value.some((set) => set.id === id)) return
    selectedSetId.value = id
    studyIndex.value = 0
    focusKey.value = null
    focusKeys.value = []
    resetReveal()
    saveLocalState()
  }

  function moveFocusedCard(offset: number): boolean {
    const key = focusKey.value
    if (!key) return false
    const validKeys = focusKeys.value.filter((candidate) =>
      cardMap.value.has(candidate),
    )
    if (validKeys.length <= 1) return false
    const currentIndex = Math.max(0, validKeys.indexOf(key))
    const nextIndex =
      (currentIndex + offset + validKeys.length) % validKeys.length
    focusKey.value = validKeys[nextIndex] ?? key
    focusKeys.value = validKeys
    resetReveal()
    return true
  }

  function nextCard() {
    if (focusKey.value) {
      void moveFocusedCard(1)
      return
    }
    if (!studyCards.value.length) return
    studyIndex.value = (studyIndex.value + 1) % studyCards.value.length
    resetReveal()
  }

  function previousCard() {
    if (focusKey.value) {
      void moveFocusedCard(-1)
      return
    }
    if (!studyCards.value.length) return
    studyIndex.value =
      (studyIndex.value - 1 + studyCards.value.length) % studyCards.value.length
    resetReveal()
  }

  function focusCard(key: string) {
    if (!cardMap.value.has(key)) return
    const resultKeys = searchResults.value.map((card) => card.key)
    focusKeys.value = resultKeys.includes(key) ? resultKeys : [key]
    focusKey.value = key
    resetReveal()
  }

  function clearFocus() {
    focusKey.value = null
    focusKeys.value = []
    resetReveal()
  }

  function toggleMeaning() {
    meaningVisible.value = !meaningVisible.value
  }

  function toggleDetails() {
    detailsVisible.value = !detailsVisible.value
  }

  function setInteractionMode(mode: InteractionMode) {
    if (interactionMode.value === mode) return
    interactionMode.value = mode
    clearFocus()
    resetReveal()
    saveLocalState()
  }

  function revealStudyCard() {
    if (interactionMode.value !== 'study' || !currentCard.value) return
    studyPhase.value = 'revealed'
  }

  function rateStudyCard(rating: StudyRating) {
    if (interactionMode.value !== 'study' || studyPhase.value !== 'revealed')
      return
    const card = currentCard.value
    if (!card) return
    studySessionLog.value = [
      ...studySessionLog.value,
      { cardKey: card.key, rating, ratedAt: new Date().toISOString() },
    ]
    void persistStudyRating(card.key, rating)
    // nextCard() calls resetReveal(), which returns studyPhase to 'challenge'.
    nextCard()
  }

  async function persistStudyRating(cardKey: string, rating: StudyRating) {
    if (!import.meta.client) return
    try {
      const response = await performFetch<{ dueAt?: string }>(
        '/api/mandarin/study/rate',
        {
          method: 'POST',
          body: JSON.stringify({ cardKey, rating }),
        },
        1,
        20_000,
      )
      if (!response.success) {
        throw new Error(response.message || 'Failed to save the study rating.')
      }
      void loadStudyDiagnostics()
    } catch (cause) {
      // Scheduling is a durability nice-to-have on top of the already-recorded
      // in-session log -- a save failure (offline, not logged in, transient 5xx)
      // must never block or roll back the learner's current-session progress.
      console.warn('[mandarin] failed to persist study rating', cause)
    }
  }

  function createCustomSet(name: string): MandarinCustomSet | null {
    const cleanName = name.trim()
    if (!cleanName) return null
    const base = safeId(cleanName) || 'deck'
    let id = base
    let suffix = 2
    while (customSets.value.some((set) => set.id === id)) {
      id = `${base}-${suffix}`
      suffix += 1
    }
    const set: MandarinCustomSet = {
      id,
      name: cleanName.slice(0, 80),
      cardKeys: [],
      createdAt: new Date().toISOString(),
    }
    customSets.value.push(set)
    saveLocalState()
    void persistCustomSet(set)
    return set
  }

  function renameCustomSet(setId: string, name: string): boolean {
    const set = customSets.value.find((candidate) => candidate.id === setId)
    const cleanName = name.trim().slice(0, 80)
    if (!set || !cleanName) return false
    if (set.name === cleanName) return true
    set.name = cleanName
    customSets.value = [...customSets.value]
    saveLocalState()
    void persistCustomSet(set)
    return true
  }

  function toggleCardInCustomSet(setId: string, cardKey: string) {
    const set = customSets.value.find((candidate) => candidate.id === setId)
    if (!set || !cardMap.value.has(cardKey)) return
    set.cardKeys = set.cardKeys.includes(cardKey)
      ? set.cardKeys.filter((key) => key !== cardKey)
      : [...set.cardKeys, cardKey]
    saveLocalState()
    void persistCustomSet(set)
  }

  function cardIsInCustomSet(setId: string, cardKey: string): boolean {
    return Boolean(
      customSets.value
        .find((set) => set.id === setId)
        ?.cardKeys.includes(cardKey),
    )
  }

  function requestedData(cardKey: string): MandarinRequestedCardData | null {
    const id = requestedId(cardKey)
    if (!id) return null
    return requestedCards.value.find((entry) => entry.id === id) ?? null
  }

  async function requestWord(
    request = searchQuery.value,
  ): Promise<MandarinRequestedCardData | null> {
    const cleanRequest = request.trim()
    if (!cleanRequest || requestingWord.value) return null
    requestingWord.value = true
    error.value = null
    try {
      const response = await performFetch<MandarinRequestedCardData>(
        '/api/mandarin/requests',
        {
          method: 'POST',
          body: JSON.stringify({ request: cleanRequest }),
        },
        1,
        60_000,
      )
      if (!response.success || !response.data?.card) {
        throw new Error(
          response.message || 'Failed to create the requested Mandarin card.',
        )
      }
      await upsertRequestedCard(response.data)
      focusKey.value = response.data.card.key
      focusKeys.value = [response.data.card.key]
      searchQuery.value = ''
      resetReveal()
      return response.data
    } catch (cause) {
      error.value =
        cause instanceof Error
          ? cause.message
          : 'Failed to create the requested Mandarin card.'
      return null
    } finally {
      requestingWord.value = false
    }
  }

  async function refreshRequestedIllustration(
    card: MandarinCard | null = currentCard.value,
  ): Promise<string | null> {
    if (!card || !requestedId(card.key) || artRefreshingKey.value) return null
    const id = requestedId(card.key)
    if (!id) return null
    artRefreshingKey.value = card.key
    error.value = null
    try {
      const response = await performFetch<MandarinRequestedCardData>(
        `/api/mandarin/requests/${id}/art`,
        { method: 'POST' },
        1,
        45_000,
      )
      if (!response.success || !response.data?.card) {
        throw new Error(
          response.message || 'Failed to refresh requested-card art.',
        )
      }
      await upsertRequestedCard(response.data)
      return artImageUrls.value[card.key] || null
    } catch (cause) {
      error.value =
        cause instanceof Error
          ? cause.message
          : 'Failed to refresh requested-card art.'
      return null
    } finally {
      artRefreshingKey.value = null
    }
  }

  function playBrowserSpeech(card: MandarinCard): boolean {
    if (!import.meta.client || !('speechSynthesis' in window)) return false

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(card.simplified)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.82
    const voices = window.speechSynthesis.getVoices()
    const voice =
      voices.find((candidate) => candidate.lang.toLowerCase() === 'zh-cn') ??
      voices.find((candidate) => candidate.lang.toLowerCase().startsWith('zh'))
    if (voice) utterance.voice = voice
    utterance.onerror = () => {
      speechError.value =
        'The Mandarin reference audio could not play in this browser.'
    }
    window.speechSynthesis.speak(utterance)
    return true
  }

  async function playReferenceAudio(url: string): Promise<boolean> {
    if (!import.meta.client || typeof Audio === 'undefined') return false

    if (activeReferenceAudio) {
      activeReferenceAudio.pause()
      activeReferenceAudio.currentTime = 0
    }

    const audio = new Audio(url)
    audio.preload = 'auto'
    activeReferenceAudio = audio

    try {
      await audio.play()
      return true
    } catch {
      return false
    }
  }

  async function speak(card: MandarinCard | null = currentCard.value) {
    speechError.value = null
    if (!card || !import.meta.client) {
      speechError.value =
        'Mandarin speech playback is not available in this browser.'
      return
    }

    if (audioLoadingKey.value) return

    let url = audioUrls.value[card.key] || ''

    if (!url) {
      audioLoadingKey.value = card.key
      try {
        const response = await performFetch<MandarinAudioData>(
          '/api/mandarin/audio',
          {
            method: 'POST',
            body: JSON.stringify({ cardKey: card.key }),
          },
          1,
          45_000,
        )

        const resolvedUrl = String(response.data?.url || '').trim()
        if (
          !response.success ||
          !resolvedUrl.startsWith('/api/mandarin/audio/')
        ) {
          if (playBrowserSpeech(card)) return
          throw new Error(
            response.message || 'Mandarin reference audio is unavailable.',
          )
        }

        url = resolvedUrl
        audioUrls.value = { ...audioUrls.value, [card.key]: url }
      } catch (cause) {
        if (playBrowserSpeech(card)) return
        speechError.value =
          cause instanceof Error
            ? cause.message
            : 'Mandarin reference audio is unavailable.'
        return
      } finally {
        audioLoadingKey.value = null
      }
    }

    if (await playReferenceAudio(url)) return

    if (playBrowserSpeech(card)) return

    speechError.value =
      'The reference clip is ready, but this browser blocked audio playback. Tap Hear pronunciation again.'
  }

  async function queueIllustration(
    card: MandarinCard | null = currentCard.value,
  ): Promise<number | null> {
    if (!card || requestedId(card.key) || artQueueingKey.value) return null
    artQueueingKey.value = card.key
    error.value = null
    try {
      const promptString = canonicalArtPrompts.value[card.key]
      if (!promptString) {
        if (canonicalArtStrategies.value[card.key] === 'glyph-only') {
          throw new Error(
            'This card is intentionally glyph-only because a decorative image would misteach it.',
          )
        }
        throw new Error(
          'The canonical Mandarin v2 art prompt is not available yet.',
        )
      }

      const response = await performFetch<ArtEnqueueData>(
        '/api/art/enqueue',
        {
          method: 'POST',
          body: JSON.stringify({
            engine: 'krea2',
            promptString,
            projectSlug: 'mandarin-tutor',
            width: 768,
            height: 768,
            isPublic: false,
            isMature: false,
            designer: `mandarin:v2:${card.key}`,
          }),
        },
        1,
        45_000,
      )
      const jobId = Number(response.data?.jobId)
      if (!response.success || !Number.isInteger(jobId) || jobId <= 0) {
        throw new Error(
          response.message || 'Failed to queue the Krea 2 illustration.',
        )
      }
      artJobs.value = { ...artJobs.value, [card.key]: jobId }
      artStatuses.value = {
        ...artStatuses.value,
        [card.key]: response.data?.status || 'PENDING',
      }
      saveLocalState()
      void persistArtJobLink(card.key, jobId)
      return jobId
    } catch (cause) {
      error.value =
        cause instanceof Error
          ? cause.message
          : 'Failed to queue the Krea 2 illustration.'
      return null
    } finally {
      artQueueingKey.value = null
    }
  }

  async function refreshIllustration(
    card: MandarinCard | null = currentCard.value,
  ): Promise<string | null> {
    if (!card || requestedId(card.key) || artRefreshingKey.value) return null
    const jobId = illustrationJobId(card.key)
    const knownImageId = Number(artImageIds.value[card.key])
    artRefreshingKey.value = card.key
    error.value = null
    try {
      let artImageId =
        Number.isInteger(knownImageId) && knownImageId > 0 ? knownImageId : 0

      if (!artImageId) {
        if (!jobId) return null
        const response = await performFetch<ArtJobData>(
          `/api/art/queue/${jobId}`,
          {},
          1,
          20_000,
        )
        if (!response.success || !response.data?.job) {
          throw new Error(response.message || `Failed to read ArtJob ${jobId}.`)
        }
        const status = String(response.data.job.status || 'UNKNOWN')
        artStatuses.value = { ...artStatuses.value, [card.key]: status }
        artImageId = Number(response.data.job.artImageId)
        if (!Number.isInteger(artImageId) || artImageId <= 0) return null
        artImageIds.value = { ...artImageIds.value, [card.key]: artImageId }
        saveLocalState()
      }

      const nextUrl = await fetchProtectedImage(artImageId)
      if (!nextUrl)
        throw new Error('The finished illustration is not available yet.')
      const previousUrl = artImageUrls.value[card.key]
      if (previousUrl?.startsWith('blob:')) URL.revokeObjectURL(previousUrl)
      artImageUrls.value = { ...artImageUrls.value, [card.key]: nextUrl }
      artStatuses.value = { ...artStatuses.value, [card.key]: 'DONE' }
      return nextUrl
    } catch (cause) {
      error.value =
        cause instanceof Error
          ? cause.message
          : 'Failed to refresh the illustration.'
      return null
    } finally {
      artRefreshingKey.value = null
    }
  }

  function illustrationJobId(cardKey: string): number | null {
    const requested = requestedData(cardKey)
    const id = Number(requested?.art.jobId ?? artJobs.value[cardKey])
    return Number.isInteger(id) && id > 0 ? id : null
  }

  function illustrationUrl(cardKey: string): string | null {
    return artImageUrls.value[cardKey] || null
  }

  function illustrationStatus(cardKey: string): string | null {
    if (requestedData(cardKey)?.art.imageId) return 'DONE'
    return artStatuses.value[cardKey] || null
  }

  watch(
    () => currentCard.value?.key ?? null,
    (cardKey) => {
      if (!cardKey) return
      void probeCanonicalIllustration(cardKey)
    },
  )

  return {
    cards,
    builtInSets,
    customSets,
    requestedCards,
    selectedSetId,
    studyIndex,
    interactionMode,
    studyPhase,
    studySessionLog,
    studyDiagnostics,
    studyDiagnosticsLoading,
    searchQuery,
    focusKey,
    focusKeys,
    meaningVisible,
    detailsVisible,
    loading,
    initialized,
    requestingWord,
    error,
    speechError,
    audioUrls,
    audioLoadingKey,
    artJobs,
    artImageIds,
    artImageUrls,
    artStatuses,
    canonicalArtUrls,
    canonicalArtStrategies,
    artQueueingKey,
    artRefreshingKey,
    allSets,
    selectedSet,
    studyCards,
    currentCard,
    searchResults,
    focusPosition,
    customSetCount,
    audioSupported,
    studySessionRatedForSet,
    initialize,
    loadCatalog,
    loadIllustrationManifest,
    loadRequestedCards,
    loadStudyDiagnostics,
    loadCloudState,
    probeCanonicalIllustration,
    selectSet,
    nextCard,
    previousCard,
    focusCard,
    clearFocus,
    toggleMeaning,
    toggleDetails,
    setInteractionMode,
    revealStudyCard,
    rateStudyCard,
    createCustomSet,
    renameCustomSet,
    toggleCardInCustomSet,
    cardIsInCustomSet,
    requestedData,
    requestWord,
    refreshRequestedIllustration,
    speak,
    queueIllustration,
    refreshIllustration,
    illustrationJobId,
    illustrationUrl,
    illustrationStatus,
  }
})
