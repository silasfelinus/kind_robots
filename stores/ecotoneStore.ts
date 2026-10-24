import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  COMPANIONS,
  ENDING_IDS,
  type CompanionId,
  type EventId,
} from '~/utils/ecotone/content'
import {
  advance,
  chooseBeat,
  chooseCrossroads,
  chooseEvent,
  chooseFork,
  originPerkAvailable,
  chooseSubstanceMoment,
  computeEnding,
  createRun,
  crossroadsNewcomer,
  currentChapter,
  findCard,
  restoreRun,
  setLiveEdits,
  travelParty,
  type CrossroadsChoice,
  type RunState,
} from '~/utils/ecotone/engine'
import type { CardEdit } from '~/utils/playbook/edits'
import type { SubstanceId } from '~/utils/ecotone/substanceArc'
import { normalizePlayerIdentity, type PlayerIdentity } from '~/utils/ecotone/playerIdentity'
import {
  MYSTERIES,
  caseRecord,
  mergeCaseRecord,
  mysteryCardMeta,
  mysteryEnding,
  pickMystery,
  runMystery,
  sanitizeCaseFiles,
  type CaseRecord,
} from '~/utils/ecotone/mysteries'
import { performFetch } from '~/stores/utils'

const RUN_KEY = 'kr.ecotone.run.v1'
const ENDINGS_KEY = 'kr.ecotone.endings.v1'
const CASES_KEY = 'kr.ecotone.cases.v1'
const UNDO_KEY = 'kr.ecotone.undo.v1'
const SAVE_SLOTS_KEY = 'kr.ecotone.manual-saves.v1'
export type EcotoneSaveSlot = { slot: number; savedAt: string; state: RunState }

export const useEcotoneStore = defineStore('ecotone', () => {
  const run = ref<RunState | null>(null)
  const endings = ref<string[]>([])
  /** Case Files: the best result on each gate of every mystery ever opened. */
  const caseFiles = ref<Record<string, CaseRecord>>({})
  const undoSnapshot = ref<RunState | null>(null)
  const manualSaves = ref<EcotoneSaveSlot[]>([])
  const canUndo = computed(() => Boolean(run.value && undoSnapshot.value))
  const loaded = ref(false)
  // Bumped when Playbook Manager live edits arrive, so card text re-reads them.
  const liveVersion = ref(0)

  const chapter = computed(() => (run.value ? currentChapter(run.value) : 1))
  const card = computed(() => {
    void liveVersion.value
    return run.value && run.value.phase === 'beat'
      ? findCard(run.value.card)
      : null
  })
  const offered = computed(() => {
    void liveVersion.value
    return run.value && run.value.phase === 'fork'
      ? run.value.offered.flatMap((id) => findCard(id) ?? [])
      : []
  })
  const lead = computed(
    () => COMPANIONS.find((c) => c.id === run.value?.activeLead) ?? null,
  )
  const party = computed(() =>
    run.value
      ? travelParty(run.value).flatMap(
          (id) => COMPANIONS.find((companion) => companion.id === id) ?? [],
        )
      : [],
  )
  const prospect = computed(
    () => COMPANIONS.find((c) => c.id === run.value?.prospect) ?? null,
  )
  const newcomer = computed(() => {
    const id = run.value ? crossroadsNewcomer(run.value) : null
    return COMPANIONS.find((c) => c.id === id) ?? null
  })
  const ending = computed(() =>
    run.value?.phase === 'end' ? computeEnding(run.value) : null,
  )
  const mystery = computed(() => (run.value ? runMystery(run.value) : null))
  const mysteryMeta = computed(() =>
    run.value?.phase === 'beat' ? mysteryCardMeta(run.value.card) : null,
  )
  const realEnding = computed(() =>
    run.value ? mysteryEnding(run.value) : null,
  )
  const casesOpened = computed(() => Object.keys(caseFiles.value).length)
  const unlockedCount = computed(
    () => endings.value.filter((id) => ENDING_IDS.includes(id)).length,
  )

  function persist() {
    if (!import.meta.client) return
    try {
      if (run.value)
        window.localStorage.setItem(RUN_KEY, JSON.stringify(run.value))
      else window.localStorage.removeItem(RUN_KEY)
      window.localStorage.setItem(ENDINGS_KEY, JSON.stringify(endings.value))
      window.localStorage.setItem(CASES_KEY, JSON.stringify(caseFiles.value))
      if (undoSnapshot.value)
        window.localStorage.setItem(
          UNDO_KEY,
          JSON.stringify(undoSnapshot.value),
        )
      else window.localStorage.removeItem(UNDO_KEY)
      window.localStorage.setItem(
        SAVE_SLOTS_KEY,
        JSON.stringify(manualSaves.value),
      )
    } catch {
      /* private browsing keeps the run in memory only */
    }
  }

  function initialize() {
    if (loaded.value) return
    if (import.meta.client) {
      try {
        const saved = window.localStorage.getItem(RUN_KEY)
        if (saved) run.value = restoreRun(JSON.parse(saved))
        const oldCheckpoint = window.localStorage.getItem(UNDO_KEY)
        if (oldCheckpoint && run.value) {
          const parsed = restoreRun(JSON.parse(oldCheckpoint))
          if (
            parsed &&
            parsed.seed === run.value.seed &&
            parsed.log.length <= run.value.log.length &&
            parsed.phase !== 'end'
          )
            undoSnapshot.value = parsed
        }
        const savedSlots = window.localStorage.getItem(SAVE_SLOTS_KEY)
        if (savedSlots) {
          const parsed: unknown = JSON.parse(savedSlots)
          if (Array.isArray(parsed))
            manualSaves.value = parsed
              .flatMap((item) => {
                const snapshot =
                  item && typeof item === 'object'
                    ? restoreRun(item.state)
                    : null
                return snapshot &&
                  Number.isInteger(item.slot) &&
                  item.slot >= 1 &&
                  item.slot <= 3 &&
                  typeof item.savedAt === 'string'
                  ? [
                      {
                        slot: item.slot as number,
                        savedAt: item.savedAt as string,
                        state: snapshot,
                      },
                    ]
                  : []
              })
              .filter(
                (item, index, all) =>
                  all.findIndex((other) => other.slot === item.slot) === index,
              )
        }
        const ledger = window.localStorage.getItem(ENDINGS_KEY)
        if (ledger) {
          const parsed: unknown = JSON.parse(ledger)
          if (Array.isArray(parsed))
            endings.value = parsed.filter(
              (id): id is string =>
                typeof id === 'string' && ENDING_IDS.includes(id),
            )
        }
        const cases = window.localStorage.getItem(CASES_KEY)
        if (cases) caseFiles.value = sanitizeCaseFiles(JSON.parse(cases))
      } catch {
        run.value = null
        undoSnapshot.value = null
      }
    }
    loaded.value = true
    void loadLiveEdits()
  }

  async function loadLiveEdits() {
    if (!import.meta.client) return
    const response = await performFetch<Record<string, CardEdit>>(
      '/api/playbook/ecotone/live',
    )
    if (!response.success || !response.data) return
    setLiveEdits(response.data)
    liveVersion.value += 1
  }

  function update(next: RunState, remember = false) {
    if (next === run.value) return
    undoSnapshot.value = remember ? run.value : null
    run.value = next
    if (
      next.phase === 'end' &&
      next.ending &&
      ENDING_IDS.includes(next.ending) &&
      !endings.value.includes(next.ending)
    )
      endings.value = [...endings.value, next.ending]
    const record = caseRecord(next)
    if (record)
      caseFiles.value = {
        ...caseFiles.value,
        [record.id]: mergeCaseRecord(caseFiles.value[record.id], record),
      }
    persist()
  }

  function begin(archetypeId: string, identity: PlayerIdentity = {}) {
    const seed = Date.now() % 2147483647
    update(
      createRun(
        seed,
        archetypeId,
        pickMystery(seed, Object.keys(caseFiles.value)),
        identity,
      ),
    )
  }

  /** Cosmetic change: persistent, but never a story decision or undo step. */
  function setPlayerLook(avatarId: string, portraitArtId?: number | null) {
    if (!run.value) return
    const identity = normalizePlayerIdentity({
      playerName: run.value.playerName,
      personalityId: run.value.personalityId,
      avatarId,
      portraitArtId: portraitArtId ?? run.value.portraitArtId,
    })
    run.value = { ...run.value, avatarId: identity.avatarId, portraitArtId: identity.portraitArtId }
    persist()
  }

  function saveSlot(slot: number) {
    if (!run.value || !Number.isInteger(slot) || slot < 1 || slot > 3)
      return false
    const snapshot: EcotoneSaveSlot = {
      slot,
      savedAt: new Date().toISOString(),
      state: structuredClone(run.value),
    }
    manualSaves.value = [
      ...manualSaves.value.filter((item) => item.slot !== slot),
      snapshot,
    ]
    persist()
    return true
  }

  function loadSlot(slot: number) {
    const saved = manualSaves.value.find((item) => item.slot === slot)
    const restored = saved ? restoreRun(structuredClone(saved.state)) : null
    if (!restored) return false
    undoSnapshot.value = null
    run.value = restored
    persist()
    return true
  }

  function deleteSlot(slot: number) {
    manualSaves.value = manualSaves.value.filter((item) => item.slot !== slot)
    persist()
  }

  function exportSave(): string | null {
    return run.value
      ? JSON.stringify(
          {
            format: 'ecotone-save',
            version: 1,
            savedAt: new Date().toISOString(),
            run: run.value,
          },
          null,
          2,
        )
      : null
  }

  function importSave(raw: unknown): boolean {
    if (!raw || typeof raw !== 'object') return false
    const payload = raw as {
      format?: unknown
      version?: unknown
      run?: unknown
    }
    if (payload.format !== 'ecotone-save' || payload.version !== 1) return false
    const restored = restoreRun(payload.run)
    if (!restored) return false
    undoSnapshot.value = null
    run.value = restored
    persist()
    return true
  }

  function undo() {
    if (!run.value || !undoSnapshot.value) return
    const before = undoSnapshot.value
    undoSnapshot.value = null
    // Unlocked endings are permanent achievements across multiple runs.
    run.value = before
    persist()
  }

  function pickEvent(event: EventId) {
    if (run.value) update(chooseEvent(run.value, event), true)
  }

  function pickFork(cardId: string) {
    if (run.value) update(chooseFork(run.value, cardId), true)
  }

  function choose(choiceId: string, spendOriginPerk = false) {
    if (run.value)
      update(
        chooseBeat(
          run.value,
          choiceId,
          spendOriginPerk && originPerkAvailable(run.value, choiceId),
        ),
        true,
      )
  }

  function takeMoment(selected: SubstanceId[]) {
    if (run.value) update(chooseSubstanceMoment(run.value, selected), true)
  }

  function crossroads(choice: boolean | CrossroadsChoice) {
    if (run.value) update(chooseCrossroads(run.value, choice), true)
  }

  function proceed() {
    if (run.value) update(advance(run.value))
  }

  function abandon() {
    run.value = null
    undoSnapshot.value = null
    persist()
  }

  function companionMet(id: CompanionId) {
    return Boolean(run.value?.meetingOrder.includes(id))
  }

  return {
    run,
    endings,
    loaded,
    canUndo,
    undo,
    manualSaves,
    saveSlot,
    loadSlot,
    deleteSlot,
    exportSave,
    importSave,
    chapter,
    card,
    offered,
    lead,
    party,
    prospect,
    newcomer,
    ending,
    unlockedCount,
    endingTotal: ENDING_IDS.length,
    caseFiles,
    casesOpened,
    caseTotal: MYSTERIES.length,
    mystery,
    mysteryMeta,
    realEnding,
    initialize,
    begin,
    setPlayerLook,
    pickEvent,
    pickFork,
    choose,
    takeMoment,
    crossroads,
    proceed,
    abandon,
    companionMet,
  }
})
