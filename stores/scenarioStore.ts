// /stores/scenarioStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Scenario } from '~/server/generated/prisma'
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

  const totalScenarios = computed(() => scenarios.value.length)
  const hasUnsavedChanges = computed(
    () =>
      JSON.stringify(selectedScenario.value) !==
      JSON.stringify(scenarioForm.value),
  )

  async function initialize() {
    if (isInitialized.value) return

    try {
      if (isClient) {
        const saved = localStorage.getItem('scenarios')
        const savedForm = localStorage.getItem('scenarioForm')
        if (saved) scenarios.value = JSON.parse(saved)
        if (savedForm) scenarioForm.value = JSON.parse(savedForm)
      }

      scenarios.value = seedScenarios.map((choice) => ({
        ...choice,
        id: Math.floor(Math.random() * 10000),
        createdAt: new Date(),
        updatedAt: new Date(),
        intros: choice.intros,
      }))

      const fetched = await fetchScenarios()
      if (fetched?.length) {
        const fetchedIds = new Set(fetched.map((s) => s.id))
        scenarios.value = [
          ...scenarios.value,
          ...fetched.filter((s) => !fetchedIds.has(s.id)),
        ]
        syncToLocalStorage()
      }

      isInitialized.value = true
    } catch (error) {
      handleError(error, 'initializing scenario store')
    }
  }

  function syncToLocalStorage() {
    try {
      if (isClient) {
        localStorage.setItem('scenarios', JSON.stringify(scenarios.value))
        localStorage.setItem('scenarioForm', JSON.stringify(scenarioForm.value))
      }
    } catch (error) {
      console.error('Error syncing to localStorage:', error)
    }
  }

  async function fetchScenarios(): Promise<Scenario[]> {
    loading.value = true
    try {
      const res = await performFetch<Scenario[]>('/api/scenarios')
      if (res.success && res.data) return res.data
      else throw new Error(res.message || 'Failed to fetch scenarios.')
    } catch (e) {
      handleError(e, 'fetching scenarios')
      return []
    } finally {
      loading.value = false
    }
  }

  async function selectScenario(id: number) {
    const s = scenarios.value.find((s: { id: number }) => s.id === id)
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
      if (data.id) await updateScenario(data.id, data)
      else await createScenario(data)
      syncToLocalStorage()
      alert('Scenario saved successfully!')
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
      } else throw new Error(res.message || 'Failed to create scenario.')
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
        const i = scenarios.value.findIndex((s: { id: number }) => s.id === id)
        if (i !== -1) {
          scenarios.value[i] = res.data
          selectedScenario.value = res.data
        }
        syncToLocalStorage()
      } else throw new Error(res.message || 'Failed to update scenario.')
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
        scenarios.value = scenarios.value.filter(
          (s: { id: number }) => s.id !== id,
        )
        if (selectedScenario.value?.id === id) selectedScenario.value = null
      } else throw new Error(res.message || 'Failed to delete scenario.')
    } catch (err) {
      handleError(err, 'deleting scenario')
    }
  }

  async function fetchScenarioById(id: number) {
    try {
      const res = await performFetch<Scenario>(`/api/scenarios/${id}`)
      if (res.success && res.data) return res.data
      else throw new Error(res.message || 'Failed to fetch scenario.')
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
