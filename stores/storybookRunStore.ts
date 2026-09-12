// /stores/storybookRunStore.ts
//
// Client state for a SERVER-SIDE story run (storybook/t-029).
//
// Lives beside storybookStore.ts rather than inside it, on purpose. That store
// owns the client-side beat loop the short/chaptered/episodic shapes still run
// on, plus its localStorage library, and roughly twenty-five contract guards
// pin its internals. Rewriting it in place would mean rewriting all of them in
// the same change, before a single new screen exists to prove the replacement
// works. So the new engine gets its own store, the screens are built on it
// (storybook/t-034..t-036), and the beat loop is deleted afterwards with its
// guards rewritten in one deliberate pass (t-037).
//
// Nothing imports this yet. That is expected.
//
// THE SERVER OWNS THE NUMBERS. Submitting a chosen option sends its id and
// nothing else -- the effects live in the run's pending turn, server-side, and
// a genre deck's axis values never reach this store at all. Do not add a
// client-side stats model here to "avoid a round trip"; that round trip is the
// integrity of the ending.

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch } from '@/stores/utils'

export type StorybookRunShape =
  'short-story' | 'chaptered' | 'episodic' | 'life'

export type StorybookMoveSource = 'option' | 'custom' | 'sheet'

export interface StorybookRunDeck {
  key: string
  title: string
  description?: string | null
  ownerKind?: string
  /** The axis COUNT, never the axis keys: a deck's axes are its secret. */
  axisCount: number
  endingCount?: number
  turnBudget?: number
  turnBudgetByShape?: Record<string, number>
  unlocked?: boolean
}

export interface StorybookRunTreasure {
  slug: string
  name: string
  rewardType: string
  rarity: string
  effect?: string | null
  flavorText?: string | null
  origin?: 'loadout' | 'board' | 'found'
  consumedAtTurn?: number | null
}

export interface StorybookRunChoice {
  id: string
  choiceText: string
  effects: Record<string, number>
}

export interface StorybookPendingTurn {
  turnIndex: number
  narrativeText: string
  choices: StorybookRunChoice[]
  artPrompt: string | null
  endingHint: string | null
  narrator: string
}

export interface StorybookRunTurn {
  turnIndex: number
  narrativeText: string
  move: { source: string; text: string }
  resultText: string | null
}

export interface StorybookRunSummary {
  id: number
  title: string
  shape: StorybookRunShape
  status: string
  turnIndex: number
  turnBudget: number | null
  createdAt: string
  updatedAt: string | null
  Deck?: { key: string; title: string } | null
  Ending?: {
    title: string
    slug: string
    victoryType: string
    icon: string | null
    heroImage: string | null
  } | null
}

export interface StorybookRun {
  id: number
  title: string
  shape: StorybookRunShape
  status: string
  turnIndex: number
  turnBudget: number
  narratorStyle: string | null
  deck: { key: string; title: string; axisCount: number }
}

export interface StorybookBoard {
  shape: StorybookRunShape
  deckKey?: string | null
  title?: string | null
  spark?: string | null
  narratorStyle?: string | null
  botId?: number | null
  castSlugs?: string[]
  castRoles?: Record<string, string>
  locationSlug?: string | null
  facetSlugs?: string[]
  scenarioSlug?: string | null
  rewardSlugs?: string[]
}

export interface StorybookCollectedEnding {
  id: number
  slug: string
  victoryType: string
  icon: string | null
  unlocked: boolean
  title?: string
  summary?: string
  heroImage?: string | null
  unlockedAt?: string | null
  runId?: number | null
}

export interface StorybookCollection {
  deck: {
    key: string
    title: string
    description: string | null
    axisCount: number
  }
  found: number
  total: number
  expected: number
  endings: StorybookCollectedEnding[]
}

/**
 * The only thing kept in the browser: which run to reopen.
 *
 * Everything else is a row. That is the whole point of this store -- a story
 * should survive a different device, which the localStorage beat loop never
 * managed.
 */
const ACTIVE_RUN_STORAGE_KEY = 'storybook-active-run-id'

function readStoredRunId(): number | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(ACTIVE_RUN_STORAGE_KEY)
    const parsed = Number(raw)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
  } catch {
    return null
  }
}

function writeStoredRunId(runId: number | null): void {
  if (typeof localStorage === 'undefined') return
  try {
    if (runId) localStorage.setItem(ACTIVE_RUN_STORAGE_KEY, String(runId))
    else localStorage.removeItem(ACTIVE_RUN_STORAGE_KEY)
  } catch {
    // A private window with storage blocked loses resume-on-reload and
    // nothing else: the run itself is a row.
  }
}

export const useStorybookRunStore = defineStore('storybookRunStore', () => {
  const run = ref<StorybookRun | null>(null)
  const pendingTurn = ref<StorybookPendingTurn | null>(null)
  const turns = ref<StorybookRunTurn[]>([])
  const inventory = ref<StorybookRunTreasure[]>([])
  const bible = ref<Record<string, unknown> | null>(null)
  const ending = ref<Record<string, unknown> | null>(null)
  const adventures = ref<StorybookRunSummary[]>([])
  const decks = ref<StorybookRunDeck[]>([])
  const collection = ref<StorybookCollection | null>(null)
  /** Life only. A genre deck's axis values are never sent. */
  const stats = ref<Record<string, number> | null>(null)

  const isOpening = ref(false)
  const isNarrating = ref(false)
  const isResolving = ref(false)
  const isLoading = ref(false)
  const errorMessage = ref('')

  const turnIndex = computed(() => run.value?.turnIndex ?? 0)
  const turnBudget = computed(() => run.value?.turnBudget ?? 0)
  const isFinalTurn = computed(
    () => Boolean(run.value) && turnIndex.value >= turnBudget.value,
  )
  const readyToResolve = computed(
    () =>
      run.value?.status === 'ACTIVE' &&
      turnBudget.value > 0 &&
      turnIndex.value > turnBudget.value,
  )
  const isComplete = computed(() => run.value?.status === 'COMPLETE')
  /** Cards the reader can actually play this turn. */
  const playableCards = computed(() =>
    inventory.value.filter((card) => !card.consumedAtTurn),
  )

  function reset(): void {
    run.value = null
    pendingTurn.value = null
    turns.value = []
    inventory.value = []
    bible.value = null
    ending.value = null
    stats.value = null
    errorMessage.value = ''
    writeStoredRunId(null)
  }

  function applyTurnPayload(payload: Record<string, unknown>): void {
    pendingTurn.value =
      (payload.pendingTurn as StorybookPendingTurn | null) ?? null
    if (Array.isArray(payload.inventory)) {
      inventory.value = payload.inventory as StorybookRunTreasure[]
    }
    if (payload.stats && typeof payload.stats === 'object') {
      stats.value = payload.stats as Record<string, number>
    }
    if (run.value && typeof payload.turnIndex === 'number') {
      run.value = { ...run.value, turnIndex: payload.turnIndex }
    }
  }

  async function fetchDecks(): Promise<boolean> {
    errorMessage.value = ''
    const response = await performFetch<StorybookRunDeck[]>(
      '/api/storybook/decks',
    )
    if (!response.success || !response.data) {
      errorMessage.value = response.message || 'Could not load the decks.'
      return false
    }
    decks.value = response.data
    return true
  }

  async function fetchAdventures(status?: string): Promise<boolean> {
    errorMessage.value = ''
    const query = status ? `?status=${encodeURIComponent(status)}` : ''
    const response = await performFetch<StorybookRunSummary[]>(
      `/api/storybook/runs${query}`,
    )
    if (!response.success || !response.data) {
      errorMessage.value = response.message || 'Could not load your adventures.'
      return false
    }
    adventures.value = response.data
    return true
  }

  async function fetchCollection(deckKey: string): Promise<boolean> {
    errorMessage.value = ''
    const response = await performFetch<StorybookCollection>(
      `/api/storybook/endings?deckKey=${encodeURIComponent(deckKey)}`,
    )
    if (!response.success || !response.data) {
      errorMessage.value = response.message || 'Could not load the collection.'
      return false
    }
    collection.value = response.data
    return true
  }

  async function openStory(board: StorybookBoard): Promise<boolean> {
    if (isOpening.value) return false
    isOpening.value = true
    errorMessage.value = ''
    try {
      const response = await performFetch<{
        run: StorybookRun
        bible: Record<string, unknown>
        inventory: StorybookRunTreasure[]
        pendingTurn: StorybookPendingTurn | null
        narrationError: string | null
      }>('/api/storybook/runs', {
        method: 'POST',
        body: JSON.stringify(board),
      })
      if (!response.success || !response.data) {
        errorMessage.value = response.message || 'The story would not open.'
        return false
      }

      run.value = response.data.run
      bible.value = response.data.bible
      inventory.value = response.data.inventory
      pendingTurn.value = response.data.pendingTurn
      turns.value = []
      ending.value = null
      stats.value = null
      writeStoredRunId(response.data.run.id)
      // The run exists even when its opening scene did not arrive; say so and
      // let the reader ask for the scene rather than stranding them.
      if (response.data.narrationError) {
        errorMessage.value = response.data.narrationError
      }
      return true
    } finally {
      isOpening.value = false
    }
  }

  async function loadRun(runId: number): Promise<boolean> {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const response = await performFetch<{
        run: StorybookRun
        bible: Record<string, unknown>
        inventory: StorybookRunTreasure[]
        pendingTurn: StorybookPendingTurn | null
        turns: StorybookRunTurn[]
        ending: Record<string, unknown> | null
        stats?: Record<string, number>
      }>(`/api/storybook/runs/${runId}`)
      if (!response.success || !response.data) {
        errorMessage.value = response.message || 'Could not open that story.'
        return false
      }

      run.value = response.data.run
      bible.value = response.data.bible
      inventory.value = response.data.inventory
      pendingTurn.value = response.data.pendingTurn
      turns.value = response.data.turns
      ending.value = response.data.ending
      stats.value = response.data.stats ?? null
      writeStoredRunId(runId)
      return true
    } finally {
      isLoading.value = false
    }
  }

  /** Reopen whatever run this browser was last in, if there was one. */
  async function resumeActiveRun(): Promise<boolean> {
    const storedId = readStoredRunId()
    if (!storedId) return false
    const loaded = await loadRun(storedId)
    // A run that has been deleted, or belongs to someone else now, should not
    // keep failing on every mount.
    if (!loaded) writeStoredRunId(null)
    return loaded
  }

  async function submitMove(
    move: {
      source: StorybookMoveSource
      text?: string
      optionId?: string | null
      rewardSlug?: string | null
    } | null,
  ): Promise<boolean> {
    const active = run.value
    if (!active || isNarrating.value) return false

    isNarrating.value = true
    errorMessage.value = ''
    try {
      const response = await performFetch<Record<string, unknown>>(
        `/api/storybook/runs/${active.id}/turn`,
        {
          method: 'POST',
          body: JSON.stringify({ turnIndex: active.turnIndex, move }),
        },
      )
      if (!response.success || !response.data) {
        errorMessage.value = response.message || 'That turn did not land.'
        return false
      }

      const payload = response.data
      const turn = payload.turn as StorybookRunTurn | null
      if (turn) turns.value = [...turns.value, turn]
      applyTurnPayload(payload)
      return true
    } finally {
      isNarrating.value = false
    }
  }

  /** Take one of the offered options. Only its id is sent. */
  function chooseOption(optionId: string): Promise<boolean> {
    return submitMove({ source: 'option', optionId })
  }

  function writeMove(text: string): Promise<boolean> {
    const clean = text.trim()
    if (!clean) return Promise.resolve(false)
    return submitMove({ source: 'custom', text: clean })
  }

  /** Play a Skill or Item from the protagonist's sheet. */
  function playCard(rewardSlug: string, note = ''): Promise<boolean> {
    return submitMove({ source: 'sheet', rewardSlug, text: note })
  }

  /** Ask for the current scene again when narration failed to produce one. */
  function requestScene(): Promise<boolean> {
    return submitMove(null)
  }

  async function resolveRun(): Promise<boolean> {
    const active = run.value
    if (!active || isResolving.value) return false

    isResolving.value = true
    errorMessage.value = ''
    try {
      const response = await performFetch<Record<string, unknown>>(
        `/api/storybook/runs/${active.id}/resolve`,
        { method: 'POST' },
      )
      if (!response.success || !response.data) {
        errorMessage.value = response.message || 'The ending would not settle.'
        return false
      }
      ending.value = response.data
      run.value = { ...active, status: 'COMPLETE' }
      return true
    } finally {
      isResolving.value = false
    }
  }

  function leaveRun(): void {
    reset()
  }

  return {
    run,
    pendingTurn,
    turns,
    inventory,
    bible,
    ending,
    adventures,
    decks,
    collection,
    stats,
    isOpening,
    isNarrating,
    isResolving,
    isLoading,
    errorMessage,
    turnIndex,
    turnBudget,
    isFinalTurn,
    readyToResolve,
    isComplete,
    playableCards,
    fetchDecks,
    fetchAdventures,
    fetchCollection,
    openStory,
    loadRun,
    resumeActiveRun,
    chooseOption,
    writeMove,
    playCard,
    requestScene,
    resolveRun,
    leaveRun,
  }
})
