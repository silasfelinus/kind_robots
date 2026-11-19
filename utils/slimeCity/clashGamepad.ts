// Gamepad binding for Slime City Clash (conductor slime-city/t-012 input pass).
//
// Clash is already fully keyboard reachable: every card, alley, power and the
// FIGHT button is a real <button>. The gamepad therefore drives the same
// controls as a console menu would: the D-pad or left stick moves focus
// spatially, A presses the focused control, LB/RB step through the hand,
// Start sends the crew in (FIGHT), Y peeks at the rival hand, and B closes
// the match report or returns focus to the hand.
//
// planClashPadCommand is pure (tested without a DOM); runClashPadCommand
// applies a plan to the live Clash section.
import { moveFocus, type ConsoleCommand } from '../consoleInput'

export const CLASH_FOCUSABLE =
  'button:not([disabled]):not([aria-hidden="true"]), a[href], [tabindex]:not([tabindex="-1"])'

export type ClashPadContext = {
  /** The match report dialog is open. */
  reportOpen: boolean
  /** Focus is currently inside the Clash section (or its report). */
  focusInside: boolean
  /** Number of cards in the visible hand. */
  handSize: number
  /** Index of the focused hand card, or -1 when focus is elsewhere. */
  focusedHandIndex: number
}

export type ClashPadPlan =
  | { kind: 'move'; direction: 'up' | 'down' | 'left' | 'right' }
  | { kind: 'press-focused' }
  | { kind: 'focus-first' }
  | { kind: 'click'; testid: string }
  | { kind: 'focus'; testid: string }
  | { kind: 'none' }

export function planClashPadCommand(
  command: ConsoleCommand,
  ctx: ClashPadContext,
): ClashPadPlan {
  switch (command) {
    case 'up':
    case 'down':
    case 'left':
    case 'right':
      return ctx.focusInside
        ? { kind: 'move', direction: command }
        : { kind: 'focus-first' }
    case 'confirm':
      return ctx.focusInside
        ? { kind: 'press-focused' }
        : { kind: 'focus-first' }
    case 'start':
      return ctx.reportOpen
        ? { kind: 'click', testid: 'slime-match-report-rematch' }
        : { kind: 'click', testid: 'clash-pass' }
    case 'back':
      return ctx.reportOpen
        ? { kind: 'click', testid: 'slime-match-report-close' }
        : ctx.handSize > 0
          ? { kind: 'focus', testid: 'clash-hand-0' }
          : { kind: 'none' }
    case 'prevTab':
    case 'nextTab': {
      if (ctx.reportOpen || ctx.handSize <= 0) return { kind: 'none' }
      const step = command === 'nextTab' ? 1 : -1
      const from =
        ctx.focusedHandIndex < 0 ? (step > 0 ? -1 : 0) : ctx.focusedHandIndex
      const next = (from + step + ctx.handSize) % ctx.handSize
      return { kind: 'focus', testid: 'clash-hand-' + next }
    }
    case 'details':
      return ctx.reportOpen
        ? { kind: 'none' }
        : { kind: 'click', testid: 'clash-peek' }
    default:
      return { kind: 'none' }
  }
}

function byTestid(root: HTMLElement, testid: string): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[data-testid="${testid}"]`)
}

function usable(el: HTMLElement | null): el is HTMLElement {
  return (
    !!el &&
    !(el as HTMLButtonElement).disabled &&
    el.getClientRects().length > 0
  )
}

/** Reads the live Clash section into a planning context. */
export function readClashPadContext(root: HTMLElement): ClashPadContext {
  const active = document.activeElement as HTMLElement | null
  const hand = [
    ...root.querySelectorAll<HTMLElement>('[data-testid^="clash-hand-"]'),
  ].filter((el) => /^clash-hand-\d+$/.test(el.dataset.testid ?? ''))
  return {
    reportOpen: !!byTestid(root, 'slime-match-report'),
    focusInside: !!active && root.contains(active) && active !== root,
    handSize: hand.length,
    focusedHandIndex: active ? hand.indexOf(active) : -1,
  }
}

/** Applies one gamepad command to the Clash section. Returns true if handled. */
export function runClashPadCommand(
  root: HTMLElement,
  command: ConsoleCommand,
): boolean {
  const ctx = readClashPadContext(root)
  const scope = ctx.reportOpen
    ? (byTestid(root, 'slime-match-report') ?? root)
    : root
  const plan = planClashPadCommand(command, ctx)
  switch (plan.kind) {
    case 'move':
      return moveFocus(scope, plan.direction, CLASH_FOCUSABLE)
    case 'press-focused': {
      const active = document.activeElement as HTMLElement | null
      if (!usable(active)) return false
      active.click()
      return true
    }
    case 'focus-first': {
      const first =
        [...scope.querySelectorAll<HTMLElement>(CLASH_FOCUSABLE)].find(
          usable,
        ) ?? null
      if (!first) return false
      first.focus()
      return true
    }
    case 'click': {
      const el = byTestid(root, plan.testid)
      if (!usable(el)) return false
      el.click()
      return true
    }
    case 'focus': {
      const el = byTestid(root, plan.testid)
      if (!usable(el)) return false
      el.focus()
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      return true
    }
    default:
      return false
  }
}
