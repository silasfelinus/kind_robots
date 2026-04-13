// /stores/pitchStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Pitch, Art } from '~/prisma/generated/prisma/client'
import { useUserStore } from './userStore'
import { performFetch, handleError } from './utils'
import {
  randomEntry as helperRandomEntry,
  filterPitchesByType,
  groupPitchesByTitle,
  filterPublicPitches,
  extractExamples,
  joinExamples,
  buildTitleStormPrompt,
  buildBrainstormPrompt,
  parsePitchType,
  PitchType,
} from './helpers/pitchHelper'

export type { Pitch }

export const usePitchStore = defineStore('pitchStore', () => {
  const isClient = typeof window !== 'undefined'

  const pitches = ref<Pitch[]>([])
  const selectedPitches = ref<Pitch[]>([])
  const selectedPitchType = ref<PitchType | null>(null)
  const selectedPitch = ref<Pitch | null>(null)
  const selectedTitle = ref<Pitch | null>(null)

  const newestPitches = ref<Pitch[]>([])
  const galleryArt = ref<Record<number, Art[]>>({})

  const loading = ref(false)
  const isInitialized = ref(false)
  const hasLoaded = ref(false)

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchPromise = ref<Promise<Pitch[]> | null>(null)

  const numberOfRequests = ref(1)
  const temperature = ref(0.9)
  const exampleString = ref(' ')
  const apiResponse = ref(' ')
  const maxTokens = ref(500)

  const pitchTypes = Object.values(PitchType)
  const userStore = useUserStore()

  const selectedPitchId = computed(() => selectedPitch.value?.id)

  const titles = computed(() =>
    filterPitchesByType(PitchType.TITLE, pitches.value),
  )

  const brainstormPitches = computed(() =>
    filterPitchesByType(PitchType.BRAINSTORM, pitches.value),
  )

  const randomListPitches = computed(() =>
    filterPitchesByType(PitchType.RANDOMLIST, pitches.value),
  )

  const pitchesByTitle = computed(() => groupPitchesByTitle(pitches.value))

  const publicPitches = computed(() =>
    filterPublicPitches(pitches.value, userStore.userId),
  )

  const selectedTitlePitches = computed(() => {
    const t = selectedTitle.value?.title
    if (!t) return []
    return pitches.value.filter((p) => p.title === t)
  })

  const newestPitchesDisplay = computed(() =>
    newestPitches.value.map((p) => ({ ...p, isNewest: true })),
  )

  function saveStateToLocalStorage() {
    if (!isClient) return
    localStorage.setItem('pitches', JSON.stringify(pitches.value))
  }

  async function initialize() {
    if (!isClient || isInitialized.value) return
    if (initializePromise.value) return initializePromise.value

    initializePromise.value = (async () => {
      try {
        const stored = localStorage.getItem('pitches')
        if (stored) pitches.value = JSON.parse(stored)

        if (!hasLoaded.value) {
          await fetchPitches()
        }

        isInitialized.value = true
      } catch (err) {
        isInitialized.value = false
        handleError(err, 'initializing pitch store')
      } finally {
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function fetchPitches(force = false): Promise<Pitch[]> {
    if (!force && hasLoaded.value) return pitches.value
    if (fetchPromise.value) return fetchPromise.value

    fetchPromise.value = (async () => {
      loading.value = true

      try {
        const res = await performFetch<Pitch[]>('/api/pitches')

        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to fetch pitches')
        }

        pitches.value = res.data.map((p) => ({
          ...p,
          PitchType: parsePitchType(p.PitchType as unknown as string),
        }))

        hasLoaded.value = true
        saveStateToLocalStorage()

        return pitches.value
      } catch (err) {
        hasLoaded.value = false
        handleError(err, 'fetching pitches')
        return []
      } finally {
        loading.value = false
        fetchPromise.value = null
      }
    })()

    return fetchPromise.value
  }

  async function fetchArtForPitch(pitchId: number) {
    if (galleryArt.value[pitchId]) return

    try {
      const res = await performFetch<Art[]>(`/api/pitches/art/${pitchId}`)
      if (res.success) {
        galleryArt.value[pitchId] = res.data || []
      }
    } catch (err) {
      handleError(err, 'fetching art for pitch')
    }
  }

  async function createPitch(payload: Partial<Pitch>) {
    try {
      const res = await performFetch<Pitch>('/api/pitches', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Creation failed')
      }

      const created = {
        ...res.data,
        PitchType: parsePitchType(res.data.PitchType as unknown as string),
      }

      pitches.value.push(created)
      saveStateToLocalStorage()

      return { success: true, data: created }
    } catch (err) {
      handleError(err, 'creating pitch')
      return { success: false, message: 'Error creating pitch' }
    }
  }

  async function fetchBrainstormPitches() {
    if (!selectedTitle.value) return
    if (loading.value) return

    loading.value = true

    try {
      const content = buildBrainstormPrompt(
        selectedTitle.value.title || '',
        selectedTitle.value.description || '',
        numberOfRequests.value,
        exampleString.value,
      )

      const res = await performFetch<string>('/api/botcafe/brainstorm', {
        method: 'POST',
        body: JSON.stringify({
          n: numberOfRequests.value,
          content,
          max_tokens: maxTokens.value,
          temperature: temperature.value,
        }),
      })

      if (res.success) {
        apiResponse.value = res.data || ''
      }
    } catch (err) {
      handleError(err, 'brainstorm')
    } finally {
      loading.value = false
    }
  }

  function setSelectedPitch(pitchId: number) {
    const pitch = pitches.value.find((p) => p.id === pitchId)
    if (pitch) selectedPitches.value = [pitch]
  }

  function setSelectedTitle(pitchId: number) {
    selectedTitle.value = pitches.value.find((p) => p.id === pitchId) || null
  }

  function selectPitch(pitchId: number) {
    const found = pitches.value.find((p) => p.id === pitchId)
    if (found) selectedPitch.value = found
  }

  function randomEntry(pitchName: string): string {
    return helperRandomEntry(pitchName, pitches.value)
  }

  function getSelectedExamples(): string[] {
    return extractExamples(selectedPitch.value?.examples ?? '')
  }

  return {
    pitches,
    selectedPitches,
    selectedPitchType,
    selectedPitch,
    selectedTitle,
    newestPitches,
    galleryArt,
    loading,
    numberOfRequests,
    temperature,
    exampleString,
    apiResponse,
    maxTokens,
    pitchTypes,
    selectedPitchId,
    titles,
    brainstormPitches,
    randomListPitches,
    pitchesByTitle,
    publicPitches,
    selectedTitlePitches,
    newestPitchesDisplay,
    initialize,
    fetchPitches,
    createPitch,
    fetchArtForPitch,
    fetchBrainstormPitches,
    setSelectedPitch,
    setSelectedTitle,
    selectPitch,
    getSelectedExamples,
    randomEntry,
  }
})

export { PitchType }
