// @ts-nocheck
/* eslint-disable */
// test-ignore

// TEMPLATE — copy to /stores/sampleStore.ts (one flat file per model).
// Modeled on /stores/rewardStore.ts, the current cleanest CRUD store.
// When copying for a real model: rename Sample → YourModel everywhere,
// update the field lists in toSamplePayload/createDefaultSampleForm,
// and point the API paths at /api/<lowercase-plural>.
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Sample } from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from './utils'
import { loadSnapshot, markSnapshotActive } from './helpers/snapshotLoader'
import { useNavStore } from '@/stores/navStore'

// SSR guard — every localStorage touch goes through the safe* helpers below.
const isClient = typeof window !== 'undefined'

type SampleInitializeOptions = {
  force?: boolean
  fetchRemote?: boolean
}

// The form type is Partial<Model> plus any looser field types the UI needs
// while editing (e.g. enum fields temporarily holding free strings).
export type SampleForm = Partial<Sample>

// Storage keys — one constant per persisted slice.
const samplesStorageKey = 'samples'
const sampleFormStorageKey = 'sampleForm'
const selectedSampleStorageKey = 'selectedSample'

// Must match a registered DashboardKey in /stores/helpers/dashboardHelper.ts
// (see sample/README.md — "Adding a new channel").
const dashboardKey = 'sample' as const

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

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function safeParseObject<T>(raw: string | null): T | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as T) : null
  } catch {
    return null
  }
}

function trimString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function trimNullableString(value: unknown): string | null {
  if (value === null) return null

  const trimmed = trimString(value)

  return trimmed.length ? trimmed : null
}

// Rows must pass this to enter the store — keeps corrupt localStorage or
// partial API rows from poisoning the list.
function isValidSample(sample: Sample): boolean {
  return Boolean(sample.id && sample.title)
}

// One canonical sort for the whole model, applied on every merge.
function sortSamples(a: Sample, b: Sample): number {
  const aTitle = a.title || ''
  const bTitle = b.title || ''

  return aTitle.localeCompare(bTitle)
}

// Row → editable form. Centralize any display normalization here.
function toSampleForm(sample: Sample): SampleForm {
  return { ...sample }
}

// Form → API payload. This is the ONLY place field trimming/coercion
// happens, so the create/update calls can't disagree about shapes.
// List every writable field of your model explicitly.
function toSamplePayload(form: SampleForm): Partial<Sample> {
  return {
    id: form.id,
    title: trimString(form.title),
    description: trimNullableString(form.description),
    label: trimNullableString(form.label),
    type: trimNullableString(form.type),
    designer: trimNullableString(form.designer),
    isPublic: form.isPublic ?? true,
    isMature: Boolean(form.isMature),
    userId: form.userId ?? null,
    imageId: form.imageId ?? null,
  }
}

function createDefaultSampleForm(): SampleForm {
  return {
    title: '',
    description: '',
    label: '',
    type: '',
    designer: '',
    isPublic: true,
    isMature: false,
    userId: null,
    imageId: null,
  }
}

export const useSampleStore = defineStore('sampleStore', () => {
  const samples = ref<Sample[]>([])
  const usingSnapshot = ref(false)
  const selectedSample = ref<Sample | null>(null)
  const sampleForm = ref<SampleForm>({})
  const error = ref<string | null>(null)

  // The standard flag set — components key off these, keep all of them.
  const isLoading = ref(false)
  const isSaving = ref(false)
  const isInitialized = ref(false)
  const isInitializing = ref(false)
  const hasLoaded = ref(false)

  // In-flight promise refs dedupe concurrent callers (two components
  // mounting at once produce ONE network request, not two).
  const initializePromise = ref<Promise<void> | null>(null)
  const fetchPromise = ref<Promise<Sample[]> | null>(null)
  const fetchSampleByIdPromises = ref<Record<number, Promise<Sample | null>>>(
    {},
  )

  const totalSamples = computed(() => samples.value.length)

  const hasUnsavedChanges = computed(() => {
    const selected = selectedSample.value
      ? toSamplePayload(toSampleForm(selectedSample.value))
      : {}

    const form = toSamplePayload(sampleForm.value)

    return JSON.stringify(selected) !== JSON.stringify(form)
  })

  function setError(value: unknown, fallback: string): void {
    error.value = value instanceof Error ? value.message : fallback
  }

  function clearError(): void {
    error.value = null
  }

  function syncToLocalStorage() {
    safeSetLocalStorage(samplesStorageKey, JSON.stringify(samples.value))
    safeSetLocalStorage(sampleFormStorageKey, JSON.stringify(sampleForm.value))
    safeSetLocalStorage(
      selectedSampleStorageKey,
      JSON.stringify(selectedSample.value),
    )
  }

  function loadFromLocalStorage() {
    samples.value = safeParseArray<Sample>(
      safeGetLocalStorage(samplesStorageKey),
    )
      .filter(isValidSample)
      .sort(sortSamples)

    sampleForm.value =
      safeParseObject<SampleForm>(safeGetLocalStorage(sampleFormStorageKey)) ??
      {}

    selectedSample.value = safeParseObject<Sample>(
      safeGetLocalStorage(selectedSampleStorageKey),
    )
  }

  // Merge, never overwrite: a refetch must not clobber locally-created or
  // snapshot rows that the server response doesn't include.
  function mergeSamples(incoming: Sample[]) {
    const map = new Map<number, Sample>()

    for (const sample of samples.value) {
      map.set(sample.id, sample)
    }

    for (const sample of incoming) {
      if (isValidSample(sample)) {
        map.set(sample.id, sample)
      }
    }

    samples.value = Array.from(map.values()).sort(sortSamples)
    syncToLocalStorage()
  }

  function upsertSample(sample: Sample) {
    mergeSamples([sample])

    if (selectedSample.value?.id === sample.id) {
      selectedSample.value = sample
      sampleForm.value = toSampleForm(sample)
    }

    syncToLocalStorage()
  }

  function removeSampleLocally(id: number) {
    samples.value = samples.value.filter((sample) => sample.id !== id)

    if (selectedSample.value?.id === id) {
      selectedSample.value = null
      sampleForm.value = {}
    }

    syncToLocalStorage()
  }

  // initialize({ fetchRemote: true }) is what managers call onMounted;
  // initialize({ force: true, fetchRemote: true }) is the refresh button.
  async function initialize(
    options: SampleInitializeOptions = {},
  ): Promise<void> {
    const shouldFetchRemote =
      Boolean(options.fetchRemote) &&
      (Boolean(options.force) || !hasLoaded.value || samples.value.length === 0)

    if (isInitialized.value && !options.force && !shouldFetchRemote) return

    if (initializePromise.value && !options.force) {
      return initializePromise.value
    }

    initializePromise.value = (async () => {
      try {
        isInitializing.value = true
        clearError()

        if (!isInitialized.value || options.force) {
          loadFromLocalStorage()
        }

        // First visit (or cleared storage): paint from the nightly snapshot
        // so the page shows real rows even if the database is down. The next
        // successful fetch replaces these rows and clears the flag. Snapshot
        // files live in /stores/fallback/<key>.json — optional but expected
        // for content models. Skip this block if your model has no snapshot.
        if (samples.value.length === 0) {
          const snapshotRows = await loadSnapshot<Sample>('samples')

          if (snapshotRows.length && samples.value.length === 0) {
            mergeSamples(snapshotRows)
            usingSnapshot.value = true
            markSnapshotActive('samples', true)
          }
        }

        if (shouldFetchRemote) {
          await fetchSamples(Boolean(options.force))
        }

        if (!sampleForm.value || Object.keys(sampleForm.value).length === 0) {
          sampleForm.value = createDefaultSampleForm()
          syncToLocalStorage()
        }

        isInitialized.value = true
      } catch (caughtError) {
        setError(caughtError, 'Failed to initialize samples')
        handleError(caughtError, 'initializing sample store')
        isInitialized.value = false
      } finally {
        isInitializing.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function fetchSamples(force = false): Promise<Sample[]> {
    if (!force && hasLoaded.value) {
      return samples.value
    }

    if (fetchPromise.value && !force) {
      return fetchPromise.value
    }

    fetchPromise.value = (async () => {
      isLoading.value = true
      clearError()

      try {
        // performFetch injects Content-Type and the Authorization bearer
        // token automatically — no manual headers needed anywhere below.
        const res = await performFetch<Sample[]>('/api/samples')

        if (!res.success || !Array.isArray(res.data)) {
          throw new Error(res.message || 'Invalid response')
        }

        mergeSamples(res.data)
        hasLoaded.value = true
        usingSnapshot.value = false
        markSnapshotActive('samples', false)

        return samples.value
      } catch (caughtError) {
        hasLoaded.value = false
        setError(caughtError, 'Failed to fetch samples')
        handleError(caughtError, 'fetching samples')
        return samples.value
      } finally {
        isLoading.value = false
        fetchPromise.value = null
      }
    })()

    return fetchPromise.value
  }

  async function fetchSampleById(id: number): Promise<Sample | null> {
    const existing = samples.value.find((sample) => sample.id === id)

    if (existing) {
      return existing
    }

    if (fetchSampleByIdPromises.value[id]) {
      return fetchSampleByIdPromises.value[id]
    }

    fetchSampleByIdPromises.value[id] = (async () => {
      try {
        clearError()

        const res = await performFetch<Sample>(`/api/samples/${id}`)

        if (!res.success || !res.data) {
          throw new Error(res.message || 'Sample not found')
        }

        upsertSample(res.data)
        return res.data
      } catch (caughtError) {
        setError(caughtError, 'Failed to fetch sample')
        handleError(caughtError, 'fetching sample by ID')
        return null
      } finally {
        delete fetchSampleByIdPromises.value[id]
      }
    })()

    return fetchSampleByIdPromises.value[id]
  }

  async function selectSample(id: number) {
    const found = samples.value.find((sample) => sample.id === id)

    if (found) {
      selectedSample.value = found
      sampleForm.value = toSampleForm(found)
      syncToLocalStorage()
      return found
    }

    const fetched = await fetchSampleById(id)

    if (fetched) {
      selectedSample.value = fetched
      sampleForm.value = toSampleForm(fetched)
      syncToLocalStorage()
      return fetched
    }

    setError(new Error(`Sample ${id} not found`), 'Sample not found')
    return null
  }

  // Select a row AND hop the channel's dashboard to its interact tab —
  // this is how cards deep-link into the interact view.
  async function startSampleInteraction(id: number) {
    const sample = await selectSample(id)

    if (!sample) {
      return null
    }

    const navStore = useNavStore()
    navStore.setDashboardTab(dashboardKey, 'interact')

    return sample
  }

  function deselectSample() {
    selectedSample.value = null
    sampleForm.value = {}
    syncToLocalStorage()
  }

  function startAddingSample() {
    selectedSample.value = null
    sampleForm.value = createDefaultSampleForm()
    syncToLocalStorage()
  }

  async function startEditingSample(id?: number) {
    const sampleId = id ?? selectedSample.value?.id

    if (!sampleId) return null

    const sample = await selectSample(sampleId)

    if (!sample) return null

    sampleForm.value = toSampleForm(sample)
    syncToLocalStorage()

    return sample
  }

  // Save routes to create or update based on whether the form has a
  // positive id — new/unsaved rows never have one.
  async function saveSample() {
    isSaving.value = true

    try {
      clearError()

      const data = toSamplePayload(sampleForm.value)

      if (!data.title) {
        throw new Error('Sample title is required.')
      }

      if (data.id && data.id > 0) {
        const result = await updateSample(data.id, data)

        if (!result.success || !result.data) {
          throw new Error(result.message || 'Failed to update sample.')
        }

        return result.data
      }

      const result = await createSample(data)

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Failed to create sample.')
      }

      return result.data
    } catch (caughtError) {
      setError(caughtError, 'Failed to save sample')
      handleError(caughtError, 'saving sample')
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function updateSample(
    id: number,
    updates: SampleForm | Partial<Sample>,
  ) {
    try {
      clearError()

      const payload = toSamplePayload(updates as SampleForm)

      const res = await performFetch<Sample>(`/api/samples/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Update failed')
      }

      upsertSample(res.data)
      selectedSample.value = res.data
      sampleForm.value = toSampleForm(res.data)
      syncToLocalStorage()

      return {
        success: true,
        data: res.data,
      }
    } catch (caughtError) {
      setError(caughtError, 'Failed to update sample')
      handleError(caughtError, 'updating sample')

      return {
        success: false,
        message:
          caughtError instanceof Error
            ? caughtError.message
            : 'Failed to update sample',
      }
    }
  }

  async function createSample(newSample: SampleForm | Partial<Sample>) {
    try {
      clearError()

      const payload = toSamplePayload(newSample as SampleForm)

      const res = await performFetch<Sample>('/api/samples', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Create failed')
      }

      upsertSample(res.data)
      selectedSample.value = res.data
      sampleForm.value = toSampleForm(res.data)
      syncToLocalStorage()

      return {
        success: true,
        data: res.data,
      }
    } catch (caughtError) {
      setError(caughtError, 'Failed to create sample')
      handleError(caughtError, 'creating sample')

      return {
        success: false,
        message:
          caughtError instanceof Error
            ? caughtError.message
            : 'Failed to create sample',
      }
    }
  }

  async function deleteSample(id: number) {
    try {
      clearError()

      const res = await performFetch(`/api/samples/${id}`, {
        method: 'DELETE',
      })

      if (!res.success) {
        throw new Error(res.message || 'Delete failed')
      }

      removeSampleLocally(id)

      return {
        success: true,
      }
    } catch (caughtError) {
      setError(caughtError, 'Failed to delete sample')
      handleError(caughtError, 'deleting sample')

      return {
        success: false,
        message:
          caughtError instanceof Error
            ? caughtError.message
            : 'Failed to delete sample',
      }
    }
  }

  function resetInitialization() {
    isInitialized.value = false
    isInitializing.value = false
    initializePromise.value = null
    fetchPromise.value = null
    fetchSampleByIdPromises.value = {}
    hasLoaded.value = false
    error.value = null
  }

  return {
    samples,
    usingSnapshot,
    selectedSample,
    sampleForm,
    error,

    isLoading,
    isSaving,
    isInitialized,
    isInitializing,
    hasLoaded,

    initializePromise,
    fetchPromise,
    fetchSampleByIdPromises,

    totalSamples,
    hasUnsavedChanges,

    initialize,
    resetInitialization,
    loadFromLocalStorage,
    syncToLocalStorage,

    fetchSamples,
    fetchSampleById,

    selectSample,
    startSampleInteraction,
    deselectSample,

    startAddingSample,
    startEditingSample,
    saveSample,

    updateSample,
    createSample,
    deleteSample,
  }
})

export type { Sample }
