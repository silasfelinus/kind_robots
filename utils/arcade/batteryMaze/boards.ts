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
import {
  ARCADE_MUSIC,
  COLD_MUSIC,
  COZY_MUSIC,
  GARDEN_MUSIC,
  GREENHOUSE_MUSIC,
  SOLAR_MUSIC,
  TOASTER_MUSIC,
} from './music'
import {
  BREAKFAST_BAR,
  CLAW_ROW,
  CLASSIC_LAYOUT,
  CRUMB_TRAY,
  DARK_ARCADE,
  DEEP_FREEZE,
  FLOWER_BEDS,
  FREEZER,
  GARDEN_PATHS,
  HIGH_SCORE_HALL,
  ICE_TRAY,
  OUTLET_LOOPS,
  PANEL_ROWS,
  POP_UP_PARLOUR,
  POTTING_SHED,
  SEEDLING_ROWS,
  SUN_DECK,
  SWITCHYARD,
  THE_ROOFTOP,
} from './mazes'
import { OVERCLOCKED_HEAT } from './tables'
import type { PowerUpKind } from './tables'
import type { MazeLayout, Tile } from './mazes'
import type { GremlinKind } from './roster'

/** A special maze's own goal (it pays, and with no robot lost it shows the golden bolt). */
export type SpecialKind =
  | 'prize-parade'
  | 'breakfast-rush'
  | 'bloom-run'
  | 'thaw'
  | 'lamp-lighter'
  | 'sunset-charge'

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
  pattern: 'rivets' | 'coils' | 'leaves' | 'frost' | 'tiles' | 'panels'
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
  /** Vines bud then grow across a corridor, one every `every` ticks (`bud` of them a warning). */
  vines?: { every: number; bud: number }
  /** Fans blow for `on` ticks, then rest for `off`. */
  fans?: { on: number; off: number }
  /** Lights out: the robot's light and a lit lamp's, in tiles. */
  dark?: { robot: number; lamp: number }
  /** The sun: day and night lengths, and how soon a panel's spark comes back by day. */
  sun?: { day: number; night: number; respawn: number }
  /** Mirror junctions turn this often. */
  mirrors?: number
  /** The board's own tool, rolling out of the dock with the other power-ups. */
  tool?: PowerUpKind
  /** The secret board: it opens only with all six golden bolts. */
  secret?: boolean
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
  {
    id: 'greenhouse',
    number: 3,
    name: 'GREENHOUSE GRID',
    phase: 2,
    intro: 'VINES GROW. A WATERING CAN CLEARS THEM.',
    newcomers: 'COPY THE COPYCAT  BRIAR THE BRAMBLE',
    look: { wall: 'leaf', neon: 'pink', floor: 'earth', pattern: 'leaves' },
    music: GREENHOUSE_MUSIC,
    vines: { every: 60 * 7, bud: 90 },
    tool: 'can',
    mazes: [
      {
        layout: SEEDLING_ROWS,
        roster: ['chaser', 'copycat', 'ambusher', 'wanderer'],
      },
      {
        layout: FLOWER_BEDS,
        roster: ['chaser', 'bramble', 'flanker', 'copycat'],
        special: 'bloom-run',
        goldenBolt: { x: 11, y: 7 },
      },
      {
        layout: POTTING_SHED,
        roster: ['chaser', 'copycat', 'bramble', 'sprinter', 'wanderer'],
      },
    ],
    story: 'charging-party',
  },
  {
    id: 'cold',
    number: 4,
    name: 'COLD STORAGE',
    phase: 2,
    intro: 'ICE SLIDES YOU ON. FANS BLOW ALONG THEIR ROWS.',
    newcomers: 'BLINK THE BLINKER  FLURRY THE SNOWBALL',
    look: { wall: 'sky', neon: 'teal', floor: 'steel', pattern: 'frost' },
    music: COLD_MUSIC,
    fans: { on: 60 * 4, off: 60 * 3 },
    mazes: [
      {
        layout: ICE_TRAY,
        roster: ['chaser', 'blinker', 'ambusher', 'flanker'],
      },
      {
        layout: FREEZER,
        roster: ['chaser', 'snowball', 'blinker', 'wanderer'],
        special: 'thaw',
        goldenBolt: { x: 11, y: 7 },
      },
      {
        layout: DEEP_FREEZE,
        roster: ['chaser', 'snowball', 'blinker', 'snacker', 'ambusher'],
      },
    ],
    story: 'snow-day',
  },
  {
    id: 'arcade',
    number: 5,
    name: 'ARCADE AFTER HOURS',
    phase: 3,
    intro: 'LIGHTS OUT. KEEP TO THE GLOW.',
    newcomers: 'CRACKLE THE STATIC  BOLT THE GATEKEEPER',
    look: { wall: 'purple', neon: 'pink', pattern: 'tiles' },
    music: ARCADE_MUSIC,
    dark: { robot: 3.5, lamp: 2.6 },
    tool: 'lamp',
    mazes: [
      {
        layout: CLAW_ROW,
        roster: ['chaser', 'static', 'ambusher', 'wanderer'],
      },
      {
        layout: DARK_ARCADE,
        roster: ['chaser', 'gatekeeper', 'static', 'flanker'],
        special: 'lamp-lighter',
        goldenBolt: { x: 11, y: 7 },
      },
      {
        layout: HIGH_SCORE_HALL,
        roster: ['chaser', 'static', 'gatekeeper', 'bramble', 'sprinter'],
      },
    ],
    story: 'lights-out',
  },
  {
    id: 'solar',
    number: 6,
    name: 'ROOFTOP SOLAR FARM',
    phase: 3,
    intro: 'SPARKS GROW BACK IN THE SUN. MIRRORS TURN.',
    newcomers: 'PIP AND POP THE TWINS  AND EVERY OLD FRIEND',
    look: { wall: 'gold', neon: 'sky', floor: 'steel', pattern: 'panels' },
    music: SOLAR_MUSIC,
    sun: { day: 60 * 25, night: 60 * 15, respawn: 60 * 6 },
    mirrors: 60 * 8,
    mazes: [
      { layout: PANEL_ROWS, roster: ['chaser', 'twin', 'twin', 'flanker'] },
      {
        layout: SUN_DECK,
        roster: ['chaser', 'twin', 'twin', 'snacker'],
        special: 'sunset-charge',
        goldenBolt: { x: 11, y: 7 },
      },
      {
        layout: THE_ROOFTOP,
        roster: ['twin', 'twin', 'blinker', 'copycat', 'static'],
      },
    ],
    story: 'sunrise',
  },
  {
    id: 'garden',
    number: 7,
    name: 'THE BATTERY GARDEN',
    phase: 4,
    intro: 'SHIFTING PATHS AND PRIZES EVERYWHERE!',
    newcomers: 'ALL OF THEM',
    look: { wall: 'leaf', neon: 'gold', floor: 'leaf', pattern: 'leaves' },
    music: GARDEN_MUSIC,
    mirrors: 60 * 6,
    secret: true,
    mazes: [
      {
        layout: GARDEN_PATHS,
        roster: ['chaser', 'sprinter', 'snacker', 'copycat', 'static'],
      },
      {
        layout: OUTLET_LOOPS,
        roster: ['bramble', 'blinker', 'snowball', 'gatekeeper', 'wanderer'],
      },
      {
        layout: SEEDLING_ROWS,
        roster: ['twin', 'twin', 'chaser', 'ambusher', 'flanker'],
      },
    ],
    story: 'true-ending',
  },
]

export const PHASES: readonly Phase[] = [
  {
    number: 1,
    name: 'MORNING BOOT',
    boards: ['cozy', 'toaster'],
    boss: 'mama',
  },
  {
    number: 2,
    name: 'AFTERNOON LOAD',
    boards: ['greenhouse', 'cold'],
    boss: 'train',
  },
  {
    number: 3,
    name: 'NIGHT SHIFT',
    boards: ['arcade', 'solar'],
    boss: 'overload',
  },
]

/** Prizes rain on the Battery Garden: one rolls in this often. */
export const GARDEN_PRIZE_EVERY = 60 * 8
/** Bloom Run's vines grow faster; Thaw's freezer door shuts; Sunset Charge's long day. */
export const BLOOM_VINES = 60 * 4
export const THAW_TICKS = 60 * 110
export const SUNSET = { day: 60 * 80, bank: 30 }
/** A lamp relights when the robot eats a spark this near it. */
export const LAMP_REACH = 2

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
  'bloom-run': {
    name: 'BLOOM RUN',
    goal: 'OPEN ALL SIX FLOWER GATES BEFORE THE VINES!',
    target: 6,
  },
  thaw: {
    name: 'THAW',
    goal: 'CHARGE IT BEFORE THE FREEZER DOOR SHUTS!',
    target: 1,
  },
  'lamp-lighter': {
    name: 'LAMP LIGHTER',
    goal: 'RELIGHT ALL EIGHT CABINET LAMPS!',
    target: 8,
  },
  'sunset-charge': {
    name: 'SUNSET CHARGE',
    goal: 'BANK THIRTY PANEL SPARKS BEFORE SUNDOWN!',
    target: 30,
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
  | { kind: 'ending'; id: string; secret?: boolean }

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
    // The Bay opens between phases; the last phase ends the campaign.
    if (phase.number < PHASES.length)
      steps.push({ kind: 'bay', phase: phase.number })
  }
  steps.push({ kind: 'ending', id: 'ending' })
  // The secret board, then the true ending (both only with all six golden bolts).
  const garden = boardById('garden')
  steps.push({ kind: 'card', board: garden.id })
  for (const maze of [0, 1, 2] as const)
    steps.push({ kind: 'maze', board: garden.id, maze })
  steps.push({ kind: 'ending', id: garden.story, secret: true })
  return steps
}

export function boardById(id: string): Board {
  const board = BOARDS.find((b) => b.id === id)
  if (!board) throw new Error(`no board ${id}`)
  return board
}

/** Heat climbs one a maze through the campaign; Overclocked (any lap after the first) is late. */
export function heatFor(board: Board, maze: number, lap: number): number {
  return (board.number - 1) * 3 + maze + 1 + (lap > 0 ? OVERCLOCKED_HEAT : 0)
}

/** Whether a step belongs to the secret board or its true ending. */
export function secretStep(step: Step): boolean {
  if (step.kind === 'ending') return !!step.secret
  if (step.kind === 'card' || step.kind === 'maze')
    return !!boardById(step.board).secret
  return false
}

/** A boss maze plays at the heat of the board before it. */
export function bossHeat(phase: number, lap: number): number {
  const last = PHASES[phase - 1]!.boards.at(-1)!
  return heatFor(boardById(last), 2, lap)
}
