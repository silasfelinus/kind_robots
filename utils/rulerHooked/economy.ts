// utils/rulerHooked/economy.ts
//
// Fishing rewards, gear, and a kingdom shop (ruler-hooked/t-029). Silas,
// 2026-09-11: "no shop to purchase upgrades to fishing or to upgrade the
// kingdom, no ability to catch treasures when fishing that might be spent
// at said shop on gear or the kingdom."
//
// Follows the house pattern (Cthulhuquarium's data/economy.yaml +
// simulate_economy.py): tunable constants in one place, read by game code
// rather than duplicated. Framework-free, deterministic, and — like every
// other mutation in this engine — spent only through the existing closed
// Effect grammar (applyEffects.ts): counters for coins, flags for owned
// gear, sliders for kingdom investment. No parallel currency or save shape
// is introduced; `counters.coins` and `flags['gear:<id>']` are the only new
// save fields, and both already existed as concepts (see fish.ts's
// `counters.fishCaught` and content.ts's `counters: { treasuresFound: +1 }`).

import type { AxisKey, Rarity } from '~/types/ruler-hooked'
import type { RngStream } from './seed'

// --- treasure -----------------------------------------------------------

/** One rarity tier's treasure odds: `chance` to find anything at all on a
 *  landed catch, and the coin range if it hits. Rarer fish are both more
 *  likely to carry treasure and worth more when they do, so a rare pull
 *  feels different from a common one (the task's own framing). */
export interface TreasureRoll {
  chance: number
  min: number
  max: number
}

export const TREASURE_BY_RARITY: Record<Rarity, TreasureRoll> = {
  COMMON: { chance: 0.12, min: 2, max: 6 },
  UNCOMMON: { chance: 0.18, min: 4, max: 10 },
  RARE: { chance: 0.25, min: 8, max: 18 },
  EPIC: { chance: 0.35, min: 15, max: 30 },
  LEGENDARY: { chance: 0.45, min: 25, max: 50 },
  MYTHIC: { chance: 0.6, min: 40, max: 80 },
}

/**
 * Roll for treasure on a landed catch. Consumes exactly one or two draws
 * from `rng` (one to decide whether anything was found, a second only when
 * it was) -- call this AFTER every other roll a catch needs, so it never
 * shifts the fish/size/quality draws an existing seed already depends on.
 * Deterministic: same rarity + same rng state -> same result.
 */
export function rollTreasure(rarity: Rarity, rng: RngStream): number {
  const table = TREASURE_BY_RARITY[rarity]
  if (rng.next() >= table.chance) return 0
  const span = table.max - table.min
  return table.min + Math.round(rng.next() * span)
}

// --- gear -----------------------------------------------------------------

/**
 * Gear is a one-time coin purchase that permanently widens the REEL band
 * and/or slows the sweep for every future encounter (t-026's timing bar,
 * timingBar.ts) -- ownership is a save flag, not a consumable. Kept to the
 * two knobs the task explicitly named ("visibly alter t-026's timing
 * minigame: band width, marker speed"); a third effect (a genuine second
 * chance/extra life) would touch the fight state machine itself and is
 * deliberately left to a follow-up rather than folded in here speculatively.
 */
export interface GearItem {
  id: string
  name: string
  description: string
  cost: number
  /** save.flags key set to true once purchased -- ownership is permanent. */
  flagKey: string
  /** Added to the REEL band width (0-100 scale) for every future encounter. */
  bandWidthBonus: number
  /** Added to the one-way sweep duration in ms (higher = slower = easier). */
  sweepMsBonus: number
}

export const GEAR_CATALOG: GearItem[] = [
  {
    id: 'reinforced-rod',
    name: 'Reinforced Rod',
    description:
      'A stiffer rod steadies the marker, slowing its sweep just enough to read.',
    cost: 40,
    flagKey: 'gear:reinforcedRod',
    bandWidthBonus: 0,
    sweepMsBonus: 250,
  },
  {
    id: 'silk-line',
    name: 'Silk Line',
    description: 'Less drag on the line widens the margin for a clean strike.',
    cost: 90,
    flagKey: 'gear:silkLine',
    bandWidthBonus: 6,
    sweepMsBonus: 0,
  },
  {
    id: 'balanced-lure',
    name: 'Balanced Lure',
    description:
      'A well-weighted lure steadies every fight from the very first beat.',
    cost: 160,
    flagKey: 'gear:balancedLure',
    bandWidthBonus: 4,
    sweepMsBonus: 150,
  },
]

export interface GearBonus {
  bandWidthBonus: number
  sweepMsBonus: number
}

/** Sum every owned gear item's bonuses from a save's flags. Pure. */
export function gearBonusFromFlags(flags: Record<string, boolean>): GearBonus {
  let bandWidthBonus = 0
  let sweepMsBonus = 0
  for (const item of GEAR_CATALOG) {
    if (flags[item.flagKey]) {
      bandWidthBonus += item.bandWidthBonus
      sweepMsBonus += item.sweepMsBonus
    }
  }
  return { bandWidthBonus, sweepMsBonus }
}

export function ownsGear(
  flags: Record<string, boolean>,
  itemId: string,
): boolean {
  const item = GEAR_CATALOG.find((g) => g.id === itemId)
  return !!item && !!flags[item.flagKey]
}

// --- kingdom investment -----------------------------------------------------

/**
 * Kingdom items spend coins to move the SAME kingdomHealth sliders the PoC
 * already recomposites the landscape from (Silas: "Wire it to the existing
 * kingdom-health model rather than a parallel currency") -- there is no
 * separate kingdom-XP meter, only Effect.sliders deltas via the existing
 * applyEffects.ts reducer, same as any narrative card.
 */
export interface KingdomItem {
  id: string
  name: string
  description: string
  cost: number
  sliders: Partial<Record<AxisKey, number>>
}

export const KINGDOM_CATALOG: KingdomItem[] = [
  {
    id: 'riverbank-market',
    name: 'Riverbank Market',
    description:
      'Stalls along the bank turn passing coin into a real market day.',
    cost: 60,
    sliders: { prosperity: 6 },
  },
  {
    id: 'lakeside-shrine',
    name: 'Lakeside Shrine',
    description:
      'A small shrine gives the shoreline something worth protecting.',
    cost: 80,
    sliders: { nature: 5, joy: 3 },
  },
  {
    id: 'festival-fund',
    name: 'Festival Fund',
    description: 'Pays for lanterns, music, and a reason to celebrate.',
    cost: 70,
    sliders: { joy: 8 },
  },
  {
    id: 'watch-patrol',
    name: 'Watch Patrol',
    description: 'A steadier patrol keeps the roads, and the ledgers, orderly.',
    cost: 75,
    sliders: { order: 7 },
  },
]
