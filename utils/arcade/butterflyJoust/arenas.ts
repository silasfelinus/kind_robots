// /utils/arcade/butterflyJoust/arenas.ts
//
// The Four Gardens Tourney's arenas as data (conductor kr-arcade/t-048): each garden's ledges
// (original layouts, with moving, folding and crumbling ledges), its thermals, wind and dandelion
// puffs, its pond, its six waves and its champion. The arena engine in the game reads these; a new
// garden is a new entry here, not a branch in the update loop.

import { POND_Y, W } from './field'
import type { RiderKind } from './roster'
import type { WaveKind } from './rules'

export type ArenaId = 'sunset' | 'meadow'
export type ChampionId = 'bumbleton' | 'duchess'
/** How a garden is painted: its sky, hills and pond (scenery.ts). */
export type ArenaStyle = 'sunset' | 'meadow'
/** How a ledge is painted (and, for a flower, that it folds). */
export type LedgeLook = 'candy' | 'turf' | 'flower' | 'leaf' | 'pad' | 'puff'

export type LedgeSpec = {
  x0: number
  x1: number
  y: number
  look?: LedgeLook
  /** Crumbles in from both ends as the arena's waves go on. */
  crumbles?: boolean
  /** Sways about its spot: amplitude in x and y, and the period in ticks. */
  move?: { ax: number; ay: number; period: number; phase?: number }
  /** A flower: open this long, then the petals fold shut this long (a tell before it folds). */
  fold?: { open: number; shut: number; phase: number }
}

/** A sun-patch thermal: a column that lifts fliers, lit and dimmed as clouds pass. */
export type Thermal = {
  x: number
  w: number
  /** Where the lift gives out. */
  top: number
  /** Upward push a tick (gravity is 0.1). */
  lift: number
  /** Lit this long, then shaded this long (0 shade: always on). */
  on: number
  off: number
  phase: number
}

/** Dandelion puffs drifting up from the meadow: one-use stepping clouds. */
export type PuffSpec = { every: number; rise: number; width: number }

/** Gusts: every so often the wind blows one way for a while (a tell first). */
export type WindSpec = {
  every: number
  length: number
  push: number
  tell: number
}

export type WaveSpec = { kind: WaveKind; riders: RiderKind[] }

export type Arena = {
  id: ArenaId
  number: number
  name: string
  /** The card's line as the arena opens. */
  intro: string
  style: ArenaStyle
  ledges: LedgeSpec[]
  /** The ledge riders start on (never one that folds or moves). */
  home: number
  spawns: { x: number; y: number }[]
  thermals: Thermal[]
  puffs?: PuffSpec
  wind?: WindSpec
  /** The first wave the frog surfaces on. */
  frogFrom: number
  /** Carriers fetch hatching cocoons. */
  carriers: boolean
  /** Pixels the crumbling ledge loses each wave from the third. */
  crumbleStep: number
  /** Six waves; the third is the signature wave. */
  waves: WaveSpec[]
  champion: ChampionId
}

export type ChampionInfo = { name: string; rule: string; points: number }

export const CHAMPIONS: Record<ChampionId, ChampionInfo> = {
  bumbleton: {
    name: 'SIR BUMBLETON',
    rule: 'HE WINS LEVEL. GET ABOVE!',
    points: 5000,
  },
  duchess: {
    name: 'DANDELION DUCHESS',
    rule: 'POP THE SEEDS BEFORE THEY LAND',
    points: 6000,
  },
}

/** Sunset Pond: today's arena, retuned. */
const SUNSET: Arena = {
  id: 'sunset',
  number: 1,
  name: 'SUNSET POND',
  intro: 'THE TOURNEY OPENS AT DUSK',
  style: 'sunset',
  ledges: [
    { x0: 70, x1: 378, y: 304, crumbles: true },
    { x0: -20, x1: 92, y: 226 },
    { x0: 356, x1: W + 20, y: 226 },
    { x0: 168, x1: 280, y: 196 },
    { x0: 34, x1: 138, y: 126 },
    { x0: 310, x1: 414, y: 126 },
    { x0: 186, x1: 262, y: 74 },
  ],
  home: 0,
  spawns: [
    { x: 224, y: 196 },
    { x: 86, y: 126 },
    { x: 362, y: 126 },
    { x: 40, y: 226 },
    { x: 408, y: 226 },
  ],
  thermals: [],
  frogFrom: 2,
  carriers: false,
  crumbleStep: 12,
  waves: [
    { kind: 'joust', riders: ['drifter', 'drifter', 'drifter'] },
    { kind: 'joust', riders: ['drifter', 'drifter', 'hunter', 'hunter'] },
    {
      kind: 'survival',
      riders: ['drifter', 'hunter', 'hunter', 'shadow'],
    },
    { kind: 'cocoon', riders: [] },
    {
      kind: 'gladiator',
      riders: ['drifter', 'hunter', 'hunter', 'shadow', 'shadow'],
    },
    {
      kind: 'storm',
      riders: ['hunter', 'hunter', 'hunter', 'shadow', 'shadow'],
    },
  ],
  champion: 'bumbleton',
}

/** Spring Meadow: flower ledges that fold, sun-patch thermals and rising dandelion puffs. */
const MEADOW: Arena = {
  id: 'meadow',
  number: 2,
  name: 'SPRING MEADOW',
  intro: 'MIND THE FLOWERS: THEY FOLD',
  style: 'meadow',
  ledges: [
    { x0: 116, x1: 332, y: 300, look: 'turf' },
    { x0: 14, x1: 104, y: 238, look: 'turf' },
    { x0: 344, x1: 434, y: 238, look: 'turf' },
    {
      x0: 186,
      x1: 262,
      y: 200,
      look: 'flower',
      fold: { open: 420, shut: 170, phase: 0 },
    },
    {
      x0: 64,
      x1: 150,
      y: 150,
      look: 'flower',
      fold: { open: 420, shut: 170, phase: 200 },
    },
    {
      x0: 298,
      x1: 384,
      y: 150,
      look: 'flower',
      fold: { open: 420, shut: 170, phase: 400 },
    },
    {
      x0: 196,
      x1: 252,
      y: 88,
      look: 'leaf',
      move: { ax: 70, ay: 6, period: 720 },
    },
  ],
  home: 0,
  spawns: [
    { x: 224, y: 200 },
    { x: 59, y: 238 },
    { x: 389, y: 238 },
    { x: 107, y: 150 },
    { x: 341, y: 150 },
  ],
  thermals: [
    { x: 160, w: 34, top: 96, lift: 0.17, on: 600, off: 200, phase: 0 },
    { x: 288, w: 34, top: 96, lift: 0.17, on: 600, off: 200, phase: 400 },
  ],
  puffs: { every: 210, rise: 0.4, width: 40 },
  frogFrom: 1,
  carriers: false,
  crumbleStep: 0,
  waves: [
    { kind: 'joust', riders: ['drifter', 'drifter', 'glider', 'glider'] },
    { kind: 'joust', riders: ['drifter', 'hunter', 'twin', 'glider'] },
    {
      kind: 'gladiator',
      riders: ['hunter', 'twin', 'twin', 'glider', 'shadow'],
    },
    {
      kind: 'survival',
      riders: ['bomber', 'hunter', 'twin', 'glider', 'glider'],
    },
    { kind: 'cocoon', riders: ['glider', 'glider'] },
    {
      kind: 'joust',
      riders: ['bomber', 'bomber', 'twin', 'shadow', 'hunter', 'glider'],
    },
  ],
  champion: 'duchess',
}

/** The tourney's gardens in order. */
export const ARENAS: readonly Arena[] = [SUNSET, MEADOW]

/** Waves in an arena before its champion. */
export const WAVES_PER_ARENA = 6

/** Sunset Pond: the Classic Pond and the versus arena keep it. */
export const CLASSIC_ARENA = SUNSET

/** The arena at a campaign index (laps round once every garden is cleared). */
export function arenaAt(index: number): { arena: Arena; lap: number } {
  const n = ARENAS.length
  const i = Math.max(0, Math.floor(index))
  return { arena: ARENAS[i % n]!, lap: Math.floor(i / n) }
}

/**
 * How hard a wave is: two steps an arena and one a wave, so the curves keep climbing through the
 * tourney; each lap round the gardens adds six.
 */
export function arenaHeat(arenaIndex: number, wave: number): number {
  const { arena, lap } = arenaAt(arenaIndex)
  return (arena.number - 1) * 2 + Math.max(1, wave) + lap * 6
}

/** The crumbling ledge's loss on a wave (0 before the third). */
export function crumbleAt(arena: Arena, wave: number): number {
  return Math.max(0, wave - 2) * arena.crumbleStep
}

/** Whether a flower is open at tick t, and how close it is to folding (1: about to). */
export function flowerState(
  fold: NonNullable<LedgeSpec['fold']>,
  t: number,
): { open: boolean; closing: number } {
  const cycle = fold.open + fold.shut
  const at = (((t + fold.phase) % cycle) + cycle) % cycle
  if (at >= fold.open) return { open: false, closing: 0 }
  const tell = 70
  return {
    open: true,
    closing: at > fold.open - tell ? (at - (fold.open - tell)) / tell : 0,
  }
}

/** Whether a thermal is lit at tick t. */
export function thermalOn(th: Thermal, t: number): boolean {
  if (th.off <= 0) return true
  const cycle = th.on + th.off
  return (((t + th.phase) % cycle) + cycle) % cycle < th.on
}

/** Puffs are born just over the pond. */
export const PUFF_START = POND_Y - 12
/** A dandelion puff bursts this long after a rider first lands on it. */
export const PUFF_STAND = 100
