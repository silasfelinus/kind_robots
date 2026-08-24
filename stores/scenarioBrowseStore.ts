import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Character, Scenario } from '~/prisma/generated/prisma/client'
import type {
  ScenarioDream,
  ScenarioFacet,
} from '@/stores/scenarioStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { handleError, performFetch } from '@/stores/utils'

export type ScenarioBrowseCharacter = Pick<
  Character,
  | 'id'
  | 'name'
  | 'honorific'
  | 'title'
  | 'role'
  | 'class'
  | 'species'
  | 'genre'
>

export interface ScenarioBrowse extends Scenario {
  Dreams?: ScenarioDream[]
  Facets?: ScenarioFacet[]
  Characters?: ScenarioBrowseCharacter[]
  _count?: {
    Dreams?: number
    Facets?: number
    Characters?: number
  }
}

function sortScenarios(a: ScenarioBrowse, b: ScenarioBrowse): number {
  if (a.id < 0 && b.id > 0) return -1
  if (a.id > 0 && b.id < 0) return 1
  return (a.title || '').localeCompare(b.title || '')
}

export const useScenarioBrowseStore = defineStore('scenarioBrowseStore', () => {
  const scenarioStore = useScenarioStore()
  const scenarios = ref<ScenarioBrowse[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasLoaded = ref(false)
  let fetchPromise: Promise<ScenarioBrowse[]> | null = null

  const totalScenarios = computed(() => scenarios.value.length)

  function seedScenarios(): ScenarioBrowse[] {
    return scenarioStore.buildSeedScenarios() as ScenarioBrowse[]
  }

  function mergeScenarios(incoming: ScenarioBrowse[]) {
    const map = new Map<number, ScenarioBrowse>()

    for (const scenario of scenarios.value) map.set(scenario.id, scenario)
    for (const scenario of incoming) map.set(scenario.id, scenario)

    scenarios.value = Array.from(map.values()).sort(sortScenarios)
  }

  async function fetchScenarios(
    force = false,
    includeSeeds = true,
  ): Promise<ScenarioBrowse[]> {
    if (!force && hasLoaded.value) return scenarios.value
    if (fetchPromise && !force) return fetchPromise

    fetchPromise = (async () => {
      loading.value = true
      error.value = null

      try {
        const res = await performFetch<ScenarioBrowse[]>(
          '/api/scenarios?browse=true',
        )

        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to fetch Scenario browse index.')
        }

        scenarios.value = []
        if (includeSeeds) mergeScenarios(seedScenarios())
        mergeScenarios(res.data)
        hasLoaded.value = true
        return scenarios.value
      } catch (cause) {
        handleError(cause, 'fetching Scenario browse index')
        error.value =
          cause instanceof Error
            ? cause.message
            : 'Failed to fetch Scenario browse index.'

        if (includeSeeds && scenarios.value.length === 0) {
          mergeScenarios(seedScenarios())
        }

        return scenarios.value
      } finally {
        loading.value = false
        fetchPromise = null
      }
    })()

    return fetchPromise
  }

  function removeScenario(id: number) {
    scenarios.value = scenarios.value.filter((scenario) => scenario.id !== id)
  }

  function reset() {
    scenarios.value = []
    error.value = null
    hasLoaded.value = false
    fetchPromise = null
  }

  return {
    scenarios,
    loading,
    error,
    hasLoaded,
    totalScenarios,
    fetchScenarios,
    removeScenario,
    reset,
  }
})
