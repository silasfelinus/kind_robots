import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from './utils'
import { useUserStore } from './userStore'
import type {
  MandarinCard,
  MandarinCatalogPayload,
  MandarinCustomSet,
  MandarinStudySet,
} from '@/utils/mandarin'

const STORAGE_KEY = 'kind-robots:mandarin-tutor:v1'

type LocalState = {
  customSets: MandarinCustomSet[]
  selectedSetId: string
  artJobs: Record<string, number>
  artImageIds: Record<string, number>
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

function safeId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export const useMandarinTutorStore = defineStore('mandarinTutorStore', () => {
  const cards = ref<MandarinCard[]>([])
  const builtInSets = ref<MandarinStudySet[]>([])
  const customSets = ref<MandarinCustomSet[]>([])
  const selectedSetId = ref('starter-500')
  const studyIndex = ref(0)
  const searchQuery = ref('')
  const focusKey = ref<string | null>(null)
  const meaningVisible = ref(false)
  const detailsVisible = ref(false)
  const loading = ref(false)
  const initialized = ref(false)
  const error = ref<string | null>(null)
  const speechError = ref<string | null>(null)
  const artJobs = ref<Record<string, number>>({})
  const artImageIds = ref<Record<string, number>>({})
  const artImageUrls = ref<Record<string, string>>({})
  const artStatuses = ref<Record<string, string>>({})
  const artQueueingKey = ref<string | null>(null)
  const artRefreshingKey = ref<string | null>(null)

  const cardMap = computed(
    () => new Map(cards.value.map((card) => [card.key, card] as const)),
  )

  const allSets = computed<MandarinStudySet[]>(() => [
    ...builtInSets.value,
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

  const customSetCount = computed(() => customSets.value.length)
  const audioSupported = computed(
    () => import.meta.client && 'speechSynthesis' in window,
  )

  function resetReveal() {
    meaningVisible.value = false
    detailsVisible.value = false
    speechError.value = null
  }

  function saveLocalState() {
    if (!import.meta.client) return
    const state: LocalState = {
      customSets: customSets.value,
      selectedSetId: selectedSetId.value,
      artJobs: artJobs.value,
      artImageIds: artImageIds.value,
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
      cards.value = response.data.cards
      builtInSets.value = response.data.sets
      if (!allSets.value.some((set) => set.id === selectedSetId.value)) {
        selectedSetId.value = builtInSets.value[0]?.id ?? 'starter-500'
      }
      initialized.value = true
      studyIndex.value = 0
      resetReveal()
    } catch (cause) {
      error.value =
        cause instanceof Error ? cause.message : 'Failed to load Mandarin cards.'
    } finally {
      loading.value = false
    }
  }

  async function initialize() {
    if (initialized.value || loading.value) return
    loadLocalState()
    await loadCatalog()
  }

  function selectSet(id: string) {
    if (!allSets.value.some((set) => set.id === id)) return
    selectedSetId.value = id
    studyIndex.value = 0
    focusKey.value = null
    resetReveal()
    saveLocalState()
  }

  function nextCard() {
    if (!studyCards.value.length) return
    focusKey.value = null
    studyIndex.value = (studyIndex.value + 1) % studyCards.value.length
    resetReveal()
  }

  function previousCard() {
    if (!studyCards.value.length) return
    focusKey.value = null
    studyIndex.value =
      (studyIndex.value - 1 + studyCards.value.length) % studyCards.value.length
    resetReveal()
  }

  function focusCard(key: string) {
    if (!cardMap.value.has(key)) return
    focusKey.value = key
    resetReveal()
  }

  function clearFocus() {
    focusKey.value = null
    resetReveal()
  }

  function toggleMeaning() {
    meaningVisible.value = !meaningVisible.value
  }

  function toggleDetails() {
    detailsVisible.value = !detailsVisible.value
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
    return set
  }

  function toggleCardInCustomSet(setId: string, cardKey: string) {
    const set = customSets.value.find((candidate) => candidate.id === setId)
    if (!set || !cardMap.value.has(cardKey)) return
    set.cardKeys = set.cardKeys.includes(cardKey)
      ? set.cardKeys.filter((key) => key !== cardKey)
      : [...set.cardKeys, cardKey]
    saveLocalState()
  }

  function cardIsInCustomSet(setId: string, cardKey: string): boolean {
    return Boolean(
      customSets.value
        .find((set) => set.id === setId)
        ?.cardKeys.includes(cardKey),
    )
  }

  function speak(card: MandarinCard | null = currentCard.value) {
    speechError.value = null
    if (!card || !import.meta.client || !('speechSynthesis' in window)) {
      speechError.value = 'Mandarin speech playback is not available in this browser.'
      return
    }

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
      speechError.value = 'The Mandarin voice could not play this word.'
    }
    window.speechSynthesis.speak(utterance)
  }

  async function fetchProtectedImage(artImageId: number): Promise<string | null> {
    if (!import.meta.client) return null
    const userStore = useUserStore()
    const token = userStore.token || userStore.user?.token || ''
    const headers = new Headers()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const response = await fetch(`/api/art/images/${artImageId}/file`, { headers })
    if (!response.ok) return null
    return URL.createObjectURL(await response.blob())
  }

  async function queueIllustration(
    card: MandarinCard | null = currentCard.value,
  ): Promise<number | null> {
    if (!card || artQueueingKey.value) return null
    artQueueingKey.value = card.key
    error.value = null
    try {
      const promptString = [
        `Educational flashcard illustration for the Mandarin concept “${card.meaning}”.`,
        'One clear memorable everyday scene or object that communicates the meaning at a glance.',
        'Culturally grounded, friendly, uncluttered, polished editorial illustration.',
        'No text, no letters, no Chinese characters, no captions, no logo, no watermark.',
      ].join(' ')
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
            designer: `mandarin:${card.key}`,
          }),
        },
        1,
        45_000,
      )
      const jobId = Number(response.data?.jobId)
      if (!response.success || !Number.isInteger(jobId) || jobId <= 0) {
        throw new Error(response.message || 'Failed to queue the Krea 2 illustration.')
      }
      artJobs.value = { ...artJobs.value, [card.key]: jobId }
      artStatuses.value = { ...artStatuses.value, [card.key]: response.data?.status || 'PENDING' }
      saveLocalState()
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
    if (!card || artRefreshingKey.value) return null
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
      if (!nextUrl) throw new Error('The finished illustration is not available yet.')
      const previousUrl = artImageUrls.value[card.key]
      if (previousUrl?.startsWith('blob:')) URL.revokeObjectURL(previousUrl)
      artImageUrls.value = { ...artImageUrls.value, [card.key]: nextUrl }
      artStatuses.value = { ...artStatuses.value, [card.key]: 'DONE' }
      return nextUrl
    } catch (cause) {
      error.value =
        cause instanceof Error ? cause.message : 'Failed to refresh the illustration.'
      return null
    } finally {
      artRefreshingKey.value = null
    }
  }

  function illustrationJobId(cardKey: string): number | null {
    const id = Number(artJobs.value[cardKey])
    return Number.isInteger(id) && id > 0 ? id : null
  }

  function illustrationUrl(cardKey: string): string | null {
    return artImageUrls.value[cardKey] || null
  }

  function illustrationStatus(cardKey: string): string | null {
    return artStatuses.value[cardKey] || null
  }

  return {
    cards,
    builtInSets,
    customSets,
    selectedSetId,
    studyIndex,
    searchQuery,
    focusKey,
    meaningVisible,
    detailsVisible,
    loading,
    initialized,
    error,
    speechError,
    artJobs,
    artImageIds,
    artImageUrls,
    artStatuses,
    artQueueingKey,
    artRefreshingKey,
    allSets,
    selectedSet,
    studyCards,
    currentCard,
    searchResults,
    customSetCount,
    audioSupported,
    initialize,
    loadCatalog,
    selectSet,
    nextCard,
    previousCard,
    focusCard,
    clearFocus,
    toggleMeaning,
    toggleDetails,
    createCustomSet,
    toggleCardInCustomSet,
    cardIsInCustomSet,
    speak,
    queueIllustration,
    refreshIllustration,
    illustrationJobId,
    illustrationUrl,
    illustrationStatus,
  }
})
