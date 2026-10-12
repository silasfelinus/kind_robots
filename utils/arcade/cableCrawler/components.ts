// /utils/arcade/cableCrawler/components.ts
//
// The Mainframe's components (conductor kr-arcade/t-064, spec: conductor
// projects/kr-arcade/depth-pass/CABINETS.md section 8). Each component is a world: five authored
// mazes, a Screensaver bonus board after the third, and a boss board, with its own spark set,
// board art, music and pace. The campaign walks them in order; content is data here, never a
// branch in the update loop.

import type { MusicLoop } from '../sound'
import { RAMPS, type Ramp } from '../snes'
import {
  FUSE_BOX,
  POWER_STRIP_MAZES,
  STARFIELD,
  type MazeLayout,
} from './mazes'
import { BOSS_MUSIC, POWER_STRIP_MUSIC, SCREENSAVER_MUSIC } from './music'

/** The spark sprite set a component uses. */
export type SparkSet = 'bolt'
/** The Screensaver bonus board a component plays after its third maze. */
export type ScreensaverKind = 'starfield'
/** The boss at the end of a component. */
export type BossKind = 'surge-protector'

export type ComponentLook = {
  /** The wall slabs' ramp. */
  wall: Ramp
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

/** The components in campaign order. */
export const COMPONENTS: readonly Component[] = [POWER_STRIP]

export { BOSS_MUSIC, SCREENSAVER_MUSIC }

export type Step =
  | { kind: 'maze'; index: number; layout: MazeLayout }
  | { kind: 'screensaver'; layout: MazeLayout }
  | { kind: 'boss'; layout: MazeLayout }

/** A component's boards in order: three mazes, the Screensaver, two mazes, the boss. */
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
  ]
}

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
