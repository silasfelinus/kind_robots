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
  buildPitchPayload,
  parsePitchType,
  isValidPitch,
  PitchType,
} from './helpers/pitchHelper'

export type { Pitch }

export const usePitchStore = defineStore('pitchStore', () => {
  const isClient = typeof window !== 'undefined'

  const pitches = ref<Pitch[]>([])
  const selectedPitches = ref<Pitch[]>([])
  const selectedPitchType = ref<PitchType | null>(null)
  const isInitialized = ref(false)
  const galleryArt = ref<Art[]>([])
  const selectedTitle = ref<Pitch | null>(null)
  const newestPitches = ref<Pitch[]>([])
  const loading = ref(false)
  const numberOfRequests = ref(1)
  const temperature = ref(0.9)
  const exampleString = ref(' ')
  const apiResponse = ref(' ')
  const maxTokens = ref(500)
  const selectedPitch = ref<Pitch | null>(null)
  const pitchTypes = Object.values(PitchType)
  const selectedPitchId = computed(() => selectedPitch.value?.id)

  const userStore = useUserStore()

  // Computed
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
  const selectedTitlePitches = computed(() =>
    selectedTitle.value
      ? pitches.value.filter(
          (p: { title: any }) => p.title === selectedTitle.value?.title,
        )
      : [],
  )
  const newestPitchesDisplay = computed(() =>
    newestPitches.value.map((p: any) => ({ ...p, isNewest: true })),
  )

  function saveStateToLocalStorage() {
    if (!isClient) return
    localStorage.setItem('pitches', JSON.stringify(pitches.value))
    localStorage.setItem(
      'selectedPitches',
      JSON.stringify(selectedPitches.value),
    )
    localStorage.setItem(
      'selectedPitchType',
      JSON.stringify(selectedPitchType.value),
    )
    localStorage.setItem('galleryArt', JSON.stringify(galleryArt.value))
    localStorage.setItem('selectedTitle', JSON.stringify(selectedTitle.value))
    localStorage.setItem('newestPitches', JSON.stringify(newestPitches.value))
    localStorage.setItem(
      'numberOfRequests',
      JSON.stringify(numberOfRequests.value),
    )
    localStorage.setItem('temperature', String(temperature.value))
    localStorage.setItem('exampleString', exampleString.value)
    localStorage.setItem('apiResponse', apiResponse.value)
    localStorage.setItem('maxTokens', JSON.stringify(maxTokens.value))
  }

  function getPitchesBySelectedType(): Pitch[] {
    return selectedPitchType.value
      ? pitches.value.filter(
          (p: { PitchType: PitchType | null }) =>
            p.PitchType === selectedPitchType.value,
        )
      : pitches.value
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

    const stored = (key: string) => localStorage.getItem(key)

    pitches.value = JSON.parse(stored('pitches') || '[]')
    selectedPitches.value = JSON.parse(stored('selectedPitches') || '[]')
    selectedPitchType.value = JSON.parse(stored('selectedPitchType') || 'null')
    galleryArt.value = JSON.parse(stored('galleryArt') || '[]')
    selectedTitle.value = JSON.parse(stored('selectedTitle') || 'null')
    newestPitches.value = JSON.parse(stored('newestPitches') || '[]')
    numberOfRequests.value = JSON.parse(stored('numberOfRequests') || '1')
    temperature.value = Number(JSON.parse(stored('temperature') || '0.9'))
    exampleString.value = stored('exampleString') || ' '
    apiResponse.value = stored('apiResponse') || ' '
    maxTokens.value = JSON.parse(stored('maxTokens') || '500')

    await fetchPitches()
    isInitialized.value = true
  }

  async function fetchPitches() {
    loading.value = true
    try {
      const res = await performFetch<Pitch[]>('/api/pitches')
      if (res.success && res.data) {
        pitches.value = res.data.map((p) => ({
          ...p,
          PitchType: parsePitchType(p.PitchType as string),
        }))
        saveStateToLocalStorage()
      }
    } catch (err) {
      handleError(err, 'fetching pitches')
    } finally {
      loading.value = false
    }
  }

  async function updatePitch(pitchId: number, updates: Partial<Pitch>) {
    try {
      const res = await performFetch<Pitch>(`/api/pitches/${pitchId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      const index = pitches.value.findIndex(
        (p: { id: number }) => p.id === pitchId,
      )
      if (res.success && res.data && index !== -1) {
        pitches.value[index] = { ...pitches.value[index], ...res.data }
        saveStateToLocalStorage()
        return { success: true, message: 'Pitch updated successfully' }
      }
      return { success: false, message: res.message || 'Update failed' }
    } catch (err) {
      handleError(err, 'updating pitch')
      return { success: false, message: 'Error updating pitch' }
    }
  }

  async function deletePitch(pitchId: number) {
    try {
      const res = await performFetch(`/api/pitches/${pitchId}`, {
        method: 'DELETE',
      })
      if (res.success) {
        pitches.value = pitches.value.filter(
          (p: { id: number }) => p.id !== pitchId,
        )
        saveStateToLocalStorage()
        return { success: true, message: 'Pitch deleted' }
      }
      return { success: false, message: res.message || 'Delete failed' }
    } catch (err) {
      handleError(err, 'deleting pitch')
      return { success: false, message: 'Error deleting pitch' }
    }
  }

  async function fetchPitchById(pitchId: number) {
    try {
      const res = await performFetch<Pitch>(`/api/pitches/${pitchId}`)
      if (res.success && res.data) {
        if (!pitches.value.find((p: { id: number }) => p.id === pitchId)) {
          pitches.value.push(res.data)
          saveStateToLocalStorage()
        }
        return { success: true, data: res.data }
      }
      return { success: false, message: res.message || 'Fetch failed' }
    } catch (err) {
      handleError(err, 'fetching pitch by ID')
      return { success: false, message: 'Error fetching pitch' }
    }
  }

  async function fetchArtForPitch(pitchId: number) {
    try {
      const res = await performFetch<Art[]>(`/api/pitches/art/${pitchId}`)
      if (res.success) {
        galleryArt.value = res.data || []
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
      if (res.success && res.data) {
        pitches.value.push({
          ...res.data,
          PitchType: parsePitchType(res.data.PitchType as string),
        })
        saveStateToLocalStorage()
        return { success: true, data: res.data }
      }
      return { success: false, message: res.message || 'Creation failed' }
    } catch (err) {
      handleError(err, 'creating pitch')
      return { success: false, message: 'Error creating pitch' }
    }
  }

  async function fetchTitleStormPitches() {
    if (!selectedTitle.value) return
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
    try {
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
    }
  }

  async function fetchBrainstormPitches() {
    if (!selectedTitle.value) return
    const content = buildBrainstormPrompt(
      selectedTitle.value.title || '',
      selectedTitle.value.description || '',
      numberOfRequests.value,
      exampleString.value,
    )
    const body = {
      n: numberOfRequests.value,
      content,
      max_tokens: maxTokens.value,
      temperature: temperature.value,
    }
    try {
      const res = await performFetch<string>('/api/botcafe/brainstorm', {
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
      handleError(err, 'fetching brainstorm')
    }
  }

  async function fetchRandomPitches(count: number) {
    try {
      const res = await performFetch<Pitch[]>(
        `/api/pitches/random?count=${count}`,
      )
      if (res.success) {
        selectedPitches.value = res.data || []
        saveStateToLocalStorage()
      }
    } catch (err) {
      handleError(err, 'fetching random pitches')
    }
  }

  function setSelectedPitch(pitchId: number) {
    const pitch = pitches.value.find((p: { id: number }) => p.id === pitchId)
    if (pitch) selectedPitches.value = [pitch]
    saveStateToLocalStorage()
  }

  function setSelectedPitchType(pitchType: PitchType | null) {
    selectedPitchType.value = pitchType
    saveStateToLocalStorage()
  }

  function setSelectedTitle(pitchId: number) {
    selectedTitle.value =
      pitches.value.find((p: { id: number }) => p.id === pitchId) || null
    saveStateToLocalStorage()
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

  function addPitches(newPitches: Pitch[]) {
    const toAdd = newPitches.filter(
      (np) => !pitches.value.some((p: { id: any }) => p.id === np.id),
    )
    pitches.value.push(...toAdd)
    const sorted = pitches.value
      .filter(
        (p: { PitchType: PitchType }) => p.PitchType === PitchType.BRAINSTORM,
      )
      .sort(
        (
          a: { createdAt: string | number | Date },
          b: { createdAt: string | number | Date },
        ) => +new Date(b.createdAt) - +new Date(a.createdAt),
      )
    selectedPitches.value = sorted.slice(0, 5)
    saveStateToLocalStorage()
  }

  function selectPitch(pitchId: number) {
    const found = pitches.value.find((p: { id: number }) => p.id === pitchId)
    if (found) selectedPitch.value = found
  }

  async function updatePitchExamples(pitchId: number, examplesArray: string[]) {
    const updated = joinExamples(examplesArray)
    await updatePitch(pitchId, { examples: updated })
    saveStateToLocalStorage()
  }

  function randomEntry(pitchName: string): string {
    return helperRandomEntry(pitchName, pitches.value)
  }
  // should be implemented in same structure here.

  function getSelectedExamples(): string[] {
    return extractExamples(selectedPitch.value?.examples ?? '')
  }

  return {
    pitches,
    selectedPitches,
    selectedPitchType,
    isInitialized,
    galleryArt,
    selectedTitle,
    newestPitches,
    loading,
    numberOfRequests,
    temperature,
    exampleString,
    apiResponse,
    maxTokens,
    selectedPitch,

    titles,
    brainstormPitches,
    randomListPitches,
    pitchesByTitle,
    publicPitches,
    selectedTitlePitches,
    newestPitchesDisplay,

    saveStateToLocalStorage,
    clearLocalStorage,
    initialize,
    fetchPitches,
    createPitch,
    updatePitch,
    deletePitch,
    fetchPitchById,
    fetchArtForPitch,
    fetchTitleStormPitches,
    fetchBrainstormPitches,
    fetchRandomPitches,
    setSelectedPitch,
    setSelectedPitchType,
    setSelectedTitle,
    addTitle,
    addPitches,
    selectPitch,
    updatePitchExamples,
    getSelectedExamples,
    randomEntry,
    getPitchesBySelectedType,
    pitchTypes,
    selectedPitchId,
  }
})

export { PitchType }
