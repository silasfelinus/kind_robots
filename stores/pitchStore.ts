// /stores/pitchStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Pitch, Art } from '~/prisma/generated/prisma/client'
import { CreationSource } from '~/prisma/generated/prisma/client'
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
    const title = selectedTitle.value?.title
    if (!title) return []
    return pitches.value.filter((pitch) => pitch.title === title)
  })

  const newestPitchesDisplay = computed(() =>
    newestPitches.value.map((pitch) => ({ ...pitch, isNewest: true })),
  )

  function saveStateToLocalStorage() {
    if (!isClient) return
    localStorage.setItem('pitches', JSON.stringify(pitches.value))
  }

  function getPitchesBySelectedType(): Pitch[] {
    if (!selectedPitchType.value) return pitches.value

    return pitches.value.filter(
      (pitch) => pitch.PitchType === selectedPitchType.value,
    )
  }

  function setSelectedPitchType(pitchType: PitchType | null) {
    selectedPitchType.value = pitchType
    saveStateToLocalStorage()
  }

  async function deletePitch(pitchId: number) {
    try {
      const res = await performFetch(`/api/pitches/${pitchId}`, {
        method: 'DELETE',
      })

      if (!res.success) {
        return {
          success: false,
          message: res.message || 'Delete failed',
        }
      }

      pitches.value = pitches.value.filter((pitch) => pitch.id !== pitchId)
      selectedPitches.value = selectedPitches.value.filter(
        (pitch) => pitch.id !== pitchId,
      )

      if (selectedPitch.value?.id === pitchId) {
        selectedPitch.value = null
      }

      if (selectedTitle.value?.id === pitchId) {
        selectedTitle.value = null
      }

      newestPitches.value = newestPitches.value.filter(
        (pitch) => pitch.id !== pitchId,
      )

      saveStateToLocalStorage()

      return {
        success: true,
        message: 'Pitch deleted',
      }
    } catch (err) {
      handleError(err, 'deleting pitch')
      return {
        success: false,
        message: 'Error deleting pitch',
      }
    }
  }

  async function updatePitchExamples(pitchId: number, examplesArray: string[]) {
    const updatedExamples = joinExamples(examplesArray)
    const result = await updatePitch(pitchId, { examples: updatedExamples })

    if (result.success) {
      saveStateToLocalStorage()
    }

    return result
  }

  function addTitle({
    title,
    PitchType: pitchType,
    pitch,
  }: {
    title: string
    PitchType: PitchType
    pitch?: string
  }) {
    return createPitch({
      title,
      PitchType: pitchType,
      pitch: pitchType === PitchType.TITLE ? title : pitch,
    })
  }

  function clearLocalStorage() {
    if (!isClient) return

    const keys = [
      'pitches',
      'selectedPitches',
      'selectedPitchType',
      'galleryArt',
      'selectedTitle',
      'newestPitches',
      'numberOfRequests',
      'temperature',
      'exampleString',
      'apiResponse',
      'maxTokens',
    ]

    keys.forEach((key) => localStorage.removeItem(key))
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

        pitches.value = res.data.map((pitch) => ({
          ...pitch,
          PitchType: parsePitchType(pitch.PitchType as unknown as string),
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

  async function updatePitch(pitchId: number, updates: Partial<Pitch>) {
    try {
      const res = await performFetch<Pitch>(`/api/pitches/${pitchId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })

      const index = pitches.value.findIndex((pitch) => pitch.id === pitchId)

      if (res.success && res.data && index !== -1) {
        pitches.value[index] = {
          ...pitches.value[index],
          ...res.data,
          PitchType: parsePitchType(res.data.PitchType as unknown as string),
        }

        if (selectedPitch.value?.id === pitchId) {
          selectedPitch.value = pitches.value[index]
        }

        if (selectedTitle.value?.id === pitchId) {
          selectedTitle.value = pitches.value[index]
        }

        saveStateToLocalStorage()

        return { success: true, message: 'Pitch updated successfully' }
      }

      return {
        success: false,
        message: res.message || 'Update failed',
      }
    } catch (err) {
      handleError(err, 'updating pitch')
      return { success: false, message: 'Error updating pitch' }
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

  async function fetchTitleStormPitches() {
    if (!selectedTitle.value) return
    if (loading.value) return

    loading.value = true

    try {
      const content = buildTitleStormPrompt(
        selectedTitle.value.title || '',
        selectedTitle.value.description || '',
        numberOfRequests.value,
        exampleString.value,
      )

      const body = {
        n: 1,
        content,
        max_tokens: maxTokens.value,
        temperature: temperature.value,
      }

      const res = await performFetch<string>('/api/botcafe/titleStorm', {
        method: 'POST',
        body: JSON.stringify(body),
      })

      if (res.success) {
        apiResponse.value = res.data || 'No response'

        const created = await createPitch({
          title: selectedTitle.value.title,
          description: selectedTitle.value.description,
          examples: res.data,
          PitchType: PitchType.BRAINSTORM,
          pitch: res.data,
        })

        if (created.success && created.data) {
          newestPitches.value = [created.data]
          saveStateToLocalStorage()
        }
      }
    } catch (err) {
      handleError(err, 'fetching title storm')
    } finally {
      loading.value = false
    }
  }

  function setSelectedPitch(pitchId: number) {
    const pitch = pitches.value.find((item) => item.id === pitchId)
    if (pitch) {
      selectedPitch.value = pitch
      selectedPitches.value = [pitch]
    }
  }

  function setSelectedTitle(pitchId: number) {
    selectedTitle.value =
      pitches.value.find((pitch) => pitch.id === pitchId) || null
  }

  function selectPitch(pitchId: number) {
    const found = pitches.value.find((pitch) => pitch.id === pitchId)
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
    updatePitch,
    fetchArtForPitch,
    fetchBrainstormPitches,
    fetchTitleStormPitches,
    setSelectedPitch,
    setSelectedTitle,
    selectPitch,
    getSelectedExamples,
    randomEntry,
    clearLocalStorage,
    deletePitch,
    setSelectedPitchType,
    addTitle,
    updatePitchExamples,
    getPitchesBySelectedType,
    saveStateToLocalStorage,
  }
})

export { PitchType, CreationSource }
