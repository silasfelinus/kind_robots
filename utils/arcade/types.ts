// /utils/arcade/types.ts
//
// Shared contracts for the Kind Robots Arcade (conductor project kr-arcade).
// A game is metadata (which the server and the hall can read without touching
// a canvas) plus a lazily imported module that creates playable instances.

import type { ArcadeSound } from './sound'

export type ArcadeButton =
  'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'start'

export const ARCADE_BUTTONS: ArcadeButton[] = [
  'up',
  'down',
  'left',
  'right',
  'a',
  'b',
  'start',
]

/** One fixed tick of input: what is held, and what went down this tick. */
export type InputFrame = {
  held: Record<ArcadeButton, boolean>
  pressed: Record<ArcadeButton, boolean>
}

/**
 * How a cabinet draws. Every classic cabinet is 'canvas2d' (the default): it
 * draws into the cabinet's 2D canvas. A 'webgl' game (Kind Pinball's 3D table,
 * conductor kind-pinball/t-004) renders into a separate stage canvas stacked
 * under it, while the cabinet keeps drawing its attract, pause and initials
 * screens on the 2D canvas above.
 */
export type ArcadeRenderMode = 'canvas2d' | 'webgl'

/** One rung of a cabinet's mastery ladder (utils/arcade/mastery.ts). */
export type ArcadeMasteryGoal = {
  id: string
  /** What the game shows when it is earned. */
  title: string
  /** What the attract page says to do. */
  hint: string
  /** Shown as question marks until earned, so the guide keeps it hidden. */
  secret?: boolean
}

export type ArcadeGameMeta = {
  slug: string
  title: string
  /** The classic this one riffs on (mechanics only). */
  riffsOn: string
  blurb: string
  /** Short how-to-play lines, drawn in the pixel font on the attract loop. */
  howTo: string[]
  /** Logical playfield size; the cabinet scales it to fit. */
  width: number
  height: number
  /** Server-side plausibility ceiling for a submitted score. */
  maxPlausibleScore: number
  titleArt: string
  /** Accent colour for the cabinet glow and the marquee title. */
  accent: string
  /** One line describing the controls on the cabinet's control panel. */
  controls: string
  /** Omitted for the classic Canvas 2D cabinets. */
  renderMode?: ArcadeRenderMode
  /** Same-device players the cabinet can seat (default 1). */
  maxPlayers?: number
  /** The cabinet's mastery ladder, shown on its how-to-play page. */
  mastery?: readonly ArcadeMasteryGoal[]
}

export type ArcadeGameOptions = {
  rng: () => number
  sound: ArcadeSoundLike
  /** Attract-mode demo: the game drives itself and ignores the input. */
  demo: boolean
  hiScore: number
  /** Players seated for this game (1 unless the game's maxPlayers allows more). */
  players?: number
  /** Mastery goals this player has already earned (announced only when new). */
  mastery?: readonly string[]
}

/** The subset of ArcadeSound a game may call (lets tests pass a stub). */
export type ArcadeSoundLike = Pick<ArcadeSound, 'play'>

export interface ArcadeGameInstance {
  readonly score: number
  readonly level: number
  readonly lives: number
  readonly over: boolean
  /** Mastery goals earned this game, for a cabinet with a ladder. */
  readonly mastered?: readonly string[]
  /**
   * Advance one fixed 1/60 s tick. `input` is player 1's; a game seating more
   * players also gets every seated player's frame, player 1 first.
   */
  update(input: InputFrame, players?: InputFrame[]): void
  /** Draw in logical coordinates (the cabinet has already scaled the context). */
  render(g: CanvasRenderingContext2D): void
}

/**
 * A game that draws with WebGL on the cabinet's stage canvas. It owns GPU,
 * physics and audio resources, so the cabinet mounts it once, tells it the
 * stage size, and disposes it when it leaves the screen.
 */
export interface ArcadeWebGLGameInstance {
  readonly renderMode: 'webgl'
  readonly score: number
  readonly level: number
  readonly lives: number
  readonly over: boolean
  /** Mastery goals earned this game, for a cabinet with a ladder. */
  readonly mastered?: readonly string[]
  /** Attach to the stage canvas and build the scene. */
  mount(canvas: HTMLCanvasElement): void
  /** CSS size of the stage in pixels, and the device pixel ratio to render at. */
  resize(width: number, height: number, dpr: number): void
  /** Advance one fixed 1/60 s tick (`players` as for ArcadeGameInstance). */
  update(input: InputFrame, players?: InputFrame[]): void
  /** Draw the current state to the stage canvas. */
  render(): void
  /** Release every GPU, physics and audio resource; safe to call twice. */
  dispose(): void
}

export type ArcadePlayableInstance =
  ArcadeGameInstance | ArcadeWebGLGameInstance

export function isWebGLInstance(
  instance: ArcadePlayableInstance | null | undefined,
): instance is ArcadeWebGLGameInstance {
  return (
    !!instance &&
    (instance as Partial<ArcadeWebGLGameInstance>).renderMode === 'webgl'
  )
}

export type ArcadeGameModule = {
  create(options: ArcadeGameOptions): ArcadePlayableInstance
}

export function emptyInput(): InputFrame {
  const held = {} as Record<ArcadeButton, boolean>
  const pressed = {} as Record<ArcadeButton, boolean>
  for (const button of ARCADE_BUTTONS) {
    held[button] = false
    pressed[button] = false
  }
  return { held, pressed }
}
