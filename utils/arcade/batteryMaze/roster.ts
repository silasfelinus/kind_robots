// /utils/arcade/batteryMaze/roster.ts
//
// Battery Maze's gremlins and how each one hunts (conductor kr-arcade/t-039). The first four are
// this cabinet's own: each reads something different about the robot, so learning them is
// learning to play.
//
//   ZIP   the chaser    sniffs along the robot's trail a beat behind it, and closes the gap as
//                       it overclocks (glowing ears); up close it simply pounces.
//   SNAG  the ambusher  races for the next crossroads the robot is heading into. Turn back and
//                       it has guessed wrong.
//   FUSE  the flanker   guards the power cell nearest the robot and charges when the robot comes
//                       for it (its antenna lights). With the cells gone it doubles back to cut
//                       off the robot's retreat.
//   DOZY  the wanderer  potters from spark to spark, but it can hear chomping: munch within six
//                       tiles and it comes to look (a "!" pops up) for a few seconds. Glide
//                       through eaten halls and it never notices.
//
// Gremlins choose a turn at each tile centre by heading for a target tile; these rules pick that
// target while the gremlins hunt. In scatter they head for their own corners instead.

import type { Tile } from './mazes'

export type GremlinKind = 'chaser' | 'ambusher' | 'flanker' | 'wanderer'

/** What a gremlin remembers between turns. */
export type Mind = {
  /** Where a wanderer is pottering to, and how long it keeps at it. */
  goal: Tile | null
  goalTicks: number
  /** Ticks a wanderer stays curious about the chomping it heard. */
  curious: number
  /** A flanker charging the robot at its cell. */
  charging: boolean
}

export function freshMind(): Mind {
  return { goal: null, goalTicks: 0, curious: 0, charging: false }
}

/** What a gremlin can tell about the robot and the maze. */
export type HuntView = {
  robot: { x: number; y: number; dir: Tile }
  /** Where the robot was `ticks` ago along its path: its scent trail. */
  trail(ticks: number): Tile
  /** The next crossroads the robot will reach on its heading (its own tile when stopped). */
  junctionAhead(): Tile
  /** The last crossroads the robot passed. */
  junctionBehind(): Tile
  /** The uneaten power cell nearest the robot, or null when none are left. */
  cellNearRobot(): Tile | null
  /** A spark picked on the game's rng, or null when none are left. */
  randomSpark(): Tile | null
  /** The robot chomped a spark in the last few ticks. */
  chomping: boolean
  /** The chaser's overclock stage (0 to 2). */
  overclock: 0 | 1 | 2
}

export type HunterSelf = { x: number; y: number; mind: Mind }

export type Hunter = {
  kind: GremlinKind
  name: string
  /** How to spot it. */
  tell: string
  /** How to beat it. */
  answer: string
  /** Its target tile while it hunts. */
  hunt(self: HunterSelf, view: HuntView): Tile
  /** Called every tick while it roams awake (a wanderer listening). */
  sense?(self: HunterSelf, view: HuntView): void
}

const dist = (a: Tile, b: Tile) => Math.hypot(a.x - b.x, a.y - b.y)

/** How far behind on the robot's trail the chaser sniffs, by overclock stage (ticks). */
export const SNIFF_LAG = [75, 40, 0] as const
/** Within this many tiles the chaser stops sniffing and pounces. */
export const POUNCE_RANGE = 3
/** A guarded cell: the flanker charges once the robot is this close to it. */
export const GUARD_RANGE = 6
/** A wanderer hears chomping this far away. */
export const HEARING_RANGE = 6
export const CURIOUS_TICKS = 150
const POTTER_TICKS = 60 * 5

export const HUNTERS: Record<GremlinKind, Hunter> = {
  chaser: {
    kind: 'chaser',
    name: 'ZIP',
    tell: 'Glowing ears: overclocked',
    answer: 'Loop it round a block',
    hunt(self, view) {
      const robot = view.robot
      if (dist(self, robot) <= POUNCE_RANGE) return { x: robot.x, y: robot.y }
      return view.trail(SNIFF_LAG[view.overclock])
    },
  },
  ambusher: {
    kind: 'ambusher',
    name: 'SNAG',
    tell: 'Races for your next crossroads',
    answer: 'Double back',
    hunt(self, view) {
      const robot = view.robot
      if (dist(self, robot) <= 2) return { x: robot.x, y: robot.y }
      return view.junctionAhead()
    },
  },
  flanker: {
    kind: 'flanker',
    name: 'FUSE',
    tell: 'Guards a power cell',
    answer: 'Bait it out, then grab the cell',
    hunt(self, view) {
      const robot = view.robot
      const cell = view.cellNearRobot()
      if (!cell) {
        self.mind.charging = true
        return view.junctionBehind()
      }
      self.mind.charging = dist(robot, cell) <= GUARD_RANGE
      return self.mind.charging ? { x: robot.x, y: robot.y } : cell
    },
  },
  wanderer: {
    kind: 'wanderer',
    name: 'DOZY',
    tell: 'Hears you chomp',
    answer: 'Go quiet through eaten halls',
    sense(self, view) {
      if (self.mind.curious > 0) self.mind.curious--
      if (view.chomping && dist(self, view.robot) <= HEARING_RANGE)
        self.mind.curious = CURIOUS_TICKS
      if (self.mind.goalTicks > 0) self.mind.goalTicks--
    },
    hunt(self, view) {
      const robot = view.robot
      if (self.mind.curious > 0) return { x: robot.x, y: robot.y }
      const goal = self.mind.goal
      const reached =
        goal && Math.round(self.x) === goal.x && Math.round(self.y) === goal.y
      if (!goal || reached || self.mind.goalTicks <= 0) {
        self.mind.goal = view.randomSpark() ?? { x: robot.x, y: robot.y }
        self.mind.goalTicks = POTTER_TICKS
      }
      return self.mind.goal!
    },
  },
}

/** The order gremlins join a maze. */
export const STARTING_FOUR: readonly GremlinKind[] = [
  'chaser',
  'ambusher',
  'flanker',
  'wanderer',
]
