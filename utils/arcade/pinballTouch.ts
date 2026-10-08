// /utils/arcade/pinballTouch.ts
//
// Kind Pinball's touch controls (conductor kind-pinball/t-010): no d-pad.
// The lower left and right of the screen are the flippers; the strip at the
// lower right edge, over the shooter lane, is the plunger: a tap there flips
// the right flipper, a finger dragged down pulls the plunger back as far as
// it goes and lets it fly on release; a short upward swipe anywhere nudges
// the table. This is the gesture logic alone, in screen fractions, so it can
// be tested without a DOM; components/arcade/arcade-pinball-touch.vue feeds
// it pointer events.

import type { ArcadeButton } from './types'

export type PinballZone = 'left' | 'right' | 'plunger' | 'none'

/** Below this line (a fraction of the height down the screen) the flippers live. */
export const FLIPPER_TOP = 0.4
/** The plunger strip: the right edge, below this line. */
export const PLUNGER_LEFT = 0.86
export const PLUNGER_TOP = 0.55
/** A drag this far down (fraction of height) turns a tap into a pull. */
const PULL_START = 0.02
/** A full pull is this much farther (fraction of height). */
const PULL_RANGE = 0.22
/** An upward swipe this long (fraction of height), this quick, nudges. */
const SWIPE = 0.08
const SWIPE_MS = 350

export function zoneAt(x: number, y: number): PinballZone {
  if (y < FLIPPER_TOP) return 'none'
  if (x >= PLUNGER_LEFT && y >= PLUNGER_TOP) return 'plunger'
  return x < 0.5 ? 'left' : 'right'
}

export type PinballTouchOutput = {
  /** A button goes down or up (left, right, up for a nudge's tap). */
  press(button: ArcadeButton, down: boolean): void
  /** How far the plunger is pulled (0..1) while a finger drags it; null when let go. */
  plunger(depth: number | null): void
}

type Finger = {
  zone: PinballZone
  x: number
  y: number
  at: number
  /** The flipper this finger holds, if any. */
  holds: 'left' | 'right' | null
  pulling: boolean
  nudged: boolean
}

export class PinballTouch {
  private fingers = new Map<number, Finger>()
  private held = { left: 0, right: 0 }
  private out: PinballTouchOutput

  constructor(out: PinballTouchOutput) {
    this.out = out
  }

  private hold(side: 'left' | 'right', down: boolean) {
    const before = this.held[side]
    this.held[side] = Math.max(0, before + (down ? 1 : -1))
    if ((before === 0) !== (this.held[side] === 0))
      this.out.press(side, this.held[side] > 0)
  }

  /** A finger lands at (x, y), in fractions of the screen, at `at` ms. */
  down(id: number, x: number, y: number, at: number) {
    const zone = zoneAt(x, y)
    const holds =
      zone === 'left' ? 'left' : zone === 'none' ? null : ('right' as const)
    if (holds) this.hold(holds, true)
    this.fingers.set(id, {
      zone,
      x,
      y,
      at,
      holds,
      pulling: false,
      nudged: false,
    })
  }

  move(id: number, x: number, y: number, at: number) {
    const f = this.fingers.get(id)
    if (!f) return
    const dy = y - f.y
    if (f.zone === 'plunger' && (f.pulling || dy > PULL_START)) {
      // A drag down the lane: the plunger, not the flipper.
      if (!f.pulling) {
        f.pulling = true
        if (f.holds) this.hold(f.holds, false)
        f.holds = null
      }
      this.out.plunger(Math.min(1, Math.max(0, (dy - PULL_START) / PULL_RANGE)))
      return
    }
    if (!f.nudged && -dy >= SWIPE && at - f.at <= SWIPE_MS) {
      f.nudged = true
      this.out.press('up', true)
      this.out.press('up', false)
    }
  }

  up(id: number) {
    const f = this.fingers.get(id)
    if (!f) return
    this.fingers.delete(id)
    if (f.holds) this.hold(f.holds, false)
    if (f.pulling) this.out.plunger(null)
  }

  /** Every finger lifts (the overlay hides, the page loses focus). */
  release() {
    for (const id of [...this.fingers.keys()]) this.up(id)
  }
}
