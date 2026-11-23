import { ARCADE_BUTTONS, emptyInput, type InputFrame } from '../types'

export const MAKER_REPLAY_MAX_FRAMES = 60 * 60 * 10

/** An unchanged Maker course always starts from the same random sequence. */
export function makerReplayRandom(courseId: string): () => number {
  let state = Number.parseInt(courseId, 36) >>> 0
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

/** Two bits per button: one for held input and one for the press edge. */
export function packMakerReplayFrame(input: InputFrame): number {
  let bits = 0
  for (let i = 0; i < ARCADE_BUTTONS.length; i++) {
    const button = ARCADE_BUTTONS[i]!
    if (input.held[button]) bits |= 1 << i
    if (input.pressed[button]) bits |= 1 << (i + ARCADE_BUTTONS.length)
  }
  return bits
}

export function unpackMakerReplayFrame(bits: number): InputFrame {
  const frame = emptyInput()
  for (let i = 0; i < ARCADE_BUTTONS.length; i++) {
    const button = ARCADE_BUTTONS[i]!
    frame.held[button] = Boolean(bits & (1 << i))
    frame.pressed[button] = Boolean(
      bits & (1 << (i + ARCADE_BUTTONS.length)),
    )
  }
  return frame
}
