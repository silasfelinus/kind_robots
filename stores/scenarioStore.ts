// /stores/scenarioStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Scenario } from '~/prisma/generated/prisma/client'
import { performFetch, handleError } from '@/stores/utils'
import { scenarios as seedScenarios } from '@/utils/sceneChoices'

const isClient = typeof window !== 'undefined'

export const useScenarioStore = defineStore('scenarioStore', () => {
  const scenarios = ref<Scenario[]>([])
  const selectedScenario = ref<Scenario | null>(null)
  const scenarioForm = ref<Partial<Scenario>>({})
  const isSaving = ref(false)
  const isInitialized = ref(false)
  const loading = ref(false)
  const currentChoice = ref('')
  const storyHistory = ref<string[]>([])

  const initializePromise = ref<Promise<void> | null>(null)
  const fetchPromise = ref<Promise<Scenario[]> | null>(null)
  const hasLoaded = ref(false)

  const totalScenarios = computed(() => scenarios.value.length)

  const hasUnsavedChanges = computed(
    () =>
      JSON.stringify(selectedScenario.value) !==
      JSON.stringify(scenarioForm.value),
  )

  function buildSeedScenarios(): Scenario[] {
    return seedScenarios.map((choice, index) => ({
      ...choice,
      id: -(index + 1),
      createdAt: new Date(),
      updatedAt: new Date(),
      intros: choice.intros,
    }))
  }

  function syncToLocalStorage() {
    if (!isClient) return

    try {
      localStorage.setItem('scenarios', JSON.stringify(scenarios.value))
      localStorage.setItem('scenarioForm', JSON.stringify(scenarioForm.value))
    } catch (error) {
      console.error('Error syncing scenarios:', error)
    }
  }

  function loadFromLocalStorage() {
    if (!isClient) return

    try {
      const saved = localStorage.getItem('scenarios')
      const savedForm = localStorage.getItem('scenarioForm')

      if (saved) scenarios.value = JSON.parse(saved)
      if (savedForm) scenarioForm.value = JSON.parse(savedForm)
    } catch (error) {
      handleError(error, 'loading scenarios')
    }
  }

  async function initialize() {
    if (isInitialized.value) return
    if (initializePromise.value) return initializePromise.value

    initializePromise.value = (async () => {
      try {
        loadFromLocalStorage()

        const seed = buildSeedScenarios()

        const existingIds = new Set(scenarios.value.map((s) => s.id))

        scenarios.value = [
          ...seed.filter((s) => !existingIds.has(s.id)),
          ...scenarios.value,
        ]

        const fetched = await fetchScenarios()

        const fetchedIds = new Set(fetched.map((s) => s.id))

        scenarios.value = [
          ...scenarios.value.filter((s) => !fetchedIds.has(s.id)),
          ...fetched,
        ]

        syncToLocalStorage()
        isInitialized.value = true
      } catch (error) {
        isInitialized.value = false
        handleError(error, 'initializing scenario store')
      } finally {
        initializePromise.value = null
      }
    })()

    return initializePromise.value
  }

  async function fetchScenarios(force = false): Promise<Scenario[]> {
    if (!force && hasLoaded.value) return scenarios.value
    if (fetchPromise.value) return fetchPromise.value

    fetchPromise.value = (async () => {
      loading.value = true

      try {
        const res = await performFetch<Scenario[]>('/api/scenarios')

        if (res.success && res.data) {
          hasLoaded.value = true
          return res.data
        }

        throw new Error(res.message || 'Failed to fetch scenarios.')
      } catch (e) {
        hasLoaded.value = false
        handleError(e, 'fetching scenarios')
        return []
      } finally {
        loading.value = false
        fetchPromise.value = null
      }
    })()

    return fetchPromise.value
  }

  async function selectScenario(id: number) {
    const s = scenarios.value.find((s) => s.id === id)
    if (!s) return console.warn(`Scenario with ID ${id} not found.`)
    selectedScenario.value = s
    scenarioForm.value = { ...s }
  }

  function deselectScenario() {
    selectedScenario.value = null
    scenarioForm.value = {}
  }

  async function saveScenario() {
    isSaving.value = true
    try {
      const data = { ...scenarioForm.value }

      if (data.id && data.id > 0) {
        await updateScenario(data.id, data)
      } else {
        await createScenario(data)
      }

      syncToLocalStorage()
    } catch (err) {
      handleError(err, 'saving scenario')
    } finally {
      isSaving.value = false
    }
  }

  async function createScenario(scenario: Partial<Scenario>) {
    try {
      const res = await performFetch<Scenario>('/api/scenarios', {
        method: 'POST',
        body: JSON.stringify(scenario),
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.success && res.data) {
        scenarios.value.push(res.data)
        selectedScenario.value = res.data
      }
    } catch (err) {
      handleError(err, 'creating scenario')
    }
  }

  async function updateScenario(id: number, updates: Partial<Scenario>) {
    try {
      const res = await performFetch<Scenario>(`/api/scenarios/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.success && res.data) {
        const i = scenarios.value.findIndex((s) => s.id === id)
        if (i !== -1) {
          scenarios.value[i] = res.data
          selectedScenario.value = res.data
        }
        syncToLocalStorage()
      }
    } catch (err) {
      handleError(err, 'updating scenario')
    }
  }

  async function deleteScenario(id: number) {
    try {
      const res = await performFetch(`/api/scenarios/${id}`, {
        method: 'DELETE',
      })

      if (res.success) {
        scenarios.value = scenarios.value.filter((s) => s.id !== id)

        if (selectedScenario.value?.id === id) {
          selectedScenario.value = null
        }

        syncToLocalStorage()
      }
    } catch (err) {
      handleError(err, 'deleting scenario')
    }
  }

  async function fetchScenarioById(id: number) {
    try {
      const res = await performFetch<Scenario>(`/api/scenarios/${id}`)
      if (res.success && res.data) return res.data
      throw new Error(res.message || 'Failed to fetch scenario.')
    } catch (err) {
      handleError(err, 'fetching scenario by ID')
      return null
    }
  }

  return {
    scenarios,
    selectedScenario,
    scenarioForm,
    isSaving,
    isInitialized,
    loading,
    currentChoice,
    storyHistory,
    initializePromise,
    fetchPromise,
    hasLoaded,
    totalScenarios,
    hasUnsavedChanges,
    initialize,
    syncToLocalStorage,
    fetchScenarios,
    selectScenario,
    deselectScenario,
    saveScenario,
    createScenario,
    updateScenario,
    deleteScenario,
    fetchScenarioById,
  }
})

export type { Scenario }
