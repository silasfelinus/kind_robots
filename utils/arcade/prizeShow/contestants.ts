// /utils/arcade/prizeShow/contestants.ts
//
// Prize Show Panic's four contestants (conductor kr-arcade t-033, depth-pass/ASSESSMENT.md section 2,
// "The contestants and the modes"): each robot plays differently, and up to four play at once
// through the cabinet's `players` frames.
//
//   Sparkle  balanced: the show's star, as she always was.
//   Zippy    fast on her feet and quick on the trigger, with a narrow spray.
//   Boomer   slow, with a wide, heavy cannon: three shots a pull, each counting double.
//   Glimmer  a shield of her own that takes one hit, then recharges after a while.
//
// The palettes recolour the game's contestant sprite (games/prizeShowPanic.ts), so each reads apart
// at a glance: Sparkle's gold, Zippy's sky blue, Boomer's rust, Glimmer's lilac.

import { RAMPS } from '../snes'

export type ContestantId = 'sparkle' | 'zippy' | 'boomer' | 'glimmer'

export const CONTESTANT_IDS: readonly ContestantId[] = [
  'sparkle',
  'zippy',
  'boomer',
  'glimmer',
]

export type ContestantKit = {
  name: string
  /** What the pick card says about her (two short lines). */
  blurb: readonly [string, string]
  /** Walking speed, as a share of the stage's SPEED. */
  speed: number
  /** Time between shots, as a share of the cannon's usual cooldown. */
  cooldown: number
  /** The spray's spread (radians) and how many shots a pull fires. */
  spread: number
  shots: number
  /** Confetti each shot counts for. */
  damage: number
  /** Her own shield: ticks it takes to come back after a hit (0: none). */
  recharge: number
  /** Sprite recolouring: the body, the antenna, the chest light. */
  body: readonly [string, string, string, string, string]
  antenna: readonly [string, string, string]
  light: string
}

export const CONTESTANTS: Record<ContestantId, ContestantKit> = {
  sparkle: {
    name: 'SPARKLE',
    blurb: ['BALANCED', 'ALL-ROUNDER'],
    speed: 1,
    cooldown: 1,
    spread: 0,
    shots: 1,
    damage: 1,
    recharge: 0,
    body: [
      RAMPS.gold[4],
      RAMPS.gold[3],
      RAMPS.gold[2],
      RAMPS.gold[1],
      RAMPS.gold[0],
    ],
    antenna: [RAMPS.pink[3], RAMPS.pink[2], RAMPS.pink[1]],
    light: RAMPS.teal[3],
  },
  zippy: {
    name: 'ZIPPY',
    blurb: ['FAST FEET', 'THIN SPRAY'],
    speed: 1.18,
    cooldown: 0.8,
    spread: 0,
    shots: 1,
    damage: 1,
    recharge: 0,
    body: [
      RAMPS.sky[4],
      RAMPS.sky[3],
      RAMPS.sky[2],
      RAMPS.sky[1],
      RAMPS.sky[0],
    ],
    antenna: [RAMPS.gold[4], RAMPS.gold[3], RAMPS.gold[2]],
    light: RAMPS.gold[4],
  },
  boomer: {
    name: 'BOOMER',
    blurb: ['SLOW, BUT', 'BIG CANNON'],
    speed: 0.88,
    cooldown: 1.7,
    spread: 0.22,
    shots: 3,
    damage: 2,
    recharge: 0,
    body: [
      RAMPS.rust[4],
      RAMPS.rust[3],
      RAMPS.rust[2],
      RAMPS.rust[1],
      RAMPS.rust[0],
    ],
    antenna: [RAMPS.steel[4], RAMPS.steel[3], RAMPS.steel[2]],
    light: RAMPS.ember[3],
  },
  glimmer: {
    name: 'GLIMMER',
    blurb: ['A SHIELD', 'THAT HEALS'],
    speed: 1,
    cooldown: 1.1,
    spread: 0,
    shots: 1,
    damage: 1,
    recharge: 60 * 10,
    body: [
      RAMPS.purple[4],
      RAMPS.purple[3],
      RAMPS.purple[2],
      RAMPS.purple[1],
      RAMPS.purple[0],
    ],
    antenna: [RAMPS.teal[4], RAMPS.teal[3], RAMPS.teal[2]],
    light: RAMPS.pink[3],
  },
}

/** Each seat's colour (its cursor on the pick card and its marker in play). */
export const SEAT_COLOURS: readonly string[] = [
  RAMPS.pink[3],
  RAMPS.teal[3],
  RAMPS.gold[3],
  RAMPS.leaf[3],
]
