// /utils/arcade/butterflyJoust/arenas.ts
//
// The Four Gardens Tourney's arenas as data (conductor kr-arcade/t-048): each garden's ledges
// (original layouts, with moving, folding, crumbling, icy and moonlit ledges), its thermals, wind,
// rain, lightning, apples, leaf piles, lanterns and dandelion puffs, its floor (a pond, a stream,
// open sky, a frozen pond or a mirror pool), its waves and its champion. The arena engine in the
// game reads these; a new garden is a new entry here, not a branch in the update loop.

import { POND_Y, W } from './field'
import type { RiderKind } from './roster'
import type { WaveKind } from './rules'

export type ArenaId =
  'sunset' | 'meadow' | 'heights' | 'orchard' | 'snowfield' | 'moon' | 'rainbow'
export type ChampionId =
  'bumbleton' | 'duchess' | 'thunderhead' | 'kite' | 'queen' | 'mirror'
/** How a garden is painted: its sky, hills and floor (scenery.ts). */
export type ArenaStyle = ArenaId
/** How a ledge is painted (and, for some, how it behaves: an icy ledge slides). */
export type LedgeLook =
  | 'candy'
  | 'turf'
  | 'flower'
  | 'leaf'
  | 'pad'
  | 'puff'
  | 'cloud'
  | 'branch'
  | 'autumn'
  | 'ice'
  | 'snow'
  | 'floe'
  | 'lantern'
  | 'marble'
/** What lies below: a pond (the frog), a stream (its cousin), open sky, a frozen pond, a mirror pool. */
export type Floor = 'pond' | 'stream' | 'sky' | 'ice' | 'mirror'

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
  /** Moonlit: there only while the moon is out of the clouds. */
  moonlit?: boolean
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
  /** A rainbow updraft: it dries rain-soaked wings too. */
  rainbow?: boolean
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

/** Rain showers that soak wings (heavier, more flaps), after a tell. */
export type RainSpec = { every: number; length: number; tell: number }
/** Lightning: a ledge flashes for `tell`, then the bolt strikes it. */
export type LightningSpec = { every: number; tell: number }
/** Apples drop from the branches now and then. */
export type AppleSpec = { every: number }
/** Paper lanterns float up as moving ledges, then fade. */
export type LanternSpec = {
  every: number
  rise: number
  life: number
  width: number
}
/** The moon slips in and out of the clouds: out this long, hidden this long. */
export type MoonSpec = { out: number; hidden: number; tell: number }

export type WaveSpec = {
  kind: WaveKind
  riders: RiderKind[]
  /** Shown in place of the wave number (the Gauntlet's steps). */
  label?: string
}

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
  rain?: RainSpec
  lightning?: LightningSpec
  apples?: AppleSpec
  lanterns?: LanternSpec
  moon?: MoonSpec
  /** Ledges with a leaf pile on them (a cocoon laid there hides in the leaves). */
  piles?: number[]
  floor: Floor
  /** The first wave the frog (or its cousin) surfaces on. */
  frogFrom: number
  /** Carriers fetch hatching cocoons. */
  carriers: boolean
  /** Pixels the crumbling ledge loses each wave from the third. */
  crumbleStep: number
  /** The waves; the third is the signature wave, where the golden petal is won. */
  waves: WaveSpec[]
  /** Its champion (the Rainbow Lists has none: its last wave is the true ending). */
  champion: ChampionId | null
  /** Its golden petal, for clearing the signature wave without losing a butterfly. */
  petal: boolean
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
  thunderhead: {
    name: 'OLD THUNDERHEAD',
    rule: 'ONLY HIS OPEN EYE, LEVEL',
    points: 7000,
  },
  kite: {
    name: 'THE SCARECROW KITE',
    rule: 'BONK ITS RIDERS, CUT THE STRINGS',
    points: 8000,
  },
  queen: {
    name: 'THE FROST MOTH QUEEN',
    rule: 'RIDE THE LANTERNS UP TO HER',
    points: 9000,
  },
  mirror: {
    name: 'THE MIRROR MOTH',
    rule: 'IT FLIES AS YOU FLY',
    points: 12000,
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
  floor: 'pond',
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
  petal: true,
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
  floor: 'pond',
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
  petal: true,
}

/** Thunderhead Heights: no ground at all, only drifting clouds, with rain and lightning. */
const HEIGHTS: Arena = {
  id: 'heights',
  number: 3,
  name: 'THUNDERHEAD HEIGHTS',
  intro: 'NO GROUND UP HERE: MIND THE BOLTS',
  style: 'heights',
  ledges: [
    { x0: 120, x1: 328, y: 292, look: 'cloud' },
    {
      x0: 20,
      x1: 112,
      y: 234,
      look: 'cloud',
      move: { ax: 36, ay: 4, period: 900 },
    },
    {
      x0: 336,
      x1: 428,
      y: 234,
      look: 'cloud',
      move: { ax: 36, ay: 4, period: 900, phase: 450 },
    },
    {
      x0: 180,
      x1: 268,
      y: 182,
      look: 'cloud',
      move: { ax: 56, ay: 5, period: 1100 },
    },
    {
      x0: 40,
      x1: 128,
      y: 126,
      look: 'cloud',
      move: { ax: 44, ay: 4, period: 1000, phase: 300 },
    },
    {
      x0: 320,
      x1: 408,
      y: 126,
      look: 'cloud',
      move: { ax: 44, ay: 4, period: 1000, phase: 700 },
    },
    {
      x0: 192,
      x1: 256,
      y: 72,
      look: 'cloud',
      move: { ax: 80, ay: 3, period: 1300 },
    },
  ],
  home: 0,
  spawns: [
    { x: 224, y: 182 },
    { x: 84, y: 126 },
    { x: 364, y: 126 },
    { x: 66, y: 234 },
    { x: 382, y: 234 },
  ],
  thermals: [
    {
      x: 224,
      w: 30,
      top: 56,
      lift: 0.2,
      on: 420,
      off: 360,
      phase: 0,
      rainbow: true,
    },
  ],
  rain: { every: 540, length: 480, tell: 80 },
  lightning: { every: 260, tell: 70 },
  floor: 'sky',
  frogFrom: 99,
  carriers: false,
  crumbleStep: 0,
  waves: [
    { kind: 'joust', riders: ['drifter', 'hunter', 'diver'] },
    { kind: 'joust', riders: ['hunter', 'diver', 'lancer', 'drifter'] },
    { kind: 'storm', riders: ['lancer', 'diver', 'hunter', 'hunter'] },
    {
      kind: 'survival',
      riders: ['diver', 'diver', 'lancer', 'shadow', 'glider'],
    },
    { kind: 'cocoon', riders: ['diver'] },
    {
      kind: 'gladiator',
      riders: ['lancer', 'lancer', 'diver', 'shadow', 'hunter', 'twin'],
    },
  ],
  champion: 'thunderhead',
  petal: true,
}

/** Autumn Orchard: swaying branches, gusts with a weather vane, falling apples and leaf piles. */
const ORCHARD: Arena = {
  id: 'orchard',
  number: 4,
  name: 'AUTUMN ORCHARD',
  intro: 'WATCH THE VANE: A GUST IS COMING',
  style: 'orchard',
  ledges: [
    { x0: 100, x1: 348, y: 300, look: 'autumn' },
    {
      x0: 8,
      x1: 118,
      y: 232,
      look: 'branch',
      move: { ax: 7, ay: 2, period: 260 },
    },
    {
      x0: 330,
      x1: 440,
      y: 232,
      look: 'branch',
      move: { ax: 7, ay: 2, period: 260, phase: 130 },
    },
    {
      x0: 172,
      x1: 276,
      y: 186,
      look: 'branch',
      move: { ax: 9, ay: 3, period: 300 },
    },
    {
      x0: 38,
      x1: 148,
      y: 130,
      look: 'branch',
      move: { ax: 8, ay: 2, period: 280, phase: 90 },
    },
    {
      x0: 300,
      x1: 410,
      y: 130,
      look: 'branch',
      move: { ax: 8, ay: 2, period: 280, phase: 200 },
    },
    {
      x0: 184,
      x1: 264,
      y: 76,
      look: 'branch',
      move: { ax: 10, ay: 2, period: 320, phase: 40 },
    },
  ],
  home: 0,
  spawns: [
    { x: 224, y: 186 },
    { x: 93, y: 130 },
    { x: 355, y: 130 },
    { x: 63, y: 232 },
    { x: 385, y: 232 },
  ],
  thermals: [],
  wind: { every: 420, length: 200, push: 2.4, tell: 80 },
  apples: { every: 140 },
  piles: [1, 2, 4, 5],
  floor: 'stream',
  frogFrom: 2,
  carriers: true,
  crumbleStep: 0,
  waves: [
    { kind: 'joust', riders: ['drifter', 'beetle', 'hunter'] },
    { kind: 'joust', riders: ['beetle', 'hunter', 'hunter', 'drifter'] },
    { kind: 'cocoon', riders: [] },
    {
      kind: 'gladiator',
      riders: ['beetle', 'beetle', 'shadow', 'hunter', 'diver'],
    },
    {
      kind: 'survival',
      riders: ['lancer', 'beetle', 'bomber', 'hunter', 'twin'],
    },
    {
      kind: 'storm',
      riders: ['beetle', 'shadow', 'shadow', 'lancer', 'hunter'],
    },
  ],
  champion: 'kite',
  petal: true,
}

/** Lantern Snowfield: a night festival of icy ledges, rising lanterns and a frozen pond. */
const SNOWFIELD: Arena = {
  id: 'snowfield',
  number: 5,
  name: 'LANTERN SNOWFIELD',
  intro: 'ICE SLIDES, AND THE POND CRACKS',
  style: 'snowfield',
  ledges: [
    { x0: 130, x1: 318, y: 284, look: 'snow' },
    { x0: 10, x1: 108, y: 226, look: 'ice' },
    { x0: 340, x1: 438, y: 226, look: 'ice' },
    { x0: 178, x1: 270, y: 176, look: 'ice' },
    { x0: 44, x1: 140, y: 122, look: 'ice' },
    { x0: 308, x1: 404, y: 122, look: 'ice' },
    { x0: 196, x1: 252, y: 70, look: 'snow' },
  ],
  home: 0,
  spawns: [
    { x: 224, y: 176 },
    { x: 92, y: 122 },
    { x: 356, y: 122 },
    { x: 59, y: 226 },
    { x: 389, y: 226 },
  ],
  thermals: [],
  lanterns: { every: 170, rise: 0.32, life: 60 * 15, width: 26 },
  floor: 'ice',
  frogFrom: 99,
  carriers: true,
  crumbleStep: 0,
  waves: [
    { kind: 'joust', riders: ['drifter', 'frost', 'hunter'] },
    { kind: 'joust', riders: ['frost', 'frost', 'hunter', 'beetle'] },
    { kind: 'team', riders: ['frost', 'hunter', 'hunter', 'lancer'] },
    {
      kind: 'survival',
      riders: ['frost', 'diver', 'shadow', 'glider', 'hunter'],
    },
    { kind: 'cocoon', riders: ['frost'] },
    {
      kind: 'gladiator',
      riders: ['frost', 'frost', 'lancer', 'shadow', 'beetle', 'bomber'],
    },
  ],
  champion: 'queen',
  petal: true,
}

const EVERYONE: RiderKind[] = [
  'drifter',
  'hunter',
  'shadow',
  'glider',
  'twin',
  'bomber',
  'diver',
  'lancer',
  'beetle',
  'frost',
]

/** The Moon Garden: moonlit ledges that come and go, a mirror pool, and the Gauntlet. */
const MOON: Arena = {
  id: 'moon',
  number: 6,
  name: 'THE MOON GARDEN',
  intro: 'THE FINAL: RUN THE GAUNTLET',
  style: 'moon',
  ledges: [
    { x0: 136, x1: 312, y: 292, look: 'marble' },
    { x0: 16, x1: 108, y: 232, look: 'marble' },
    { x0: 340, x1: 432, y: 232, look: 'marble' },
    { x0: 176, x1: 272, y: 180, look: 'marble', moonlit: true },
    { x0: 48, x1: 140, y: 128, look: 'marble', moonlit: true },
    { x0: 308, x1: 400, y: 128, look: 'marble', moonlit: true },
    { x0: 190, x1: 258, y: 74, look: 'marble', moonlit: true },
  ],
  home: 0,
  spawns: [
    { x: 224, y: 180 },
    { x: 94, y: 128 },
    { x: 354, y: 128 },
    { x: 62, y: 232 },
    { x: 386, y: 232 },
  ],
  thermals: [],
  moon: { out: 540, hidden: 240, tell: 90 },
  floor: 'mirror',
  frogFrom: 99,
  carriers: true,
  crumbleStep: 0,
  waves: [
    { kind: 'joust', riders: ['drifter', 'hunter', 'glider', 'diver'] },
    { kind: 'joust', riders: ['twin', 'lancer', 'beetle', 'frost', 'bomber'] },
    {
      kind: 'survival',
      riders: ['hunter', 'shadow', 'diver', 'lancer'],
      label: 'GAUNTLET 1/5',
    },
    {
      kind: 'gladiator',
      riders: ['beetle', 'twin', 'shadow', 'frost', 'glider'],
      label: 'GAUNTLET 2/5',
    },
    { kind: 'cocoon', riders: ['bomber'], label: 'GAUNTLET 3/5' },
    {
      kind: 'storm',
      riders: ['lancer', 'diver', 'hunter', 'shadow'],
      label: 'GAUNTLET 4/5',
    },
    {
      kind: 'team',
      riders: ['frost', 'beetle', 'twin', 'lancer', 'diver'],
      label: 'GAUNTLET 5/5',
    },
  ],
  champion: 'mirror',
  petal: false,
}

/** The Rainbow Lists: the secret arena behind the five golden petals, every rider at full speed. */
export const RAINBOW_LISTS: Arena = {
  id: 'rainbow',
  number: 7,
  name: 'THE RAINBOW LISTS',
  intro: 'FIVE PETALS: THE SECRET LISTS',
  style: 'rainbow',
  ledges: SUNSET.ledges.map((l) => ({ ...l, crumbles: false })),
  home: 0,
  spawns: SUNSET.spawns,
  thermals: [],
  floor: 'mirror',
  frogFrom: 99,
  carriers: true,
  crumbleStep: 0,
  waves: [
    { kind: 'joust', riders: EVERYONE.slice(0, 6) },
    { kind: 'joust', riders: EVERYONE.slice(4) },
    { kind: 'survival', riders: [...EVERYONE] },
  ],
  champion: null,
  petal: false,
}

/** The tourney's gardens in order: five arenas, then the Moon Garden final. */
export const ARENAS: readonly Arena[] = [
  SUNSET,
  MEADOW,
  HEIGHTS,
  ORCHARD,
  SNOWFIELD,
  MOON,
]

/** Waves in a garden before its champion (the Moon Garden's Gauntlet adds a seventh). */
export const WAVES_PER_ARENA = 6

/** The gardens with a golden petal (the Rainbow Lists needs every one). */
export const PETAL_ARENAS: readonly ArenaId[] = ARENAS.filter(
  (a) => a.petal,
).map((a) => a.id)

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

/** Whether the moon is out (moonlit ledges are there), and how close it is to hiding (1: about to). */
export function moonState(
  moon: MoonSpec,
  t: number,
): { out: boolean; fading: number } {
  const cycle = moon.out + moon.hidden
  const at = ((t % cycle) + cycle) % cycle
  if (at >= moon.out) return { out: false, fading: 0 }
  return {
    out: true,
    fading:
      at > moon.out - moon.tell ? (at - (moon.out - moon.tell)) / moon.tell : 0,
  }
}

/** Every garden's signature wave is its third. */
export const SIGNATURE_WAVE = 3
