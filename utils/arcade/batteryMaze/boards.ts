// /utils/arcade/batteryMaze/boards.ts
//
// Battery Maze's campaign as data (conductor kr-arcade/t-040, spec: conductor
// projects/kr-arcade/depth-pass/CABINETS.md section 2, "The Charging Network"). The city's grid
// has gone glitchy; the little robot travels inside its appliances, board by board, to recharge
// them. Each board is three mazes (the first introduces its mechanic and new gremlin, the second
// is its special maze, the third remixes everything), with its own look, music, title card and a
// story break after it. A boss maze ends each Power Phase; the Charging Bay opens between phases.
// The game reads all of this; nothing board-specific lives in its update loop.

import type { MusicLoop } from '../sound'
import type { RampName } from '../snes'
import { COZY_MUSIC, TOASTER_MUSIC } from './music'
import {
  BREAKFAST_BAR,
  CLASSIC_LAYOUT,
  CRUMB_TRAY,
  OUTLET_LOOPS,
  POP_UP_PARLOUR,
  SWITCHYARD,
} from './mazes'
import type { MazeLayout, Tile } from './mazes'
import type { GremlinKind } from './roster'

/** A special maze's own goal (it pays, and with no robot lost it shows the golden bolt). */
export type SpecialKind = 'prize-parade' | 'breakfast-rush'

export type BoardMaze = {
  layout: MazeLayout
  /** The gremlins, in the order they leave the dock (the first waits outside). */
  roster: readonly GremlinKind[]
  special?: SpecialKind
  /** Where the board's golden bolt hides (its special maze). */
  goldenBolt?: Tile
}

export type BoardLook = {
  /** The walls' colour ramp, and the ramp their neon spill and gates glow in. */
  wall: RampName
  neon: RampName
  /** The floor's colour ramp (night when absent). */
  floor?: RampName
  /** What is etched on the walls' faces. */
  pattern: 'rivets' | 'coils'
}

/** The beat a board's toaster slots keep: toast is up for `up` ticks, after a `tell`-tick glow. */
export type ToastBeat = { period: number; up: number; tell: number }

export type Board = {
  id: string
  number: number
  name: string
  phase: number
  /** The title card's lines: the board's mechanic, and its new gremlins. */
  intro: string
  newcomers: string
  look: BoardLook
  music: MusicLoop
  toastBeat?: ToastBeat
  mazes: readonly [BoardMaze, BoardMaze, BoardMaze]
  /** The story break after it (story.ts). */
  story: string
}

export type Phase = {
  number: number
  name: string
  boards: readonly string[]
  /** The boss maze that ends it (bosses.ts). */
  boss: string
}

const FOUR: readonly GremlinKind[] = [
  'chaser',
  'ambusher',
  'flanker',
  'wanderer',
]

export const BOARDS: readonly Board[] = [
  {
    id: 'cozy',
    number: 1,
    name: 'COZY CHARGER',
    phase: 1,
    intro: 'A WARM LITTLE CHARGER. LEARN THE FOUR!',
    newcomers: 'ZIP  SNAG  FUSE  DOZY',
    look: { wall: 'purple', neon: 'teal', pattern: 'rivets' },
    music: COZY_MUSIC,
    mazes: [
      { layout: CLASSIC_LAYOUT, roster: FOUR },
      {
        layout: OUTLET_LOOPS,
        roster: FOUR,
        special: 'prize-parade',
        goldenBolt: { x: 11, y: 5 },
      },
      { layout: SWITCHYARD, roster: FOUR },
    ],
    story: 'coffee-break',
  },
  {
    id: 'toaster',
    number: 2,
    name: 'TOASTER WORKS',
    phase: 1,
    intro: 'CONVEYORS CARRY YOU. TOAST POPS UP!',
    newcomers: 'DASH THE SPRINTER  MUNCH THE SNACKER',
    look: { wall: 'rust', neon: 'gold', floor: 'earth', pattern: 'coils' },
    music: TOASTER_MUSIC,
    toastBeat: { period: 360, up: 120, tell: 60 },
    mazes: [
      {
        layout: CRUMB_TRAY,
        roster: ['chaser', 'sprinter', 'ambusher', 'wanderer'],
      },
      {
        layout: BREAKFAST_BAR,
        roster: ['chaser', 'snacker', 'ambusher', 'flanker'],
        special: 'breakfast-rush',
        goldenBolt: { x: 11, y: 13 },
      },
      {
        layout: POP_UP_PARLOUR,
        roster: ['chaser', 'sprinter', 'snacker', 'flanker', 'wanderer'],
      },
    ],
    story: 'spilled-oil',
  },
]

export const PHASES: readonly Phase[] = [
  {
    number: 1,
    name: 'MORNING BOOT',
    boards: ['cozy', 'toaster'],
    boss: 'mama',
  },
]

export const SPECIALS: Record<
  SpecialKind,
  { name: string; goal: string; target: number }
> = {
  'prize-parade': {
    name: 'PRIZE PARADE',
    goal: 'CATCH ALL EIGHT PRIZES!',
    target: 8,
  },
  'breakfast-rush': {
    name: 'BREAKFAST RUSH',
    goal: 'GRAB ALL THREE GOLDEN TOASTS!',
    target: 3,
  },
}

/** The Prize Parade: a new prize every this many ticks, each wandering this long. */
export const PARADE = { first: 60 * 4, every: 60 * 7, wander: 60 * 10 }
/** Breakfast Rush: golden toast pops when this share of the maze is eaten, for `ticks`. */
export const RUSH = {
  at: [0.2, 0.5, 0.8],
  ticks: 60 * 6,
  points: [2000, 3000, 5000],
}

export type Step =
  | { kind: 'card'; board: string }
  | { kind: 'maze'; board: string; maze: 0 | 1 | 2 }
  | { kind: 'story'; id: string }
  | { kind: 'boss'; id: string; phase: number }
  | { kind: 'bay'; phase: number }

/** The whole campaign, in order. */
export function campaignSteps(): Step[] {
  const steps: Step[] = []
  for (const phase of PHASES) {
    for (const id of phase.boards) {
      const board = boardById(id)
      steps.push({ kind: 'card', board: id })
      for (const maze of [0, 1, 2] as const)
        steps.push({ kind: 'maze', board: id, maze })
      steps.push({ kind: 'story', id: board.story })
    }
    steps.push({ kind: 'boss', id: phase.boss, phase: phase.number })
    steps.push({ kind: 'bay', phase: phase.number })
  }
  return steps
}

export function boardById(id: string): Board {
  const board = BOARDS.find((b) => b.id === id)
  if (!board) throw new Error(`no board ${id}`)
  return board
}

/** Heat climbs one a maze through the campaign; each lap round the grid adds six. */
export function heatFor(board: Board, maze: number, lap: number): number {
  return (board.number - 1) * 3 + maze + 1 + lap * 6
}

/** A boss maze plays at the heat of the board before it. */
export function bossHeat(phase: number, lap: number): number {
  const last = PHASES[phase - 1]!.boards.at(-1)!
  return heatFor(boardById(last), 2, lap)
}
