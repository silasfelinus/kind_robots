// /utils/arcade/pinball/tables/zuzuLastBell/croc.ts
//
// The River Croc's cycle (conductor zuzu-pinball/t-015), pure and timed in
// physics steps:
//
//   open ──capture──▶ captured ──▶ death-roll ──eject──▶ spit
//     ▲                                                    │
//     └──── rising ◀──── submerged ◀────────────────────────┘
//
// The jaw gate (the table's croc-jaw door) shuts on the capture and opens
// again only when he has risen, so the mouth holds one ball at a time and
// every other ball is turned away by the teeth. The scoop's own hold and
// kickout put the ball back on the right inlane; nothing here can keep it.

import { PHYSICS_HZ } from '../../clock'
import type { RuleEffect } from '../../types'

export type CrocPhase =
  'open' | 'captured' | 'death-roll' | 'spit' | 'submerged' | 'rising'

export type CrocCycle = { phase: CrocPhase; since: number }

export const CROC_MOUTH = 'croc-mouth'
export const CROC_JAW = 'croc-jaw'
export const CROC_TOY = 'river-croc'

/** How long each timed phase lasts, in physics steps. */
export const CROC_STEPS = {
  captured: Math.round(PHYSICS_HZ * 0.25),
  spit: Math.round(PHYSICS_HZ * 0.45),
  submerged: Math.round(PHYSICS_HZ * 2),
  rising: Math.round(PHYSICS_HZ * 0.6),
} as const

export function initialCroc(): CrocCycle {
  return { phase: 'open', since: 0 }
}

/** The ball is in his jaws: they snap shut behind it. */
export function crocCaptured(at: number, effects: RuleEffect[]): CrocCycle {
  effects.push({ type: 'mechanism', id: CROC_JAW, action: 'close' })
  return { phase: 'captured', since: at }
}

/** The scoop has kicked the ball out: he spits it to the inlane. */
export function crocEjected(at: number): CrocCycle {
  return { phase: 'spit', since: at }
}

/** Time passing: the timed phases move on; rising opens the jaws again. */
export function advanceCroc(
  cycle: CrocCycle,
  at: number,
  effects: RuleEffect[],
): CrocCycle {
  const age = at - cycle.since
  switch (cycle.phase) {
    case 'captured':
      return age >= CROC_STEPS.captured
        ? { phase: 'death-roll', since: at }
        : cycle
    case 'spit':
      return age >= CROC_STEPS.spit ? { phase: 'submerged', since: at } : cycle
    case 'submerged':
      return age >= CROC_STEPS.submerged
        ? { phase: 'rising', since: at }
        : cycle
    case 'rising':
      if (age < CROC_STEPS.rising) return cycle
      effects.push({ type: 'mechanism', id: CROC_JAW, action: 'open' })
      return { phase: 'open', since: at }
    default:
      return cycle
  }
}
