// /utils/arcade/seedBurst/shed.ts
//
// The Potting Shed (conductor kr-arcade/t-137, depth-pass CABINETS.md section 24): it opens between
// seasons, and the gardeners spend the seeds they earned in play (never real money) on an extra
// spare, a starting variety for everyone's pouch, or a golden-seed hint for the season ahead.
// Prices rise each season. Pure rules; the cabinet draws the shed and keeps the seeds.

import { VARIETIES } from './pouch'
import type { Variety } from './pouch'

export type ShedItem = 'spare' | 'variety' | 'hint' | 'leave'

export const SHED_ITEMS: readonly ShedItem[] = [
  'spare',
  'variety',
  'hint',
  'leave',
]

export const SHED_NAMES: Record<ShedItem, string> = {
  spare: 'EXTRA SPARE',
  variety: 'SEED PACKET',
  hint: 'GOLDEN HINT',
  leave: 'BACK TO THE GARDEN',
}

const BASE_PRICE: Record<ShedItem, number> = {
  spare: 12,
  variety: 10,
  hint: 6,
  leave: 0,
}

/** The most spares the shed will sell up to. */
export const SHED_SPARE_CAP = 9

/** What an item costs before the season numbered `season` (0 = the first Spring). */
export function shedPrice(item: ShedItem, season: number): number {
  return Math.round(BASE_PRICE[item] * (1 + 0.5 * Math.max(0, season - 1)))
}

/** The next variety the shed sells, given the pouch everyone shares, or null when all are in. */
export function nextVariety(pouch: readonly Variety[]): Variety | null {
  return VARIETIES.find((v) => !pouch.includes(v)) ?? null
}

/** Why an item can't be bought right now, or null when it can. */
export function shedBlock(
  item: ShedItem,
  state: {
    seeds: number
    spares: number
    pouch: readonly Variety[]
    hint: boolean
  },
  season: number,
): string | null {
  if (item === 'leave') return null
  if (state.seeds < shedPrice(item, season)) return 'NOT ENOUGH SEEDS'
  if (item === 'spare' && state.spares >= SHED_SPARE_CAP) return 'SPARES FULL'
  if (item === 'variety' && !nextVariety(state.pouch)) return 'POUCH FULL'
  if (item === 'hint' && state.hint) return 'HINT BOUGHT'
  return null
}
