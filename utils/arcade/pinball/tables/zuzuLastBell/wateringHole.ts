// /utils/arcade/pinball/tables/zuzuLastBell/wateringHole.ts
//
// The Watering Hole (conductor zuzu-pinball/t-016): the River Croc's own
// mini-mode, told inside the Homestead chapter. In the Zuzu gamebook a
// one-eyed coyote drinks across the red-stone watering hole while something
// longer than a sword slides under the surface; here a swallow during
// Homestead opens the scene for a while.
//
// While it runs, an orbit stirs the water and lights the Croc's mouth for a
// few seconds: a swallow in that window is the Death Roll jackpot. Each
// Death Roll raises the next one and leaves him warier, so the orbit-to-mouth
// window shortens and the next one takes a quicker, cleaner trajectory. A
// swallow without the lit orbit still pays: the spit-back consolation. The
// jaw gate and the scoop (croc.ts) guarantee every swallow is spat back to
// the right inlane; nothing here holds or drains a ball.

import { PHYSICS_HZ } from '../../clock'
import type { RuleEffect } from '../../types'

export type WateringHole = {
  /** Physics step it ends on; -Infinity when the scene is not running. */
  until: number
  /** True while an orbit has lit the mouth for a Death Roll. */
  lit: boolean
  /** Step the lit mouth goes dark again. */
  litUntil: number
  /** Death Rolls this visit: the jackpot climbs and the window shrinks. */
  rolls: number
  /** What this visit has paid, for its total. */
  total: number
}

/** The chapter the Watering Hole belongs to (chapters.ts). */
export const WATERING_HOLE_CHAPTER = 'homestead'
export const WATERING_HOLE_STEPS = PHYSICS_HZ * 30
/** The orbits that stir the water. */
export const STIR_SHOTS: readonly string[] = ['left-orbit', 'right-orbit']
/** Seconds an orbit leaves the mouth lit, by Death Rolls already taken. */
export const DEATH_ROLL_WINDOWS = [6, 5, 4, 3.5] as const

export const WATERING_VALUES = {
  open: 100_000,
  stir: 25_000,
  deathRoll: 1_000_000,
  /** Added for each Death Roll already taken this visit. */
  deathRollStep: 500_000,
  spitBack: 100_000,
}

export function initialWateringHole(): WateringHole {
  return {
    until: Number.NEGATIVE_INFINITY,
    lit: false,
    litUntil: Number.NEGATIVE_INFINITY,
    rolls: 0,
    total: 0,
  }
}

export const wateringHoleRunning = (hole: WateringHole) =>
  hole.until !== Number.NEGATIVE_INFINITY

/** The orbit-to-mouth window after `rolls` Death Rolls, in physics steps. */
export function deathRollWindow(rolls: number): number {
  const seconds =
    DEATH_ROLL_WINDOWS[Math.min(rolls, DEATH_ROLL_WINDOWS.length - 1)]!
  return Math.round(seconds * PHYSICS_HZ)
}

/** The Death Roll jackpot after `rolls` already taken, in round `round`. */
export function deathRollValue(rolls: number, round: number): number {
  return (
    (WATERING_VALUES.deathRoll + rolls * WATERING_VALUES.deathRollStep) * round
  )
}

/** A swallow during Homestead: the coyote comes down to drink. */
export function openWateringHole(
  at: number,
  round: number,
  effects: RuleEffect[],
): { hole: WateringHole; points: number } {
  const points = WATERING_VALUES.open * round
  effects.push(
    { type: 'sound', name: 'water-spray' },
    {
      type: 'dmd',
      text: 'THE WATERING HOLE',
      sub: 'ORBIT THEN THE CROC',
      ms: 2400,
      scene: 'mode-intro',
    },
    {
      type: 'dmd',
      text: 'COYOTE AT THE WATER',
      sub: 'SOMETHING MOVES BELOW',
      ms: 1800,
    },
  )
  return {
    hole: {
      ...initialWateringHole(),
      until: at + WATERING_HOLE_STEPS,
      total: points,
    },
    points,
  }
}

/** An orbit made while the scene runs: the mouth lights for a Death Roll. */
export function stirWater(
  hole: WateringHole,
  at: number,
  round: number,
  effects: RuleEffect[],
): { hole: WateringHole; points: number } {
  const points = WATERING_VALUES.stir * round
  effects.push(
    { type: 'sound', name: 'water-spray' },
    {
      type: 'dmd',
      text: 'THE WATER STIRS',
      sub: 'SHOOT THE CROC',
      ms: 1200,
    },
  )
  return {
    hole: {
      ...hole,
      lit: true,
      litUntil: at + deathRollWindow(hole.rolls),
      total: hole.total + points,
    },
    points,
  }
}

/**
 * A swallow while the scene runs: the Death Roll when an orbit lit the
 * mouth, the spit-back consolation when it did not. Either way he pays.
 */
export function wateringSwallow(
  hole: WateringHole,
  round: number,
  effects: RuleEffect[],
): { hole: WateringHole; points: number; deathRoll: boolean } {
  if (hole.lit) {
    const points = deathRollValue(hole.rolls, round)
    const rolls = hole.rolls + 1
    effects.push(
      { type: 'sound', name: 'jackpot' },
      {
        type: 'dmd',
        text: rolls > 1 ? `DEATH ROLL ${rolls}` : 'DEATH ROLL',
        sub: 'THE COYOTE IS SAFE',
        ms: 2400,
        scene: 'death-roll',
        value: points,
      },
    )
    return {
      hole: {
        ...hole,
        lit: false,
        litUntil: Number.NEGATIVE_INFINITY,
        rolls,
        total: hole.total + points,
      },
      points,
      deathRoll: true,
    }
  }
  const points = WATERING_VALUES.spitBack * round
  effects.push({
    type: 'dmd',
    text: 'SPIT BACK',
    sub: 'ORBIT FOR DEATH ROLL',
    ms: 1400,
  })
  return {
    hole: { ...hole, total: hole.total + points },
    points,
    deathRoll: false,
  }
}

/** Time passing: the lit mouth goes dark, and the scene ends on its timer. */
export function advanceWateringHole(
  hole: WateringHole,
  at: number,
  effects: RuleEffect[],
): WateringHole {
  if (!wateringHoleRunning(hole)) return hole
  if (at >= hole.until) return closeWateringHole(hole, effects)
  if (hole.lit && at >= hole.litUntil)
    return { ...hole, lit: false, litUntil: Number.NEGATIVE_INFINITY }
  return hole
}

/** The scene ends (its timer, or the ball): the coyote slips away. */
export function closeWateringHole(
  hole: WateringHole,
  effects: RuleEffect[],
): WateringHole {
  if (!wateringHoleRunning(hole)) return hole
  effects.push({
    type: 'dmd',
    text: 'WATERING HOLE TOTAL',
    ms: 2000,
    scene: 'mode-total',
    value: hole.total,
  })
  return initialWateringHole()
}
