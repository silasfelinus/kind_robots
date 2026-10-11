// /utils/arcade/batteryMaze/bay.ts
//
// The Charging Bay (conductor kr-arcade/t-040): it opens between Power Phases, and the robot
// spends the bolts it earned in play (never real money) on a little help for the road ahead.
// Bolts come from clearing mazes, clean charges, full trains, prizes, special mazes and bosses.

import type { PowerUpKind } from './tables'

export type BayItemId = 'robot' | 'flip' | 'magnet' | 'hint'

export type BayItem = {
  id: BayItemId
  name: string
  about: string
  price: number
  /** How many a run can hold (spare robots are unlimited). */
  max?: number
}

export const BAY_ITEMS: readonly BayItem[] = [
  { id: 'robot', name: 'SPARE ROBOT', about: 'ONE MORE ROBOT', price: 12 },
  {
    id: 'flip',
    name: 'EXTRA FLIP',
    about: '+1 REWIRE FLIP EVERY MAZE',
    price: 8,
    max: 2,
  },
  {
    id: 'magnet',
    name: 'STARTING MAGNET',
    about: 'START THE NEXT BOARD WITH A MAGNET',
    price: 6,
    max: 1,
  },
  {
    id: 'hint',
    name: 'BOLT HINT',
    about: 'SHOW WHERE THE GOLDEN BOLTS HIDE',
    price: 5,
    max: 1,
  },
]

/** Bolts paid for each feat. */
export const BOLT_AWARDS = {
  maze: 2,
  clean: 2,
  fullTrain: 3,
  prize: 1,
  special: 3,
  boss: 10,
} as const

/** The power-up a Starting Magnet gives the next board's first maze. */
export const STARTING_POWER: PowerUpKind = 'magnet'
