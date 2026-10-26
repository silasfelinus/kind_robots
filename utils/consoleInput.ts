// Console-style input for menu surfaces (Playbook Forge, playbook kit shells):
// one focused element at a time, moved by arrows, D-pad or left stick, with
// buttons mapped to a small set of commands. Stateless helpers; the component
// that owns the surface wires them to its own listeners.

export type ConsoleCommand =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'confirm'
  | 'back'
  | 'prevTab'
  | 'nextTab'
  | 'start'
  | 'details'

export type InputDevice = 'keyboard' | 'gamepad' | 'touch'

export const KEY_COMMANDS: Record<string, ConsoleCommand> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Enter: 'confirm',
  Space: 'confirm',
  Escape: 'back',
  Backspace: 'back',
  KeyQ: 'prevTab',
  KeyE: 'nextTab',
  PageUp: 'prevTab',
  PageDown: 'nextTab',
  KeyF: 'start',
  KeyY: 'details',
}

/** Standard-mapping gamepad buttons (A B X Y LB RB … Start, D-pad). */
const PAD_BUTTONS: Partial<Record<number, ConsoleCommand>> = {
  0: 'confirm',
  1: 'back',
  3: 'details',
  4: 'prevTab',
  5: 'nextTab',
  9: 'start',
  12: 'up',
  13: 'down',
  14: 'left',
  15: 'right',
}

const STICK_DEADZONE = 0.55
const REPEAT_DELAY_MS = 380
const REPEAT_RATE_MS = 120

export type PadMemory = { held: Map<ConsoleCommand, number> }

export function newPadMemory(): PadMemory {
  return { held: new Map() }
}

/** Commands to fire this frame: new presses plus held directions on repeat. */
export function readPad(
  pad: Gamepad,
  memory: PadMemory,
  now: number,
): ConsoleCommand[] {
  const down = new Set<ConsoleCommand>()
  pad.buttons.forEach((button, index) => {
    const command = PAD_BUTTONS[index]
    if (command && button.pressed) down.add(command)
  })
  const [x = 0, y = 0] = pad.axes
  if (y < -STICK_DEADZONE) down.add('up')
  if (y > STICK_DEADZONE) down.add('down')
  if (x < -STICK_DEADZONE) down.add('left')
  if (x > STICK_DEADZONE) down.add('right')

  const fire: ConsoleCommand[] = []
  for (const command of down) {
    const since = memory.held.get(command)
    const repeats =
      command === 'up' ||
      command === 'down' ||
      command === 'left' ||
      command === 'right'
    if (since === undefined) {
      fire.push(command)
      memory.held.set(command, now)
    } else if (repeats && now - since > REPEAT_DELAY_MS) {
      fire.push(command)
      memory.held.set(command, now - REPEAT_DELAY_MS + REPEAT_RATE_MS)
    }
  }
  for (const command of [...memory.held.keys()])
    if (!down.has(command)) memory.held.delete(command)
  return fire
}

const NAV_SELECTOR = '[data-nav]:not([disabled]):not([aria-hidden="true"])'

function visible(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0
}

/**
 * Moves focus to the nearest navigable element in a direction, preferring
 * elements aligned with the current one, as a console menu does.
 */
export function moveFocus(
  root: HTMLElement,
  direction: 'up' | 'down' | 'left' | 'right',
): boolean {
  const items = [...root.querySelectorAll<HTMLElement>(NAV_SELECTOR)].filter(
    visible,
  )
  if (!items.length) return false
  const current = document.activeElement as HTMLElement | null
  if (!current || !items.includes(current)) {
    items[0]!.focus()
    return true
  }
  const a = current.getBoundingClientRect()
  const ax = a.left + a.width / 2
  const ay = a.top + a.height / 2
  let best: HTMLElement | null = null
  let bestScore = Infinity
  for (const item of items) {
    if (item === current) continue
    const b = item.getBoundingClientRect()
    const bx = b.left + b.width / 2
    const by = b.top + b.height / 2
    const dx = bx - ax
    const dy = by - ay
    const along =
      direction === 'up'
        ? -dy
        : direction === 'down'
          ? dy
          : direction === 'left'
            ? -dx
            : dx
    if (along <= 4) continue
    const across =
      direction === 'up' || direction === 'down' ? Math.abs(dx) : Math.abs(dy)
    const score = along + across * 2.2
    if (score < bestScore) {
      bestScore = score
      best = item
    }
  }
  if (!best) return false
  best.focus()
  best.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  return true
}

/** Typing in a field keeps the keyboard; only Escape leaves it. */
export function isTextEntry(el: Element | null): boolean {
  return (
    !!el &&
    (el.tagName === 'TEXTAREA' ||
      (el.tagName === 'INPUT' && (el as HTMLInputElement).type !== 'range'))
  )
}
