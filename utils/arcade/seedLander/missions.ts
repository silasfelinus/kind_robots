// /utils/arcade/seedLander/missions.ts
//
// Seed Lander's missions as data (conductor kr-arcade/t-069): every landing puzzle, a campaign
// island's or a Free Flight hill's, is a MissionSpec: its map, where the pod starts, its sun
// budget and par, what must be done to clear it, the cargo on the ground and the hazards in the
// air. The game runs whichever it is handed; Free Flight builds a fresh one per hill from the
// game's seeded rng, with a new hazard from the roster unlocked every 4 hills.

import { levelCurve } from '../curve'
import type { BossId } from './bosses'
import type { CrystalSpec, LanternSpec, SporeSpec } from './cavern'
import type {
  CrowSpec,
  DripSpec,
  FallSpec,
  FluffSpec,
  LaneSpec,
  PebbleSpec,
  WindmillSpec,
} from './hazards'
import type { CargoKind } from './tether'
import type { Knot, MapSpec, PadSpec } from './terrain'
import { knotAt } from './terrain'

/** The logical screen. */
export const W = 320
export const H = 240
export const HUD_H = 26

export type MissionKind =
  | 'plant'
  | 'deliver'
  | 'water'
  | 'rescue'
  | 'lantern'
  | 'rings'
  | 'boss'

/** The hazard roster (CABINETS.md section 9), in the order Free Flight unlocks them. */
export const HAZARD_LADDER = [
  'gust',
  'updraft',
  'windmill',
  'dandelion',
  'crow',
  'waterfall',
  'stalactite',
  'pebble',
  'spore',
  'bumble',
  'lightning',
  'hail',
  'rain',
  'dust',
  'meteor',
] as const
export type HazardId = (typeof HAZARD_LADDER)[number]

/** The hazards this build can field (each slice adds its islands' hazards here). */
export const BUILT_HAZARDS: ReadonlySet<HazardId> = new Set<HazardId>([
  'gust',
  'updraft',
  'windmill',
  'dandelion',
  'crow',
  'waterfall',
  'stalactite',
  'pebble',
  'spore',
])

export const HAZARD_NAMES: Record<HazardId, string> = {
  gust: 'GUSTS',
  updraft: 'UPDRAFT VENTS',
  windmill: 'WINDMILLS',
  dandelion: 'DANDELION DRIFT',
  crow: 'CROW-BOTS',
  waterfall: 'WATERFALLS',
  stalactite: 'DRIP STALACTITES',
  pebble: 'PEBBLE ROLLERS',
  spore: 'SPORE PUFFBALLS',
  bumble: 'BUMBLE BUOYS',
  lightning: 'LIGHTNING CLOUDS',
  hail: 'HAIL',
  rain: 'RAIN',
  dust: 'DUST DEVILS',
  meteor: 'METEOR DRIZZLE',
}

/** An updraft vent: a column of rising air from the ground (leaves spiral up it). */
export type VentSpec = { x: number; w: number; h: number; lift: number }

export type CargoSpec = {
  id?: string
  kind: CargoKind
  x: number
  /** Seedlings in a crate (each bump spills one). */
  seedlings?: number
  /** The drop pad it is delivered to. */
  to: string
}

/** How a mission's sky and ground are painted. */
export type ThemeId =
  | 'dawn'
  | 'noon'
  | 'dusk'
  | 'night'
  | 'downs'
  | 'gorge'
  | 'cavern'

/** A petal ring to fly through (a Ring Race). */
export type RingSpec = { x: number; y: number; r: number }
/** A golden acorn hidden on the map. */
export type AcornSpec = { id: string; x: number; y: number }

export type MissionSpec = {
  id: string
  name: string
  /** One line on the mission card. */
  brief: string
  kind: MissionKind
  map: MapSpec
  start: { x: number; y: number }
  /** Ticks of puffing in the mission's tank (before the tier's share). */
  sun: number
  /** Strongest gust (horizontal push per tick). */
  wind: number
  /** Gravity times this (an island's own physics). */
  gravity?: number
  /** Seed beds to plant to clear a plant mission. */
  seeds: number
  cargo?: readonly CargoSpec[]
  vents?: readonly VentSpec[]
  /** Under par on sun used (Thrifty) and on time (Swift). */
  par: { sun: number; ticks: number }
  theme: ThemeId
  /** Hazards newly unlocked on this hill (Free Flight shows them on its card). */
  unlocked?: readonly HazardId[]
  lanes?: readonly LaneSpec[]
  windmills?: readonly WindmillSpec[]
  fluff?: readonly FluffSpec[]
  crows?: readonly CrowSpec[]
  /** Waterfall Gorge: waterfalls, dripping stalactites and pebble rollers. */
  falls?: readonly FallSpec[]
  drips?: readonly DripSpec[]
  pebbles?: readonly PebbleSpec[]
  /** Firefly Caverns: a dark cave, crystal bumpers, spore puffballs and lanterns to relight. */
  dark?: boolean
  crystals?: readonly CrystalSpec[]
  spores?: readonly SporeSpec[]
  lanterns?: readonly LanternSpec[]
  /** A Ring Race's rings, flown in order, and its time limit. */
  rings?: readonly RingSpec[]
  time?: number
  acorns?: readonly AcornSpec[]
  /** A boss set-piece: who, standing where. */
  boss?: { id: BossId; x: number }
  /** Crates to deliver to clear a Deliver mission (all of them if omitted). */
  deliveries?: number
}

/** Free Flight's levers: they keep rising long after the old hill-8 plateau. */
export const FREE_CURVES = {
  /** How far the ground rises and falls between knots. */
  rough: { start: 22, step: 3, limit: 64 },
  /** The x1 bed's width; each multiplier up is narrower. */
  padWide: { start: 46, step: -1.5, limit: 30 },
  /** How much narrower each multiplier step is. */
  padStep: { start: 7, step: 0.25, limit: 9 },
  /** Strongest gust. */
  wind: { start: 0, step: 0.0008, limit: 0.009 },
  /** Map width in screens. */
  screens: { start: 2, step: 0.34, limit: 5 },
} as const

/** Narrowest any seed bed gets. */
export const MIN_PAD = 12

/** Every 4 hills unlocks the next built hazard of the roster. */
export function freeHazards(hill: number): HazardId[] {
  const built = HAZARD_LADDER.filter((h) => BUILT_HAZARDS.has(h))
  return built.slice(0, Math.min(built.length, 1 + Math.floor((hill - 1) / 4)))
}

/** Hazards first met on this hill (none between unlocks). */
export function newHazards(hill: number): HazardId[] {
  const now = freeHazards(hill)
  const before = hill > 1 ? freeHazards(hill - 1) : []
  return now.filter((h) => !before.includes(h))
}

/** Free Flight's time of day: every 4 hills the sky moves on, so progress shows. */
export function freeTheme(hill: number): ThemeId {
  const themes: ThemeId[] = ['dawn', 'noon', 'dusk', 'night']
  return themes[Math.floor((hill - 1) / 4) % 4]!
}

/** A bed's width for its multiplier on this hill. */
export function padWidth(hill: number, mult: number): number {
  const wide = levelCurve(hill, FREE_CURVES.padWide)
  const step = levelCurve(hill, FREE_CURVES.padStep)
  return Math.max(MIN_PAD, Math.round(wide - (mult - 1) * step))
}

/**
 * Free Flight hill `hill`: a fresh island several screens wide from the game's rng, with seed
 * beds from x1 up to x5 (the x5 tucked into a narrow valley or on a peak), sunflowers to refuel
 * at, a seed crate to tow to the shed on odd hills from 3, and the unlocked hazards.
 */
export function freeHill(hill: number, rng: () => number): MissionSpec {
  const screens = Math.floor(levelCurve(hill, FREE_CURVES.screens))
  const w = screens * W
  const h = 260
  const rough = levelCurve(hill, FREE_CURVES.rough)
  const knotStep = 32
  const knots: Array<[number, number]> = []
  let y = h - 80 - rng() * 30
  for (let x = 0; x <= w; x += knotStep) {
    knots.push([x, y])
    y += (rng() - 0.5) * rough
    y = Math.max(120, Math.min(h - 16, y))
  }
  // Slots across the map for beds, sunflowers, the crate and vents (none under the start).
  const slotW = 64
  const slots: number[] = []
  for (let x = 120; x <= w - 40; x += slotW) slots.push(x)
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[slots[i], slots[j]] = [slots[j]!, slots[i]!]
  }
  const take = () => slots.pop() ?? w / 2
  const mults = [1, 2, 3, 4, 5].slice(0, Math.min(5, 3 + Math.floor(hill / 2)))
  const pads: PadSpec[] = []
  for (const mult of mults) {
    const x = take()
    const bed = padWidth(hill, mult)
    if (mult === 5) {
      // A peak where there is sky above for one, a valley where there is ground below.
      const base = knotAt(knots, x)
      const roll = rng()
      const shape =
        base - 64 < 110
          ? 'valley'
          : base + 30 > h - 12
            ? 'peak'
            : roll < 0.5
              ? 'valley'
              : 'peak'
      carveRare(knots, x, bed, shape, h)
    }
    pads.push({ id: `bed${mult}`, x, w: bed, mult })
  }
  const suns = 1 + Math.floor(screens / 3)
  for (let i = 0; i < suns; i++)
    pads.push({ id: `sun${i}`, x: take(), w: 30, kind: 'sun' })
  const hazards = freeHazards(hill)
  const cargo: CargoSpec[] = []
  if (hill >= 3 && hill % 2 === 1) {
    const from = take()
    const to = take()
    flatten(knots, from, 24)
    pads.push({ id: 'shed', x: to, w: 36, kind: 'drop' })
    cargo.push({ kind: 'crate', x: from, seedlings: 3, to: 'shed' })
  }
  const vents = hazards.includes('updraft')
    ? Array.from(
        { length: Math.min(5, 1 + Math.floor((hill - 5) / 3)) },
        () => ({ x: take(), w: 22, h: 110 + rng() * 40, lift: 0.024 }),
      )
    : []
  const after = (first: number, every: number, most: number) =>
    Math.min(most, 1 + Math.floor((hill - first) / every))
  const windmills: WindmillSpec[] = hazards.includes('windmill')
    ? Array.from({ length: after(9, 5, 3) }, () => {
        const x = take()
        const ground = knotAt(knots, x)
        return {
          x,
          y: ground - 78 - rng() * 14,
          r: 50 + rng() * 14,
          speed: (rng() < 0.5 ? -1 : 1) * (0.015 + rng() * 0.008),
        }
      })
    : []
  const fluff: FluffSpec[] = hazards.includes('dandelion')
    ? [
        {
          x0: 0,
          x1: w,
          y0: 50,
          y1: 150,
          every: Math.max(18, 60 - (hill - 13) * 3),
          drift: (rng() < 0.5 ? -1 : 1) * 0.55,
        },
      ]
    : []
  const crows: CrowSpec[] = hazards.includes('crow')
    ? Array.from({ length: after(17, 6, 3) }, () => ({
        x: take(),
        y: 46 + rng() * 20,
      }))
    : []
  const falls: FallSpec[] = hazards.includes('waterfall')
    ? Array.from({ length: after(21, 6, 3) }, () => {
        const x = take()
        return {
          x0: x - 9,
          x1: x + 9,
          y0: 24,
          y1: knotAt(knots, x) - 2,
          push: 0.01,
        }
      })
    : []
  const drips: DripSpec[] = hazards.includes('stalactite')
    ? Array.from({ length: after(25, 4, 4) }, (_, i) => ({
        x: take(),
        y: 36,
        every: 170 + 20 * i,
        offset: 40 * i,
      }))
    : []
  const pebbles: PebbleSpec[] = hazards.includes('pebble')
    ? Array.from({ length: after(29, 6, 3) }, (_, i) => {
        const x0 = take()
        return {
          x0,
          x1: Math.min(w - 8, x0 + 160),
          every: 220,
          offset: 70 * i,
        }
      })
    : []
  const spores: SporeSpec[] = hazards.includes('spore')
    ? Array.from({ length: after(33, 4, 4) }, () => {
        const x = take()
        return { x, y: knotAt(knots, x) - 44 - rng() * 30, r: 9 }
      })
    : []
  const seeds = hill < 5 ? 2 : 3
  const sun = 700 + 190 * screens + 70 * seeds
  return {
    id: `free-${hill}`,
    name: `HILLSIDE ${hill}`,
    brief: `PLANT ${seeds} BEDS`,
    kind: 'plant',
    start: { x: 48, y: 34 },
    sun,
    wind: hazards.includes('gust') ? levelCurve(hill, FREE_CURVES.wind) : 0,
    seeds,
    cargo,
    vents,
    windmills,
    fluff,
    crows,
    falls,
    drips,
    pebbles,
    spores,
    map: {
      w,
      h,
      ground: knots,
      pads,
      ledges: windmills.map((m) => ({
        x0: m.x - 3,
        x1: m.x + 3,
        y0: m.y + 8,
        y1: knotAt(knots, m.x) + 4,
      })),
    },
    par: { sun: Math.round(sun * 0.55), ticks: 60 * (18 + 9 * screens) },
    theme: freeTheme(hill),
    unlocked: newHazards(hill),
  }
}

/** Sink the ground at x into a narrow valley, or push it up into a peak, for an x5 bed. */
function carveRare(
  knots: Array<[number, number]>,
  x: number,
  bed: number,
  shape: 'valley' | 'peak',
  h: number,
) {
  const base = knotAt(knots, x)
  // The valley floor runs a little past the bed, so a pod centred on it stands clear of the walls.
  const half = shape === 'valley' ? bed / 2 + 8 : bed / 2 + 3
  const shaped: Array<[number, number]> =
    shape === 'valley'
      ? [
          [x - 40, base],
          [x - half - 6, Math.max(110, base - 26)],
          [x - half, Math.min(h - 12, base + 30)],
          [x + half, Math.min(h - 12, base + 30)],
          [x + half + 6, Math.max(110, base - 26)],
          [x + 40, base],
        ]
      : [
          [x - 40, base],
          [x - half, Math.max(100, base - 64)],
          [x + half, Math.max(100, base - 64)],
          [x + 40, base],
        ]
  const kept = knots.filter((k) => Math.abs(k[0] - x) > 40)
  knots.length = 0
  knots.push(...kept, ...shaped)
  knots.sort((p, q) => p[0] - q[0])
}

/** Level the ground around x (for a crate to sit on). */
function flatten(knots: Array<[number, number]>, x: number, half: number) {
  const y = knotAt(knots, x)
  for (const k of knots) if (Math.abs(k[0] - x) <= half) k[1] = y
}

/** The highest ground (smallest y) between two xs, for pilots planning a route. */
export function highestBetween(
  ground: readonly Knot[] | ((x: number) => number),
  a: number,
  b: number,
): number {
  const at =
    typeof ground === 'function' ? ground : (x: number) => knotAt(ground, x)
  let top = Infinity
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  for (let x = lo; x <= hi; x += 4) top = Math.min(top, at(x))
  return top
}
