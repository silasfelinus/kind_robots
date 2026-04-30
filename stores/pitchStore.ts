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

export type CreationSource = 'HUMAN' | 'AI' | 'UNKNOWN' | 'HYBRID' | 'UPLOAD'

export type { Pitch }

type PitchInitializeOptions = {
  force?: boolean
  fetchRemote?: boolean
}

const isClient = typeof window !== 'undefined'

const storageKeys = {
  pitches: 'pitches',
  selectedPitches: 'selectedPitches',
  selectedPitchType: 'selectedPitchType',
  galleryArt: 'galleryArt',
  selectedTitle: 'selectedTitle',
  newestPitches: 'newestPitches',
  numberOfRequests: 'numberOfRequests',
  temperature: 'temperature',
  exampleString: 'exampleString',
  apiResponse: 'apiResponse',
  maxTokens: 'maxTokens',
}

function safeGetLocalStorage(key: string): string | null {
  if (!isClient) return null

  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLocalStorage(key: string, value: string): void {
  if (!isClient) return

  try {
    localStorage.setItem(key, value)
  } catch {}
}

function safeRemoveLocalStorage(key: string): void {
  if (!isClient) return

  try {
    localStorage.removeItem(key)
  } catch {}
}

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function safeParseObject<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback

  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as T) : fallback
  } catch {
    return fallback
  }
}

function safeParseNumber(raw: string | null, fallback: number): number {
  if (!raw) return fallback

  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizePitch(pitch: Pitch): Pitch {
  return {
    ...pitch,
    PitchType: parsePitchType(pitch.PitchType as unknown as string),
  }
}

function sortPitches(a: Pitch, b: Pitch): number {
  return b.id - a.id
}

export const usePitchStore = defineStore('pitchStore', () => {
  const pitches = ref<Pitch[]>([])
  const selectedPitches = ref<Pitch[]>([])
  const selectedPitchType = ref<PitchType | null>(null)
  const selectedPitch = ref<Pitch | null>(null)
  const selectedTitle = ref<Pitch | null>(null)

  const newestPitches = ref<Pitch[]>([])
  const galleryArt = ref<Record<number, Art[]>>({})

  const loading = ref(false)
  const isInitialized = ref(false)
  const isInitializing = ref(false)
  const hasLoaded = ref(false)
  const lastError = ref<string | null>(null)

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchPromise = ref<Promise<Pitch[]> | null>(null)
  const fetchArtForPitchPromises = ref<Record<number, Promise<Art[]>>>({})
  const createPitchPromise = ref<Promise<{
    success: boolean
    data?: Pitch
    message?: string
  }> | null>(null)

  const numberOfRequests = ref(10)
  const temperature = ref(0.9)
  const exampleString = ref(' ')
  const apiResponse = ref('')
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

  function setLastError(error: unknown, fallback: string): void {
    lastError.value = error instanceof Error ? error.message : fallback
  }

  function clearError(): void {
    lastError.value = null
  }

  function saveStateToLocalStorage() {
    safeSetLocalStorage(storageKeys.pitches, JSON.stringify(pitches.value))
    safeSetLocalStorage(
      storageKeys.selectedPitches,
      JSON.stringify(selectedPitches.value),
    )
    safeSetLocalStorage(
      storageKeys.selectedPitchType,
      JSON.stringify(selectedPitchType.value),
    )
    safeSetLocalStorage(
      storageKeys.galleryArt,
      JSON.stringify(galleryArt.value),
    )
    safeSetLocalStorage(
      storageKeys.selectedTitle,
      JSON.stringify(selectedTitle.value),
    )
    safeSetLocalStorage(
      storageKeys.newestPitches,
      JSON.stringify(newestPitches.value),
    )
    safeSetLocalStorage(
      storageKeys.numberOfRequests,
      String(numberOfRequests.value),
    )
    safeSetLocalStorage(storageKeys.temperature, String(temperature.value))
    safeSetLocalStorage(storageKeys.exampleString, exampleString.value)
    safeSetLocalStorage(storageKeys.apiResponse, apiResponse.value)
    safeSetLocalStorage(storageKeys.maxTokens, String(maxTokens.value))
  }

  function hydrateFromLocalStorage() {
    pitches.value = safeParseArray<Pitch>(
      safeGetLocalStorage(storageKeys.pitches),
    )
      .map(normalizePitch)
      .sort(sortPitches)

    selectedPitches.value = safeParseArray<Pitch>(
      safeGetLocalStorage(storageKeys.selectedPitches),
    ).map(normalizePitch)

    const storedType = safeGetLocalStorage(storageKeys.selectedPitchType)
    selectedPitchType.value =
      storedType && storedType !== 'null'
        ? parsePitchType(JSON.parse(storedType) as string)
        : null

    galleryArt.value = safeParseObject<Record<number, Art[]>>(
      safeGetLocalStorage(storageKeys.galleryArt),
      {},
    )

    selectedTitle.value = safeParseObject<Pitch | null>(
      safeGetLocalStorage(storageKeys.selectedTitle),
      null,
    )

    if (selectedTitle.value) {
      selectedTitle.value = normalizePitch(selectedTitle.value)
    }

    newestPitches.value = safeParseArray<Pitch>(
      safeGetLocalStorage(storageKeys.newestPitches),
    ).map(normalizePitch)

    numberOfRequests.value = safeParseNumber(
      safeGetLocalStorage(storageKeys.numberOfRequests),
      10,
    )

    temperature.value = safeParseNumber(
      safeGetLocalStorage(storageKeys.temperature),
      0.9,
    )

    exampleString.value =
      safeGetLocalStorage(storageKeys.exampleString) ?? exampleString.value

    apiResponse.value =
      safeGetLocalStorage(storageKeys.apiResponse) ?? apiResponse.value

    maxTokens.value = safeParseNumber(
      safeGetLocalStorage(storageKeys.maxTokens),
      500,
    )
  }

  function upsertPitch(pitch: Pitch): Pitch {
    const normalized = normalizePitch(pitch)
    const index = pitches.value.findIndex((entry) => entry.id === normalized.id)

    if (index >= 0) {
      pitches.value.splice(index, 1, normalized)
    } else {
      pitches.value.push(normalized)
    }

    pitches.value.sort(sortPitches)

    if (selectedPitch.value?.id === normalized.id) {
      selectedPitch.value = normalized
    }

    if (selectedTitle.value?.id === normalized.id) {
      selectedTitle.value = normalized
    }

    selectedPitches.value = selectedPitches.value.map((entry) =>
      entry.id === normalized.id ? normalized : entry,
    )

    saveStateToLocalStorage()

    return normalized
  }

  function removePitchLocally(pitchId: number) {
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

    delete galleryArt.value[pitchId]

    saveStateToLocalStorage()
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

  async function initialize(
    options: PitchInitializeOptions = {},
  ): Promise<void> {
    if (!isClient && !options.fetchRemote) return
    if (isInitialized.value && !options.force) return
    if (initializePromise.value && !options.force)
      return initializePromise.value

    initializePromise.value = (async () => {
      try {
        isInitializing.value = true
        clearError()

        hydrateFromLocalStorage()

        if (options.fetchRemote) {
          await fetchPitches(Boolean(options.force))
        }

        isInitialized.value = true
      } catch (error) {
        isInitialized.value = false
        handleError(error, 'initializing pitch store')
        setLastError(error, 'Failed to initialize pitch store')
      } finally {
        isInitializing.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function fetchPitches(force = false): Promise<Pitch[]> {
    if (!force && hasLoaded.value && pitches.value.length) return pitches.value
    if (fetchPromise.value && !force) return fetchPromise.value

    fetchPromise.value = (async () => {
      loading.value = true

      try {
        clearError()

        const res = await performFetch<Pitch[]>('/api/pitches')

        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to fetch pitches')
        }

        pitches.value = res.data.map(normalizePitch).sort(sortPitches)
        hasLoaded.value = true
        saveStateToLocalStorage()

        return pitches.value
      } catch (error) {
        hasLoaded.value = false
        handleError(error, 'fetching pitches')
        setLastError(error, 'Failed to fetch pitches')
        return pitches.value
      } finally {
        loading.value = false
        fetchPromise.value = null
      }
    })()

    return fetchPromise.value
  }

  async function fetchArtForPitch(pitchId: number): Promise<Art[]> {
    if (galleryArt.value[pitchId]) return galleryArt.value[pitchId]

    if (fetchArtForPitchPromises.value[pitchId]) {
      return fetchArtForPitchPromises.value[pitchId]
    }

    fetchArtForPitchPromises.value[pitchId] = (async () => {
      try {
        clearError()

        const res = await performFetch<Art[]>(`/api/pitches/art/${pitchId}`)

        if (res.success) {
          galleryArt.value[pitchId] = res.data || []
          saveStateToLocalStorage()
          return galleryArt.value[pitchId]
        }

        throw new Error(res.message || 'Failed to fetch art for pitch')
      } catch (error) {
        handleError(error, 'fetching art for pitch')
        setLastError(error, 'Failed to fetch art for pitch')
        return []
      } finally {
        delete fetchArtForPitchPromises.value[pitchId]
      }
    })()

    return fetchArtForPitchPromises.value[pitchId]
  }

  async function createPitch(payload: Partial<Pitch>) {
    if (createPitchPromise.value) {
      return createPitchPromise.value
    }

    createPitchPromise.value = (async () => {
      try {
        clearError()

        const res = await performFetch<Pitch>('/api/pitches', {
          method: 'POST',
          body: JSON.stringify(payload),
        })

        if (!res.success || !res.data) {
          throw new Error(res.message || 'Creation failed')
        }

        const created = upsertPitch(res.data)

        return { success: true, data: created }
      } catch (error) {
        handleError(error, 'creating pitch')
        setLastError(error, 'Error creating pitch')
        return { success: false, message: 'Error creating pitch' }
      } finally {
        createPitchPromise.value = null
      }
    })()

    return createPitchPromise.value
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

  async function updatePitchExamples(pitchId: number, examplesArray: string[]) {
    const updatedExamples = joinExamples(examplesArray)
    const result = await updatePitch(pitchId, { examples: updatedExamples })

    if (result.success) {
      saveStateToLocalStorage()
    }

    return result
  }

  async function deletePitch(pitchId: number) {
    try {
      clearError()

      const res = await performFetch(`/api/pitches/${pitchId}`, {
        method: 'DELETE',
      })

      if (!res.success) {
        return {
          success: false,
          message: res.message || 'Delete failed',
        }
      }

      removePitchLocally(pitchId)

      return {
        success: true,
        message: 'Pitch deleted',
      }
    } catch (error) {
      handleError(error, 'deleting pitch')
      setLastError(error, 'Error deleting pitch')

      return {
        success: false,
        message: 'Error deleting pitch',
      }
    }
  }

  async function updatePitch(pitchId: number, updates: Partial<Pitch>) {
    try {
      clearError()

      const res = await performFetch<Pitch>(`/api/pitches/${pitchId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })

      if (res.success && res.data) {
        upsertPitch(res.data)

        return {
          success: true,
          message: 'Pitch updated successfully',
        }
      }

      return {
        success: false,
        message: res.message || 'Update failed',
      }
    } catch (error) {
      handleError(error, 'updating pitch')
      setLastError(error, 'Error updating pitch')

      return {
        success: false,
        message: 'Error updating pitch',
      }
    }
  }

  function normalizeBrainstormResponse(value: unknown): string {
    if (!value) return ''

    if (typeof value === 'string') return value

    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === 'string') return item

          if (item && typeof item === 'object') {
            const pitch = item as Partial<Pitch>
            return [pitch.title, pitch.pitch, pitch.description]
              .filter(Boolean)
              .join(': ')
          }

          return String(item)
        })
        .filter(Boolean)
        .join('\n')
    }

    if (typeof value === 'object') {
      const record = value as Record<string, unknown>
      return normalizeBrainstormResponse(
        record.text ?? record.content ?? record.message ?? record.data,
      )
    }

    return String(value)
  }

  async function fetchBrainstormPitches() {
    if (!selectedTitle.value) {
      return {
        success: false,
        message: 'No selected title',
      }
    }

    if (loading.value) {
      return {
        success: false,
        message: 'Brainstorm already loading',
      }
    }

    loading.value = true

    try {
      clearError()

      const activeTitle = selectedTitle.value

      const examples = extractExamples(exampleString.value).map((example) => ({
        title: activeTitle.title || 'Example',
        pitch: example,
      }))

      const content = buildBrainstormPrompt(
        activeTitle.title || '',
        activeTitle.description || '',
        numberOfRequests.value,
        exampleString.value,
      )

      const res = await performFetch<unknown>('/api/botcafe/brainstorm', {
        method: 'POST',
        body: JSON.stringify({
          title: activeTitle.title || '',
          description: activeTitle.description || '',
          instructions: activeTitle.description || '',
          examples,
          n: numberOfRequests.value,
          content,
          max_tokens: maxTokens.value,
          maxTokens: maxTokens.value,
          maxOutputTokens: maxTokens.value,
          temperature: temperature.value,
        }),
      })

      if (!res.success) {
        return {
          success: false,
          message: res.message || 'Brainstorm request failed',
        }
      }

      apiResponse.value = normalizeBrainstormResponse(res.data)
      saveStateToLocalStorage()

      return {
        success: true,
        data: apiResponse.value,
        message: 'Brainstorm generated',
      }
    } catch (error) {
      handleError(error, 'brainstorm')
      setLastError(error, 'Error generating brainstorm')

      return {
        success: false,
        message: 'Error generating brainstorm',
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchTitleStormPitches() {
    if (!selectedTitle.value) return
    if (loading.value) return

    loading.value = true

    try {
      clearError()

      const activeTitle = selectedTitle.value

      const content = buildTitleStormPrompt(
        activeTitle.title || '',
        activeTitle.description || '',
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
          title: activeTitle.title,
          description: activeTitle.description,
          examples: res.data,
          PitchType: PitchType.BRAINSTORM,
          pitch: res.data,
        })

        if (created.success && created.data) {
          newestPitches.value = [created.data]
          saveStateToLocalStorage()
        }
      }
    } catch (error) {
      handleError(error, 'fetching title storm')
      setLastError(error, 'Error fetching title storm')
    } finally {
      loading.value = false
    }
  }

  function setSelectedPitch(pitchId: number) {
    const pitch = pitches.value.find((item) => item.id === pitchId)

    if (pitch) {
      selectedPitch.value = pitch
      selectedPitches.value = [pitch]
      saveStateToLocalStorage()
    }
  }

  function setSelectedTitle(pitchId: number) {
    selectedTitle.value =
      pitches.value.find((pitch) => pitch.id === pitchId) || null

    saveStateToLocalStorage()
  }

  function selectPitch(pitchId: number) {
    const found = pitches.value.find((pitch) => pitch.id === pitchId)

    if (found) {
      selectedPitch.value = found
      saveStateToLocalStorage()
    }
  }

  function randomEntry(pitchName: string): string {
    return helperRandomEntry(pitchName, pitches.value)
  }

  function getSelectedExamples(): string[] {
    return extractExamples(selectedPitch.value?.examples ?? '')
  }

  function clearLocalStorage() {
    Object.values(storageKeys).forEach((key) => safeRemoveLocalStorage(key))
  }

  function resetInitialization() {
    isInitialized.value = false
    isInitializing.value = false
    initializePromise.value = null
    fetchPromise.value = null
    fetchArtForPitchPromises.value = {}
    createPitchPromise.value = null
    lastError.value = null
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
    isInitialized,
    isInitializing,
    hasLoaded,
    lastError,
    initializePromise,
    fetchPromise,
    fetchArtForPitchPromises,
    createPitchPromise,

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
    resetInitialization,
    hydrateFromLocalStorage,
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

export { PitchType }
