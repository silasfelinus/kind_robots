// /utils/arcade/bumperBubbles/wings.ts
//
// Fizzwick Tower's ten wings of ten floors (conductor kr-arcade m8, spec: CABINETS.md
// section 7, "The wings"). A wing carries its look (a theme in art.ts), its music,
// the grumps it introduces, the Fizz Tap it introduces and its floors. Wings are
// built a slice at a time; until the tower is finished, the climb goes on past the
// last built floor by replaying the built floors at the higher floor's pace.

import { BOTTLING_HALL } from './bottlingHall'
import { GUMDROP_GARDENS } from './gumdropGardens'
import type { GrumpKind } from './grumps'
import { parseFloor } from './tower'
import type { Flavour, Floor, FloorDef } from './tower'

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
    floors: GUMDROP_GARDENS,
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
