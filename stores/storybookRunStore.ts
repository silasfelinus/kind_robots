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

/**
 * The four modes a story can be told in (storybook/t-039). Replaces the four
 * shapes: short story and chaptered tale were one story at two lengths, and
 * length is a setting now, not an identity (storybook/t-041).
 */
export type StorybookRunMode =
  'open-ended' | 'episodic' | 'structured' | 'taskmaster'

/** @deprecated The pre-mode spelling. Same type; use StorybookRunMode. */
export type StorybookRunShape = StorybookRunMode

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
  /** Locked-card hints only (storybook/t-038) -- never the axes. */
  unlockHint?: string | null
  unlockLabel?: string | null
}

export interface StorybookGatedCharacter {
  slug: string
  unlocked: boolean
  unlockHint?: string | null
  unlockLabel?: string | null
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

/** Taskmaster mode's real work, as the reader is allowed to see it. */
export interface StorybookQuestCheckpoint {
  id: string
  title: string
  detail: string | null
  sourceKind: 'direct-task' | 'honeydo' | 'needs-human'
  status: string
  todoId: number | null
  conductorTaskId: string | null
  projectSlug: string | null
}

export interface StorybookQuestProposal {
  id: string
  checkpointId: string
  turnIndex: number
  outcome: string
  note: string
  /** What applying this would do, in plain words, BEFORE it is done. */
  effect: string
  /** False until the reader accepts it. Never render an unapplied one as done. */
  applied: boolean
  appliedAt: string | null
  appliedTodoId: number | null
}

export interface StorybookQuest {
  objective: string
  projectSlug: string | null
  projectTitle: string | null
  checkpoints: StorybookQuestCheckpoint[]
  activeCheckpointId: string | null
  proposals: StorybookQuestProposal[]
}

export interface StorybookRunArt {
  id: number
  chapter: number
  sceneType?: string | null
  ArtImage?: { imagePath?: string | null; path?: string | null } | null
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
  mode: StorybookRunMode
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
  mode: StorybookRunMode
  status: string
  turnIndex: number
  /** null is an endless open-ended run: the reader decides when it ends. */
  turnBudget: number | null
  narratorStyle: string | null
  deck: { key: string; title: string; axisCount: number }
}

export interface StorybookBoard {
  mode: StorybookRunMode
  /**
   * Taskmaster mode only: the conductor project whose real work the Thread slot
   * deals. Required in that mode -- a quest without a project has no work in
   * it, only a story about work.
   */
  projectSlug?: string | null
  /**
   * The length dial (storybook/t-041): omit for the deck's default, pass null
   * for an endless open-ended story. A setting, never a card.
   */
  turnBudget?: number | null
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

/**
 * A played board, reduced to slugs (storybook/t-060). Not the wire payload
 * StorybookBoard sends to the server -- this is the client-only shape "Play
 * Again" re-deals the Table from, kept separate so a slug that no longer
 * resolves (a renamed/removed entity) just drops off the board instead of
 * touching the request that already ran.
 */
export interface StorybookBoardSlugs {
  mode: string[]
  genre: string[]
  place: string[]
  hero: string[]
  company: string[]
  narrator: string[]
  thread: string[]
  treasures: string[]
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
  /** Taskmaster mode only. Null in every other mode. */
  const quest = ref<StorybookQuest | null>(null)
  const art = ref<StorybookRunArt[]>([])
  const adventures = ref<StorybookRunSummary[]>([])
  const decks = ref<StorybookRunDeck[]>([])
  const gatedCharacters = ref<StorybookGatedCharacter[]>([])
  const collection = ref<StorybookCollection | null>(null)
  /** Life only. A genre deck's axis values are never sent. */
  const stats = ref<Record<string, number> | null>(null)
  /**
   * The board a run was opened with, in slugs (storybook/t-060). Recorded by
   * openStory() and cleared by reset() like everything else tied to a
   * specific run -- it exists only so playAgain() has something to retain
   * before leaveRun() wipes it.
   */
  const openedBoard = ref<StorybookBoardSlugs | null>(null)
  /**
   * One-shot handoff to the Table's next mount. retainBoardForPlayAgain()
   * fills it from openedBoard right before leaveRun() clears openedBoard;
   * consumePlayAgainBoard() empties it again so an ordinary visit or a
   * "start over" never re-seeds a stale board.
   */
  const playAgainBoard = ref<StorybookBoardSlugs | null>(null)

  const isOpening = ref(false)
  const isNarrating = ref(false)
  const isResolving = ref(false)
  const isApplying = ref(false)
  const isLoading = ref(false)
  const errorMessage = ref('')

  const turnIndex = computed(() => run.value?.turnIndex ?? 0)
  const turnBudget = computed(() => run.value?.turnBudget ?? null)
  /**
   * An endless open-ended run has no budget, so it has no final turn and the
   * pips must not read "3 of 8" (storybook/t-040). It is still resolvable --
   * the server says when, and the reader chooses the moment.
   */
  const isEndless = computed(
    () => Boolean(run.value) && run.value?.turnBudget == null,
  )
  const isFinalTurn = computed(
    () =>
      Boolean(run.value) &&
      turnBudget.value !== null &&
      turnIndex.value >= turnBudget.value,
  )
  const canEndOnDemand = ref(false)
  const readyToResolve = computed(() => {
    // The server is the ONLY source of truth here (storybook-reading.vue's own
    // header comment). A budgeted Taskmaster run can finish its quest before its
    // turn budget runs out (questDone() in server/utils/storybookRuns.ts), and a
    // local turnIndex > turnBudget guess never sees that.
    if (run.value?.status !== 'ACTIVE') return false
    return canEndOnDemand.value
  })
  const isComplete = computed(() => run.value?.status === 'COMPLETE')
  /** Cards the reader can actually play this turn. */
  const playableCards = computed(() =>
    inventory.value.filter((card) => !card.consumedAtTurn),
  )

  function reset(): void {
    run.value = null
    pendingTurn.value = null
    quest.value = null
    art.value = []
    turns.value = []
    inventory.value = []
    bible.value = null
    ending.value = null
    stats.value = null
    errorMessage.value = ''
    // A finished run can leave this true; nothing else clears it before the
    // next run's first turn payload arrives, so a fresh ACTIVE run would read
    // readyToResolve from the run it replaced (storybook/t-010 cycle 76).
    canEndOnDemand.value = false
    openedBoard.value = null
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
    // The server decides when an endless story may be brought to an end -- it
    // holds the deck's floor, and the client never has the deck's axes anyway.
    if (typeof payload.readyToResolve === 'boolean') {
      canEndOnDemand.value = payload.readyToResolve
    }
    if (payload.quest !== undefined) {
      quest.value = (payload.quest as StorybookQuest | null) ?? null
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

  async function fetchGatedCharacters(): Promise<boolean> {
    const response = await performFetch<StorybookGatedCharacter[]>(
      '/api/storybook/characters',
    )
    if (!response.success || !response.data) return false
    gatedCharacters.value = response.data
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

  async function openStory(
    board: StorybookBoard,
    boardSlugs?: StorybookBoardSlugs,
  ): Promise<boolean> {
    if (isOpening.value) return false
    isOpening.value = true
    errorMessage.value = ''
    try {
      const response = await performFetch<{
        run: StorybookRun
        bible: Record<string, unknown>
        inventory: StorybookRunTreasure[]
        pendingTurn: StorybookPendingTurn | null
        quest: StorybookQuest | null
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
      quest.value = response.data.quest ?? null
      art.value = []
      turns.value = []
      ending.value = null
      // A brand-new run has earned no early resolution yet; never inherit the
      // prior run's flag (storybook/t-010 cycle 76).
      canEndOnDemand.value = false
      stats.value = null
      openedBoard.value = boardSlugs ?? null
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
        quest: StorybookQuest | null
        art?: StorybookRunArt[]
        readyToResolve?: boolean
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
      quest.value = response.data.quest ?? null
      art.value = response.data.art ?? []
      stats.value = response.data.stats ?? null
      canEndOnDemand.value = Boolean(response.data.readyToResolve)
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

  /**
   * Called by playAgain() before leaveRun() wipes openedBoard, so the board
   * a finished run was opened with survives into the next Table mount.
   */
  function retainBoardForPlayAgain(): void {
    playAgainBoard.value = openedBoard.value
  }

  /**
   * One-shot: the Table calls this on mount and it is gone either way, so an
   * ordinary visit or "start over" never re-seeds a stale board.
   */
  function consumePlayAgainBoard(): StorybookBoardSlugs | null {
    const board = playAgainBoard.value
    playAgainBoard.value = null
    return board
  }

  /**
   * Apply one quest proposal (storybook/t-045).
   *
   * The ONLY thing in this store that changes a real to-do. Playing a turn
   * never does; the reader accepts a proposal here, explicitly, and the server
   * refuses anything this route did not authorize.
   */
  async function applyProposal(proposalId: string): Promise<boolean> {
    const active = run.value
    if (!active || isApplying.value) return false
    isApplying.value = true
    errorMessage.value = ''
    try {
      const response = await performFetch<{
        quest: StorybookQuest | null
        alreadyApplied: boolean
      }>(
        `/api/storybook/runs/${active.id}/proposals/${encodeURIComponent(proposalId)}/apply`,
        { method: 'POST' },
      )
      if (!response.success || !response.data) {
        errorMessage.value = response.message || 'That did not go through.'
        return false
      }
      quest.value = response.data.quest ?? quest.value
      return true
    } finally {
      isApplying.value = false
    }
  }

  return {
    run,
    pendingTurn,
    quest,
    art,
    isApplying,
    applyProposal,
    turns,
    inventory,
    bible,
    ending,
    adventures,
    decks,
    gatedCharacters,
    collection,
    stats,
    isOpening,
    isNarrating,
    isResolving,
    isLoading,
    errorMessage,
    turnIndex,
    turnBudget,
    isEndless,
    isFinalTurn,
    canEndOnDemand,
    readyToResolve,
    isComplete,
    playableCards,
    fetchDecks,
    fetchGatedCharacters,
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
    retainBoardForPlayAgain,
    consumePlayAgainBoard,
  }
})
