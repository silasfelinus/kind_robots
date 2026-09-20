// utils/rulerHooked/encounter.ts
//
// Framework-free, beat-based fishing encounters for The Ruler Is Hooked.
// Canonical outcomes depend on encounter state + player actions + seeded RNG,
// never elapsed milliseconds, animation frames, device speed, or wall clock.

import type { FishAffinity, Rarity, RunSave } from '~/types/ruler-hooked'
import { cloneSave } from './applyEffects'
import { gearBonusFromFlags } from './economy'
import { RULER_HOOKED_FISH, resolveFishingCatch } from './fish'
import { makeRng } from './seed'
import { resolveTimingStop, timingProfileFor } from './timingBar'

export type FishingAction = 'REEL' | 'SLACK' | 'WAIT'
export type FishingPhase = 'APPROACH' | 'FIGHT' | 'LANDED' | 'ESCAPED'
export type FishingFamily = 'STANDARD_TENSION' | 'PATIENCE' | 'REVERSE_CONTROL'

export interface FishingBeatRecord {
  beat: number
  action: FishingAction
  phase: FishingPhase
  progress: number
  tension: number
  reversed: boolean
  cue: string
  /**
   * Present only for beats resolved through the timing-bar path
   * (applyFishingStop) -- the raw 0-100 stop position the player recorded.
   * `quality` is redundant with it (both `action` and `quality` are pure
   * functions of `stopPosition` + the beat's timing profile) but is kept
   * alongside it since the profile that produced it isn't itself part of
   * this record -- recomputing `quality` from `stopPosition` alone would
   * require re-deriving the profile, which is cheap but unnecessary to make
   * every reader of a history record do.
   */
  stopPosition?: number
  quality?: number
}

export interface FishingEncounter {
  id: string
  seed: string
  fishSlug: string
  fishName: string
  affinity: FishAffinity
  rarity: Rarity
  catchBehavior: string
  family: FishingFamily
  phase: FishingPhase
  beat: number
  maxBeats: number
  progress: number
  tension: number
  reversed: boolean
  approachMistakes: number
  cue: string
  history: FishingBeatRecord[]
  /** Owned-gear bonuses (economy.ts's gearBonusFromFlags), snapshotted from
   *  save.flags when the encounter was built and held fixed for its whole
   *  fight -- buying gear mid-fight can't retroactively change an
   *  already-hooked fish. Fed straight into timingProfileFor. */
  gearBandBonus: number
  gearSweepMsBonus: number
}

interface FishingProfile {
  family: FishingFamily
  maxBeats: number
  progressPerReel: number
  tensionPerReel: number
  slackRecovery: number
}

interface EncounterFish {
  fishSlug: string
  name: string
  affinity: FishAffinity
  rarity: Rarity
  catchBehavior: string
}

const STANDARD_PROFILE: FishingProfile = {
  family: 'STANDARD_TENSION',
  maxBeats: 8,
  progressPerReel: 30,
  tensionPerReel: 22,
  slackRecovery: 28,
}

const PROFILES: Record<string, FishingProfile> = {
  'sunspoke-koi': {
    family: 'PATIENCE',
    maxBeats: 9,
    progressPerReel: 29,
    tensionPerReel: 20,
    slackRecovery: 26,
  },
  'moebius-crab': {
    family: 'REVERSE_CONTROL',
    maxBeats: 9,
    progressPerReel: 31,
    tensionPerReel: 21,
    slackRecovery: 27,
  },
}

export function profileForFish(fishSlug: string): FishingProfile {
  return PROFILES[fishSlug] ?? STANDARD_PROFILE
}

function buildEncounter(save: RunSave, preview: EncounterFish): FishingEncounter {
  const profile = profileForFish(preview.fishSlug)
  const patience = profile.family === 'PATIENCE'
  const gearBonus = gearBonusFromFlags(save.flags)

  return {
    id: `${save.saveId}:${save.turnCount}:${preview.fishSlug}`,
    seed: `${save.seed}:${save.turnCount}:fight:${preview.fishSlug}`,
    fishSlug: preview.fishSlug,
    fishName: preview.name,
    affinity: preview.affinity,
    rarity: preview.rarity,
    catchBehavior: preview.catchBehavior,
    family: profile.family,
    phase: patience ? 'APPROACH' : 'FIGHT',
    beat: 0,
    maxBeats: profile.maxBeats,
    progress: 0,
    tension: patience ? 0 : 30,
    reversed: false,
    approachMistakes: 0,
    cue: patience
      ? `${preview.name} circles the lure without committing. Stop pulling and watch it.`
      : `${preview.name} takes the hook. Build progress without letting line tension spike.`,
    history: [],
    gearBandBonus: gearBonus.bandWidthBonus,
    gearSweepMsBonus: gearBonus.sweepMsBonus,
  }
}

/**
 * Select the same fish the compatibility takeTurn() path will later record,
 * but against a clone so beginning an encounter does not mutate the real save.
 */
export function startFishingEncounter(save: RunSave): FishingEncounter {
  const fishSeed = `${save.seed}:${save.turnCount}:fish`
  const preview = resolveFishingCatch(cloneSave(save), makeRng(fishSeed))
  return buildEncounter(save, preview)
}

/** Deterministic direct constructor for reducer tests and authored previews. */
export function startFishingEncounterForFish(save: RunSave, fishSlug: string): FishingEncounter {
  const fish = RULER_HOOKED_FISH.find((candidate) => candidate.slug === fishSlug)
  if (!fish) throw new Error(`Unknown Ruler Hooked fish: ${fishSlug}`)
  return buildEncounter(save, {
    fishSlug: fish.slug,
    name: fish.name,
    affinity: fish.affinity,
    rarity: fish.rarity,
    catchBehavior: fish.catchBehavior,
  })
}

const clamp = (value: number, min = 0, max = 100): number =>
  Math.max(min, Math.min(max, value))

function recordBeat(encounter: FishingEncounter, action: FishingAction): FishingEncounter {
  return {
    ...encounter,
    history: [
      ...encounter.history,
      {
        beat: encounter.beat,
        action,
        phase: encounter.phase,
        progress: encounter.progress,
        tension: encounter.tension,
        reversed: encounter.reversed,
        cue: encounter.cue,
      },
    ],
  }
}

function resolveApproach(encounter: FishingEncounter, action: FishingAction): FishingEncounter {
  const next: FishingEncounter = { ...encounter, beat: encounter.beat + 1 }

  if (action === 'WAIT') {
    next.phase = 'FIGHT'
    next.progress = 8
    next.tension = 24
    next.cue = `${next.fishName} finally turns inward. The fins flare: now the hook is real.`
    return recordBeat(next, action)
  }

  next.approachMistakes += 1
  next.tension = clamp(next.tension + (action === 'REEL' ? 16 : 6))
  next.cue = action === 'REEL'
    ? `${next.fishName} widens its circle. Pulling now only convinces it that you are impatient.`
    : `${next.fishName} keeps circling. Giving line is not the same thing as waiting.`

  if (next.approachMistakes >= 3) {
    next.phase = 'ESCAPED'
    next.cue = `${next.fishName} loses interest and glides away. The lake has judged your patience.`
  }
  return recordBeat(next, action)
}

function effectiveAction(encounter: FishingEncounter, action: FishingAction): FishingAction {
  if (!encounter.reversed) return action
  if (action === 'REEL') return 'SLACK'
  if (action === 'SLACK') return 'REEL'
  return action
}

/**
 * `quality` (0..1, default 1) scales how well the beat's action landed --
 * fed in from the timing-bar minigame (applyFishingStop below). At the
 * default of 1 every formula here reduces exactly to the original
 * fixed-magnitude math, so `applyFishingAction`'s own callers (including
 * every pre-existing self-test) see byte-identical behavior.
 */
function resolveFight(encounter: FishingEncounter, action: FishingAction, quality = 1): FishingEncounter {
  const profile = profileForFish(encounter.fishSlug)
  const next: FishingEncounter = { ...encounter, beat: encounter.beat + 1 }
  const rng = makeRng(`${encounter.seed}:${next.beat}:${action}`)
  const surge = Math.floor(rng.next() * 8)
  const resistance = Math.floor(rng.next() * 5)
  const applied = effectiveAction(encounter, action)
  const q = Math.max(0, Math.min(1, quality))

  if (applied === 'REEL') {
    // quality=1: progressPerReel - resistance, tensionPerReel + surge -- identical to the original fixed formula.
    next.progress = clamp(next.progress + Math.round(profile.progressPerReel * q) - resistance)
    next.tension = clamp(next.tension + Math.round(profile.tensionPerReel * (2 - q)) + surge)
  } else if (applied === 'SLACK') {
    // quality=1: -5 progress, -slackRecovery tension -- identical to the original fixed formula.
    next.progress = clamp(next.progress - Math.round(5 * (2 - q)))
    next.tension = clamp(next.tension - Math.round(profile.slackRecovery * q))
  } else {
    // Original WAIT formula recovers `12 - floor(surge/2)` tension (9..12); quality scales that recovery.
    const waitRecovery = 12 - Math.floor(surge / 2)
    next.progress = clamp(next.progress - Math.round(1 * (2 - q)))
    next.tension = clamp(next.tension - Math.round(waitRecovery * q))
  }

  if (next.tension >= 100) {
    next.phase = 'ESCAPED'
    next.cue = `The line snaps tight and ${next.fishName} tears free.`
    return recordBeat(next, action)
  }

  if (next.progress >= 100) {
    next.phase = 'LANDED'
    next.cue = `${next.fishName} breaks the surface. Landed.`
    return recordBeat(next, action)
  }

  if (next.beat >= next.maxBeats) {
    next.phase = 'ESCAPED'
    next.cue = `${next.fishName} finds one last reserve of energy and slips the hook.`
    return recordBeat(next, action)
  }

  if (next.family === 'REVERSE_CONTROL' && !next.reversed && next.beat >= 2) {
    next.reversed = true
    next.cue = 'The Moebius shell turns through itself. Controls are reversed: REEL now gives line; SLACK gains line.'
    return recordBeat(next, action)
  }

  if (next.reversed) {
    next.cue = next.tension > 78
      ? 'Inside-out line, high tension. Remember: REEL gives line while the loop is reversed.'
      : 'The loop is still reversed. SLACK pulls the crab closer; REEL releases tension.'
  } else if (next.tension > 80) {
    next.cue = 'The line is singing. Give it slack before the next hard pull.'
  } else if (next.tension < 20) {
    next.cue = 'The line has gone soft. Reel carefully to recover progress.'
  } else {
    next.cue = 'Tension is workable. Choose whether to gain ground or prepare for the next surge.'
  }

  return recordBeat(next, action)
}

/** Pure reducer: same encounter state + action always produces the same next state. */
export function applyFishingAction(
  encounter: FishingEncounter,
  action: FishingAction,
): FishingEncounter {
  if (encounter.phase === 'LANDED' || encounter.phase === 'ESCAPED') return encounter
  if (encounter.phase === 'APPROACH') return resolveApproach(encounter, action)
  return resolveFight(encounter, action)
}

/**
 * Pure reducer for the sliding-marker timing bar: a recorded stop position
 * (0-100) is resolved against the beat's timing profile (band position/width
 * -- itself a pure function of family/rarity/beat, see timingBar.ts) into an
 * action + quality, which then drive the same underlying resolveApproach /
 * resolveFight logic `applyFishingAction` uses. Same encounter state + same
 * stop position always produces the same next state, which is what makes
 * "record the stop positions as the input sequence" (Silas) a real replay
 * guarantee: the profile that maps a position to an action/quality is
 * derived only from encounter state, never RNG or wall-clock, so replaying
 * the same seed against the same recorded stops reproduces the same fight.
 */
export function applyFishingStop(encounter: FishingEncounter, stopPosition: number): FishingEncounter {
  if (encounter.phase === 'LANDED' || encounter.phase === 'ESCAPED') return encounter

  const profile = timingProfileFor(encounter)
  const { action, quality } = resolveTimingStop(stopPosition, profile)
  const resolved = encounter.phase === 'APPROACH'
    ? resolveApproach(encounter, action)
    : resolveFight(encounter, action, quality)

  const history = resolved.history.slice()
  const lastBeat = history[history.length - 1]
  if (lastBeat) {
    history[history.length - 1] = {
      ...lastBeat,
      stopPosition: Math.max(0, Math.min(100, stopPosition)),
      quality,
    }
  }
  return { ...resolved, history }
}

export function fishingEncounterFinished(encounter: FishingEncounter): boolean {
  return encounter.phase === 'LANDED' || encounter.phase === 'ESCAPED'
}
