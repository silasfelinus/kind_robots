// /utils/arcade/batteryMaze/modes.ts
//
// The ways to play (conductor kr-arcade/t-042): the campaign, Overclocked once it is cleared,
// Rush Hour (the leaderboard event), Classic Maze (one maze, level after level), and Gremlin
// Tag for 2-4 players. Two seated in any robot mode is co-op. Also the medals each campaign
// maze can award. All of it is data the game reads.

import type { GremlinKind } from './roster'

export type ModeId = 'campaign' | 'overclocked' | 'rush' | 'classic' | 'tag'

export type ModeInfo = {
  id: ModeId
  name: string
  /** One short line under the menu, at most 34 characters. */
  about: string
}

export const MODES: Record<ModeId, ModeInfo> = {
  campaign: {
    id: 'campaign',
    name: 'CAMPAIGN',
    about: 'RECHARGE THE WHOLE CITY GRID',
  },
  overclocked: {
    id: 'overclocked',
    name: 'OVERCLOCKED',
    about: 'THE GRID AGAIN, RUNNING HOT',
  },
  rush: {
    id: 'rush',
    name: 'RUSH HOUR',
    about: '3 MINUTES. BANK YOUR SPARKS!',
  },
  classic: {
    id: 'classic',
    name: 'CLASSIC MAZE',
    about: 'ONE MAZE, FASTER EACH LEVEL',
  },
  tag: {
    id: 'tag',
    name: 'GREMLIN TAG',
    about: 'P1 IS THE ROBOT, THE REST CHASE',
  },
}

/** The menu's modes for this many seats (three or four seated play Tag only). */
export function menuModes(seats: number, overclocked: boolean): ModeId[] {
  if (seats >= 3) return ['tag']
  const list: ModeId[] = ['campaign']
  if (overclocked) list.push('overclocked')
  list.push('rush', 'classic')
  if (seats === 2) list.push('tag')
  return list
}

/** Co-op: two robots share one pool of lives. */
export const COOP_LIVES = 6

/** Rush Hour: a timed score attack in waves; eaten sparks only count once banked. */
export const RUSH_HOUR = {
  layout: 'outlet-loops',
  look: 'toaster',
  ticks: 60 * 180,
  /** Sparks flow back into the maze this often, and the heat rises. */
  wave: 60 * 40,
  heat: 3,
  heatPerWave: 3,
  maxHeat: 18,
  /** A battery bar shows up this often, and stays this long. */
  barEvery: 60 * 9,
  barLife: 60 * 7,
  /** Points per banked spark, times the multiplier, which rises with each bank. */
  sparkPoints: 10,
  maxMultiplier: 8,
} as const

/** Classic Maze: the first maze at a heat that climbs with the level, a coffee break every three. */
export const CLASSIC_MAZE = {
  layout: 'classic',
  look: 'cozy',
  breakEvery: 3,
  scene: 'coffee-break',
} as const

/** Gremlin Tag: the robot clears the maze to win; the gremlins win by catching it three times. */
export const TAG = {
  layout: 'classic',
  look: 'arcade',
  heat: 5,
  lives: 3,
  roster: [
    'chaser',
    'ambusher',
    'flanker',
    'wanderer',
  ] as readonly GremlinKind[],
  /** The result card stays up this long. */
  resultTicks: 60 * 5,
} as const

export type MedalId = 'clean' | 'train' | 'prize'

export type Medal = { id: MedalId; bit: number; name: string }

/** Earned per campaign maze, kept in the save as bits under `board:maze`. */
export const MEDALS: readonly Medal[] = [
  { id: 'clean', bit: 1, name: 'CLEAN CHARGE' },
  { id: 'train', bit: 2, name: 'FULL TRAIN' },
  { id: 'prize', bit: 4, name: 'PRIZE HUNTER' },
]

export const ALL_MEDALS = 7
