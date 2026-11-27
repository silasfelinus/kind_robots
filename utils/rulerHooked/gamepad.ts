import {
  newPadMemory,
  readPad,
  type ConsoleCommand,
  type PadMemory,
} from '~/utils/consoleInput'

export type RoyalPadCommand = ConsoleCommand | 'fishopedia'

interface RoyalPadMemory {
  input: PadMemory
  index: number | null
  x: boolean
}

export function newRoyalPadMemory(): RoyalPadMemory {
  return { input: newPadMemory(), index: null, x: false }
}

export function readRoyalPad(
  gamepad: Gamepad | null,
  memory: RoyalPadMemory,
  now: number,
  active: boolean,
): RoyalPadCommand[] {
  const index = gamepad?.index ?? null
  if (index !== memory.index) {
    memory.input.held.clear()
    memory.index = index
    memory.x = false
  }
  if (!gamepad) return []

  const commands: RoyalPadCommand[] = readPad(gamepad, memory.input, now)
  const x = !!gamepad.buttons[2]?.pressed
  if (x && !memory.x) commands.push('fishopedia')
  memory.x = x
  return active ? commands : []
}
