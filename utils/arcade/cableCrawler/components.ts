// /utils/arcade/cableCrawler/components.ts
//
// The Mainframe's components (conductor kr-arcade/t-064 on, spec: conductor
// projects/kr-arcade/depth-pass/CABINETS.md section 8). Each component is a world: five authored
// mazes, a Screensaver bonus board after the third, and a boss board, with its own spark set,
// board art, music and pace, and the Workbench after it. The campaign walks them in order;
// content is data here, never a branch in the update loop.

import type { MusicLoop } from '../sound'
import { RAMPS, type Ramp } from '../snes'
import {
  FUSE_BOX,
  POWER_STRIP_MAZES,
  STARFIELD,
  type MazeLayout,
} from './mazes'
import { BREEZE, COOLING_FAN_MAZES, FAN_ROOM } from './mazesFan'
import { EQUALISER, SOUND_CARD_MAZES, SPEAKER_ROOM } from './mazesSound'
import { DEFRAG, RAM_ROWS_MAZES, THE_HEAP } from './mazesRam'
import {
  BOSS_MUSIC,
  COOLING_FAN_MUSIC,
  POWER_STRIP_MUSIC,
  RAM_ROWS_MUSIC,
  SCREENSAVER_MUSIC,
  SOUND_CARD_MUSIC,
  WORKBENCH_MUSIC,
} from './music'

/** The spark sprite set a component uses: bolts, bits, snowflakes or notes. */
export type SparkSet = 'bolt' | 'bit' | 'flake' | 'note'
/** The Screensaver bonus board a component plays after its third maze. */
export type ScreensaverKind = 'starfield' | 'defrag' | 'breeze' | 'equaliser'
/** The boss at the end of a component. */
export type BossKind =
  'surge-protector' | 'memory-leak' | 'big-whirr' | 'subwoofer'
/** How a component's wall slabs are dressed: outlet plastic, RAM chips, or cooling fins. */
export type WallStyle = 'plastic' | 'chips' | 'fins' | 'speakers'

export type ComponentLook = {
  /** The wall slabs' ramp. */
  wall: Ramp
  wallStyle: WallStyle
  /** The board under them, top band to bottom. */
  floor: readonly [string, string, string, string]
  /** Etched traces through the corridors. */
  trace: string
  /** The accent the HUD and banners wear. */
  accent: Ramp
  spark: SparkSet
}

export type Component = {
  id: string
  number: number
  name: string
  /** One line for the component's title card. */
  tagline: string
  mazes: readonly MazeLayout[]
  screensaver: { kind: ScreensaverKind; layout: MazeLayout; name: string }
  boss: { kind: BossKind; layout: MazeLayout; name: string }
  look: ComponentLook
  /** Ticks per cell the plug crawls on the first maze (each maze after is a little quicker). */
  step: number
  /** Battery on the first maze, in seconds (each maze after has a little less). */
  battery: number
  /** Ticks per cell a static bug wanders. */
  bugStep: number
  music: MusicLoop
}

export const POWER_STRIP: Component = {
  id: 'power-strip',
  number: 1,
  name: 'THE POWER STRIP',
  tagline: 'PLUG IN AND SURGE',
  mazes: POWER_STRIP_MAZES,
  screensaver: { kind: 'starfield', layout: STARFIELD, name: 'STARFIELD' },
  boss: {
    kind: 'surge-protector',
    layout: FUSE_BOX,
    name: 'THE SURGE PROTECTOR',
  },
  look: {
    wall: RAMPS.cream,
    wallStyle: 'plastic',
    floor: ['#3a2a3f', '#2d2036', '#21182c', '#170f22'],
    trace: '#7a3d22',
    accent: RAMPS.rust,
    spark: 'bolt',
  },
  step: 8,
  battery: 90,
  bugStep: 15,
  music: POWER_STRIP_MUSIC,
}

export const RAM_ROWS: Component = {
  id: 'ram-rows',
  number: 2,
  name: 'RAM ROWS',
  tagline: 'MIND THE CRABS AND DIODES',
  mazes: RAM_ROWS_MAZES,
  screensaver: { kind: 'defrag', layout: DEFRAG, name: 'DEFRAG' },
  boss: { kind: 'memory-leak', layout: THE_HEAP, name: 'THE MEMORY LEAK' },
  look: {
    wall: RAMPS.leaf,
    wallStyle: 'chips',
    floor: ['#163326', '#11281f', '#0c1f18', '#071510'],
    trace: '#b88a2a',
    accent: RAMPS.leaf,
    spark: 'bit',
  },
  step: 7.5,
  battery: 85,
  bugStep: 14,
  music: RAM_ROWS_MUSIC,
}

export const COOLING_FAN: Component = {
  id: 'cooling-fan',
  number: 3,
  name: 'THE COOLING FAN',
  tagline: 'RIDE THE AIR, DODGE THE HEAT',
  mazes: COOLING_FAN_MAZES,
  screensaver: { kind: 'breeze', layout: BREEZE, name: 'BREEZE' },
  boss: { kind: 'big-whirr', layout: FAN_ROOM, name: 'THE BIG WHIRR' },
  look: {
    wall: RAMPS.sky,
    wallStyle: 'fins',
    floor: ['#1a2a44', '#14223a', '#0e1a2f', '#091224'],
    trace: '#4a6c8f',
    accent: RAMPS.sky,
    spark: 'flake',
  },
  step: 7,
  battery: 80,
  bugStep: 13,
  music: COOLING_FAN_MUSIC,
}

export const SOUND_CARD: Component = {
  id: 'sound-card',
  number: 4,
  name: 'THE SOUND CARD',
  tagline: 'MOVE TO THE BEAT, MIND YOUR ECHO',
  mazes: SOUND_CARD_MAZES,
  screensaver: { kind: 'equaliser', layout: EQUALISER, name: 'EQUALISER' },
  boss: { kind: 'subwoofer', layout: SPEAKER_ROOM, name: 'THE SUBWOOFER' },
  look: {
    wall: RAMPS.purple,
    wallStyle: 'speakers',
    floor: ['#2e1a3a', '#25152f', '#1b0f25', '#12081b'],
    trace: '#8a3d8f',
    accent: RAMPS.pink,
    spark: 'note',
  },
  step: 6.5,
  battery: 78,
  bugStep: 12,
  music: SOUND_CARD_MUSIC,
}

/** The components in campaign order. */
export const COMPONENTS: readonly Component[] = [
  POWER_STRIP,
  RAM_ROWS,
  COOLING_FAN,
  SOUND_CARD,
]

export { BOSS_MUSIC, SCREENSAVER_MUSIC, WORKBENCH_MUSIC }

export type Step =
  | { kind: 'maze'; index: number; layout: MazeLayout }
  | { kind: 'screensaver'; layout: MazeLayout }
  | { kind: 'boss'; layout: MazeLayout }
  | { kind: 'workbench' }

/**
 * A component's boards in order: three mazes, the Screensaver, two mazes, the boss, and then
 * the Workbench before the next component.
 */
export function componentSteps(c: Component): Step[] {
  const maze = (index: number): Step => ({
    kind: 'maze',
    index,
    layout: c.mazes[index]!,
  })
  return [
    maze(0),
    maze(1),
    maze(2),
    { kind: 'screensaver', layout: c.screensaver.layout },
    maze(3),
    maze(4),
    { kind: 'boss', layout: c.boss.layout },
    { kind: 'workbench' },
  ]
}

/** The boards a component plays (every step but the Workbench). */
export const BOARDS_PER_COMPONENT = 7

/** The component at a campaign index, and how many laps of the Mainframe came before it. */
export function componentAt(index: number): {
  component: Component
  lap: number
} {
  return {
    component: COMPONENTS[index % COMPONENTS.length]!,
    lap: Math.floor(index / COMPONENTS.length),
  }
}

/** Every maze id that hides a golden byte. */
export const BYTE_MAZES: readonly string[] = COMPONENTS.flatMap((c) =>
  c.mazes.map((m) => m.id),
)
