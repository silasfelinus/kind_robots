// /utils/arcade/input.ts
//
// One input model for keyboard, gamepad and the cabinet's on-screen touch
// controls. Each fixed tick calls poll() and gets what is held plus what went
// down since the previous poll.

import {
  ARCADE_BUTTONS,
  emptyInput,
  type ArcadeButton,
  type InputFrame,
} from './types'

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

const AXIS_DEADZONE = 0.4

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
export function combineFrame(
  previous: Record<ArcadeButton, boolean>,
  sources: Array<Partial<Record<ArcadeButton, boolean>>>,
): InputFrame {
  const frame = emptyInput()
  for (const button of ARCADE_BUTTONS) {
    const held = sources.some((source) => source[button] === true)
    frame.held[button] = held
    frame.pressed[button] = held && !previous[button]
  }
  return frame
}

export class ArcadeInput {
  private keys: Partial<Record<ArcadeButton, boolean>> = {}
  private touch: Partial<Record<ArcadeButton, boolean>> = {}
  /** Keys tapped and released between two polls still count once. */
  private taps: Partial<Record<ArcadeButton, boolean>> = {}
  private last: Record<ArcadeButton, boolean> = emptyInput().held
  private target: Window | null = null
  /** While typing initials, letter and digit keys are text, not buttons. */
  typing = false

  private onKeyDown = (event: KeyboardEvent) => {
    const button = KEY_MAP[event.code]
    if (!button) return
    if (event.target instanceof HTMLInputElement) return
    if (this.typing && /^(Key|Digit)/.test(event.code)) return
    // Enter/Space on a focused button or link keep activating it.
    if (
      (button === 'start' || event.code === 'Space') &&
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
    const button = KEY_MAP[event.code]
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

  setTouch(button: ArcadeButton, down: boolean) {
    this.touch[button] = down
    if (down) this.taps[button] = true
  }

  clear() {
    this.keys = {}
    this.touch = {}
    this.taps = {}
  }

  poll(): InputFrame {
    const sources: Array<Partial<Record<ArcadeButton, boolean>>> = [
      this.keys,
      this.touch,
      this.taps,
    ]
    if (typeof navigator !== 'undefined' && navigator.getGamepads) {
      for (const pad of navigator.getGamepads()) {
        if (pad) sources.push(readGamepad(pad))
      }
    }
    const frame = combineFrame(this.last, sources)
    this.last = frame.held
    this.taps = {}
    return frame
  }
}
