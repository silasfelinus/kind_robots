// /utils/arcade/input.ts
//
// One input model for keyboard, gamepad and the cabinet's on-screen touch
// controls. Each fixed tick calls poll() and gets what is held plus what went
// down since the previous poll.
//
// ButtonInput is generic over the button set, so a game with more buttons or
// two players (Zuzu Showdown) reuses the same keyboard, touch, tap and gamepad
// handling with its own key map and pad reader. ArcadeInput is the cabinet's
// seven-button instance.

import { ARCADE_BUTTONS, type ArcadeButton, type InputFrame } from './types'

export const KEY_MAP: Record<string, ArcadeButton> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Space: 'a',
  KeyZ: 'a',
  KeyJ: 'a',
  KeyX: 'b',
  KeyK: 'b',
  ShiftLeft: 'b',
  ShiftRight: 'b',
  Enter: 'start',
  NumpadEnter: 'start',
}

/** Two on one keyboard: player 1 on the left of the board... */
export const P1_KEYS: Record<string, ArcadeButton> = {
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
  Space: 'a',
  KeyF: 'a',
  KeyZ: 'a',
  KeyG: 'b',
  KeyX: 'b',
  ShiftLeft: 'b',
  Enter: 'start',
}

/** ...and player 2 on the arrows, with the keys beside them. */
export const P2_KEYS: Record<string, ArcadeButton> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Slash: 'a',
  Numpad0: 'a',
  Period: 'b',
  ShiftRight: 'b',
  NumpadDecimal: 'b',
  NumpadEnter: 'start',
}

/**
 * Which gamepad slot each seated player reads (null: every pad, -1: none).
 * One player takes every pad. With two, the first two pads go one each; a
 * lone pad goes to player 2, since player 1 has the left of the keyboard.
 */
export function assignPads(
  connected: readonly number[],
  players: number,
): Array<number | null> {
  if (players <= 1) return [null]
  const seats: Array<number | null> = Array.from({ length: players }, () => -1)
  if (connected.length === 1) {
    seats[1] = connected[0]!
    return seats
  }
  connected.slice(0, players).forEach((pad, seat) => (seats[seat] = pad))
  return seats
}

export const AXIS_DEADZONE = 0.4

/** Standard-mapping gamepad -> abstract buttons (pure, for tests). */
export function readGamepad(
  pad: Pick<Gamepad, 'buttons' | 'axes'>,
): Partial<Record<ArcadeButton, boolean>> {
  const down = (index: number) => Boolean(pad.buttons[index]?.pressed)
  const x = pad.axes[0] ?? 0
  const y = pad.axes[1] ?? 0
  return {
    a: down(0) || down(2),
    b: down(1) || down(3),
    start: down(9),
    up: down(12) || y < -AXIS_DEADZONE,
    down: down(13) || y > AXIS_DEADZONE,
    left: down(14) || x < -AXIS_DEADZONE,
    right: down(15) || x > AXIS_DEADZONE,
  }
}

/** Fold the raw sources into one frame, deriving edges from the last frame. */
export function combineButtons<B extends string>(
  buttons: readonly B[],
  previous: Partial<Record<B, boolean>>,
  sources: Array<Partial<Record<B, boolean>>>,
): { held: Record<B, boolean>; pressed: Record<B, boolean> } {
  const held = {} as Record<B, boolean>
  const pressed = {} as Record<B, boolean>
  for (const button of buttons) {
    held[button] = sources.some((source) => source[button] === true)
    pressed[button] = held[button] && !previous[button]
  }
  return { held, pressed }
}

/** The cabinet's seven buttons folded into one frame. */
export function combineFrame(
  previous: Record<ArcadeButton, boolean>,
  sources: Array<Partial<Record<ArcadeButton, boolean>>>,
): InputFrame {
  return combineButtons(ARCADE_BUTTONS, previous, sources)
}

export type ButtonInputOptions<B extends string> = {
  buttons: readonly B[]
  keyMap: Record<string, B>
  readPad: (
    pad: Pick<Gamepad, 'buttons' | 'axes'>,
  ) => Partial<Record<B, boolean>>
  /** Read only this gamepad slot; null reads every connected pad. */
  padIndex?: number | null
  /** Buttons that stay with a focused <button> or <a> instead of the game. */
  passThrough?: readonly B[]
}

export class ButtonInput<B extends string> {
  private keys: Partial<Record<B, boolean>> = {}
  private touch: Partial<Record<B, boolean>> = {}
  /** Keys tapped and released between two polls still count once. */
  private taps: Partial<Record<B, boolean>> = {}
  private last: Partial<Record<B, boolean>> = {}
  private target: Window | null = null
  /** While typing initials, letter and digit keys are text, not buttons. */
  typing = false

  constructor(private options: ButtonInputOptions<B>) {}

  /** Read only this gamepad slot (null: every pad, -1: none). */
  setPadIndex(padIndex: number | null) {
    this.options = { ...this.options, padIndex }
  }

  /** Swap the key bindings (remapping) and drop anything held. */
  setKeyMap(keyMap: Record<string, B>) {
    this.options = { ...this.options, keyMap }
    this.keys = {}
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const button = this.options.keyMap[event.code]
    if (!button) return
    if (event.target instanceof HTMLInputElement) return
    if (this.typing && /^(Key|Digit)/.test(event.code)) return
    // Enter/Space on a focused button or link keep activating it.
    if (
      (this.options.passThrough?.includes(button) || event.code === 'Space') &&
      event.target instanceof Element &&
      event.target.closest('button, a')
    ) {
      return
    }
    event.preventDefault()
    this.keys[button] = true
    this.taps[button] = true
  }

  private onKeyUp = (event: KeyboardEvent) => {
    const button = this.options.keyMap[event.code]
    if (!button) return
    this.keys[button] = false
  }

  private onBlur = () => {
    this.keys = {}
    this.touch = {}
  }

  attach(target: Window = window) {
    this.target = target
    target.addEventListener('keydown', this.onKeyDown)
    target.addEventListener('keyup', this.onKeyUp)
    target.addEventListener('blur', this.onBlur)
  }

  detach() {
    if (!this.target) return
    this.target.removeEventListener('keydown', this.onKeyDown)
    this.target.removeEventListener('keyup', this.onKeyUp)
    this.target.removeEventListener('blur', this.onBlur)
    this.target = null
  }

  setTouch(button: B, down: boolean) {
    this.touch[button] = down
    if (down) this.taps[button] = true
  }

  clear() {
    this.keys = {}
    this.touch = {}
    this.taps = {}
  }

  poll(): { held: Record<B, boolean>; pressed: Record<B, boolean> } {
    const sources: Array<Partial<Record<B, boolean>>> = [
      this.keys,
      this.touch,
      this.taps,
    ]
    if (typeof navigator !== 'undefined' && navigator.getGamepads) {
      const slot = this.options.padIndex ?? null
      const pads = navigator.getGamepads()
      for (let index = 0; index < pads.length; index += 1) {
        const pad = pads[index]
        if (pad && (slot === null || slot === index)) {
          sources.push(this.options.readPad(pad))
        }
      }
    }
    const frame = combineButtons(this.options.buttons, this.last, sources)
    this.last = frame.held
    this.taps = {}
    return frame
  }
}

export class ArcadeInput extends ButtonInput<ArcadeButton> {
  constructor(keyMap: Record<string, ArcadeButton> = KEY_MAP) {
    super({
      buttons: ARCADE_BUTTONS,
      keyMap,
      readPad: readGamepad,
      passThrough: ['start'],
    })
  }
}
