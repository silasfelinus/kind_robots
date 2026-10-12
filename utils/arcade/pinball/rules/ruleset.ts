// /utils/arcade/pinball/rules/ruleset.ts
//
// A table's rules as one pluggable object (conductor zuzu-pinball/t-008).
// The runtime wires input, physics, effects and the renderer the same way for
// every table; what a switch is worth, which lamps are lit and what the DMD
// says belong to the table's ruleset. AMI Village Rescue's ruleset wraps the
// reducer in rules/engine.ts; Zuzu's lives with its table.

import type { ArcadeMasteryGoal } from '../../types'
import type { PinballMusicBed } from '../audio/catalog'
import type { RuleEffect, TableDef } from '../types'
import {
  initialRules,
  stepRules,
  type PinballRulesState,
  type RulesContext,
  type RulesEvent,
} from './engine'
import { lampStates, type LampFrame } from './lamps'
import type { LedFrame } from './leds'
import { showTriggers, type LightShow } from './lightShows'
import { goalsMet, MASTERY_GOALS, masteryEffects } from './mastery'
import { musicFor } from './subTable'
import { delivered, toyPose, type ToyPose } from './toys'

/**
 * An animatronic's phase, how long it has been in it (seconds), and an
 * optional mood cue its toy may show on top (a Zuzu Croc's stirred water).
 */
export type AnimatronicPose = { phase: string; age: number; cue?: string }

/** What the runtime reads from any table's rules state. */
export type CoreRulesState = {
  score: number
  /** The ball being played, from 1. */
  ball: number
  /** Balls left including the one in play. */
  lives: number
  over: boolean
  /** A tilted machine's flippers are dead until the ball drains. */
  tilted: boolean
  bonusMultiplier: number
  /** Completed shots this game, by shot id. */
  shotsMade: Record<string, number>
}

export type PinballRuleset<S extends CoreRulesState = CoreRulesState> = {
  /** A new game of `balls` balls; `seed` drives its random picks. */
  initial(balls: number, seed: number): S
  step(
    state: S,
    event: RulesEvent,
    context: RulesContext,
  ): { state: S; effects: RuleEffect[] }
  lamps(state: S, table: TableDef): LampFrame
  /** Light shows the change from one state to the next calls for. */
  shows(before: S, after: S, tick: number): LightShow[]
  /** The music bed the game calls for now. */
  music(state: S): PinballMusicBed | null
  /** The shot whose arrow pulses for a live skill shot, if any. */
  skillTarget(state: S): string | null
  /** The table's signature toys, when it has them. */
  toys?: {
    pose(state: S): ToyPose
    delivered(before: S, after: S): boolean
  }
  /**
   * The LED rail's colours (rules/leds.ts), one per LED, at physics step
   * `step`; `still` is reduced motion: no flashing, no chases.
   */
  leds?(state: S, step: number, count: number, still: boolean): LedFrame
  /** Animatronic toys' poses by id, at physics step `step`. */
  animatronics?(state: S, step: number): Record<string, AnimatronicPose>
  /** Mastery goals, when the table has them. */
  mastery?: {
    goals: readonly ArcadeMasteryGoal[]
    met(before: S, after: S, effects: readonly RuleEffect[]): string[]
    effects(id: string, earned: number): RuleEffect[]
  }
}

/** AMI Village Rescue (Kind Pinball's table). */
export const AMI_RULESET: PinballRuleset<PinballRulesState> = {
  initial: initialRules,
  step: stepRules,
  lamps: lampStates,
  shows: showTriggers,
  music: musicFor,
  skillTarget: (state) => {
    const skill = state.play.skill
    return skill.armed ? skill.target : null
  },
  toys: { pose: toyPose, delivered },
  mastery: {
    goals: MASTERY_GOALS,
    met: goalsMet,
    effects: masteryEffects,
  },
}
