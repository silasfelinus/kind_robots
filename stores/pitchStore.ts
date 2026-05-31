// /stores/pitchStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ArtImage, Pitch, Prompt } from '~/prisma/generated/prisma/client'
import { useUserStore } from './userStore'
import { usePromptStore } from './promptStore'
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

type CreationSource = 'HUMAN' | 'AI' | 'UNKNOWN' | 'HYBRID' | 'UPLOAD'

export interface PitchForm extends Partial<Pitch> {
  promptIds?: number[]
}

type PitchInitializeOptions = {
  force?: boolean
  fetchRemote?: boolean
  createBlankForm?: boolean
}

type PitchMutationResult = {
  success: boolean
  data?: Pitch
  message: string
}

const isClient = typeof window !== 'undefined'

const storageKeys = {
  pitches: 'pitches',
  pitchForm: 'pitchForm',
  selectedPitches: 'selectedPitches',
  selectedPitchType: 'selectedPitchType',
  selectedPitch: 'selectedPitch',
  selectedTitle: 'selectedTitle',
  galleryArt: 'galleryArt',
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

function defaultPitchForm(
  userId?: number | null,
  username?: string,
): PitchForm {
  return {
    title: '',
    pitch: '',
    genre: '',
    designer: username || 'Kind Designer',
    flavorText: '',
    PitchType: PitchType.ARTPITCH,
    creationSource: 'HUMAN',
    isMature: false,
    isPublic: true,
    userId: userId || 10,
    artPrompt: '',
    description: '',
    examples: '',
    icon: 'kind-icon:idea',
    artImageId: null,
    promptIds: [],
  } as PitchForm
}

function normalizePitchForm(input: Partial<PitchForm>): PitchForm {
  return {
    ...input,
    PitchType: parsePitchType(input.PitchType as unknown as string),
  } as PitchForm
}

export const usePitchStore = defineStore('pitchStore', () => {
  const pitches = ref<Pitch[]>([])
  const pitchForm = ref<PitchForm>({})
  const selectedPitches = ref<Pitch[]>([])
  const selectedPitchType = ref<PitchType | null>(null)
  const selectedPitch = ref<Pitch | null>(null)
  const selectedTitle = ref<Pitch | null>(null)

  const newestPitches = ref<Pitch[]>([])
  const galleryArt = ref<Record<number, ArtImage[]>>({})

  const loading = ref(false)
  const isSaving = ref(false)
  const isGeneratingFields = ref(false)
  const isInitialized = ref(false)
  const isInitializing = ref(false)
  const hasLoaded = ref(false)
  const lastError = ref<string | null>(null)

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchPromise = ref<Promise<Pitch[]> | null>(null)
  const fetchArtForPitchPromises = ref<Record<number, Promise<ArtImage[]>>>({})
  const createPitchPromise = ref<Promise<PitchMutationResult> | null>(null)
  const updatePitchPromise = ref<Record<number, Promise<PitchMutationResult>>>(
    {},
  )

  const numberOfRequests = ref(10)
  const temperature = ref(0.9)
  const exampleString = ref(' ')
  const apiResponse = ref('')
  const maxTokens = ref(500)

  const pitchTypes = Object.values(PitchType)
  const userStore = useUserStore()

  const selectedPitchId = computed(() => selectedPitch.value?.id ?? null)

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

  const ownedPitches = computed(() =>
    pitches.value.filter((pitch) => pitch.userId === userStore.userId),
  )

  const visiblePitches = computed(() =>
    pitches.value.filter((pitch) => {
      if (!pitch.isMature || userStore.showMature) {
        return (
          pitch.isPublic ||
          pitch.userId === userStore.userId ||
          userStore.isAdmin
        )
      }

      return false
    }),
  )

  const selectedTitlePitches = computed(() => {
    const title = selectedTitle.value?.title
    if (!title) return []

    return pitches.value.filter((pitch) => pitch.title === title)
  })

  const selectedPitchPrompts = computed(() => {
    const pitch = selectedPitch.value as (Pitch & { Prompts?: Prompt[] }) | null
    return pitch?.Prompts || []
  })

  const newestPitchesDisplay = computed(() =>
    newestPitches.value.map((pitch) => ({ ...pitch, isNewest: true })),
  )

  const hasUnsavedChanges = computed(() => {
    return (
      JSON.stringify(selectedPitch.value ?? {}) !==
      JSON.stringify(pitchForm.value ?? {})
    )
  })

  function setLastError(error: unknown, fallback: string): void {
    lastError.value = error instanceof Error ? error.message : fallback
  }

  function clearError(): void {
    lastError.value = null
  }

  function saveStateToLocalStorage() {
    safeSetLocalStorage(storageKeys.pitches, JSON.stringify(pitches.value))
    safeSetLocalStorage(storageKeys.pitchForm, JSON.stringify(pitchForm.value))
    safeSetLocalStorage(
      storageKeys.selectedPitches,
      JSON.stringify(selectedPitches.value),
    )
    safeSetLocalStorage(
      storageKeys.selectedPitchType,
      JSON.stringify(selectedPitchType.value),
    )
    safeSetLocalStorage(
      storageKeys.selectedPitch,
      JSON.stringify(selectedPitch.value),
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

    pitchForm.value = normalizePitchForm(
      safeParseObject<PitchForm>(
        safeGetLocalStorage(storageKeys.pitchForm),
        {},
      ),
    )

    selectedPitches.value = safeParseArray<Pitch>(
      safeGetLocalStorage(storageKeys.selectedPitches),
    ).map(normalizePitch)

    const storedType = safeGetLocalStorage(storageKeys.selectedPitchType)
    selectedPitchType.value =
      storedType && storedType !== 'null'
        ? parsePitchType(JSON.parse(storedType) as string)
        : null

    selectedPitch.value = safeParseObject<Pitch | null>(
      safeGetLocalStorage(storageKeys.selectedPitch),
      null,
    )

    if (selectedPitch.value) {
      selectedPitch.value = normalizePitch(selectedPitch.value)
    }

    galleryArt.value = safeParseObject<Record<number, ArtImage[]>>(
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

    newestPitches.value = newestPitches.value.map((entry) =>
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
      pitchForm.value = {}
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

  function setPitchForm(updates: Partial<PitchForm>) {
    pitchForm.value = normalizePitchForm({
      ...pitchForm.value,
      ...updates,
    })
    saveStateToLocalStorage()
  }

  function createBlankPitchForm() {
    pitchForm.value = defaultPitchForm(userStore.userId, userStore.username)
    saveStateToLocalStorage()
  }

  function startAddingPitch() {
    selectedPitch.value = null
    selectedPitches.value = []
    createBlankPitchForm()
  }

  async function startEditingPitch(pitchId?: number): Promise<Pitch | null> {
    const id = pitchId ?? selectedPitch.value?.id

    if (!id) return null

    const pitch = pitches.value.find((entry) => entry.id === id)

    if (!pitch) {
      const fetched = await fetchPitchById(id)
      if (!fetched) return null

      selectedPitch.value = fetched
      selectedPitches.value = [fetched]
      pitchForm.value = normalizePitchForm(fetched as PitchForm)
      saveStateToLocalStorage()
      return fetched
    }

    selectedPitch.value = pitch
    selectedPitches.value = [pitch]
    pitchForm.value = normalizePitchForm(pitch as PitchForm)
    saveStateToLocalStorage()

    return pitch
  }

  async function startCloningPitch(pitchId: number): Promise<PitchForm | null> {
    const pitch = pitches.value.find((entry) => entry.id === pitchId)

    if (!pitch) return null

    selectedPitch.value = null
    selectedPitches.value = []

    pitchForm.value = normalizePitchForm({
      ...pitch,
      id: undefined,
      title: pitch.title ? `${pitch.title} Remix` : 'Pitch Remix',
      creationSource: 'HYBRID',
      userId: userStore.userId || 10,
      designer: userStore.username || pitch.designer || 'Kind Designer',
    })

    saveStateToLocalStorage()

    return pitchForm.value
  }

  function deselectPitch() {
    selectedPitch.value = null
    selectedPitches.value = []
    pitchForm.value = {}
    saveStateToLocalStorage()
  }

  function setSelectedPitchType(pitchType: PitchType | null) {
    selectedPitchType.value = pitchType
    saveStateToLocalStorage()
  }

  function getPitchesBySelectedType(): Pitch[] {
    if (!selectedPitchType.value) return pitches.value

    return pitches.value.filter(
      (pitch) => pitch.PitchType === selectedPitchType.value,
    )
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

        if (
          options.createBlankForm !== false &&
          Object.keys(pitchForm.value).length === 0
        ) {
          createBlankPitchForm()
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

  async function fetchPitchById(pitchId: number): Promise<Pitch | null> {
    const cached = pitches.value.find((pitch) => pitch.id === pitchId)
    if (cached) return cached

    try {
      clearError()

      const res = await performFetch<Pitch>(`/api/pitches/${pitchId}`)

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to fetch pitch')
      }

      return upsertPitch(res.data)
    } catch (error) {
      handleError(error, 'fetching pitch by id')
      setLastError(error, 'Failed to fetch pitch')
      return null
    }
  }

  async function fetchArtForPitch(pitchId: number): Promise<ArtImage[]> {
    if (galleryArt.value[pitchId]) return galleryArt.value[pitchId]

    if (fetchArtForPitchPromises.value[pitchId]) {
      return fetchArtForPitchPromises.value[pitchId]
    }

    fetchArtForPitchPromises.value[pitchId] = (async () => {
      try {
        clearError()

        const res = await performFetch<ArtImage[]>(
          `/api/pitches/art/${pitchId}`,
        )

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

  async function createPitch(
    payload: Partial<Pitch>,
  ): Promise<PitchMutationResult> {
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
        selectedPitch.value = created
        selectedPitches.value = [created]
        pitchForm.value = normalizePitchForm(created as PitchForm)
        newestPitches.value = [created]

        saveStateToLocalStorage()

        return {
          success: true,
          data: created,
          message: 'Pitch created',
        }
      } catch (error) {
        handleError(error, 'creating pitch')
        setLastError(error, 'Error creating pitch')
        return {
          success: false,
          message:
            error instanceof Error ? error.message : 'Error creating pitch',
        }
      } finally {
        createPitchPromise.value = null
      }
    })()

    return createPitchPromise.value
  }

  async function updatePitch(
    pitchId: number,
    updates: Partial<Pitch>,
  ): Promise<PitchMutationResult> {
    if (updatePitchPromise.value[pitchId]) {
      return updatePitchPromise.value[pitchId]
    }

    updatePitchPromise.value[pitchId] = (async () => {
      try {
        clearError()

        const res = await performFetch<Pitch>(`/api/pitches/${pitchId}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        })

        if (res.success && res.data) {
          const updated = upsertPitch(res.data)
          selectedPitch.value = updated
          selectedPitches.value = [updated]
          pitchForm.value = normalizePitchForm(updated as PitchForm)

          saveStateToLocalStorage()

          return {
            success: true,
            data: updated,
            message: 'Pitch updated successfully',
          }
        }

        throw new Error(res.message || 'Update failed')
      } catch (error) {
        handleError(error, 'updating pitch')
        setLastError(error, 'Error updating pitch')

        return {
          success: false,
          message:
            error instanceof Error ? error.message : 'Error updating pitch',
        }
      } finally {
        delete updatePitchPromise.value[pitchId]
      }
    })()

    return updatePitchPromise.value[pitchId]
  }

  async function savePitch(): Promise<PitchMutationResult> {
    isSaving.value = true

    try {
      clearError()

      const payload: Partial<Pitch> = {
        ...pitchForm.value,
        PitchType: parsePitchType(
          pitchForm.value.PitchType as unknown as string,
        ),
        pitch:
          pitchForm.value.pitch?.trim() ||
          pitchForm.value.title?.trim() ||
          'Untitled pitch',
        title: pitchForm.value.title?.trim() || null,
        userId: pitchForm.value.userId || userStore.userId || 10,
        designer:
          pitchForm.value.designer || userStore.username || 'Kind Designer',
      }

      if (typeof pitchForm.value.id === 'number') {
        return await updatePitch(pitchForm.value.id, payload)
      }

      return await createPitch(payload)
    } finally {
      isSaving.value = false
    }
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
        message:
          error instanceof Error ? error.message : 'Error deleting pitch',
      }
    }
  }

  async function deletePitchById(pitchId: number) {
    return await deletePitch(pitchId)
  }

  async function addPromptToPitch(promptId: number, pitchId?: number) {
    const targetPitchId = pitchId ?? selectedPitch.value?.id

    if (!targetPitchId) {
      return {
        success: false,
        message: 'No pitch selected',
      }
    }

    try {
      clearError()

      const res = await performFetch<Prompt>(`/api/prompts/${promptId}`, {
        method: 'PATCH',
        body: JSON.stringify({ pitchId: targetPitchId }),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to attach prompt')
      }

      const promptStore = usePromptStore()
      promptStore.upsertPrompt?.(res.data)

      await fetchPitches(true)

      return {
        success: true,
        message: 'Prompt added to pitch',
      }
    } catch (error) {
      handleError(error, 'adding prompt to pitch')
      setLastError(error, 'Failed to add prompt to pitch')

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to add prompt to pitch',
      }
    }
  }

  async function removePromptFromPitch(promptId: number) {
    try {
      clearError()

      const res = await performFetch<Prompt>(`/api/prompts/${promptId}`, {
        method: 'PATCH',
        body: JSON.stringify({ pitchId: null }),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to detach prompt')
      }

      const promptStore = usePromptStore()
      promptStore.upsertPrompt?.(res.data)

      await fetchPitches(true)

      return {
        success: true,
        message: 'Prompt removed from pitch',
      }
    } catch (error) {
      handleError(error, 'removing prompt from pitch')
      setLastError(error, 'Failed to remove prompt from pitch')

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to remove prompt from pitch',
      }
    }
  }

  async function promotePromptToPitch(promptId: number) {
    const promptStore = usePromptStore()
    const prompt = await promptStore.fetchPromptById(promptId)

    if (!prompt) {
      return {
        success: false,
        message: 'Prompt not found',
      }
    }

    return await createPitch({
      title: prompt.prompt.slice(0, 80),
      pitch: prompt.prompt,
      description: prompt.prompt.slice(0, 256),
      PitchType: PitchType.ARTPITCH,
      creationSource: 'HYBRID',
      userId: prompt.userId || userStore.userId || 10,
      designer: userStore.username || 'Kind Designer',
    })
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
        record.ideas ?? record.text ?? record.content ?? record.message ?? record.data,
      )
    }

    return String(value)
  }

  async function fetchBrainstormPitches() {
    if (!selectedTitle.value && !selectedPitch.value) {
      return {
        success: false,
        message: 'No selected pitch or title',
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

      const activePitch = selectedTitle.value || selectedPitch.value

      if (!activePitch) {
        throw new Error('No selected pitch')
      }

      const examples = extractExamples(exampleString.value).map((example) => ({
        title: activePitch.title || 'Example',
        pitch: example,
      }))

      const content = buildBrainstormPrompt(
        activePitch.title || activePitch.pitch || '',
        activePitch.description || '',
        numberOfRequests.value,
        exampleString.value,
      )

      const res = await performFetch<unknown>('/api/botcafe/brainstorm', {
        method: 'POST',
        body: JSON.stringify({
          title: activePitch.title || activePitch.pitch || '',
          description: activePitch.description || '',
          instructions: activePitch.description || '',
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
        mana: (res as { mana?: unknown }).mana,
      }
    } catch (error) {
      handleError(error, 'brainstorm')
      setLastError(error, 'Error generating brainstorm')

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Error generating brainstorm',
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchTitleStormPitches() {
    if (!selectedTitle.value && !selectedPitch.value) return
    if (loading.value) return

    loading.value = true

    try {
      clearError()

      const activePitch = selectedTitle.value || selectedPitch.value

      if (!activePitch) return

      const content = buildTitleStormPrompt(
        activePitch.title || activePitch.pitch || '',
        activePitch.description || '',
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
          title: activePitch.title,
          description: activePitch.description,
          examples: res.data,
          PitchType: PitchType.BRAINSTORM,
          pitch: res.data || 'Untitled brainstorm',
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

  async function generateFields(fieldsToUpgrade: string[]) {
    isGeneratingFields.value = true

    try {
      clearError()

      const res = await performFetch<Partial<Pitch>>('/api/pitches/generate', {
        method: 'POST',
        body: JSON.stringify({
          pitch: pitchForm.value,
          fieldsToUpgrade,
        }),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to generate pitch fields')
      }

      setPitchForm(res.data as Partial<PitchForm>)

      return {
        success: true,
        message: 'Pitch fields generated',
      }
    } catch (error) {
      handleError(error, 'generating pitch fields')
      setLastError(error, 'Failed to generate pitch fields')

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to generate pitch fields',
      }
    } finally {
      isGeneratingFields.value = false
    }
  }

  function setSelectedPitch(pitchId: number) {
    const pitch = pitches.value.find((item) => item.id === pitchId)

    if (pitch) {
      selectedPitch.value = pitch
      selectedPitches.value = [pitch]
      pitchForm.value = normalizePitchForm(pitch as PitchForm)
      saveStateToLocalStorage()
    }
  }

  function setSelectedTitle(pitchId: number) {
    selectedTitle.value =
      pitches.value.find((pitch) => pitch.id === pitchId) || null

    saveStateToLocalStorage()
  }

  function selectPitch(pitchId: number) {
    setSelectedPitch(pitchId)
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
    updatePitchPromise.value = {}
    lastError.value = null
  }

  return {
    pitches,
    pitchForm,
    selectedPitches,
    selectedPitchType,
    selectedPitch,
    selectedTitle,
    newestPitches,
    galleryArt,

    loading,
    isSaving,
    isGeneratingFields,
    isInitialized,
    isInitializing,
    hasLoaded,
    lastError,
    initializePromise,
    fetchPromise,
    fetchArtForPitchPromises,
    createPitchPromise,
    updatePitchPromise,

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
    ownedPitches,
    visiblePitches,
    selectedTitlePitches,
    selectedPitchPrompts,
    newestPitchesDisplay,
    hasUnsavedChanges,

    initialize,
    resetInitialization,
    hydrateFromLocalStorage,
    fetchPitches,
    fetchPitchById,
    createPitch,
    updatePitch,
    savePitch,
    fetchArtForPitch,

    setPitchForm,
    createBlankPitchForm,
    startAddingPitch,
    startEditingPitch,
    startCloningPitch,
    deselectPitch,

    fetchBrainstormPitches,
    fetchTitleStormPitches,
    setSelectedPitch,
    setSelectedTitle,
    selectPitch,
    getSelectedExamples,
    randomEntry,
    clearLocalStorage,
    deletePitch,
    deletePitchById,
    setSelectedPitchType,
    addTitle,
    updatePitchExamples,
    getPitchesBySelectedType,
    saveStateToLocalStorage,

    addPromptToPitch,
    removePromptFromPitch,
    promotePromptToPitch,
    generateFields,
    upsertPitch,
  }
})

export { PitchType }
export type { Pitch }
