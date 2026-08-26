// utils/rulerHooked/encounter.ts
//
// Framework-free, beat-based fishing encounters for The Ruler Is Hooked.
// Canonical outcomes depend on encounter state + player actions + seeded RNG,
// never elapsed milliseconds, animation frames, device speed, or wall clock.

import type { FishAffinity, Rarity, RunSave } from '~/types/ruler-hooked'
import { cloneSave } from './applyEffects'
import { resolveFishingCatch } from './fish'
import { makeRng } from './seed'

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
}

interface FishingProfile {
  family: FishingFamily
  maxBeats: number
  progressPerReel: number
  tensionPerReel: number
  slackRecovery: number
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

/**
 * Select the same fish the compatibility takeTurn() path will later record,
 * but against a clone so beginning an encounter does not mutate the real save.
 */
export function startFishingEncounter(save: RunSave): FishingEncounter {
  const fishSeed = `${save.seed}:${save.turnCount}:fish`
  const preview = resolveFishingCatch(cloneSave(save), makeRng(fishSeed))
  const profile = profileForFish(preview.fishSlug)
  const patience = profile.family === 'PATIENCE'

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
  }
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
  const next: FishingEncounter = {
    ...encounter,
    beat: encounter.beat + 1,
  }

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

function resolveFight(encounter: FishingEncounter, action: FishingAction): FishingEncounter {
  const profile = profileForFish(encounter.fishSlug)
  const next: FishingEncounter = {
    ...encounter,
    beat: encounter.beat + 1,
  }
  const rng = makeRng(`${encounter.seed}:${next.beat}:${action}`)
  const surge = Math.floor(rng.next() * 8)
  const resistance = Math.floor(rng.next() * 5)
  const applied = effectiveAction(encounter, action)

  if (applied === 'REEL') {
    next.progress = clamp(next.progress + profile.progressPerReel - resistance)
    next.tension = clamp(next.tension + profile.tensionPerReel + surge)
  } else if (applied === 'SLACK') {
    next.progress = clamp(next.progress - 5)
    next.tension = clamp(next.tension - profile.slackRecovery)
  } else {
    next.progress = clamp(next.progress - 1)
    next.tension = clamp(next.tension - 12 + Math.floor(surge / 2))
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

export function fishingEncounterFinished(encounter: FishingEncounter): boolean {
  return encounter.phase === 'LANDED' || encounter.phase === 'ESCAPED'
}
