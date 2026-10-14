/**
 * Which poses of each painted sheet play when: `loop` is the resting cycle
 * (walk, float, guard), `act` plays on demand (a stomp, a tell, an attack).
 * Indices follow the six-pose sheets queued in conductor's ART-PLAN.md.
 */
import { PLUMBER_ART, plumberStageSlug } from './savePlumberArt'

export type SheetAnimation = {
  src: string
  frames: number
  loop: number[]
  act: number[]
  /** Fallback single painted sprite while the sheet loads or if it fails. */
  still: string
}

function enemy(sheet: string, key: string, loop: number[], act: number[]) {
  return {
    src: PLUMBER_ART.anim(sheet),
    frames: 6,
    loop,
    act,
    still: PLUMBER_ART.enemy(key),
  }
}

export const ENEMY_ANIMATIONS: Record<string, SheetAnimation> = {
  pumpbug: enemy('pumpbug-cycle', 'pumpbug', [0, 1, 2, 3], [4, 4, 5, 5]),
  'rivet-roller': enemy(
    'rivet-roller-v2',
    'rivet-roller',
    [0, 1],
    [2, 3, 4, 5],
  ),
  'umbrella-mite': enemy(
    'umbrella-mite-cycle',
    'umbrella-mite',
    [0, 1, 0, 2],
    [3, 4, 5],
  ),
  'moss-lantern': enemy(
    'moss-lantern-cycle',
    'moss-lantern',
    [0, 3, 0, 1],
    [2, 4, 4, 5],
  ),
  'glass-gull': enemy('glass-gull-cycle', 'glass-gull', [0, 1], [2, 3, 4]),
  'cork-crab': enemy('cork-crab-cycle', 'cork-crab', [0, 1], [2, 3, 4, 5]),
  'siphon-sprite': enemy(
    'siphon-sprite-cycle',
    'siphon-sprite',
    [0, 1],
    [2, 3, 4],
  ),
  'clockwork-minnow': enemy(
    'clockwork-minnow-cycle',
    'clockwork-minnow',
    [0, 1],
    [2, 3, 4, 5],
  ),
  'gasket-golem': enemy(
    'gasket-golem-cycle',
    'gasket-golem',
    [0, 1],
    [2, 3, 4, 5],
  ),
  'spring-hare': enemy(
    'spring-hare-cycle',
    'spring-hare',
    [0, 1, 2, 1],
    [3, 4, 5],
  ),
  'paper-kite': enemy('paper-kite-cycle', 'paper-kite', [0, 1, 2], [3, 4, 5]),
  'puddle-mimic': enemy(
    'puddle-mimic-cycle',
    'puddle-mimic',
    [0, 1],
    [2, 3, 4, 5],
  ),
  'chimney-spirit': enemy(
    'chimney-spirit-cycle',
    'chimney-spirit',
    [0, 1],
    [2, 3, 4, 5],
  ),
  'tea-kettle-knight': enemy(
    'tea-kettle-knight-cycle',
    'tea-kettle-knight',
    [0, 1],
    [2, 3, 4, 5],
  ),
}

/** A world boss's six-pose attack sheet: idle, then tell, attack and recovery. */
export function bossAnimation(name: string): SheetAnimation {
  const key = plumberStageSlug(name)
  return {
    src: PLUMBER_ART.anim(`${key}-attack`),
    frames: 6,
    loop: [0, 0, 0, 1, 1, 2, 3, 3, 0],
    act: [4, 4, 5, 5],
    still: PLUMBER_ART.boss(key, 'idle'),
  }
}
