// /utils/arcade/bumperBubbles/wings.ts
//
// Fizzwick Tower's ten wings of ten floors (conductor kr-arcade m8, spec: CABINETS.md
// section 7, "The wings"). A wing carries its look (a theme in art.ts), its music,
// the grumps it introduces, the Fizz Tap it introduces and its floors. Wings were
// built a slice at a time; the tower is finished at floor 100 (slice 4, t-062), where the climb ends.

import { BOTTLING_HALL } from './bottlingHall'
import { GUMDROP_GARDENS } from './gumdropGardens'
import { LAGOON_CELLAR } from './lagoonCellar'
import { STARLIGHT_OBSERVATORY } from './starlightObservatory'
import { EMBER_KITCHEN } from './emberKitchen'
import { FROST_FREEZER } from './frostFreezer'
import { GEARWORKS } from './gearworks'
import { HAUNTED_PANTRY } from './hauntedPantry'
import { STORM_ROOFTOP } from './stormRooftop'
import { CARBONATOR } from './carbonator'
import type { GrumpKind } from './grumps'
import { parseFloor } from './tower'
import type { Flavour, Floor, FloorDef, SpecialKind } from './tower'

export type WingDef = {
  /** 1-based. */
  n: number
  name: string
  /** The art theme (art.ts THEMES). */
  theme: string
  /** The music loop (music.ts). */
  music: string
  /** Grumps that first appear here. */
  grumps: readonly GrumpKind[]
  /** The Fizz Tap flavour this wing introduces. */
  tap: Flavour | null
  /** What it teaches, for the wing card. */
  motto: string
  /** The special bubble it introduces. */
  special: SpecialKind | null
  floors: readonly FloorDef[]
}

export const FLOORS_PER_WING = 10

export const WINGS: readonly WingDef[] = [
  {
    n: 1,
    name: 'THE BOTTLING HALL',
    theme: 'bottling',
    music: 'bottling',
    grumps: ['waddler', 'hopper', 'dasher', 'climber'],
    tap: 'classic',
    motto: 'HOLD HOP ON A BUBBLE TO RIDE IT',
    special: null,
    floors: BOTTLING_HALL,
  },
  {
    n: 2,
    name: 'GUMDROP GARDENS',
    theme: 'gardens',
    music: 'gardens',
    grumps: ['bouncer', 'sprout'],
    tap: 'gum',
    motto: 'GUM BUBBLES STICK TO WALLS',
    special: null,
    floors: GUMDROP_GARDENS,
  },
  {
    n: 3,
    name: 'THE LAGOON CELLAR',
    theme: 'lagoon',
    music: 'lagoon',
    grumps: ['puffer', 'diver'],
    tap: null,
    motto: 'WATER CARRIES BUBBLES ALONG',
    special: 'splash',
    floors: LAGOON_CELLAR,
  },
  {
    n: 4,
    name: 'STARLIGHT OBSERVATORY',
    theme: 'observatory',
    music: 'observatory',
    grumps: ['comet', 'tick'],
    tap: 'float',
    motto: 'LOW GRAVITY: FLOATY HOPS',
    special: 'zap',
    floors: STARLIGHT_OBSERVATORY,
  },
  {
    n: 5,
    name: 'THE EMBER KITCHEN',
    theme: 'kitchen',
    music: 'kitchen',
    grumps: ['grumbler', 'toaster'],
    tap: 'fizz',
    motto: 'HOT PLATES GLOW, THEN PUFF',
    special: 'toasty',
    floors: EMBER_KITCHEN,
  },
  {
    n: 6,
    name: 'THE FROST FREEZER',
    theme: 'freezer',
    music: 'freezer',
    grumps: ['flinger', 'skater'],
    tap: 'frost',
    motto: 'ICE SLIDES. SHOVE THE BLOCKS',
    special: null,
    floors: FROST_FREEZER,
  },
  {
    n: 7,
    name: 'THE GEARWORKS',
    theme: 'gearworks',
    music: 'gearworks',
    grumps: ['cog', 'windup'],
    tap: null,
    motto: 'BELTS, LIFTS AND WIND-UP DOORS',
    special: null,
    floors: GEARWORKS,
  },
  {
    n: 8,
    name: 'THE HAUNTED PANTRY',
    theme: 'haunted',
    music: 'haunted',
    grumps: ['phantom', 'mimic'],
    tap: null,
    motto: 'DARK FLOORS: YOUR ANTENNAE GLOW',
    special: null,
    floors: HAUNTED_PANTRY,
  },
  {
    n: 9,
    name: 'THE STORM ROOFTOP',
    theme: 'storm',
    music: 'storm',
    grumps: ['thunder', 'glider'],
    tap: null,
    motto: 'WIND, RAIN AND LIGHTNING ON A FLASH',
    special: null,
    floors: STORM_ROOFTOP,
  },
  {
    n: 10,
    name: 'THE CARBONATOR',
    theme: 'carbonator',
    music: 'carbonator',
    grumps: [],
    tap: null,
    motto: 'EVERY WING, REMIXED. RESTART IT.',
    special: null,
    floors: CARBONATOR,
  },
]

/** Floors built so far (the tower grows a wing or more per slice). */
export const BUILT_FLOORS = WINGS.reduce((n, w) => n + w.floors.length, 0)

export type FloorPlan = {
  /** The tower floor (1-based, never wrapping). */
  n: number
  wing: WingDef
  /** Index into the built floors, the floor whose map is played. */
  map: number
  def: FloorDef
}

/** What is played on tower floor n. */
export function floorPlan(n: number): FloorPlan {
  const map = (Math.max(1, Math.floor(n)) - 1) % BUILT_FLOORS
  const wing = WINGS[Math.floor(map / FLOORS_PER_WING)]!
  return { n, wing, map, def: wing.floors[map % FLOORS_PER_WING]! }
}

/** The wing whose first floor is n, or null when n doesn't start a wing. */
export function wingStarting(n: number): WingDef | null {
  const plan = floorPlan(n)
  return (n - 1) % FLOORS_PER_WING === 0 ? plan.wing : null
}

const parsed = new Map<number, Floor>()
/** A built floor's parse, kept once. */
export function parsedFloor(map: number): Floor {
  let f = parsed.get(map)
  if (!f) {
    const wing = WINGS[Math.floor(map / FLOORS_PER_WING)]!
    f = parseFloor(wing.floors[map % FLOORS_PER_WING]!)
    parsed.set(map, f)
  }
  return f
}
