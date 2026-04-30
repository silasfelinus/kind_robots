// /stores/scenarioStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Scenario } from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from '@/stores/utils'
import { scenarios as seedScenarios } from '@/utils/sceneChoices'

const isClient = typeof window !== 'undefined'

type ScenarioInitializeOptions = {
  force?: boolean
  fetchRemote?: boolean
  includeSeeds?: boolean
}

const scenariosStorageKey = 'scenarios'
const scenarioFormStorageKey = 'scenarioForm'
const selectedScenarioStorageKey = 'selectedScenario'
const currentChoiceStorageKey = 'currentChoice'
const storyHistoryStorageKey = 'storyHistory'

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

function sortScenarios(a: Scenario, b: Scenario): number {
  if (a.id < 0 && b.id > 0) return -1
  if (a.id > 0 && b.id < 0) return 1

  const aTitle = a.title || ''
  const bTitle = b.title || ''

  return aTitle.localeCompare(bTitle)
}

export const useScenarioStore = defineStore('scenarioStore', () => {
  const scenarios = ref<Scenario[]>([])
  const selectedScenario = ref<Scenario | null>(null)
  const scenarioForm = ref<Partial<Scenario>>({})
  const isSaving = ref(false)
  const isInitialized = ref(false)
  const isInitializing = ref(false)
  const loading = ref(false)
  const lastError = ref<string | null>(null)
  const currentChoice = ref('')
  const storyHistory = ref<string[]>([])

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchPromise = ref<Promise<Scenario[]> | null>(null)
  const fetchScenarioByIdPromises = ref<
    Record<number, Promise<Scenario | null>>
  >({})
  const hasLoaded = ref(false)

  const totalScenarios = computed(() => scenarios.value.length)

  const hasUnsavedChanges = computed(
    () =>
      JSON.stringify(selectedScenario.value ?? {}) !==
      JSON.stringify(scenarioForm.value ?? {}),
  )

  function setLastError(error: unknown, fallback: string): void {
    lastError.value = error instanceof Error ? error.message : fallback
  }

  function clearError(): void {
    lastError.value = null
  }

  function buildSeedScenarios(): Scenario[] {
    return seedScenarios.map((choice, index) => ({
      ...choice,
      id: -(index + 1),
      createdAt: new Date(),
      updatedAt: new Date(),
      intros: choice.intros,
    })) as Scenario[]
  }

  function syncToLocalStorage() {
    safeSetLocalStorage(scenariosStorageKey, JSON.stringify(scenarios.value))
    safeSetLocalStorage(
      scenarioFormStorageKey,
      JSON.stringify(scenarioForm.value),
    )
    safeSetLocalStorage(
      selectedScenarioStorageKey,
      JSON.stringify(selectedScenario.value),
    )
    safeSetLocalStorage(currentChoiceStorageKey, currentChoice.value)
    safeSetLocalStorage(
      storyHistoryStorageKey,
      JSON.stringify(storyHistory.value),
    )
  }

  function loadFromLocalStorage() {
    scenarios.value = safeParseArray<Scenario>(
      safeGetLocalStorage(scenariosStorageKey),
    ).sort(sortScenarios)

    scenarioForm.value =
      safeParseObject<Partial<Scenario>>(
        safeGetLocalStorage(scenarioFormStorageKey),
      ) ?? {}

    selectedScenario.value = safeParseObject<Scenario>(
      safeGetLocalStorage(selectedScenarioStorageKey),
    )

    currentChoice.value = safeGetLocalStorage(currentChoiceStorageKey) || ''
    storyHistory.value = safeParseArray<string>(
      safeGetLocalStorage(storyHistoryStorageKey),
    )
  }

  function mergeScenarios(incoming: Scenario[]) {
    const map = new Map<number, Scenario>()

    for (const scenario of scenarios.value) {
      map.set(scenario.id, scenario)
    }

    for (const scenario of incoming) {
      map.set(scenario.id, scenario)
    }

    scenarios.value = Array.from(map.values()).sort(sortScenarios)
    syncToLocalStorage()
  }

  function upsertScenario(scenario: Scenario) {
    mergeScenarios([scenario])

    if (selectedScenario.value?.id === scenario.id) {
      selectedScenario.value = scenario
      scenarioForm.value = { ...scenario }
    }

    syncToLocalStorage()
  }

  function removeScenarioLocally(id: number) {
    scenarios.value = scenarios.value.filter((scenario) => scenario.id !== id)

    if (selectedScenario.value?.id === id) {
      selectedScenario.value = null
      scenarioForm.value = {}
    }

    syncToLocalStorage()
  }

  function applySeedScenarios() {
    mergeScenarios(buildSeedScenarios())
  }

  async function initialize(
    options: ScenarioInitializeOptions = {},
  ): Promise<void> {
    if (isInitialized.value && !options.force) return
    if (initializePromise.value && !options.force)
      return initializePromise.value

    initializePromise.value = (async () => {
      try {
        isInitializing.value = true
        clearError()

        loadFromLocalStorage()

        if (options.includeSeeds !== false) {
          applySeedScenarios()
        }

        if (options.fetchRemote) {
          await fetchScenarios(Boolean(options.force))
        }

        isInitialized.value = true
      } catch (error) {
        isInitialized.value = false
        handleError(error, 'initializing scenario store')
        setLastError(error, 'Failed to initialize scenario store')
      } finally {
        isInitializing.value = false
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function fetchScenarios(force = false): Promise<Scenario[]> {
    if (
      !force &&
      hasLoaded.value &&
      scenarios.value.some((scenario) => scenario.id > 0)
    ) {
      return scenarios.value
    }

    if (fetchPromise.value && !force) {
      return fetchPromise.value
    }

    fetchPromise.value = (async () => {
      loading.value = true

      try {
        clearError()

        const res = await performFetch<Scenario[]>('/api/scenarios')

        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to fetch scenarios.')
        }

        mergeScenarios(res.data)
        hasLoaded.value = true

        return scenarios.value
      } catch (error) {
        hasLoaded.value = false
        handleError(error, 'fetching scenarios')
        setLastError(error, 'Failed to fetch scenarios')
        return scenarios.value
      } finally {
        loading.value = false
        fetchPromise.value = null
      }
    })()

    return fetchPromise.value
  }

  async function selectScenario(id: number) {
    const scenario = scenarios.value.find((entry) => entry.id === id)

    if (scenario) {
      selectedScenario.value = scenario
      scenarioForm.value = { ...scenario }
      syncToLocalStorage()
      return scenario
    }

    if (id > 0) {
      const fetched = await fetchScenarioById(id)

      if (fetched) {
        selectedScenario.value = fetched
        scenarioForm.value = { ...fetched }
        syncToLocalStorage()
        return fetched
      }
    }

    setLastError(
      new Error(`Scenario with ID ${id} not found.`),
      'Scenario not found',
    )
    return null
  }

  function deselectScenario() {
    selectedScenario.value = null
    scenarioForm.value = {}
    syncToLocalStorage()
  }

  async function saveScenario() {
    isSaving.value = true

    try {
      clearError()

      const data = { ...scenarioForm.value }

      if (data.id && data.id > 0) {
        return await updateScenario(data.id, data)
      }

      return await createScenario(data)
    } catch (error) {
      handleError(error, 'saving scenario')
      setLastError(error, 'Failed to save scenario')
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function createScenario(scenario: Partial<Scenario>) {
    try {
      clearError()

      const res = await performFetch<Scenario>('/api/scenarios', {
        method: 'POST',
        body: JSON.stringify(scenario),
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to create scenario')
      }

      upsertScenario(res.data)
      selectedScenario.value = res.data
      scenarioForm.value = { ...res.data }
      syncToLocalStorage()

      return res.data
    } catch (error) {
      handleError(error, 'creating scenario')
      setLastError(error, 'Failed to create scenario')
      return null
    }
  }

  async function updateScenario(id: number, updates: Partial<Scenario>) {
    if (id < 0) {
      return await createScenario({
        ...updates,
        id: undefined,
      })
    }

    try {
      clearError()

      const res = await performFetch<Scenario>(`/api/scenarios/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to update scenario')
      }

      upsertScenario(res.data)
      selectedScenario.value = res.data
      scenarioForm.value = { ...res.data }
      syncToLocalStorage()

      return res.data
    } catch (error) {
      handleError(error, 'updating scenario')
      setLastError(error, 'Failed to update scenario')
      return null
    }
  }

  async function deleteScenario(id: number) {
    if (id < 0) {
      removeScenarioLocally(id)
      return true
    }

    try {
      clearError()

      const res = await performFetch(`/api/scenarios/${id}`, {
        method: 'DELETE',
      })

      if (!res.success) {
        throw new Error(res.message || 'Failed to delete scenario')
      }

      removeScenarioLocally(id)
      return true
    } catch (error) {
      handleError(error, 'deleting scenario')
      setLastError(error, 'Failed to delete scenario')
      return false
    }
  }

  async function fetchScenarioById(id: number): Promise<Scenario | null> {
    const existing = scenarios.value.find((scenario) => scenario.id === id)

    if (existing) {
      return existing
    }

    if (id < 0) {
      return null
    }

    if (fetchScenarioByIdPromises.value[id]) {
      return fetchScenarioByIdPromises.value[id]
    }

    fetchScenarioByIdPromises.value[id] = (async () => {
      try {
        clearError()

        const res = await performFetch<Scenario>(`/api/scenarios/${id}`)

        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to fetch scenario.')
        }

        upsertScenario(res.data)
        return res.data
      } catch (error) {
        handleError(error, 'fetching scenario by ID')
        setLastError(error, 'Failed to fetch scenario')
        return null
      } finally {
        delete fetchScenarioByIdPromises.value[id]
      }
    })()

    return fetchScenarioByIdPromises.value[id]
  }

  function setCurrentChoice(choice: string) {
    currentChoice.value = choice
    syncToLocalStorage()
  }

  function addStoryHistory(entry: string) {
    if (!entry.trim()) return

    storyHistory.value.push(entry.trim())
    syncToLocalStorage()
  }

  function clearStoryHistory() {
    storyHistory.value = []
    currentChoice.value = ''
    syncToLocalStorage()
  }

  function resetInitialization() {
    isInitialized.value = false
    isInitializing.value = false
    initializePromise.value = null
    fetchPromise.value = null
    fetchScenarioByIdPromises.value = {}
    hasLoaded.value = false
    lastError.value = null
  }

  return {
    scenarios,
    selectedScenario,
    scenarioForm,
    isSaving,
    isInitialized,
    isInitializing,
    loading,
    lastError,
    currentChoice,
    storyHistory,

    initializePromise,
    fetchPromise,
    fetchScenarioByIdPromises,
    hasLoaded,

    totalScenarios,
    hasUnsavedChanges,

    initialize,
    resetInitialization,
    syncToLocalStorage,
    loadFromLocalStorage,
    fetchScenarios,
    fetchScenarioById,
    selectScenario,
    deselectScenario,
    saveScenario,
    createScenario,
    updateScenario,
    deleteScenario,
    setCurrentChoice,
    addStoryHistory,
    clearStoryHistory,
    applySeedScenarios,
    buildSeedScenarios,
  }
})

export type { Scenario }
