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

export function runRoyalQuizPad(
  root: HTMLElement | null,
  command: RoyalPadCommand,
): void {
  if (!root) return
  if (
    command !== 'confirm' &&
    command !== 'left' &&
    command !== 'right' &&
    command !== 'up' &&
    command !== 'down'
  )
    return

  const buttons = [
    ...root.querySelectorAll<HTMLButtonElement>('button'),
  ].filter(
    (button) =>
      !button.disabled &&
      button.getAttribute('aria-disabled') !== 'true' &&
      button.getClientRects().length > 0 &&
      !button.closest('[inert], [aria-hidden="true"]'),
  )
  if (!buttons.length) return

  const current = buttons.findIndex(
    (button) => button === root.ownerDocument.activeElement,
  )
  if (command === 'confirm') {
    if (current < 0) buttons[0]?.focus()
    else buttons[current]?.click()
    return
  }

  const step = command === 'left' || command === 'up' ? -1 : 1
  const next =
    current < 0 ? 0 : (current + step + buttons.length) % buttons.length
  buttons[next]?.focus()
}
