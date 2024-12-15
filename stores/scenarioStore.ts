// /stores/scenarioStore.ts
import { defineStore } from 'pinia'
import type { Scenario } from '@prisma/client'
import { performFetch, handleError } from '@/stores/utils'

import { scenarios } from '@/utils/sceneChoices'

export const useScenarioStore = defineStore({
  id: 'scenarioStore',

  state: () => ({
    scenarios: [] as Scenario[], // This will be populated with either seed data or fetched data
    selectedScenario: null as Scenario | null,
    scenarioForm: {} as Partial<Scenario>,
    isSaving: false,
    isInitialized: false,
    loading: false,
  }),

  getters: {
    totalScenarios: (state) => state.scenarios.length,
    hasUnsavedChanges: (state) =>
      JSON.stringify(state.selectedScenario) !==
      JSON.stringify(state.scenarioForm),
  },

  actions: {
    async initialize() {
      if (this.isInitialized) return

      try {
        // Restore from localStorage first
        const savedState = localStorage.getItem('scenarios')
        const savedForm = localStorage.getItem('scenarioForm')

        if (savedState) {
          this.scenarios = JSON.parse(savedState) as Scenario[]
        }

        // Restore scenario form from localStorage
        if (savedForm) {
          this.scenarioForm = JSON.parse(savedForm)
        }

        // Initialize with scene choices
        this.scenarios = scenarios.map((choice) => ({
          ...choice,
          id: Math.floor(Math.random() * 10000), // Generate a random ID or replace with real IDs
          createdAt: new Date(),
          updatedAt: new Date(),
        }))

        // Fetch scenarios from API to update
        const fetchedScenarios = await this.fetchScenarios()

        // Supplement existing scenarios with fetched data (avoid overwriting)
        if (fetchedScenarios && fetchedScenarios.length) {
          // Merge and avoid duplicates by checking the id
          const fetchedScenarioIds = new Set(fetchedScenarios.map((s) => s.id))
          this.scenarios = [
            ...this.scenarios,
            ...fetchedScenarios.filter((s) => !fetchedScenarioIds.has(s.id)),
          ]
          this.syncToLocalStorage()
        }

        this.isInitialized = true
      } catch (error) {
        handleError(error, 'initializing scenario store')
      }
    },

    syncToLocalStorage() {
      try {
        localStorage.setItem('scenarios', JSON.stringify(this.scenarios))
        localStorage.setItem('scenarioForm', JSON.stringify(this.scenarioForm))
      } catch (error) {
        console.error('Error syncing to localStorage:', error)
      }
    },

    async fetchScenarios(): Promise<Scenario[]> {
      this.loading = true

      try {
        const response = await performFetch<Scenario[]>('/api/scenarios')
        if (response.success && response.data) {
          return response.data // Return fetched data to the caller
        } else {
          throw new Error(response.message || 'Failed to fetch scenarios.')
        }
      } catch (error) {
        handleError(error, 'fetching scenarios')
        return [] // Return empty array on failure to avoid overwriting
      } finally {
        this.loading = false
      }
    },

    async selectScenario(scenarioId: number) {
      const scenario = this.scenarios.find((s) => s.id === scenarioId)
      if (!scenario) {
        console.warn(`Scenario with ID ${scenarioId} not found.`)
        return
      }
      this.selectedScenario = scenario
      this.scenarioForm = { ...scenario }
    },

    deselectScenario() {
      this.selectedScenario = null
      this.scenarioForm = {}
    },

    async saveScenario() {
      this.isSaving = true

      try {
        const scenarioToSave = { ...this.scenarioForm }

        if (scenarioToSave.id) {
          await this.updateScenario(scenarioToSave.id, scenarioToSave)
        } else {
          await this.createScenario(scenarioToSave)
        }

        this.syncToLocalStorage()
        alert('Scenario saved successfully!')
      } catch (error) {
        handleError(error, 'saving scenario')
      } finally {
        this.isSaving = false
      }
    },

    async createScenario(scenario: Partial<Scenario> = {}) {
      try {
        const response = await performFetch<Scenario>('/api/scenarios', {
          method: 'POST',
          body: JSON.stringify(scenario),
          headers: { 'Content-Type': 'application/json' },
        })

        if (response.success && response.data) {
          this.scenarios.push(response.data)
          this.selectedScenario = response.data // Select the newly created scenario
        } else {
          throw new Error(response.message || 'Failed to create scenario.')
        }
      } catch (error) {
        handleError(error, 'creating scenario')
      }
    },

    async updateScenario(id: number, updates: Partial<Scenario>) {
      try {
        const response = await performFetch<Scenario>(`/api/scenarios/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
          headers: { 'Content-Type': 'application/json' },
        })

        if (response.success && response.data) {
          const index = this.scenarios.findIndex((s) => s.id === id)
          if (index !== -1) {
            this.scenarios[index] = response.data
            this.selectedScenario = response.data
          }
          this.syncToLocalStorage()
        } else {
          throw new Error(response.message || 'Failed to update scenario.')
        }
      } catch (error) {
        handleError(error, 'updating scenario')
      }
    },

    async deleteScenario(id: number) {
      try {
        const response = await performFetch(`/api/scenarios/${id}`, {
          method: 'DELETE',
        })

        if (response.success) {
          this.scenarios = this.scenarios.filter((s) => s.id !== id)
          if (this.selectedScenario?.id === id) {
            this.selectedScenario = null
          }
        } else {
          throw new Error(response.message || 'Failed to delete scenario.')
        }
      } catch (error) {
        handleError(error, 'deleting scenario')
      }
    },

    async fetchScenarioById(id: number) {
      try {
        const response = await performFetch<Scenario>(`/api/scenarios/${id}`)
        if (response.success && response.data) {
          return response.data
        } else {
          throw new Error(response.message || 'Failed to fetch scenario.')
        }
      } catch (error) {
        handleError(error, 'fetching scenario by ID')
        return null
      }
    },
  },
})

export type { Scenario }
