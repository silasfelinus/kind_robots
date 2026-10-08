// /utils/arcade/pinball/rules/toys.ts
//
// What AMI Village Rescue's three signature toys show (conductor
// kind-pinball/t-010), read from the rules state so it stays pure and
// testable without WebGL. The renderer (render/heroes.ts) only animates
// toward the pose this returns.
//
//   The hut bank: six huts on the arch rim, one per village toward the
//   Malaria-Free wizard mode (WIZARD_AT). A visited village's hut glows, a
//   saved one burns bright, the village being played blinks, and the whole
//   row flashes through the wizard mode.
//
//   The AMI beacon: a robot head over the lock. Its three eyes are the A-M-I
//   drop targets (an eye lights as its target falls); the beacon on its
//   antenna turns when the lock is lit, and the head flashes through
//   multiball.
//
//   The net drone: it carries a net for each N-E-T target hit in the hidden
//   room's NET RUN. Bringing all three home sends it on a delivery flight to
//   the village (an event the runtime raises: see deliveries()); it circles
//   the table through multiball and the wizard mode, and otherwise waits on
//   its perch.

import type { PinballRulesState } from './engine'
import { WIZARD_AT } from './village'

export type HutLevel = 'dark' | 'visited' | 'saved' | 'playing' | 'wizard'

export type ToyPose = {
  /** One per hut, left to right: WIZARD_AT of them. */
  huts: HutLevel[]
  beacon: {
    /** The A, M and I eyes. */
    eyes: [boolean, boolean, boolean]
    /** The lock is lit: the beacon turns. */
    turning: boolean
    /** Multiball or the wizard mode: the head flashes. */
    excited: boolean
  }
  drone: {
    /** Nets it is carrying (0..3). */
    nets: number
    mode: 'perch' | 'circle'
  }
}

export const HUT_COUNT = WIZARD_AT
const AMI = ['drop-a', 'drop-m', 'drop-i'] as const

export function toyPose(state: PinballRulesState): ToyPose {
  const play = state.play
  const v = play.villages
  // The huts fill in the order the villages are visited; the one being
  // played is the last visited (the saucer adds it as the mode starts).
  const huts: HutLevel[] = Array.from({ length: HUT_COUNT }, () => 'dark')
  const visited = Math.min(v.visited.length, HUT_COUNT)
  const saved = Math.min(v.saved, visited)
  for (let i = 0; i < visited; i++) huts[i] = i < saved ? 'saved' : 'visited'
  if (v.mode && visited > 0) huts[visited - 1] = 'playing'
  if (play.wizard.running) huts.fill('wizard')
  const down = state.dropsDown.ami ?? []
  return {
    huts,
    beacon: {
      eyes: [
        down.includes(AMI[0]),
        down.includes(AMI[1]),
        down.includes(AMI[2]),
      ],
      turning: down.length >= AMI.length,
      excited: play.multiball.running || play.wizard.running,
    },
    drone: {
      nets: Math.min(3, state.sub.nets.length),
      mode: play.multiball.running || play.wizard.running ? 'circle' : 'perch',
    },
  }
}

/**
 * The drone's delivery flight: the change from `before` to `after` brought
 * all three nets HOME from the hidden room (HOME pays one on the bonus
 * multiplier and the nets another; past the room's flippers pays only the
 * nets' one, and the drone stays put).
 */
export function delivered(
  before: PinballRulesState,
  after: PinballRulesState,
): boolean {
  return (
    before.sub.nets.length >= 3 &&
    after.sub.nets.length === 0 &&
    after.bonusMultiplier - before.bonusMultiplier >= 2
  )
}
