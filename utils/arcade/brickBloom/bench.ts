// /utils/arcade/brickBloom/bench.ts
//
// Brick Bloom's Potting Bench, golden seeds and saved tour (conductor kr-arcade/t-079, depth-pass
// CABINETS.md section 11, slice 2). Petals are earned in play (never real money): a crate cracked
// gives one, a pest more, a boss and a golden seed a handful. Between glasshouses the bench sells a
// starting seed, a wider base paddle, two bloom plots pre-grown, an extra Bumble pass and a vent
// hint that marks the rich route on the house map. One golden seed hides in a vault crate on each
// house's rich route; it is kept for good once caught. The tour saves at each glasshouse through
// utils/arcade/saves.ts, and the game checks what comes back.

import { HOUSES } from './houses'

export const PETALS = {
  crate: 1,
  pest: 3,
  boss: 40,
  golden: 15,
  /** A vault cracked again after its golden seed is already home. */
  vault: 10,
} as const

export const MAX_PETALS = 9_999

export type BenchItemId = 'seed' | 'wide' | 'plots' | 'bumble' | 'hint'

export type BenchItem = {
  id: BenchItemId
  name: string
  price: number
  /** Kept for the rest of the run (otherwise it lasts the next house). */
  lasting: boolean
  line: string
}

export const BENCH_ITEMS: readonly BenchItem[] = [
  {
    id: 'seed',
    name: 'STARTER SEED',
    price: 50,
    lasting: false,
    line: 'NEXT HOUSE: EVERY WALL STARTS WITH IT',
  },
  {
    id: 'wide',
    name: 'WIDER PADDLE',
    price: 120,
    lasting: true,
    line: 'A ROOMIER TRAY FOR THE WHOLE TOUR',
  },
  {
    id: 'plots',
    name: 'TWO BLOOMS',
    price: 40,
    lasting: false,
    line: 'TWO PLOTS BLOOM AS THE HOUSE BEGINS',
  },
  {
    id: 'bumble',
    name: 'BUMBLE PASS',
    price: 40,
    lasting: false,
    line: 'BUMBLE HELPS WITH THE LAST SIX CRATES',
  },
  {
    id: 'hint',
    name: 'VENT HINT',
    price: 30,
    lasting: false,
    line: 'THE MAP SHOWS THE RICH ROUTE AND VAULT',
  },
]

/** The seeds a starter seed may be: the timed ones (no spare paddle, no multi-ball). */
export const STARTER_SEEDS = ['W', 'S', 'C', 'R', 'T', 'Q'] as const
export type StarterSeed = (typeof STARTER_SEEDS)[number]

/** What the bench sold for the next house (the wide paddle lives on the run, not here). */
export type Kit = {
  seed: StarterSeed | null
  plots: boolean
  bumble: boolean
  hint: boolean
}

export function emptyKit(): Kit {
  return { seed: null, plots: false, bumble: false, hint: false }
}

export function owned(kit: Kit, wide: boolean, id: BenchItemId): boolean {
  if (id === 'wide') return wide
  if (id === 'seed') return kit.seed !== null
  return kit[id]
}

/**
 * Buy one bench item if it isn't owned and the petals cover it. Returns the petals left, or null
 * when the purchase can't happen (the caller says why).
 */
export function buy(
  purse: number,
  kit: Kit,
  wide: boolean,
  id: BenchItemId,
  seed: StarterSeed,
): { purse: number; kit: Kit; wide: boolean } | null {
  const item = BENCH_ITEMS.find((i) => i.id === id)
  if (!item || owned(kit, wide, id) || purse < item.price) return null
  const next = { ...kit }
  if (id === 'seed') next.seed = seed
  if (id === 'plots') next.plots = true
  if (id === 'bumble') next.bumble = true
  if (id === 'hint') next.hint = true
  return { purse: purse - item.price, kit: next, wide: wide || id === 'wide' }
}

// --- golden seeds ---------------------------------------------------------------------------

/** One vault crate per house, on a wall only the right (rich) vents reach. */
export const VAULTS: Readonly<
  Record<string, { wall: string; col: number; row: number }>
> = {
  seedling: { wall: 'seed-4b', col: 11, row: 0 },
  'vine-hall': { wall: 'vine-5b', col: 5, row: 0 },
  'cactus-dome': { wall: 'cactus-4b', col: 9, row: 0 },
  'lily-pond': { wall: 'lily-4b', col: 5, row: 0 },
  'night-bloom': { wall: 'night-4b', col: 5, row: 0 },
}

export const VAULT_HITS = 3
export const GOLDEN_TOTAL = 5

export function hasAllGoldenSeeds(golden: readonly string[]): boolean {
  return HOUSES.every((h) => golden.includes(h.id))
}

export function vaultAt(
  house: number,
  wallId: string,
): { col: number; row: number } | null {
  const id = HOUSES[house]?.id
  const v = id ? VAULTS[id] : undefined
  return v && v.wall === wallId ? { col: v.col, row: v.row } : null
}

// --- the saved tour ---------------------------------------------------------------------------

export type BloomSave = {
  v: 1
  /**
   * The glasshouse to resume at the Potting Bench before (1..houses-1); 0 before any house is
   * beaten, and the house count once the tour is done (nothing to resume, golden seeds kept).
   */
  house: number
  /** The stage number that house's first wall plays at. */
  stage: number
  score: number
  lives: number
  /** The run ended in a game over: a continue keeps the house, never the score. */
  continued: boolean
  petals: number
  wide: boolean
  kit: Kit
  /** House ids whose golden seed has been caught, kept for good. */
  golden: string[]
  champion?: boolean
  trueChampion?: boolean
  secondBloom?: boolean
  secret?: boolean
}

export const MAX_SAVED_LIVES = 99

const count = (v: unknown, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= max

export function freshSave(golden: readonly string[] = []): BloomSave {
  return {
    v: 1,
    house: 0,
    stage: 1,
    score: 0,
    lives: 3,
    continued: false,
    petals: 0,
    wide: false,
    kit: emptyKit(),
    golden: [...golden],
  }
}

/** A stored save, checked against this build; null when unusable. */
export function readBloomSave(raw: unknown): BloomSave | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  if (r.v !== 1) return null
  if (!count(r.house, HOUSES.length) || !count(r.stage, 999)) return null
  if (!count(r.score, 2_999_999) || !count(r.lives, MAX_SAVED_LIVES))
    return null
  const known = new Set(HOUSES.map((h) => h.id))
  const golden = Array.isArray(r.golden)
    ? [
        ...new Set(
          r.golden.filter(
            (g): g is string => typeof g === 'string' && known.has(g),
          ),
        ),
      ]
    : []
  if (
    r.secret === true &&
    (r.house !== HOUSES.length || !hasAllGoldenSeeds(golden))
  )
    return null
  const k =
    r.kit && typeof r.kit === 'object' && !Array.isArray(r.kit)
      ? (r.kit as Record<string, unknown>)
      : {}
  const seed = (STARTER_SEEDS as readonly unknown[]).includes(k.seed)
    ? (k.seed as StarterSeed)
    : null
  return {
    v: 1,
    house: r.house,
    stage: Math.max(1, r.stage),
    score: r.score,
    lives: Math.max(1, r.lives),
    continued: r.continued === true,
    petals: count(r.petals, MAX_PETALS) ? r.petals : 0,
    wide: r.wide === true,
    kit: {
      seed,
      plots: k.plots === true,
      bumble: k.bumble === true,
      hint: k.hint === true,
    },
    golden,
    ...(r.champion === true || (r.house === HOUSES.length && r.secret !== true)
      ? { champion: true }
      : {}),
    ...(r.trueChampion === true && hasAllGoldenSeeds(golden)
      ? { trueChampion: true, champion: true }
      : {}),
    ...(r.secondBloom === true && r.champion === true
      ? { secondBloom: true }
      : {}),
    ...(r.secret === true &&
    r.house === HOUSES.length &&
    hasAllGoldenSeeds(golden)
      ? { secret: true }
      : {}),
  }
}

/** A save worth offering to continue: a later glasshouse, not yet finished. */
export function resumable(s: BloomSave | null): s is BloomSave {
  return (
    !!s &&
    ((s.house > 0 && s.house < HOUSES.length) ||
      (s.house === HOUSES.length &&
        s.secret === true &&
        hasAllGoldenSeeds(s.golden)) ||
      (s.house === 0 && s.secondBloom === true))
  )
}
