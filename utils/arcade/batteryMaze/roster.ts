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
// The Toaster Works adds two (slice 2, t-040):
//
//   DASH  the sprinter  works its way into line with the robot; once it can see straight down a
//                       corridor to it, it flattens its ears (and stops dead), then dashes at
//                       double speed. Break the line at a corner.
//   MUNCH the crumb     eats sparks too, heading for the nearest one. After fifteen it
//         snacker      overclocks: it turns red, speeds up and comes for the robot. Race it, or
//                       bump it while it's sleepy to reboot its appetite.
//
// And Gremlin Mama's babies: small, quick, and harmless while sleepy.
//
// Power Phases 2 and 3 add seven more (slice 3, t-041):
//
//   COPY    the copycat    moves when you move, mirrored left for right. Steer it into a dead end.
//   BRIAR   the bramble    leaves a short-lived thorn wall behind it. Don't follow it; go round.
//   BLINK   the blinker    blinks twice, then hops two tiles through a thin wall to land beside you.
//   FLURRY  the snowball   rolls along a fan's row with the wind, growing bigger and faster.
//   CRACKLE the static     is invisible outside the light, but leaves crackle on the tiles it crosses.
//   BOLT    the gatekeeper parks on a junction near you and holds it. Reboot it to open the locked
//                          shortcuts.
//   PIP and POP, the twins: a pincer pair, one racing ahead of you, one cutting off your retreat.
//                          Reboot one and the other sulks home.
//
// Gremlins choose a turn at each tile centre by heading for a target tile; these rules pick that
// target while the gremlins hunt. In scatter they head for their own corners instead.

import type { Tile } from './mazes'

export type GremlinKind =
  | 'chaser'
  | 'ambusher'
  | 'flanker'
  | 'wanderer'
  | 'sprinter'
  | 'snacker'
  | 'baby'
  | 'copycat'
  | 'bramble'
  | 'blinker'
  | 'snowball'
  | 'static'
  | 'gatekeeper'
  | 'twin'

/** What a gremlin remembers between turns. */
export type Mind = {
  /** Where a wanderer is pottering to, and how long it keeps at it. */
  goal: Tile | null
  goalTicks: number
  /** Ticks a wanderer stays curious about the chomping it heard. */
  curious: number
  /** A flanker charging the robot at its cell. */
  charging: boolean
  /** A sprinter's wind-up (ears flat), its dash, and its breather after. */
  aim: number
  dash: number
  cool: number
  /** Sparks a crumb snacker has eaten. */
  snacks: number
  /** A blinker's blink before its hop; a gatekeeper's time parked. */
  blink: number
  park: number
  /** A snowball's size (0 to 3) and whether the wind is rolling it. */
  size: number
  rolling: boolean
  /** Which twin: 0 races ahead of the robot, 1 cuts off its retreat. */
  side: 0 | 1
}

export function freshMind(): Mind {
  return {
    goal: null,
    goalTicks: 0,
    curious: 0,
    charging: false,
    aim: 0,
    dash: 0,
    cool: 0,
    snacks: 0,
    blink: 0,
    park: 0,
    size: 0,
    rolling: false,
    side: 0,
  }
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
  /** Whether the robot is in plain sight down a straight corridor from this tile. */
  sees(from: Tile): boolean
  /** The spark nearest this tile, or null when none are left. */
  nearestSpark(from: Tile): Tile | null
  /** Which way the robot's stick points (where it wants to go). */
  stick: Tile
  /**
   * The tile two steps away across a one-tile wall that lands beside the robot (within two
   * tiles of it), or null.
   */
  hopAcross(from: Tile): Tile | null
  /** Whether a tile is a junction (three ways or more). */
  junction(at: Tile): boolean
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
  /** Its speed, as a share of the maze's gremlin speed (1 when absent). */
  pace?(self: HunterSelf): number
  /** It eats the sparks it walks over. */
  eats?: boolean
  /** It ignores targets and is steered instead (a copycat); null means stand still. */
  steer?(self: HunterSelf, view: HuntView): Tile | null
  /** It leaves a thorn trail behind it. */
  thorns?: boolean
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
/** A sprinter's wind-up, dash and breather (ticks), and its dash pace. */
export const SPRINT = { aim: 30, dash: 60, cool: 120, pace: 2 } as const
/** A crumb snacker overclocks after this many sparks. */
export const SNACKS_TO_OVERCLOCK = 15
/** A blinker blinks this long before it hops, then rests. */
export const BLINK = { tell: 40, rest: 180 } as const
/** A gatekeeper parks this long, within this range of the robot, then moves on for a while. */
export const GATEKEEP = { park: 300, range: 7, rest: 180 } as const
/** A thorn lasts this long. */
export const THORN_TICKS = 180

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
  sprinter: {
    kind: 'sprinter',
    name: 'DASH',
    tell: 'Ears flat on a straight',
    answer: 'Break the line at a corner',
    sense(self, view) {
      const m = self.mind
      if (m.dash > 0) {
        if (--m.dash === 0) m.cool = SPRINT.cool
      } else if (m.aim > 0) {
        if (--m.aim === 0) m.dash = SPRINT.dash
      } else if (m.cool > 0) {
        m.cool--
      } else if (view.sees({ x: Math.round(self.x), y: Math.round(self.y) })) {
        m.aim = SPRINT.aim
      }
    },
    pace(self) {
      return self.mind.aim > 0 ? 0 : self.mind.dash > 0 ? SPRINT.pace : 1
    },
    hunt(self, view) {
      const robot = view.robot
      if (self.mind.dash > 0 || self.mind.aim > 0)
        return { x: robot.x, y: robot.y }
      // Line up: the nearer of the robot's column and its row.
      const across = { x: robot.x, y: self.y }
      const along = { x: self.x, y: robot.y }
      return dist(self, across) <= dist(self, along) ? across : along
    },
  },
  snacker: {
    kind: 'snacker',
    name: 'MUNCH',
    tell: 'Heads for sparks, not you',
    answer: 'Race it, or bump it before it turns red',
    eats: true,
    pace(self) {
      return self.mind.snacks >= SNACKS_TO_OVERCLOCK ? 1.2 : 0.95
    },
    hunt(self, view) {
      const robot = view.robot
      if (self.mind.snacks >= SNACKS_TO_OVERCLOCK)
        return { x: robot.x, y: robot.y }
      return view.nearestSpark(self) ?? { x: robot.x, y: robot.y }
    },
  },
  baby: {
    kind: 'baby',
    name: 'BABY',
    tell: 'Small and quick',
    answer: 'Grab a cell: sleepy babies are harmless',
    pace: () => 1.15,
    hunt(_self, view) {
      return { x: view.robot.x, y: view.robot.y }
    },
  },
  copycat: {
    kind: 'copycat',
    name: 'COPY',
    tell: 'Moves when you move, mirrored',
    answer: 'Steer it into a dead end',
    steer(_self, view) {
      const s = view.stick
      if (!s.x && !s.y) return null
      return { x: -s.x || 0, y: s.y }
    },
    hunt(_self, view) {
      return { x: view.robot.x, y: view.robot.y }
    },
  },
  bramble: {
    kind: 'bramble',
    name: 'BRIAR',
    tell: 'A thorn trail behind it',
    answer: "Don't follow it; go round",
    thorns: true,
    pace: () => 0.9,
    hunt(_self, view) {
      return { x: view.robot.x, y: view.robot.y }
    },
  },
  blinker: {
    kind: 'blinker',
    name: 'BLINK',
    tell: 'Blinks twice, then hops a wall',
    answer: "Don't stand two tiles from a thin wall",
    sense(self, view) {
      const m = self.mind
      if (m.blink > 0) {
        m.blink--
        return
      }
      if (m.cool > 0) {
        m.cool--
        return
      }
      const at = { x: Math.round(self.x), y: Math.round(self.y) }
      const hop = view.hopAcross(at)
      if (hop) {
        m.goal = hop
        m.blink = BLINK.tell
      }
    },
    pace(self) {
      return self.mind.blink > 0 ? 0 : 1
    },
    hunt(_self, view) {
      return { x: view.robot.x, y: view.robot.y }
    },
  },
  snowball: {
    kind: 'snowball',
    name: 'FLURRY',
    tell: 'Rolls along fan rows, growing',
    answer: 'Catch it small, or step out of its row',
    pace(self) {
      return self.mind.rolling ? 1.7 : 0.85
    },
    hunt(_self, view) {
      return { x: view.robot.x, y: view.robot.y }
    },
  },
  static: {
    kind: 'static',
    name: 'CRACKLE',
    tell: 'Crackle on the tiles in the dark',
    answer: 'Read the crackle',
    hunt(self, view) {
      const robot = view.robot
      if (dist(self, robot) <= POUNCE_RANGE) return { x: robot.x, y: robot.y }
      return view.trail(30)
    },
  },
  gatekeeper: {
    kind: 'gatekeeper',
    name: 'BOLT',
    tell: 'Parks on a junction',
    answer: 'Bump it while sleepy for a shortcut',
    sense(self, view) {
      const m = self.mind
      if (m.park > 0) {
        if (--m.park === 0) m.cool = GATEKEEP.rest
        return
      }
      if (m.cool > 0) {
        m.cool--
        return
      }
      const at = { x: Math.round(self.x), y: Math.round(self.y) }
      const centred =
        Math.abs(self.x - at.x) < 1e-6 && Math.abs(self.y - at.y) < 1e-6
      if (
        centred &&
        view.junction(at) &&
        dist(at, view.robot) <= GATEKEEP.range
      )
        m.park = GATEKEEP.park
    },
    pace(self) {
      return self.mind.park > 0 ? 0 : 1
    },
    hunt(_self, view) {
      return view.junctionAhead()
    },
  },
  twin: {
    kind: 'twin',
    name: 'PIP AND POP',
    tell: 'Come at you from both ends',
    answer: 'Reboot one; the other gives up',
    hunt(self, view) {
      const robot = view.robot
      if (dist(self, robot) <= 2) return { x: robot.x, y: robot.y }
      return self.mind.side === 0 ? view.junctionAhead() : view.junctionBehind()
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
