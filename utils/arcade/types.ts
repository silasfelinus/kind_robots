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
  /** Same-device players the cabinet can seat (default 1). */
  maxPlayers?: number
}

export type ArcadeGameOptions = {
  rng: () => number
  sound: ArcadeSoundLike
  /** Attract-mode demo: the game drives itself and ignores the input. */
  demo: boolean
  hiScore: number
  /** Players seated for this game (1 unless the game's maxPlayers allows more). */
  players?: number
}

/** The subset of ArcadeSound a game may call (lets tests pass a stub). */
export type ArcadeSoundLike = Pick<ArcadeSound, 'play'>

export interface ArcadeGameInstance {
  readonly score: number
  readonly level: number
  readonly lives: number
  readonly over: boolean
  /**
   * Advance one fixed 1/60 s tick. `input` is player 1's; a game seating more
   * players also gets every seated player's frame, player 1 first.
   */
  update(input: InputFrame, players?: InputFrame[]): void
  /** Draw in logical coordinates (the cabinet has already scaled the context). */
  render(g: CanvasRenderingContext2D): void
}

export type ArcadeGameModule = {
  create(options: ArcadeGameOptions): ArcadeGameInstance
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
