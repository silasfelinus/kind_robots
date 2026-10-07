// /utils/zuzuShowdown/input.ts
//
// Zuzu Showdown's controls on top of the shared arcade ButtonInput: two
// players on one keyboard, a gamepad each, and the touch stick and buttons.
// Each poll becomes a SimInput for the pure sim; Start (pause) stays outside
// the sim.
//
//   P1  WASD to move, U I = LP HP, J K = LK HK, Space = Dodge, O = Special
//   P2  arrows to move, numpad 4 5 = LP HP, 1 2 = LK HK, 0 = Dodge, 6 = Special
//   Solo play adds the arrows to P1. Every binding is remappable (remapKey).

import { AXIS_DEADZONE, ButtonInput } from '../arcade/input'
import { SIM_BUTTONS, neutralInput, type SimInput } from './types'

export const FIGHT_BUTTONS = [...SIM_BUTTONS, 'start'] as const

export type FightButton = (typeof FIGHT_BUTTONS)[number]

export type KeyMap = Record<string, FightButton>

export const P1_KEYS: KeyMap = {
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
  KeyU: 'lp',
  KeyI: 'hp',
  KeyJ: 'lk',
  KeyK: 'hk',
  Space: 'dodge',
  KeyO: 'special',
  Enter: 'start',
}

export const P2_KEYS: KeyMap = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Numpad4: 'lp',
  Numpad5: 'hp',
  Numpad1: 'lk',
  Numpad2: 'hk',
  Numpad0: 'dodge',
  Numpad6: 'special',
  NumpadEnter: 'start',
}

/** One player on the keyboard: P1's keys plus the arrows. */
export const SOLO_KEYS: KeyMap = {
  ...P1_KEYS,
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

/**
 * Standard-mapping gamepad, Street Fighter layout: punches on the top face
 * buttons (X, Y), kicks on the bottom (A, B), Dodge on a left bumper or
 * trigger, Special on a right one.
 */
export function readFightPad(
  pad: Pick<Gamepad, 'buttons' | 'axes'>,
): Partial<Record<FightButton, boolean>> {
  const down = (index: number) => Boolean(pad.buttons[index]?.pressed)
  const x = pad.axes[0] ?? 0
  const y = pad.axes[1] ?? 0
  return {
    lk: down(0),
    hk: down(1),
    lp: down(2),
    hp: down(3),
    dodge: down(4) || down(6),
    special: down(5) || down(7),
    start: down(9),
    up: down(12) || y < -AXIS_DEADZONE,
    down: down(13) || y > AXIS_DEADZONE,
    left: down(14) || x < -AXIS_DEADZONE,
    right: down(15) || x > AXIS_DEADZONE,
  }
}

/**
 * Bind `code` to `button`: the key leaves whatever it did before, and the
 * button's old keys are released. Pure, so the options store can keep maps.
 */
export function remapKey(
  map: KeyMap,
  button: FightButton,
  code: string,
): KeyMap {
  const next: KeyMap = {}
  for (const [key, bound] of Object.entries(map)) {
    if (key !== code && bound !== button) next[key] = bound
  }
  next[code] = button
  return next
}

/** One player's input: their keys, and one gamepad slot (or none). */
export function createPlayerInput(
  keyMap: KeyMap,
  padIndex: number | null,
): ButtonInput<FightButton> {
  return new ButtonInput<FightButton>({
    buttons: FIGHT_BUTTONS,
    keyMap,
    readPad: readFightPad,
    // A negative slot reads no pad at all.
    padIndex: padIndex ?? -1,
    passThrough: ['start'],
  })
}

/** The held buttons as the sim's input (Start stays with the page). */
export function toSimInput(held: Record<FightButton, boolean>): SimInput {
  const input = neutralInput()
  for (const button of SIM_BUTTONS) input[button] = held[button]
  return input
}
