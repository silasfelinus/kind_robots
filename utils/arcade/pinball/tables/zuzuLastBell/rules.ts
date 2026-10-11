// /utils/arcade/pinball/tables/zuzuLastBell/rules.ts
//
// Zuzu: The Last Bell's own rules (conductor zuzu-pinball/t-008): a pure
// reducer from switch events to state and effects, like AMI's, but owning
// Zuzu's game. The Mortuary tells the story's chapters in order
// (chapters.ts); ringing the bell lane or breaking all four Abbey seals
// lights it again. The seals also raise the bonus multiplier and relight the
// kickback. The River Croc always pays for a swallow, and his fifth lights
// an extra ball in his mouth. A soft plunge into the Mortuary is the skill
// shot; ramps and orbits in quick succession build a combo; the end of each
// ball counts a bonus; a match at the end can earn one more ball.
//
// A swallow during Homestead opens the Watering Hole (wateringHole.ts),
// where an orbit lights the Croc for the Death Roll jackpot (t-016). The
// Citadel locks balls for Harvest Moon, the three-ball multiball
// (multiball.ts, t-009). The undercrypt (t-010) builds on this state;
// nothing here blocks flipping.

import { PHYSICS_HZ } from '../../clock'
import type { RuleEffect } from '../../types'
import { nudge, type RulesContext, type RulesEvent } from '../../rules/engine'
import type { CoreRulesState, PinballRuleset } from '../../rules/ruleset'
import {
  initialShotProgress,
  recognizeShots,
  type ShotProgress,
} from '../../rules/shots'
import type { LightShow } from '../../rules/lightShows'
import { nextRandom } from '../../rules/village'
import {
  CHAPTERS,
  hitValue,
  litShots,
  RELICS_FOR_CRYPT,
  ROVE_STEPS,
  SEAL_COUNT,
  sealValue,
  type ChapterProgress,
} from './chapters'
import {
  advanceCroc,
  CROC_MOUTH,
  CROC_TOY,
  crocCaptured,
  crocEjected,
  initialCroc,
  type CrocCycle,
} from './croc'
import { zuzuLamps } from './lamps'
import {
  CITADEL,
  endMultiball,
  harvestShot,
  initialCitadel,
  initialMultiball,
  LOCK_LIGHTER,
  lockBall,
  lockFellBack,
  MULTIBALL_VALUES,
  startHarvest,
  type Citadel,
  type Multiball,
} from './multiball'
import {
  advanceWateringHole,
  closeWateringHole,
  initialWateringHole,
  openWateringHole,
  STIR_SHOTS,
  stirWater,
  WATERING_HOLE_CHAPTER,
  wateringHoleRunning,
  wateringSwallow,
  type WateringHole,
} from './wateringHole'

/** A chapter being told. */
export type ChapterRun = {
  /** Physics step its timer runs out on. */
  until: number
  /** Seconds left as the DMD last showed them. */
  shown: number
  /** A roving chapter's lit shot, and when it last moved. */
  rove: number
  movedAt: number
  /** What it has paid so far, for the mode total. */
  total: number
}

export type StoryState = {
  /** Times through all five chapters, from 1; values scale with it. */
  round: number
  /** The chapter being (or to be) told: chapters sealed this round. */
  chapter: number
  progress: ChapterProgress
  run: ChapterRun | null
  mortuaryLit: boolean
  /** Chapters sealed this game, all rounds. */
  sealed: number
}

export type ZuzuRulesState = CoreRulesState & {
  ballsInPlay: number
  seed: number
  shotProgress: ShotProgress
  /** Abbey seal drop targets down. */
  sealsDown: string[]
  kickbackLit: boolean
  tiltWarnings: number
  lastNudgeAt: number
  story: StoryState
  /** The skill shot: armed for the plunge, live until `until`. */
  skill: { armed: boolean; until: number }
  ballSave: { armed: boolean; until: number }
  combo: { count: number; at: number }
  croc: {
    swallows: number
    extraBallLit: boolean
    extraBallGiven: boolean
    /** His animatronic cycle; the jaw gate follows it (croc.ts). */
    cycle: CrocCycle
  }
  /** The Citadel lock and its ball ledger (multiball.ts). */
  citadel: Citadel
  multiball: Multiball
  /** The Croc's Watering Hole mini-mode (wateringHole.ts). */
  wateringHole: WateringHole
  extraBalls: number
  /** Strikes on the captive relic ball this game: the undercrypt's key. */
  relics: number
  /** This ball's counts, for its bonus. */
  thisBall: {
    shots: number
    crocs: number
    spins: number
    seals: number
    relics: number
    jackpots: number
  }
}

export const SEAL_BANK = 'abbey-seals'
export const MAX_MULTIPLIER = 6
/** Ramps and orbits this close together build a combo. */
export const COMBO_STEPS = PHYSICS_HZ * 3
/** The skill shot stays live this long after the plunge. */
export const SKILL_STEPS = PHYSICS_HZ * 5
/** A ball lost this soon after the plunge is given back. */
export const BALL_SAVE_STEPS = PHYSICS_HZ * 8
/** The Croc's swallows that light an extra ball in his mouth. */
export const CROC_EXTRA_BALL_AT = 5
/** The captive relic ball, and how hard it must be struck to count. */
export const RELIC = 'relic-captive'
export const RELIC_MIN_SPEED = 0.3

export const VALUES = {
  skillShot: 500_000,
  combo: 150_000,
  crocSpit: 50_000,
  mortuary: 25_000,
  bell: 25_000,
  ramp: 50_000,
  orbit: 30_000,
  seal: 10_000,
  sealsComplete: 100_000,
  pop: 3_000,
  sling: 500,
  spin: 1_000,
  relic: 75_000,
  bonusRelic: 15_000,
  bonusShot: 5_000,
  bonusCroc: 20_000,
  bonusSpin: 300,
  bonusSeal: 25_000,
  bonusJackpot: 50_000,
  citadel: 10_000,
}

export function initialZuzuRules(balls: number, seed = 1): ZuzuRulesState {
  return {
    score: 0,
    ball: 0,
    lives: balls,
    ballsInPlay: 0,
    over: false,
    tilted: false,
    bonusMultiplier: 1,
    shotsMade: {},
    seed,
    shotProgress: initialShotProgress(),
    sealsDown: [],
    kickbackLit: true,
    tiltWarnings: 0,
    lastNudgeAt: Number.NEGATIVE_INFINITY,
    story: {
      round: 1,
      chapter: 0,
      progress: { hits: 0, made: [] },
      run: null,
      mortuaryLit: true,
      sealed: 0,
    },
    skill: { armed: true, until: Number.POSITIVE_INFINITY },
    ballSave: { armed: true, until: Number.NEGATIVE_INFINITY },
    combo: { count: 0, at: Number.NEGATIVE_INFINITY },
    croc: {
      swallows: 0,
      extraBallLit: false,
      extraBallGiven: false,
      cycle: initialCroc(),
    },
    citadel: initialCitadel(),
    multiball: initialMultiball(),
    wateringHole: initialWateringHole(),
    extraBalls: 0,
    relics: 0,
    thisBall: {
      shots: 0,
      crocs: 0,
      spins: 0,
      seals: 0,
      relics: 0,
      jackpots: 0,
    },
  }
}

function award(state: ZuzuRulesState, points: number) {
  state.score += points
}

const label = (shot: string) => shot.replace(/-/g, ' ').toUpperCase()

export function stepZuzuRules(
  state: ZuzuRulesState,
  event: RulesEvent,
  context: RulesContext = { shots: [] },
): { state: ZuzuRulesState; effects: RuleEffect[] } {
  if (state.over) return { state, effects: [] }
  if (event.type === 'nudge') return nudge(state, event.tick)
  if (event.type === 'tick') return tick(state, event.tick)
  if (event.type === 'start') {
    return {
      state: { ...state, ball: 1, ballsInPlay: 1 },
      effects: [
        { type: 'serve-ball' },
        { type: 'dmd', text: 'BALL 1', ms: 1500, scene: 'ball', value: 1 },
      ],
    }
  }
  const sw = event.event
  const at = event.tick ?? 0
  const recognized = recognizeShots(
    context.shots,
    state.shotProgress,
    sw,
    at,
    sw.type === 'spin' ? sw.speed : sw.type === 'contact' ? sw.impulse : 0,
  )
  const next: ZuzuRulesState = { ...state, shotProgress: recognized.progress }
  const effects: RuleEffect[] = []
  for (const made of recognized.completed)
    shot(next, made.shotId, made.comboEligible, at, effects)

  switch (sw.type) {
    case 'drain':
      return drain(next, at, effects)
    case 'drop':
      if (sw.bank === SEAL_BANK) seal(next, sw.id, effects)
      break
    case 'capture':
      if (sw.id === CROC_MOUTH) {
        effects.push({ type: 'sound', name: 'jaw-snap' })
        next.croc = { ...next.croc, cycle: crocCaptured(at, effects) }
        // The chapter as it stood before this swallow counted toward it.
        swallow(next, homestead(state), at, effects)
      } else {
        effects.push({ type: 'sound', name: 'scoop' })
        if (sw.id === CITADEL) citadel(next, sw.ballId, at, effects)
      }
      break
    case 'eject':
      effects.push({ type: 'sound', name: 'kickout' })
      if (sw.id === CROC_MOUTH) {
        effects.push({ type: 'sound', name: 'water-spray' })
        next.croc = { ...next.croc, cycle: crocEjected(at) }
      }
      if (sw.id === CITADEL) {
        // A lock the machine could not hold: counted, and back in play.
        const healed = lockFellBack(next.citadel, sw.ballId)
        if (healed) {
          next.citadel = healed
          next.ballsInPlay += 1
        }
      }
      break
    case 'spin':
      award(next, VALUES.spin)
      next.thisBall = { ...next.thisBall, spins: next.thisBall.spins + 1 }
      effects.push({ type: 'sound', name: 'spinner' })
      break
    case 'sensor-enter':
      if (sw.id === 'shooter-exit') plunged(next, at)
      else if (sw.id === 'kickback') kickback(next, effects)
      break
    case 'contact':
      if (sw.id === RELIC) {
        if (sw.impulse >= RELIC_MIN_SPEED) relic(next, effects)
      } else if (sw.id.startsWith('marsh-pop-')) {
        award(next, VALUES.pop)
        effects.push(
          { type: 'sound', name: 'pop' },
          { type: 'mechanism', id: sw.id, action: 'flash' },
        )
      } else if (/^sling-.+-kicker$/.test(sw.id)) {
        award(next, VALUES.sling)
        effects.push({ type: 'sound', name: 'sling' })
      }
      break
  }
  return { state: next, effects }
}

/** The ball left the shooter lane: the skill shot and ball save start. */
function plunged(state: ZuzuRulesState, at: number) {
  if (state.skill.armed && state.skill.until === Number.POSITIVE_INFINITY)
    state.skill = { armed: true, until: at + SKILL_STEPS }
  if (state.ballSave.armed)
    state.ballSave = { armed: false, until: at + BALL_SAVE_STEPS }
}

function kickback(state: ZuzuRulesState, effects: RuleEffect[]) {
  if (!state.kickbackLit || state.tilted) return
  state.kickbackLit = false
  effects.push(
    { type: 'mechanism', id: 'kickback', action: 'fire' },
    { type: 'sound', name: 'kickback' },
    { type: 'dmd', text: 'KICKBACK', ms: 1200 },
  )
}

function shot(
  state: ZuzuRulesState,
  id: string,
  comboEligible: boolean,
  at: number,
  effects: RuleEffect[],
) {
  state.shotsMade = {
    ...state.shotsMade,
    [id]: (state.shotsMade[id] ?? 0) + 1,
  }
  state.thisBall = { ...state.thisBall, shots: state.thisBall.shots + 1 }
  effects.push(
    { type: 'sound', name: 'shot' },
    { type: 'mechanism', id, action: 'flash' },
  )
  if (skillShot(state, id, at, effects)) return
  if (comboEligible) combo(state, at, effects)
  harvest(state, id, comboEligible, effects)
  if (id === LOCK_LIGHTER) lightLock(state, effects)
  if (STIR_SHOTS.includes(id)) stir(state, at, effects)
  if (chapterShot(state, id, at, effects)) return
  if (id === 'mortuary') return mortuary(state, at, effects)
  if (id === 'bell-lane') return bell(state, effects)
  if (id === 'croc-mouth' || id === 'relic-spinner') return
  const kind = context(id)
  if (kind === 'ramp') award(state, VALUES.ramp * state.story.round)
  if (kind === 'orbit') award(state, VALUES.orbit * state.story.round)
  effects.push({ type: 'dmd', text: label(id), ms: 1000 })
}

/** Ramp or orbit, by the table's naming. */
function context(id: string): 'ramp' | 'orbit' | null {
  if (id.endsWith('-orbit')) return 'orbit'
  if (
    id === 'village-switchback' ||
    id === 'abbey-crossover' ||
    id === 'bell-spiral'
  )
    return 'ramp'
  return null
}

/** The first shot after the plunge: the Mortuary makes the skill shot. */
function skillShot(
  state: ZuzuRulesState,
  id: string,
  at: number,
  effects: RuleEffect[],
): boolean {
  const skill = state.skill
  if (!skill.armed) return false
  state.skill = { armed: false, until: Number.NEGATIVE_INFINITY }
  if (id !== 'mortuary' || at > skill.until) return false
  const value = VALUES.skillShot * state.story.round
  award(state, value)
  effects.push(
    { type: 'sound', name: 'skill-shot' },
    { type: 'dmd', text: 'SKILL SHOT', ms: 2000, scene: 'skill-shot', value },
  )
  // The Mortuary still tells its chapter.
  mortuary(state, at, effects)
  return true
}

function combo(state: ZuzuRulesState, at: number, effects: RuleEffect[]) {
  const live = at - state.combo.at <= COMBO_STEPS
  const count = live ? state.combo.count + 1 : 0
  state.combo = { count, at }
  if (!count) return
  award(state, VALUES.combo * count)
  effects.push(
    { type: 'sound', name: 'combo' },
    { type: 'dmd', text: `${count + 1}-WAY COMBO`, ms: 1200 },
  )
}

/** The Mortuary scoop: tells the next chapter when it is lit. */
function mortuary(state: ZuzuRulesState, at: number, effects: RuleEffect[]) {
  const story = state.story
  if (!story.mortuaryLit || story.run || state.tilted) {
    award(state, VALUES.mortuary)
    effects.push({
      type: 'dmd',
      text: 'MORTUARY',
      sub: story.run ? '' : 'RING THE BELL TO OPEN',
      ms: 1200,
    })
    return
  }
  const def = CHAPTERS[story.chapter]!
  const run: ChapterRun = {
    until: at + def.seconds * PHYSICS_HZ,
    shown: def.seconds,
    rove: 0,
    movedAt: at,
    total: 0,
  }
  state.story = { ...story, run, mortuaryLit: false }
  effects.push(
    { type: 'sound', name: 'mode-start' },
    {
      type: 'dmd',
      text: def.name,
      sub: def.goal,
      ms: 2200,
      scene: 'mode-intro',
    },
    timer(state),
  )
}

/** The bell lane rings the bell: the Mortuary opens for the next chapter. */
function bell(state: ZuzuRulesState, effects: RuleEffect[]) {
  award(state, VALUES.bell * state.story.round)
  effects.push({ type: 'sound', name: 'secret-tease' })
  lightMortuary(state, effects, 'THE BELL TOLLS')
}

function lightMortuary(
  state: ZuzuRulesState,
  effects: RuleEffect[],
  why: string,
) {
  const story = state.story
  if (story.run || story.mortuaryLit) {
    effects.push({ type: 'dmd', text: why, ms: 1000 })
    return
  }
  state.story = { ...story, mortuaryLit: true }
  effects.push({ type: 'dmd', text: why, sub: 'MORTUARY IS OPEN', ms: 1600 })
}

/** A shot during a chapter: a lit one counts toward the seal. */
function chapterShot(
  state: ZuzuRulesState,
  id: string,
  at: number,
  effects: RuleEffect[],
): boolean {
  const story = state.story
  const run = story.run
  if (!run) return false
  const def = CHAPTERS[story.chapter]!
  if (!litShots(def, story.progress, run.rove).includes(id)) return false
  const value = hitValue(story.chapter, story.progress.hits, story.round)
  award(state, value)
  const progress = {
    hits: story.progress.hits + 1,
    made: [...story.progress.made, id],
  }
  const nextRun = {
    ...run,
    total: run.total + value,
    // A found child is replaced by the next at once.
    rove: def.style === 'roving' ? run.rove + 1 : run.rove,
    movedAt: def.style === 'roving' ? at : run.movedAt,
  }
  state.story = { ...story, progress, run: nextRun }
  effects.push(
    { type: 'sound', name: 'mode-shot' },
    { type: 'dmd', text: label(id), ms: 1000, scene: 'jackpot', value },
  )
  if (progress.hits >= def.need) sealChapter(state, effects)
  else effects.push(timer(state))
  return true
}

/** A chapter told to its end: one of the five seals breaks. */
function sealChapter(state: ZuzuRulesState, effects: RuleEffect[]) {
  const story = state.story
  const value = sealValue(story.chapter, story.round)
  award(state, value)
  const total = (story.run?.total ?? 0) + value
  const last = story.chapter + 1 >= CHAPTERS.length
  state.story = {
    ...story,
    chapter: last ? 0 : story.chapter + 1,
    round: last ? story.round + 1 : story.round,
    progress: { hits: 0, made: [] },
    run: null,
    sealed: story.sealed + 1,
  }
  state.thisBall = { ...state.thisBall, seals: state.thisBall.seals + 1 }
  effects.push(
    { type: 'dmd-clear', scene: 'mode-timer' },
    { type: 'sound', name: last ? 'super-jackpot' : 'mode-complete' },
    {
      type: 'dmd',
      text: last ? 'THE LAST BELL RINGS' : 'SEAL BROKEN',
      ms: 2000,
      scene: last ? 'super-jackpot' : 'jackpot',
      value,
    },
    {
      type: 'dmd',
      text: 'CHAPTER TOTAL',
      ms: 2000,
      scene: 'mode-total',
      value: total,
    },
  )
  if (last)
    effects.push({
      type: 'dmd',
      text: 'THE STORY BEGINS AGAIN',
      sub: `ROUND ${story.round + 1}`,
      ms: 2200,
      scene: 'mode-intro',
    })
}

/** The chapter's countdown on the DMD: its name, its hits and seconds left. */
function timer(state: ZuzuRulesState): RuleEffect {
  const story = state.story
  const def = CHAPTERS[story.chapter]!
  return {
    type: 'dmd',
    text: def.name,
    sub: `${story.progress.hits} OF ${def.need}`,
    ms: 0,
    scene: 'mode-timer',
    value: story.run?.shown ?? 0,
  }
}

/** Time passing: the chapter's timer and a roving chapter's lit shot. */
function tick(
  state: ZuzuRulesState,
  at: number,
): { state: ZuzuRulesState; effects: RuleEffect[] } {
  const effects: RuleEffect[] = []
  if (state.skill.armed && at > state.skill.until)
    state = { ...state, skill: { armed: false, until: at } }
  const cycle = advanceCroc(state.croc.cycle, at, effects)
  if (cycle !== state.croc.cycle)
    state = { ...state, croc: { ...state.croc, cycle } }
  const hole = advanceWateringHole(state.wateringHole, at, effects)
  if (hole !== state.wateringHole) state = { ...state, wateringHole: hole }
  const run = state.story.run
  if (!run) return { state, effects }
  const def = CHAPTERS[state.story.chapter]!
  if (at >= run.until) {
    const next = { ...state, story: { ...state.story, run: null } }
    effects.push(
      { type: 'dmd-clear', scene: 'mode-timer' },
      {
        type: 'dmd',
        text: 'CHAPTER TOTAL',
        ms: 2000,
        scene: 'mode-total',
        value: run.total,
      },
    )
    return { state: next, effects }
  }
  const shown = Math.ceil((run.until - at) / PHYSICS_HZ)
  const moves = def.style === 'roving' && at - run.movedAt >= ROVE_STEPS
  if (shown === run.shown && !moves) return { state, effects }
  const next = {
    ...state,
    story: {
      ...state.story,
      run: {
        ...run,
        shown,
        rove: moves ? run.rove + 1 : run.rove,
        movedAt: moves ? at : run.movedAt,
      },
    },
  }
  effects.push(timer(next))
  return { state: next, effects }
}

/** An Abbey seal knocked down; all four raise the multiplier. */
function seal(state: ZuzuRulesState, id: string, effects: RuleEffect[]) {
  if (state.sealsDown.includes(id)) return
  award(state, VALUES.seal)
  const down = [...state.sealsDown, id]
  state.sealsDown = down
  effects.push({ type: 'sound', name: 'drop' })
  if (down.length < SEAL_COUNT) return
  // The seals stay down, baring the relic, until the next ball: raising a
  // target under a ball in the channel would trap it for good.
  award(state, VALUES.sealsComplete * state.story.round)
  effects.push({
    type: 'dmd',
    text: 'ABBEY SEALS BROKEN',
    sub: raiseMultiplier(state),
    ms: 1600,
  })
  if (!state.kickbackLit) {
    state.kickbackLit = true
    effects.push({ type: 'dmd', text: 'KICKBACK LIT', ms: 1200 })
  }
  lightMortuary(state, effects, 'THE SEALS GIVE WAY')
}

/** One more on the bonus multiplier, to its cap; the DMD line saying so. */
function raiseMultiplier(state: ZuzuRulesState): string {
  if (state.bonusMultiplier >= MAX_MULTIPLIER) return 'BONUS MAXED'
  state.bonusMultiplier += 1
  return `BONUS X ${state.bonusMultiplier}`
}

/**
 * The captive relic ball struck: an ancient thing stirs under the Abbey. With
 * the seals broken, each strike also raises the bonus multiplier.
 */
function relic(state: ZuzuRulesState, effects: RuleEffect[]) {
  const relics = state.relics + 1
  state.relics = relics
  state.thisBall = { ...state.thisBall, relics: state.thisBall.relics + 1 }
  award(state, VALUES.relic * state.story.round)
  effects.push(
    { type: 'sound', name: 'secret-tease' },
    { type: 'mechanism', id: RELIC, action: 'flash' },
    {
      type: 'dmd',
      text: 'RELIC STRUCK',
      sub:
        relics === RELICS_FOR_CRYPT
          ? 'THE CRYPT STIRS'
          : state.sealsDown.length >= SEAL_COUNT
            ? raiseMultiplier(state)
            : `${relics} ${relics === 1 ? 'RELIC' : 'RELICS'}`,
      ms: 1400,
    },
  )
}

/** Homestead is being told: a swallow opens the Watering Hole. */
function homestead(state: ZuzuRulesState): boolean {
  const story = state.story
  return !!story.run && CHAPTERS[story.chapter]?.id === WATERING_HOLE_CHAPTER
}

/**
 * A ball in the Croc's jaws: the Watering Hole's Death Roll or spit-back
 * while it runs, his own count and extra ball always, and a swallow during
 * Homestead opens the Watering Hole.
 */
function swallow(
  state: ZuzuRulesState,
  inHomestead: boolean,
  at: number,
  effects: RuleEffect[],
) {
  const round = state.story.round
  if (state.tilted) return croc(state, effects)
  if (wateringHoleRunning(state.wateringHole)) {
    const r = wateringSwallow(state.wateringHole, round, effects)
    state.wateringHole = r.hole
    award(state, r.points)
    return croc(state, effects, true)
  }
  croc(state, effects)
  if (!inHomestead) return
  const r = openWateringHole(at, round, effects)
  state.wateringHole = r.hole
  award(state, r.points)
}

/** An orbit while the Watering Hole runs: the mouth lights for a Death Roll. */
function stir(state: ZuzuRulesState, at: number, effects: RuleEffect[]) {
  if (state.tilted || !wateringHoleRunning(state.wateringHole)) return
  const r = stirWater(state.wateringHole, at, state.story.round, effects)
  state.wateringHole = r.hole
  award(state, r.points)
}

/**
 * The River Croc swallowed a ball: he always pays, and spits it back.
 * `quiet` leaves the DMD to the Watering Hole unless the extra ball lights.
 */
function croc(state: ZuzuRulesState, effects: RuleEffect[], quiet = false) {
  const croc = state.croc
  const swallows = croc.swallows + 1
  state.thisBall = { ...state.thisBall, crocs: state.thisBall.crocs + 1 }
  award(state, VALUES.crocSpit * state.story.round)
  if (croc.extraBallLit) {
    state.croc = {
      ...croc,
      swallows,
      extraBallLit: false,
      extraBallGiven: true,
    }
    state.extraBalls += 1
    effects.push(
      { type: 'sound', name: 'extra-ball' },
      { type: 'dmd', text: 'EXTRA BALL', ms: 2500, scene: 'extra-ball' },
    )
    return
  }
  const lights = swallows >= CROC_EXTRA_BALL_AT && !croc.extraBallGiven
  state.croc = { ...croc, swallows, extraBallLit: lights }
  if (quiet && !lights) return
  effects.push({
    type: 'dmd',
    text: 'SPIT OUT',
    sub: lights ? 'EXTRA BALL IS LIT' : `RIVER CROC ${swallows}`,
    ms: 1400,
  })
}

/** The Village ramp lights the Citadel for the next lock. */
function lightLock(state: ZuzuRulesState, effects: RuleEffect[]) {
  if (state.citadel.lit || state.multiball.kind || state.tilted) return
  state.citadel = { ...state.citadel, lit: true }
  award(state, MULTIBALL_VALUES.lockLit * state.story.round)
  effects.push({
    type: 'dmd',
    text: 'LOCK IS LIT',
    sub: 'THE CITADEL',
    ms: 1400,
  })
}

/**
 * A ball dropped into the Citadel: locked when a lock is lit (the third
 * starts Harvest Moon), otherwise a small award as the saucer kicks it out.
 */
function citadel(
  state: ZuzuRulesState,
  ballId: number,
  at: number,
  effects: RuleEffect[],
) {
  const round = state.story.round
  if (!state.citadel.lit || state.multiball.kind || state.tilted) {
    award(state, VALUES.citadel * round)
    return
  }
  const r = lockBall(state.citadel, ballId, state.ballsInPlay, round, effects)
  state.citadel = r.citadel
  award(state, r.points)
  if (!r.start) return
  state.ballsInPlay += r.start.released + r.start.served
  state.multiball = startHarvest(at, effects)
}

/** A shot during a multiball: its jackpots and super jackpot. */
function harvest(
  state: ZuzuRulesState,
  id: string,
  comboEligible: boolean,
  effects: RuleEffect[],
) {
  if (state.tilted) return
  const inCombo = comboEligible && state.combo.count > 0
  const r = harvestShot(
    state.multiball,
    id,
    inCombo,
    state.story.round,
    effects,
  )
  if (!r) return
  state.multiball = r.mb
  award(state, r.points)
  state.thisBall = { ...state.thisBall, jackpots: state.thisBall.jackpots + 1 }
}

/** A ball drained: saved, another of the same ball, the next, or game over. */
function drain(
  state: ZuzuRulesState,
  at: number,
  effects: RuleEffect[],
): { state: ZuzuRulesState; effects: RuleEffect[] } {
  if (state.ballsInPlay > 1) {
    // The multiball's ball save gives a ball back at the start.
    if (
      state.multiball.kind &&
      at < state.multiball.saveUntil &&
      !state.tilted
    ) {
      effects.push(
        { type: 'add-ball', count: 1 },
        { type: 'dmd', text: 'BALL SAVED', ms: 1200 },
      )
      return { state, effects }
    }
    state.ballsInPlay -= 1
    if (state.ballsInPlay === 1)
      state.multiball = endMultiball(state.multiball, effects)
    return { state, effects }
  }
  if (at < state.ballSave.until && !state.tilted) {
    state.ballSave = { armed: false, until: Number.NEGATIVE_INFINITY }
    effects.push(
      { type: 'add-ball', count: 1 },
      { type: 'dmd', text: 'BALL SAVED', ms: 1500 },
    )
    return { state, effects }
  }
  effects.push({ type: 'sound', name: 'drain' })
  if (state.story.run) {
    state.story = { ...state.story, run: null }
    effects.push({ type: 'dmd-clear', scene: 'mode-timer' })
  }
  state.wateringHole = closeWateringHole(state.wateringHole, effects)
  if (!state.tilted) bonus(state, effects)
  let { ball, lives } = state
  const extra = state.extraBalls > 0
  if (extra) {
    state.extraBalls -= 1
  } else {
    lives -= 1
    ball += 1
    if (lives <= 0) {
      if (match(state, effects)) {
        lives = 1
      } else {
        // The Citadel lets its locked balls go back to the trough.
        if (state.citadel.locked.length)
          effects.push({ type: 'mechanism', id: CITADEL, action: 'release' })
        effects.push(
          { type: 'dmd', text: 'GAME OVER', ms: 4000, scene: 'game-over' },
          { type: 'game-over' },
        )
        return {
          state: { ...state, ballsInPlay: 0, lives: 0, over: true },
          effects,
        }
      }
    }
  }
  effects.push(
    { type: 'mechanism', id: SEAL_BANK, action: 'reset' },
    { type: 'serve-ball' },
    extra
      ? { type: 'dmd', text: 'SHOOT AGAIN', ms: 2500, scene: 'extra-ball' }
      : {
          type: 'dmd',
          text: `BALL ${ball}`,
          ms: 1500,
          scene: 'ball',
          value: ball,
        },
  )
  if (state.tilted) effects.push({ type: 'dmd-clear', scene: 'tilt' })
  return {
    state: {
      ...state,
      ball,
      lives,
      ballsInPlay: 1,
      sealsDown: [],
      // The story keeps its place; a new ball may always tell it.
      story: { ...state.story, mortuaryLit: true },
      bonusMultiplier: 1,
      kickbackLit: true,
      tiltWarnings: 0,
      tilted: false,
      lastNudgeAt: Number.NEGATIVE_INFINITY,
      skill: { armed: true, until: Number.POSITIVE_INFINITY },
      ballSave: { armed: true, until: Number.NEGATIVE_INFINITY },
      combo: { count: 0, at: Number.NEGATIVE_INFINITY },
      multiball: initialMultiball(),
      thisBall: {
        shots: 0,
        crocs: 0,
        spins: 0,
        seals: 0,
        relics: 0,
        jackpots: 0,
      },
    },
    effects,
  }
}

/** The end-of-ball bonus: this ball's counts, times the multiplier. */
function bonus(state: ZuzuRulesState, effects: RuleEffect[]) {
  const b = state.thisBall
  const items = [
    { label: 'SHOTS', value: b.shots * VALUES.bonusShot },
    { label: 'RIVER CROC', value: b.crocs * VALUES.bonusCroc },
    { label: 'RELIC', value: b.spins * VALUES.bonusSpin },
    { label: 'SEALS', value: b.seals * VALUES.bonusSeal },
    { label: 'RELICS', value: b.relics * VALUES.bonusRelic },
    { label: 'JACKPOTS', value: b.jackpots * VALUES.bonusJackpot },
  ].filter((item) => item.value > 0)
  if (!items.length) return
  const total =
    items.reduce((sum, item) => sum + item.value, 0) * state.bonusMultiplier
  award(state, total)
  effects.push({
    type: 'dmd',
    text: 'BONUS',
    ms: 0,
    scene: 'bonus',
    value: state.bonusMultiplier,
    items,
  })
}

/** The match at game over: the score's tens digit against a random one. */
function match(state: ZuzuRulesState, effects: RuleEffect[]): boolean {
  const [r, seed] = nextRandom(state.seed)
  state.seed = seed
  const digit = Math.floor(r * 10) % 10
  const won = state.score > 0 && Math.floor(state.score / 10) % 10 === digit
  if (won)
    effects.push(
      { type: 'sound', name: 'match' },
      { type: 'dmd', text: 'MATCH', ms: 3000, scene: 'match', value: digit },
    )
  return won
}

/** Light shows the change from one state to the next calls for. */
function zuzuShows(
  before: ZuzuRulesState,
  after: ZuzuRulesState,
  at: number,
): LightShow[] {
  const shows: LightShow[] = []
  for (const [shot, made] of Object.entries(after.shotsMade))
    if (made > (before.shotsMade[shot] ?? 0))
      shows.push({ id: 'shot', start: at, shot })
  if (after.bonusMultiplier > before.bonusMultiplier)
    shows.push({ id: 'multiplier', start: at })
  if (after.story.run && !before.story.run)
    shows.push({ id: 'secret', start: at })
  if (after.story.sealed > before.story.sealed)
    shows.push({ id: 'jackpot', start: at })
  if (after.multiball.kind && !before.multiball.kind)
    shows.push({ id: 'secret', start: at })
  if (
    after.multiball.supers > before.multiball.supers ||
    after.multiball.jackpots > before.multiball.jackpots
  )
    shows.push({ id: 'jackpot', start: at })
  if (after.wateringHole.rolls > before.wateringHole.rolls)
    shows.push({ id: 'jackpot', start: at })
  if (
    wateringHoleRunning(after.wateringHole) &&
    !wateringHoleRunning(before.wateringHole)
  )
    shows.push({ id: 'secret', start: at })
  if (before.kickbackLit && !after.kickbackLit && !after.tilted)
    shows.push({ id: 'kickback', start: at })
  if (after.lives < before.lives && !after.over)
    shows.push({ id: 'drain', start: at })
  if (after.ball > before.ball && !after.over)
    shows.push({ id: 'ball-start', start: at + 50 })
  return shows
}

export const ZUZU_RULESET: PinballRuleset<ZuzuRulesState> = {
  initial: initialZuzuRules,
  step: stepZuzuRules,
  lamps: zuzuLamps,
  shows: zuzuShows,
  music: (state) =>
    state.over || state.tilted
      ? null
      : state.multiball.kind
        ? 'multiball'
        : state.story.run || wateringHoleRunning(state.wateringHole)
          ? 'mode'
          : null,
  animatronics: (state, step) => {
    const hole = state.wateringHole
    return {
      [CROC_TOY]: {
        phase: state.croc.cycle.phase,
        age: Math.max(0, step - state.croc.cycle.since) / PHYSICS_HZ,
        // The waterline: astir in the Watering Hole, hungry when lit.
        cue: hole.lit
          ? 'hungry'
          : wateringHoleRunning(hole)
            ? 'watering-hole'
            : undefined,
      },
    }
  },
  skillTarget: (state) =>
    state.skill.armed && state.skill.until !== Number.NEGATIVE_INFINITY
      ? 'mortuary'
      : null,
}
