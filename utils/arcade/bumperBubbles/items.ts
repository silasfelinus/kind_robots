// /utils/arcade/bumperBubbles/items.ts
//
// Fizzwick Tower's hidden-condition items (conductor kr-arcade/t-060, spec: CABINETS.md section 7,
// "Bubbles, items and meta"). The classic's deep layer: none of these is ever just lying about.
// Each one is a rule, a counter the robots push up without knowing it (tiles walked, empty
// bubbles popped, hops, bubbles ridden in a row...) and the count that makes the item appear
// somewhere on the floor. Picking it up starts the counter again, so the item can come back.

import type { Ramp } from '../snes'
import { RAMPS } from '../snes'

/** What the robots are quietly counting. */
export type Stat =
  | 'walked'
  | 'emptyPops'
  | 'hops'
  | 'rideStreak'
  | 'bigPop'
  | 'zaps'
  | 'letters'
  | 'treats'
  | 'speedies'
  | 'traps'

export type ItemId =
  | 'shoes'
  | 'sugar'
  | 'chew'
  | 'umbrella'
  | 'party'
  | 'star'
  | 'lamp'
  | 'necklace'
  | 'clock'
  | 'map'

export type ItemSpec = {
  id: ItemId
  name: string
  /** The hidden condition: this counter reaching `count`. */
  stat: Stat
  count: number
  /** What it does, for the banner and the guide. */
  does: string
  /** Kept by the robot until it is lost (else it acts once, at once). */
  kept: boolean
  ramp: Ramp
}

export const ITEMS: Record<ItemId, ItemSpec> = {
  shoes: {
    id: 'shoes',
    name: 'SPEED SHOES',
    stat: 'walked',
    count: 500,
    does: 'WALK FASTER',
    kept: true,
    ramp: RAMPS.rust,
  },
  sugar: {
    id: 'sugar',
    name: 'SUGAR CUBE',
    stat: 'emptyPops',
    count: 30,
    does: 'FASTER BUBBLES',
    kept: true,
    ramp: RAMPS.cream,
  },
  chew: {
    id: 'chew',
    name: 'BUBBLE GUM',
    stat: 'hops',
    count: 25,
    does: 'BUBBLES FLY FURTHER',
    kept: true,
    ramp: RAMPS.pink,
  },
  umbrella: {
    id: 'umbrella',
    name: 'UMBRELLA',
    stat: 'rideStreak',
    count: 10,
    does: 'SKIP AHEAD',
    kept: false,
    ramp: RAMPS.purple,
  },
  party: {
    id: 'party',
    name: 'PARTY POPPER',
    stat: 'bigPop',
    count: 7,
    does: 'TREATS EVERYWHERE',
    kept: false,
    ramp: RAMPS.gold,
  },
  star: {
    id: 'star',
    name: 'LUCKY STAR',
    stat: 'zaps',
    count: 3,
    does: 'A RAIN OF ZAPS',
    kept: false,
    ramp: RAMPS.gold,
  },
  lamp: {
    id: 'lamp',
    name: 'LAMP',
    stat: 'letters',
    count: 3,
    does: 'LIGHTS DARK FLOORS',
    kept: true,
    ramp: RAMPS.ember,
  },
  necklace: {
    id: 'necklace',
    name: 'NECKLACE',
    stat: 'treats',
    count: 20,
    does: 'POINTS FOR EVERY HOP',
    kept: true,
    ramp: RAMPS.teal,
  },
  clock: {
    id: 'clock',
    name: 'CLOCK',
    stat: 'speedies',
    count: 3,
    does: 'GRUMPS FREEZE',
    kept: false,
    ramp: RAMPS.sky,
  },
  map: {
    id: 'map',
    name: 'MAP',
    stat: 'traps',
    count: 60,
    does: 'SHOWS THE NEXT PANTRY',
    kept: true,
    ramp: RAMPS.earth,
  },
}

export const ITEM_IDS = Object.keys(ITEMS) as ItemId[]

/** How hard the kept items push: shoes, sugar, gum and the necklace's pay. */
export const ITEM_POWER = {
  shoes: 1.35,
  sugar: 1.4,
  chew: 1.6,
  necklace: 100,
  clockTicks: 300,
  starBolts: 6,
} as const

/** Umbrellas skip three, five or seven floors. */
export const UMBRELLA_SKIPS = [3, 5, 7] as const

export type Stats = Record<Stat, number>

export function noStats(): Stats {
  return {
    walked: 0,
    emptyPops: 0,
    hops: 0,
    rideStreak: 0,
    bigPop: 0,
    zaps: 0,
    letters: 0,
    treats: 0,
    speedies: 0,
    traps: 0,
  }
}

/** Items whose hidden condition is met now (and isn't already waiting on the floor). */
export function earned(stats: Stats, waiting: ReadonlySet<ItemId>): ItemId[] {
  return ITEM_IDS.filter(
    (id) => !waiting.has(id) && stats[ITEMS[id].stat] >= ITEMS[id].count,
  )
}
