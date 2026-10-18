// Save the Plumber's Endless run: an unending chain of runner zones built from
// the same runner-safe chunks as the campaign legs (jump, duck and wrench are
// all she needs). Each zone wears one world's look and obstacles, cycling
// Bluebell Pipeworks to the Stardrain Citadel and round again, and each one is
// harder (and the run faster) than the last. Zones join on flat ground, so the
// engine can swap one for the next without breaking her stride.
import { PLUMBER_WORLDS } from './savePlumberWorlds'
import type { StageDef } from './savePlumberLevels'

const H = 24
/** The ground surface row. */
const G = 21
/** Flat columns that open and close every zone: the handover strip. */
export const ENDLESS_PAD = 16

type Rng = () => number

/** Each world's walker foes and the chunks its zones draw from. */
const WALKERS: Record<number, string> = {
  1: 'pr',
  2: 'k',
  3: 'lh',
  4: 'jr',
  5: 'n',
  6: 'i',
  7: 'T',
  8: 'jpr',
}
const FEATURES: Record<number, string[]> = {
  1: [
    'hop',
    'gap',
    'beam',
    'foe',
    'glider',
    'crates',
    'vent',
    'stairs',
    'valve',
    'step',
  ],
  2: [
    'hop',
    'pool',
    'beam',
    'foe',
    'glider',
    'raftpool',
    'stairs',
    'crates',
    'step',
  ],
  3: [
    'hop',
    'gap',
    'beam',
    'foe',
    'glider',
    'lantern',
    'stairs',
    'hare',
    'step',
  ],
  4: ['hop', 'gap', 'beam', 'foe', 'glider', 'belt', 'crates', 'valve', 'step'],
  5: ['hop', 'gap', 'beam', 'foe', 'glider', 'wind', 'stairs', 'step'],
  6: [
    'hop',
    'bridge',
    'beam',
    'foe',
    'glider',
    'stairs',
    'crates',
    'valve',
    'step',
  ],
  7: ['hop', 'roofs', 'beam', 'foe', 'glider', 'spirit', 'stairs', 'step'],
  8: [
    'hop',
    'pool',
    'gap',
    'beam',
    'foe',
    'glider',
    'belt',
    'crates',
    'valve',
    'vent',
    'wind',
    'step',
  ],
}
/** A power on the running line: hearts every other zone, else a bubble. */
const POWERS = ['1', '2', '3']

/** A small seeded generator (mulberry32), so a zone is the same every time. */
export function zoneRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

class Zone {
  readonly g: string[][]
  constructor(readonly w: number) {
    this.g = Array.from({ length: H }, () => Array<string>(w).fill('.'))
  }
  put(x: number, y: number, ch: string) {
    this.g[y]![x] = ch
  }
  row(x0: number, x1: number, y: number, ch: string) {
    for (let x = x0; x <= x1; x++) this.put(x, y, ch)
  }
  col(x: number, y0: number, y1: number, ch: string) {
    for (let y = y0; y <= y1; y++) this.put(x, y, ch)
  }
  ground(x0: number, x1: number, top = G) {
    for (let y = top; y < H; y++) this.row(x0, x1, y, '#')
  }
  water(x0: number, x1: number) {
    this.row(x0, x1, G + 1, 'w')
    this.row(x0, x1, G + 2, 'w')
  }
}

const pick = <T>(rng: Rng, items: readonly T[]): T =>
  items[Math.floor(rng() * items.length)]!

/** Each chunk draws at x and returns its width; d is difficulty, 0 to 1. */
type Chunk = (s: Zone, x: number, world: number, d: number, rng: Rng) => number

const CHUNKS: Record<string, Chunk> = {
  hop(s, x, _w, d, rng) {
    s.ground(x, x + 8)
    const h = d < 0.4 || rng() < 0.5 ? 1 : 2
    for (let k = 0; k < h; k++) s.put(x + 5, G - 1 - k, 'B')
    if (h === 2 && d > 0.6)
      for (let k = 0; k < h; k++) s.put(x + 6, G - 1 - k, 'B')
    s.put(x + 5, G - h - 3, 'o')
    return 9
  },
  gap(s, x, _w, d, rng) {
    const gap = 3 + (d > 0.35 ? 1 : 0) + (d > 0.75 && rng() < 0.5 ? 1 : 0)
    s.ground(x, x + 3)
    s.ground(x + 4 + gap, x + gap + 7)
    s.row(x + 4, x + 3 + gap, G - 4, 'o')
    return gap + 8
  },
  bridge(s, x) {
    s.ground(x, x + 3)
    s.row(x + 4, x + 7, G, ':')
    s.ground(x + 8, x + 11)
    s.row(x + 4, x + 7, G - 4, 'o')
    return 12
  },
  pool(s, x, _w, d, rng) {
    const gap = 3 + (d > 0.4 ? 1 : 0)
    s.ground(x, x + 3)
    s.water(x + 4, x + 3 + gap)
    s.ground(x + 4 + gap, x + gap + 7)
    if (rng() < 0.5) s.put(x + 4 + Math.floor(gap / 2), G + 2, 'm')
    return gap + 8
  },
  raftpool(s, x) {
    s.ground(x, x + 2)
    s.water(x + 3, x + 12)
    s.put(x + 8, G, 'F')
    s.ground(x + 13, x + 15)
    s.row(x + 7, x + 9, G - 3, 'o')
    return 16
  },
  beam(s, x, _w, d) {
    const length = 3 + (d > 0.5 ? 2 : 0)
    s.ground(x, x + length + 7)
    for (let k = 0; k < length; k++) s.col(x + 4 + k, G - 6, G - 2, 'B')
    if (length <= 3) s.row(x + 4, x + 3 + length, G - 1, 'o')
    return length + 8
  },
  foe(s, x, w, d, rng) {
    const kinds = WALKERS[w]!.split('')
    s.ground(x, x + 11)
    s.put(x + 8, G - 1, pick(rng, kinds))
    if (d <= 0.6) return 12
    // Far enough apart that the wrench is ready again at top pace.
    s.put(x + 15, G - 1, pick(rng, kinds))
    s.ground(x + 12, x + 18)
    return 19
  },
  glider(s, x) {
    s.ground(x, x + 13)
    s.put(x + 12, G - 1, '!')
    return 14
  },
  crates(s, x, _w, d) {
    s.ground(x, x + 9)
    s.put(x + 6, G - 1, 'c')
    if (d > 0.3) s.put(x + 6, G - 2, 'c')
    return 10
  },
  vent(s, x) {
    s.ground(x, x + 9)
    s.put(x + 6, G - 1, '^')
    return 10
  },
  stairs(s, x, _w, d) {
    s.ground(x, x + 13)
    const heights = d > 0.5 ? [1, 2, 2, 3, 3, 2, 1] : [1, 2, 2, 1]
    heights.forEach((h, k) => {
      for (let r = 0; r < h; r++) s.put(x + 4 + k, G - 1 - r, 'B')
    })
    return 14
  },
  step(s, x) {
    s.ground(x, x + 3)
    s.ground(x + 4, x + 11, G - 2)
    s.ground(x + 12, x + 15)
    s.row(x + 6, x + 9, G - 5, 'o')
    return 16
  },
  valve(s, x) {
    // A long run-up: a jump that lands late (at top pace) still meets the lever.
    s.ground(x, x + 19)
    s.put(x + 10, G - 1, 'v')
    s.col(x + 17, 1, G - 1, 'g')
    return 20
  },
  lantern(s, x) {
    s.ground(x, x + 11)
    s.put(x + 8, G - 1, 'l')
    return 12
  },
  hare(s, x) {
    s.ground(x, x + 11)
    s.put(x + 8, G - 1, 'h')
    return 12
  },
  belt(s, x, _w, _d, rng) {
    s.ground(x, x + 13)
    s.row(x + 2, x + 11, G, rng() < 0.5 ? '<' : '>')
    return 14
  },
  wind(s, x) {
    s.ground(x, x + 4)
    s.ground(x + 8, x + 12)
    s.row(x, x + 12, 0, '~')
    return 13
  },
  roofs(s, x, _w, d, rng) {
    const up = (rng() < 0.5 ? -1 : 1) * (d < 0.5 ? 1 : 2)
    s.ground(x, x + 4)
    s.ground(x + 8, x + 12, up > 0 ? G - up : G + 1)
    return 13
  },
  spirit(s, x) {
    s.ground(x, x + 13)
    s.put(x + 10, G - 1, 't')
    return 14
  },
}

/** The world a zone wears: Bluebell Pipeworks first, round all eight again. */
export function zoneWorld(zone: number): number {
  return (zone % PLUMBER_WORLDS.length) + 1
}

/** How hard a zone is, 0 to 1: full strength from the second lap. */
export function zoneDifficulty(zone: number): number {
  return Math.min(1, zone / 10)
}

/**
 * One Endless zone: a flat handover strip, a seeded run of its world's chunks
 * with breathers between them (and one power on the running line), then the
 * closing strip that hands her to the next zone.
 */
export function buildEndlessZone(seed: number, zone: number): StageDef {
  const world = zoneWorld(zone)
  const d = zoneDifficulty(zone)
  const rng = zoneRng(seed * 977 + zone * 7919 + 13)
  const pool = FEATURES[world]!
  const plan: string[] = []
  // Past the first lap the pace outruns a bobbing raft, so pools stay open water.
  const chunks = d < 0.5 ? pool : pool.filter((c) => c !== 'raftpool')
  for (let k = 0; k < 12 + Math.min(6, zone); k++) {
    let choice = pick(rng, chunks)
    while (choice === plan.at(-1)) choice = pick(rng, chunks)
    plan.push(choice)
  }
  const s = new Zone(ENDLESS_PAD * 2 + plan.length * 22 + 12)
  s.ground(0, ENDLESS_PAD - 1)
  s.put(2, G - 1, '@')
  s.put(ENDLESS_PAD - 5, G - 1, zone % 2 ? pick(rng, POWERS) : '+')
  let x = ENDLESS_PAD
  for (const name of plan) {
    x += CHUNKS[name]!(s, x, world, d, rng)
    s.ground(x, x + 2)
    x += 3
  }
  s.ground(x, x + ENDLESS_PAD - 1)
  x += ENDLESS_PAD
  const place = PLUMBER_WORLDS[world - 1]!.name
  return {
    code: `${world}-E`,
    name: `Endless · ${place}`,
    rows: s.g.map((r) => r.slice(0, x).join('')),
  }
}
