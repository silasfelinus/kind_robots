// /utils/arcade/butterflyJoust/campaign.ts
//
// The tourney's long-run state (conductor kr-arcade/t-048): pollen, the Wing Garden's wares, and
// the save kept at each arena's start (utils/arcade/saves.ts). Pollen is earned in play and spent
// in the garden; it is never bought with money.

import type { WingSet } from './art'

/** Pollen earned in play. */
export const POLLEN_FOR = {
  bonk: 1,
  scoop: 0,
  carrier: 1,
  /** Per multiplier step of a banked combo past x1. */
  combo: 1,
  wave: 1,
  champion: 10,
} as const

export type Upgrades = { flap: number; combo: number; frog: number }

export type ShopItemId =
  | 'go'
  | 'spare'
  | 'flap'
  | 'combo'
  | 'frog'
  | 'morpho'
  | 'monarch'
  | 'swallowtail'

export type ShopItem = {
  id: ShopItemId
  name: string
  about: string
  /** Price of the first one; later ones of a repeatable item cost `step` more each. */
  price: number
  step: number
  /** How many can be owned (spares: any number). */
  max: number
}

/** The Wing Garden's wares, in the order the card lists them ('go' flies on to the arena). */
export const SHOP: readonly ShopItem[] = [
  {
    id: 'go',
    name: 'FLY ON',
    about: 'TO THE NEXT GARDEN',
    price: 0,
    step: 0,
    max: 0,
  },
  {
    id: 'spare',
    name: 'SPARE BUTTERFLY',
    about: 'ONE MORE LIFE',
    price: 40,
    step: 20,
    max: 99,
  },
  {
    id: 'flap',
    name: 'STRONGER FLAP',
    about: 'A LITTLE MORE LIFT',
    price: 60,
    step: 40,
    max: 2,
  },
  {
    id: 'combo',
    name: 'LONGER COMBO',
    about: 'TWO MORE SECONDS',
    price: 45,
    step: 30,
    max: 2,
  },
  {
    id: 'frog',
    name: 'FIRMER ESCAPE',
    about: 'TWO FEWER FLAPS',
    price: 35,
    step: 25,
    max: 2,
  },
  {
    id: 'morpho',
    name: 'MORPHO WINGS',
    about: 'A BLUE SHIMMER',
    price: 30,
    step: 0,
    max: 1,
  },
  {
    id: 'monarch',
    name: 'MONARCH WINGS',
    about: 'ORANGE AND GOLD',
    price: 30,
    step: 0,
    max: 1,
  },
  {
    id: 'swallowtail',
    name: 'SWALLOWTAIL WINGS',
    about: 'CREAM AND GREEN',
    price: 30,
    step: 0,
    max: 1,
  },
]

/** Each flap upgrade adds this much lift (the base flap feel is unchanged without it). */
export const FLAP_BOOST = 0.07
/** Each combo upgrade adds this many ticks to the window. */
export const COMBO_BOOST = 120
/** Each escape upgrade takes this many flaps off the frog's grip. */
export const FROG_BOOST = 2

export const WING_ITEMS: readonly WingSet[] = [
  'morpho',
  'monarch',
  'swallowtail',
]

/** What one more of `item` costs when `owned` are already had. */
export function shopPrice(item: ShopItem, owned: number): number {
  return item.price + item.step * owned
}

/** A tourney save: where the run picks up (an arena's start) and what it carries. */
export type JoustSave = {
  v: 1
  /** The campaign index of the arena to start (laps past the last garden). */
  arena: number
  score: number
  lives: number
  pollen: number
  up: Upgrades
  /** Spares bought so far (their price climbs). */
  spares: number
  wings: WingSet[]
  wear: WingSet
  /** Seats at the save: a save is offered only to the same party size. */
  seats: number
  /** A game over left it: the run picks up with a fresh score and lives. */
  continued: boolean
  /** How far the tourney has ever got (arenas opened). */
  reached: number
}

const WINGS: readonly WingSet[] = [
  'rainbow',
  'morpho',
  'monarch',
  'swallowtail',
]
const int = (v: unknown, lo: number, hi: number): number | null =>
  typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi ? v : null

/** A stored save, validated (untrusted: anything odd and it is ignored). */
export function readJoustSave(raw: unknown): JoustSave | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const s = raw as Record<string, unknown>
  if (s.v !== 1) return null
  const arena = int(s.arena, 0, 99)
  const score = int(s.score, 0, 250_000_000)
  const lives = int(s.lives, 1, 99)
  const pollen = int(s.pollen, 0, 99_999)
  const spares = int(s.spares, 0, 999)
  const seats = int(s.seats, 1, 4)
  const reached = int(s.reached, 1, 99)
  const up = s.up as Record<string, unknown> | undefined
  const flap = int(up?.flap, 0, 2)
  const combo = int(up?.combo, 0, 2)
  const frog = int(up?.frog, 0, 2)
  if (
    arena === null ||
    score === null ||
    lives === null ||
    pollen === null ||
    spares === null ||
    seats === null ||
    reached === null ||
    flap === null ||
    combo === null ||
    frog === null
  )
    return null
  if (!Array.isArray(s.wings) || typeof s.continued !== 'boolean') return null
  const wings = s.wings.filter((w): w is WingSet =>
    WINGS.includes(w as WingSet),
  )
  const wear = WINGS.includes(s.wear as WingSet)
    ? (s.wear as WingSet)
    : 'rainbow'
  return {
    v: 1,
    arena,
    score,
    lives,
    pollen,
    up: { flap, combo, frog },
    spares,
    wings: [...new Set(wings)],
    wear: wear === 'rainbow' || wings.includes(wear) ? wear : 'rainbow',
    seats,
    continued: s.continued,
    reached: Math.max(reached, arena + 1),
  }
}
