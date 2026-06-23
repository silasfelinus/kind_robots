// /stores/workspaceStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type WorkspaceModel = 'dream' | 'scenario' | 'character' | 'reward' | 'art'

export type DreamWorkspacePanel =
  | 'asset-sheet'
  | 'connected-dreams'
  | 'scenarios'
  | 'characters'
  | 'rewards'
  | 'art'
  | 'chat'

export type ScenarioWorkspacePanel =
  | 'overview'
  | 'dreams'
  | 'characters'
  | 'rewards'

const workspaceStorageKey = 'organicWorkspaceContext'
const isClient = typeof window !== 'undefined'

type StoredWorkspace = {
  activeModel?: WorkspaceModel
  dreamId?: number | null
  scenarioId?: number | null
  characterId?: number | null
  rewardId?: number | null
  artImageId?: number | null
  dreamPanel?: DreamWorkspacePanel
  scenarioPanel?: ScenarioWorkspacePanel
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

function safeParseWorkspace(raw: string | null): StoredWorkspace | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }

    return parsed as StoredWorkspace
  } catch {
    return null
  }
}

function cleanId(value?: number | null): number | null {
  const id = Number(value)

  return Number.isInteger(id) && id > 0 ? id : null
}

export const useWorkspaceStore = defineStore('workspaceStore', () => {
  const activeModel = ref<WorkspaceModel>('dream')
  const dreamId = ref<number | null>(null)
  const scenarioId = ref<number | null>(null)
  const characterId = ref<number | null>(null)
  const rewardId = ref<number | null>(null)
  const artImageId = ref<number | null>(null)
  const dreamPanel = ref<DreamWorkspacePanel>('asset-sheet')
  const scenarioPanel = ref<ScenarioWorkspacePanel>('overview')
  const hydrated = ref(false)

  const hasDreamContext = computed(() => cleanId(dreamId.value) !== null)
  const hasScenarioContext = computed(() => cleanId(scenarioId.value) !== null)

  const contextLabel = computed(() => {
    if (dreamId.value && scenarioId.value) {
      return `Dream #${dreamId.value} / Scenario #${scenarioId.value}`
    }

    if (dreamId.value) return `Dream #${dreamId.value}`
    if (scenarioId.value) return `Scenario #${scenarioId.value}`

    return 'No workspace context'
  })

  function syncToLocalStorage(): void {
    safeSetLocalStorage(
      workspaceStorageKey,
      JSON.stringify({
        activeModel: activeModel.value,
        dreamId: dreamId.value,
        scenarioId: scenarioId.value,
        characterId: characterId.value,
        rewardId: rewardId.value,
        artImageId: artImageId.value,
        dreamPanel: dreamPanel.value,
        scenarioPanel: scenarioPanel.value,
      }),
    )
  }

  function hydrate(force = false): void {
    if (hydrated.value && !force) return

    const stored = safeParseWorkspace(safeGetLocalStorage(workspaceStorageKey))

    if (stored) {
      activeModel.value = stored.activeModel ?? activeModel.value
      dreamId.value = cleanId(stored.dreamId)
      scenarioId.value = cleanId(stored.scenarioId)
      characterId.value = cleanId(stored.characterId)
      rewardId.value = cleanId(stored.rewardId)
      artImageId.value = cleanId(stored.artImageId)
      dreamPanel.value = stored.dreamPanel ?? dreamPanel.value
      scenarioPanel.value = stored.scenarioPanel ?? scenarioPanel.value
    }

    hydrated.value = true
  }

  function openDream(id: number, panel: DreamWorkspacePanel = 'asset-sheet'): void {
    const nextId = cleanId(id)
    if (!nextId) return

    dreamId.value = nextId
    activeModel.value = 'dream'
    dreamPanel.value = panel
    syncToLocalStorage()
  }

  function openScenario(
    id: number,
    nextDreamId?: number | null,
    panel: ScenarioWorkspacePanel = 'overview',
  ): void {
    const nextId = cleanId(id)
    if (!nextId) return

    scenarioId.value = nextId
    activeModel.value = 'scenario'
    scenarioPanel.value = panel

    const cleanedDreamId = cleanId(nextDreamId)
    if (cleanedDreamId) {
      dreamId.value = cleanedDreamId
    }

    syncToLocalStorage()
  }

  function openCharacter(id: number): void {
    const nextId = cleanId(id)
    if (!nextId) return

    characterId.value = nextId
    activeModel.value = 'character'
    syncToLocalStorage()
  }

  function openReward(id: number): void {
    const nextId = cleanId(id)
    if (!nextId) return

    rewardId.value = nextId
    activeModel.value = 'reward'
    syncToLocalStorage()
  }

  function openArt(id: number): void {
    const nextId = cleanId(id)
    if (!nextId) return

    artImageId.value = nextId
    activeModel.value = 'art'
    syncToLocalStorage()
  }

  function setDreamPanel(panel: DreamWorkspacePanel): void {
    dreamPanel.value = panel
    activeModel.value = 'dream'
    syncToLocalStorage()
  }

  function setScenarioPanel(panel: ScenarioWorkspacePanel): void {
    scenarioPanel.value = panel
    activeModel.value = 'scenario'
    syncToLocalStorage()
  }

  function clearScenario(): void {
    scenarioId.value = null
    syncToLocalStorage()
  }

  function clearDream(): void {
    dreamId.value = null
    syncToLocalStorage()
  }

  function resetWorkspace(): void {
    activeModel.value = 'dream'
    dreamId.value = null
    scenarioId.value = null
    characterId.value = null
    rewardId.value = null
    artImageId.value = null
    dreamPanel.value = 'asset-sheet'
    scenarioPanel.value = 'overview'
    syncToLocalStorage()
  }

  return {
    activeModel,
    dreamId,
    scenarioId,
    characterId,
    rewardId,
    artImageId,
    dreamPanel,
    scenarioPanel,
    hydrated,
    hasDreamContext,
    hasScenarioContext,
    contextLabel,
    hydrate,
    syncToLocalStorage,
    openDream,
    openScenario,
    openCharacter,
    openReward,
    openArt,
    setDreamPanel,
    setScenarioPanel,
    clearScenario,
    clearDream,
    resetWorkspace,
  }
})
