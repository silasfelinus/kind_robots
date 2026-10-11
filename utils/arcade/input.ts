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
//
// Twin-stick aim (conductor kr-arcade t-027): a cabinet whose game sets
// `twinStick` turns aiming on while it plays, and each frame then carries an
// optional `aim` vector from the gamepad's right stick, the on-screen aim
// stick, or a split keyboard (move on WASD, aim on the arrows). With aiming
// off (every other cabinet) frames are exactly as before.

import {
  ARCADE_BUTTONS,
  type AimVector,
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
 * One player takes every pad. With a pad for everyone, they go in seat order.
 * With too few, the players with no keys of their own (3 and 4) get one
 * first, then player 2, then player 1 (who has the left of the keyboard).
 */
export function assignPads(
  connected: readonly number[],
  players: number,
): Array<number | null> {
  if (players <= 1) return [null]
  const seats: Array<number | null> = Array.from({ length: players }, () => -1)
  if (connected.length >= players) {
    seats.forEach((_, seat) => (seats[seat] = connected[seat]!))
    return seats
  }
  const need = [...Array.from({ length: players - 2 }, (_, i) => i + 2), 1, 0]
  need
    .slice(0, connected.length)
    .sort((a, b) => a - b)
    .forEach((seat, i) => (seats[seat] = connected[i]!))
  return seats
}

/**
 * Mid-game, a pad stays with whoever has it: one that drops leaves its seat
 * padless, and one that turns up goes to a seat without one (keyless seats
 * first), so nobody's controller ever starts driving somebody else.
 */
export function keepPads(
  current: ReadonlyArray<number | null>,
  connected: readonly number[],
  players: number,
): Array<number | null> {
  if (players <= 1) return [null]
  const seats: Array<number | null> = Array.from(
    { length: players },
    (_, i) => {
      const pad = current[i]
      return pad != null && pad >= 0 && connected.includes(pad) ? pad : -1
    },
  )
  const free = connected.filter((pad) => !seats.includes(pad))
  const need = [...Array.from({ length: players - 2 }, (_, i) => i + 2), 1, 0]
  for (const seat of need) {
    if (!free.length) break
    if (seats[seat] === -1) seats[seat] = free.shift()!
  }
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

/** Below this a stick's push is drift, not aim. */
export const AIM_DEADZONE = 0.3

/** A stick's axes as an aim: null inside the dead zone, length clamped to 1 (pure). */
export function stickAim(
  x: number,
  y: number,
  deadzone = AIM_DEADZONE,
): AimVector | null {
  const length = Math.hypot(x, y)
  if (!(length > deadzone)) return null
  const k = Math.min(1, length) / length
  return { x: x * k, y: y * k }
}

/** A standard-mapping gamepad's right stick (axes 2 and 3) as an aim, or null. */
export function readAimStick(pad: Pick<Gamepad, 'axes'>): AimVector | null {
  return stickAim(pad.axes[2] ?? 0, pad.axes[3] ?? 0)
}

export type AimKey = 'up' | 'down' | 'left' | 'right'

/** Split keyboard for a twin-stick game: move on WASD... */
export const TWIN_KEYS: Record<string, ArcadeButton> = {
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
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

/** ...and aim on the arrows. */
export const AIM_KEYS: Record<string, AimKey> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

/** Aim keys held as an eight-way unit aim, or null (pure). */
export function aimFromKeys(
  held: Partial<Record<AimKey, boolean>>,
): AimVector | null {
  const x = (held.right ? 1 : 0) - (held.left ? 1 : 0)
  const y = (held.down ? 1 : 0) - (held.up ? 1 : 0)
  if (!x && !y) return null
  const length = Math.hypot(x, y)
  return { x: x / length, y: y / length }
}

/** The live aim from several sources: the first that aims wins (touch, then pads, then keys). */
export function combineAim(
  sources: ReadonlyArray<AimVector | null | undefined>,
): AimVector | null {
  for (const aim of sources) if (aim) return aim
  return null
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

/** A frame of buttons, with a twin-stick aim while aiming is on and something aims. */
export type ButtonFrame<B extends string> = {
  held: Record<B, boolean>
  pressed: Record<B, boolean>
  aim?: AimVector
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
  /** Twin-stick aiming: off unless the cabinet's game asks for it. */
  private aiming = false
  private aimKeyMap: Record<string, AimKey> = {}
  private aimKeys: Partial<Record<AimKey, boolean>> = {}
  private aimTouch: AimVector | null = null

  constructor(private options: ButtonInputOptions<B>) {}

  /** Read only this gamepad slot (null: every pad, -1: none). */
  setPadIndex(padIndex: number | null) {
    this.options = { ...this.options, padIndex }
  }

  /**
   * Turn twin-stick aiming on (with the keys that aim) or off. Off, poll() never reports an aim
   * and the aim keys are ordinary keys again.
   */
  setAiming(on: boolean, aimKeys: Record<string, AimKey> = AIM_KEYS) {
    this.aiming = on
    this.aimKeyMap = on ? aimKeys : {}
    this.aimKeys = {}
    if (!on) this.aimTouch = null
  }

  /** The on-screen aim stick's vector (null when no finger is on it). */
  setAimTouch(aim: AimVector | null) {
    this.aimTouch = this.aiming ? aim : null
  }

  /** Swap the key bindings (remapping) and drop anything held. */
  setKeyMap(keyMap: Record<string, B>) {
    this.options = { ...this.options, keyMap }
    this.keys = {}
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const aimKey = this.aimKeyMap[event.code]
    if (aimKey && !(event.target instanceof HTMLInputElement)) {
      event.preventDefault()
      this.aimKeys[aimKey] = true
      return
    }
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
    const aimKey = this.aimKeyMap[event.code]
    if (aimKey) {
      this.aimKeys[aimKey] = false
      return
    }
    const button = this.options.keyMap[event.code]
    if (!button) return
    this.keys[button] = false
  }

  private onBlur = () => {
    this.keys = {}
    this.touch = {}
    this.aimKeys = {}
    this.aimTouch = null
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
    this.aimKeys = {}
    this.aimTouch = null
  }

  poll(): ButtonFrame<B> {
    const sources: Array<Partial<Record<B, boolean>>> = [
      this.keys,
      this.touch,
      this.taps,
    ]
    const sticks: Array<AimVector | null> = []
    if (typeof navigator !== 'undefined' && navigator.getGamepads) {
      const slot = this.options.padIndex ?? null
      const pads = navigator.getGamepads()
      for (let index = 0; index < pads.length; index += 1) {
        const pad = pads[index]
        if (pad && (slot === null || slot === index)) {
          sources.push(this.options.readPad(pad))
          if (this.aiming) sticks.push(readAimStick(pad))
        }
      }
    }
    const frame: ButtonFrame<B> = combineButtons(
      this.options.buttons,
      this.last,
      sources,
    )
    this.last = frame.held
    this.taps = {}
    if (this.aiming) {
      const aim = combineAim([
        this.aimTouch,
        ...sticks,
        aimFromKeys(this.aimKeys),
      ])
      if (aim) frame.aim = aim
    }
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
