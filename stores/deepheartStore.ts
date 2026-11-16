import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAchievementStore } from './achievementStore'
import { usePlaybookKitStore } from './playbookKitStore'
import { achievementsProven } from '~/utils/deepheart/achievements'
import {
  SAVE_SLOTS,
  SAVES_VERSION,
  decodeChronicle,
  decodeSaves,
  emptyChronicle,
  recordFinish,
  recordProgress,
  recordStart,
  type Chronicle,
  type SaveFile,
  type SaveSlot,
} from '~/utils/deepheart/chronicle'
import { LAYERS } from '~/utils/deepheart/dungeon'
import * as engine from '~/utils/deepheart/engine'
import {
  MAX_COMPANIONS,
  activeSupports,
  activeSynergies,
  canRomance,
  optimizeParty,
  scoreParty,
  type PartyGoal,
  type PartyScore,
} from '~/utils/deepheart/party'
import { CHARACTERS, character } from '~/utils/deepheart/roster'
import type {
  EndingId,
  Gender,
  HeroSetup,
  RunState,
  StatKey,
} from '~/utils/deepheart/types'

// Deepheart (conductor deepheart). Owns the delve in progress, the chronicle
// that outlives it, three save slots plus an autosave, and the site
// achievements a delve earns. Components read this store and call its
// actions; only this store touches localStorage.

export type DhScreen = 'title' | 'builder' | 'delve' | 'chronicle' | 'saves'

const CHRONICLE_KEY = 'kr-deepheart-chronicle-v1'
const SAVES_KEY = 'kr-deepheart-saves-v1'
const HELD =
  'Saved Deepheart progress could not be read. It was left untouched; new progress lasts only this visit.'
const BLOCKED =
  'Browser storage is unavailable, so this delve will not be saved.'

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function read(key: string): string | null {
  try {
    return storage()?.getItem(key) ?? null
  } catch {
    return null
  }
}

function presetHero(id: string): HeroSetup {
  const c = character(id)
  return {
    presetId: id,
    name: '',
    gender: c.gender,
    drawnTo: c.drawnTo.length ? [...c.drawnTo] : [],
    boon: c.edge,
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export const useDeepheartStore = defineStore('deepheart', () => {
  const screen = ref<DhScreen>('title')
  const run = ref<RunState | null>(null)
  const chronicle = ref<Chronicle>(emptyChronicle())
  const saves = ref<SaveFile>({ version: SAVES_VERSION, slots: [] })
  const heldChronicle = ref(false)
  const heldSaves = ref(false)
  const warning = ref('')
  const loaded = ref(false)

  const hero = ref<HeroSetup>(presetHero('idris'))
  const companions = ref<string[]>([])
  const goal = ref<PartyGoal>('balanced')
  const suggestions = ref<PartyScore[]>([])
  const focus = ref<string>('idris')
  const lastLine = ref('')
  const roleFilter = ref<string>('all')

  const kit = () => usePlaybookKitStore()
  const romanceOn = computed(() => kit().settings.romance !== 'off')

  // ── Persistence ───────────────────────────────────────────────────────

  function load() {
    if (loaded.value) return
    loaded.value = true
    if (!storage()) warning.value = BLOCKED
    const c = decodeChronicle(read(CHRONICLE_KEY))
    heldChronicle.value = c === null
    chronicle.value = c ?? emptyChronicle()
    const s = decodeSaves(read(SAVES_KEY))
    heldSaves.value = s === null
    saves.value = s ?? { version: SAVES_VERSION, slots: [] }
    if (heldChronicle.value || heldSaves.value) warning.value = HELD
    if (chronicle.value.lastHero) {
      hero.value = clone(chronicle.value.lastHero)
      focus.value = hero.value.presetId
    }
  }

  function write(key: string, value: unknown, held: boolean) {
    if (held) return
    const store = storage()
    if (!store) return
    try {
      store.setItem(key, JSON.stringify(value))
    } catch {
      warning.value =
        'Local save is full or unavailable. This delve is not backed up.'
    }
  }

  function persistChronicle() {
    write(CHRONICLE_KEY, chronicle.value, heldChronicle.value)
  }

  function persistSaves() {
    write(SAVES_KEY, saves.value, heldSaves.value)
  }

  const autosave = computed(
    () => saves.value.slots.find((s) => s.slot === 'auto') ?? null,
  )

  const slots = computed(() =>
    Array.from(
      { length: SAVE_SLOTS },
      (_, i) => saves.value.slots.find((s) => s.slot === i + 1) ?? null,
    ),
  )

  function slotLabel(r: RunState): string {
    const lead = engine.heroName(r)
    if (r.ending) return `${lead}: ${r.ending}`
    return `${lead} · ${LAYERS[r.layer]!.name}, room ${r.depth + 1}`
  }

  function putSlot(slot: SaveSlot['slot'], r: RunState) {
    const entry: SaveSlot = {
      slot,
      savedAt: new Date().toISOString(),
      label: slotLabel(r),
      run: clone(r),
    }
    saves.value = {
      ...saves.value,
      slots: [...saves.value.slots.filter((s) => s.slot !== slot), entry],
    }
    persistSaves()
  }

  function saveTo(slot: number) {
    if (run.value) putSlot(slot, run.value)
  }

  function loadFrom(slot: SaveSlot['slot']) {
    const entry = saves.value.slots.find((s) => s.slot === slot)
    if (!entry) return
    run.value = clone(entry.run)
    lastLine.value = ''
    screen.value = 'delve'
  }

  function deleteSlot(slot: SaveSlot['slot']) {
    saves.value = {
      ...saves.value,
      slots: saves.value.slots.filter((s) => s.slot !== slot),
    }
    persistSaves()
  }

  const canContinue = computed(
    () => !!autosave.value && !autosave.value.run.ending,
  )

  function continueRun() {
    if (canContinue.value) loadFrom('auto')
  }

  // ── Building a party ──────────────────────────────────────────────────

  function chooseHero(id: string) {
    hero.value = presetHero(id)
    companions.value = companions.value.filter((c) => c !== id)
    focus.value = id
    suggestions.value = []
  }

  function setHeroName(name: string) {
    hero.value = { ...hero.value, name: name.slice(0, 24) }
  }

  function setHeroGender(gender: Gender) {
    hero.value = { ...hero.value, gender }
  }

  function toggleDrawnTo(gender: Gender) {
    const has = hero.value.drawnTo.includes(gender)
    hero.value = {
      ...hero.value,
      drawnTo: has
        ? hero.value.drawnTo.filter((g) => g !== gender)
        : [...hero.value.drawnTo, gender],
    }
  }

  function setBoon(boon: StatKey) {
    hero.value = { ...hero.value, boon }
  }

  function toggleCompanion(id: string) {
    focus.value = id
    if (id === hero.value.presetId) return
    if (companions.value.includes(id))
      companions.value = companions.value.filter((c) => c !== id)
    else if (companions.value.length < MAX_COMPANIONS)
      companions.value = [...companions.value, id]
  }

  function optimize(next?: PartyGoal) {
    if (next) goal.value = next
    suggestions.value = optimizeParty(hero.value, goal.value, 3)
  }

  function useSuggestion(score: PartyScore) {
    companions.value = [...score.companions]
    focus.value = score.companions[0] ?? hero.value.presetId
  }

  const partyScore = computed(() =>
    scoreParty(hero.value, companions.value, goal.value),
  )
  const builderSynergies = computed(() =>
    activeSynergies([hero.value.presetId, ...companions.value]),
  )
  const builderSupports = computed(() =>
    activeSupports([hero.value.presetId, ...companions.value]),
  )
  const builderRomances = computed(() =>
    companions.value.filter((id) =>
      canRomance(hero.value, id, companions.value),
    ),
  )

  function randomParty() {
    const pool = CHARACTERS.map((c) => c.id).filter(
      (id) => id !== hero.value.presetId,
    )
    const picked: string[] = []
    while (picked.length < 3) {
      const id = pool[Math.floor(Math.random() * pool.length)]!
      if (!picked.includes(id)) picked.push(id)
    }
    companions.value = picked
  }

  function newGame() {
    load()
    screen.value = 'builder'
  }

  function startDelve() {
    if (!companions.value.length) return
    const seed = Math.floor(Math.random() * 2 ** 31)
    run.value = engine.createRun(clone(hero.value), [...companions.value], seed)
    chronicle.value = recordStart(chronicle.value, run.value)
    persistChronicle()
    lastLine.value = ''
    screen.value = 'delve'
    commit(0)
  }

  function abandon() {
    run.value = null
    screen.value = 'title'
  }

  // ── Playing ───────────────────────────────────────────────────────────

  function commit(solvedBefore: number) {
    const r = run.value
    if (!r) return
    const k = kit()
    for (const id of r.moments) k.unlock('moments', id)
    for (const id of r.reveals) k.unlock('reveals', id)
    let next = recordProgress(chronicle.value, r, solvedBefore)
    if (r.ending && !r.flags.recorded) {
      r.flags.recorded = true
      k.unlock('endings', r.ending)
      next = recordFinish(next, r)
    }
    const earned = achievementsProven(next, r).filter(
      (code) => !next.awarded.includes(code),
    )
    if (earned.length) {
      next = { ...next, awarded: [...next.awarded, ...earned] }
      const achievements = useAchievementStore()
      for (const code of earned)
        if (!achievements.hasEarnedCode(code))
          void achievements.rewardAchievementByCode(code)
    }
    chronicle.value = next
    persistChronicle()
    putSlot('auto', r)
  }

  function step(action: (r: RunState) => void) {
    const r = run.value
    if (!r) return
    const solved = r.puzzlesSolved
    action(r)
    commit(solved)
  }

  const chooseDoor = (i: number) => step((r) => engine.chooseDoor(r, i))
  const act = (a: engine.CombatAction) => step((r) => engine.act(r, a))
  const autoTurn = () =>
    step((r) => {
      if (engine.currentActor(r)) engine.act(r, engine.autoAction(r))
    })
  const autoFight = () =>
    step((r) => {
      for (let i = 0; i < 400 && r.phase === 'fight'; i++)
        engine.act(r, engine.autoAction(r))
    })
  const answerRiddle = (a: string) => step((r) => engine.answerRiddle(r, a))
  const pressRune = (i: number) => step((r) => engine.pressRune(r, i))
  const pressGlyph = (g: number) => step((r) => engine.pressGlyph(r, g))
  const replaySequence = () => step((r) => engine.useSequenceShow(r))
  const toggleWeight = (i: number) => step((r) => engine.toggleWeight(r, i))
  const weigh = () => step((r) => engine.weighScales(r))
  const leavePuzzle = () => step((r) => engine.leavePuzzle(r))
  const openTreasure = (c: engine.TreasureChoice) =>
    step((r) => engine.openTreasure(r, c))
  const chooseOption = (id: string) => step((r) => engine.chooseOption(r, id))
  const equip = (id: string | null) => step((r) => engine.equipLoot(r, id))
  const leaveCamp = () => step((r) => engine.leaveCamp(r))
  const chooseEnding = (e: EndingId) => step((r) => engine.chooseEnding(r, e))

  function campAction(option: engine.CampOption) {
    step((r) => {
      lastLine.value = engine.campAction(r, option)
    })
  }

  const campOptions = computed(() => {
    const r = run.value
    if (!r) return []
    return engine
      .campOptions(r)
      .filter((o) => romanceOn.value || o.kind !== 'romance')
  })

  const meterValues = computed(() => {
    const r = run.value
    if (!r) return {}
    return {
      depth: engine.depthMeter(r),
      health: engine.partyHealth(r),
      gold: r.gold,
      potions: r.potions,
    }
  })

  function finishedTo(next: DhScreen) {
    run.value = null
    screen.value = next
  }

  function resetChronicle() {
    heldChronicle.value = false
    chronicle.value = emptyChronicle()
    persistChronicle()
  }

  return {
    screen,
    run,
    chronicle,
    saves,
    warning,
    hero,
    companions,
    goal,
    suggestions,
    focus,
    lastLine,
    roleFilter,
    romanceOn,
    autosave,
    slots,
    canContinue,
    partyScore,
    builderSynergies,
    builderSupports,
    builderRomances,
    campOptions,
    meterValues,
    load,
    newGame,
    continueRun,
    saveTo,
    loadFrom,
    deleteSlot,
    chooseHero,
    setHeroName,
    setHeroGender,
    toggleDrawnTo,
    setBoon,
    toggleCompanion,
    optimize,
    useSuggestion,
    randomParty,
    startDelve,
    abandon,
    chooseDoor,
    act,
    autoTurn,
    autoFight,
    answerRiddle,
    pressRune,
    pressGlyph,
    replaySequence,
    toggleWeight,
    weigh,
    leavePuzzle,
    openTreasure,
    chooseOption,
    equip,
    campAction,
    leaveCamp,
    chooseEnding,
    finishedTo,
    resetChronicle,
  }
})
