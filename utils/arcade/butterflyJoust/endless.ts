// /utils/arcade/butterflyJoust/endless.ts
//
// The Endless Pond (conductor kr-arcade/t-050, the Four Gardens Tourney's slice 4): the
// leaderboard event. One garden for the whole run, with its own ledges and weather, and endless
// waves in which every rider of the tourney turns up in time. Waves climb on the same curves as
// the Classic Pond, each announced with its bonus rule, and a party faces one more rider per extra
// seat. No champions, no Wing Garden, no pollen: just how far, and how many points.
//
// Which garden is drawn with the game's seeded rng (the garden is gameplay), so a replay of the
// same seed plays the same pond.

import { ARENAS, type Arena } from './arenas'
import type { RiderKind } from './roster'
import type { WaveKind } from './rules'

/** Every rider, the wave it first turns up on, and how often it is picked once it has. */
export const ENDLESS_POOL: ReadonlyArray<{
  kind: RiderKind
  from: number
  weight: number
}> = [
  { kind: 'drifter', from: 1, weight: 3 },
  { kind: 'hunter', from: 1, weight: 4 },
  { kind: 'glider', from: 2, weight: 2 },
  { kind: 'shadow', from: 3, weight: 3 },
  { kind: 'twin', from: 4, weight: 2 },
  { kind: 'beetle', from: 5, weight: 2 },
  { kind: 'bomber', from: 6, weight: 1 },
  { kind: 'diver', from: 7, weight: 2 },
  { kind: 'lancer', from: 8, weight: 2 },
  { kind: 'frost', from: 9, weight: 1 },
]

/** The drifters thin out as the pond heats up: their weight falls by one every this many waves. */
export const DRIFTER_FADE = 6

/** The pond's announced waves, twelve to a lap: each bonus rule in turn, the Lantern wave too. */
export const ENDLESS_CYCLE: readonly WaveKind[] = [
  'joust',
  'survival',
  'joust',
  'gladiator',
  'cocoon',
  'storm',
  'joust',
  'lantern',
  'team',
  'gladiator',
  'survival',
  'storm',
]

export function endlessWaveKind(wave: number, seats: number): WaveKind {
  const kind = ENDLESS_CYCLE[(Math.max(1, wave) - 1) % ENDLESS_CYCLE.length]!
  return kind === 'team' && seats < 2 ? 'survival' : kind
}

/** One rider for this wave, from a roll in [0, 1). */
export function endlessRider(wave: number, roll: number): RiderKind {
  const open = ENDLESS_POOL.filter((p) => wave >= p.from).map((p) => ({
    kind: p.kind,
    weight:
      p.kind === 'drifter'
        ? Math.max(0, p.weight - Math.floor((wave - 1) / DRIFTER_FADE))
        : p.weight,
  }))
  const total = open.reduce((sum, p) => sum + p.weight, 0)
  let at = roll * total
  for (const p of open) {
    at -= p.weight
    if (at < 0) return p.kind
  }
  return open[open.length - 1]!.kind
}

/** The pond's riders on a wave: two to start, one more each wave, eight at most. */
export function endlessCount(wave: number): number {
  return Math.min(8, 1 + Math.max(1, wave))
}

/** The difficulty step the curves read on a pond wave (it starts warm: these are veterans). */
export function endlessHeat(wave: number): number {
  return wave + 2
}

/** The gardens the pond can be: any of the tourney's six. */
export function endlessArena(roll: number): Arena {
  return ARENAS[Math.min(ARENAS.length - 1, Math.floor(roll * ARENAS.length))]!
}
