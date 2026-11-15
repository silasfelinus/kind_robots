// /utils/arcade/stationSweep/locker.ts
//
// The Supply Locker (conductor kr-arcade/t-141): between stations the shuttle docks at the
// locker, and the credits the crew earned emptying their bins buy upgrades. Credits are earned in
// play only (never real money). The stock is data; `buy` is pure so a test can check every price.

import { PICKUP_TOOLS, type PickupTool } from './tools'

export type LockerId =
  'spare' | 'clock' | 'bin' | 'tanks' | 'beam' | 'radar' | 'tool' | 'launch'

export type LockerItem = {
  id: LockerId
  name: string
  /** Price at each level owned (the last price repeats for a repeatable item). */
  prices: readonly number[]
  /** Most a crew can own; Infinity for items bought again and again. */
  max: number
  /** Most bought on one visit. */
  perVisit: number
  blurb: string
}

export const LOCKER_ITEMS: readonly LockerItem[] = [
  {
    id: 'spare',
    name: 'SPARE MOP',
    prices: [14],
    max: Infinity,
    perVisit: 2,
    blurb: 'ONE MORE MOP ON STANDBY',
  },
  {
    id: 'clock',
    name: 'MORE CLOCK',
    prices: [5],
    max: Infinity,
    perVisit: 3,
    blurb: '+15 SECONDS ON THE NEXT STATION',
  },
  {
    id: 'bin',
    name: 'BIGGER BIN',
    prices: [8, 14],
    max: 2,
    perVisit: 2,
    blurb: 'ROOM FOR 5 MORE CRITTERS',
  },
  {
    id: 'tanks',
    name: 'TOOL TANKS',
    prices: [9, 16],
    max: 2,
    perVisit: 2,
    blurb: 'EVERY TOOL HOLDS HALF AGAIN',
  },
  {
    id: 'beam',
    name: 'BEAM BOOST',
    prices: [10, 18],
    max: 2,
    perVisit: 2,
    blurb: 'THE BEAM FIRES FASTER, REACHES FARTHER',
  },
  {
    id: 'radar',
    name: 'SAC RADAR',
    prices: [8],
    max: 1,
    perVisit: 1,
    blurb: 'SEE EVERY SAC, AND WHICH WILL HATCH',
  },
  {
    id: 'tool',
    name: 'TOOL OF THE DAY',
    prices: [4],
    max: Infinity,
    perVisit: 1,
    blurb: 'EVERY MOP STARTS THE STATION WITH IT',
  },
  {
    id: 'launch',
    name: 'LAUNCH',
    prices: [0],
    max: Infinity,
    perVisit: Infinity,
    blurb: 'ON TO THE NEXT STATION',
  },
]

/** What the crew owns from the locker: kept for the whole run. */
export type Kit = {
  bin: number
  tanks: number
  beam: number
  radar: number
}

export function emptyKit(): Kit {
  return { bin: 0, tanks: 0, beam: 0, radar: 0 }
}

/** One visit to the locker: what's on the shelf and what's been bought so far. */
export type Visit = {
  /** The tool of the day on this visit. */
  tool: PickupTool
  bought: Partial<Record<LockerId, number>>
}

/** What `item` costs now, given what the crew owns. */
export function priceOf(item: LockerItem, kit: Kit): number {
  const owned = item.id in kit ? kit[item.id as keyof Kit] : 0
  return item.prices[Math.min(owned, item.prices.length - 1)]!
}

/** Why `item` can't be bought right now, or null if it can. */
export function cannotBuy(
  item: LockerItem,
  kit: Kit,
  visit: Visit,
  credits: number,
): string | null {
  if (item.id === 'launch') return null
  const owned = item.id in kit ? kit[item.id as keyof Kit] : 0
  if (owned >= item.max) return 'SOLD OUT'
  if ((visit.bought[item.id] ?? 0) >= item.perVisit) return 'ONE PER TRIP'
  if (priceOf(item, kit) > credits) return 'NEED CREDITS'
  return null
}

/** The tool of the day for a visit, from one roll of the dice. */
export function toolOfTheDay(roll: number): PickupTool {
  return PICKUP_TOOLS[Math.floor(roll * PICKUP_TOOLS.length)]!
}

/** Locker tuning: the shuttle's wait, a bin's room, and the clock an item adds. */
export const LOCKER = {
  /** The shuttle leaves on its own after this long. */
  wait: 60 * 40,
  /** Presses are ignored while the doors swing open. */
  doors: 30,
  binBase: 10,
  binStep: 5,
  clockSecs: 15,
} as const

/** Credits for the team: a deck cleaned, and a station cleaned. */
export const CREDITS = { deck: 2, station: 5 } as const

/** Bin room with this many Bigger Bins. */
export function binRoom(level: number): number {
  return LOCKER.binBase + LOCKER.binStep * level
}

/** The Sweeper Beam with this many Beam Boosts: ticks between shots, and how long a shot flies. */
export function beamTuning(level: number): { cooldown: number; life: number } {
  return { cooldown: 9 - level * 2, life: 34 + level * 8 }
}
