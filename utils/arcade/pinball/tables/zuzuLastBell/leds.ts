// /utils/arcade/pinball/tables/zuzuLastBell/leds.ts
//
// The Last Bell's LED rail (conductor zuzu-pinball/t-012), read from its
// rules state. The design brief's lighting grammar: amber for the harvest
// and the village, cyan for the sword and the storm, red for the Abbess and
// ritual, violet for the hidden pre-human mystery, white for ball save and
// navigation; teal is the River Croc's water. One show holds the strip at a
// time (a multiball over the undercrypt over the Watering Hole over a
// chapter over the quiet idle glow); the ball save lights both ends, and
// the LEDs beside the Croc always tell his cycle: a glow while his jaws are
// open, a flare when he takes the ball, a red roll, a white spit.
//
// Nothing flashes faster than three times a second (rules/leds.ts), and
// with reduced motion nothing flashes or chases: the strip holds steady
// colours and changes them only when the game does.

import {
  chase,
  dim,
  flash,
  lighten,
  railFraction,
  swell,
  type LedFrame,
} from '../../rules/leds'
import { CHAPTERS } from './chapters'
import type { ZuzuRulesState } from './rules'
import { CROC_XZ, ZUZU_LED_RAIL } from './table'
import { wateringHoleRunning } from './wateringHole'

export const LED_COLORS = {
  amber: 0xffa640,
  cyan: 0x3fd8ff,
  red: 0xff3a2a,
  violet: 0x9b5cff,
  white: 0xfff4e0,
  teal: 0x3fbfb0,
  gold: 0xffd25a,
} as const

/** Each chapter's colour on the strip while it is told. */
export const CHAPTER_LED: Record<string, number> = {
  homestead: LED_COLORS.amber,
  'storm-crow': LED_COLORS.cyan,
  abbey: LED_COLORS.red,
  names: LED_COLORS.white,
  'last-bell': LED_COLORS.gold,
}

/** Where along the rail the Croc lies, and how much of it is his. */
export const CROC_LED_AT = railFraction(ZUZU_LED_RAIL.points, ...CROC_XZ)
export const CROC_LED_SPAN = 0.06

/** Which show holds the strip now, and its colour. */
export type LedShow = { id: string; color: number }

export function ledShow(state: ZuzuRulesState): LedShow {
  const mb = state.multiball.kind
  if (mb === 'harvest') return { id: 'harvest', color: LED_COLORS.amber }
  if (mb === 'storm') return { id: 'storm', color: LED_COLORS.cyan }
  if (mb === 'last-bell') return { id: 'last-bell', color: LED_COLORS.gold }
  if (state.crypt.inside) return { id: 'crypt', color: LED_COLORS.violet }
  if (wateringHoleRunning(state.wateringHole))
    return { id: 'watering-hole', color: LED_COLORS.teal }
  const run = state.story.run
  if (run) {
    const id = CHAPTERS[state.story.chapter]?.id ?? 'homestead'
    return { id: `chapter:${id}`, color: CHAPTER_LED[id] ?? LED_COLORS.amber }
  }
  return { id: 'idle', color: LED_COLORS.amber }
}

/** The strip's colours: one per LED, at physics step `step`. */
export function zuzuLeds(
  state: ZuzuRulesState,
  step: number,
  count: number,
  still: boolean,
): LedFrame {
  const frame: LedFrame = new Array(count).fill(0)
  if (state.tilted || state.over) return frame
  const show = ledShow(state)
  const hungry = state.wateringHole.lit
  for (let i = 0; i < count; i++) {
    let level: number
    switch (show.id) {
      case 'harvest':
        level = still
          ? 0.7
          : 0.25 + 0.75 * chase(i, count, step, 0.5, count / 4)
        break
      case 'storm':
        level = still ? 0.7 : 0.2 + 0.8 * chase(i, count, step, 0.8, count / 6)
        break
      case 'last-bell':
        level = still ? 0.8 : swell(step, 1.2, 0.5)
        break
      case 'crypt':
        level = still ? 0.6 : swell(step, 3, 0.3)
        break
      case 'watering-hole':
        level = still
          ? hungry
            ? 0.9
            : 0.6
          : 0.2 + 0.8 * chase(i, count, step, hungry ? 0.9 : 0.3, count / 5)
        break
      case 'idle':
        level = still ? 0.15 : 0.1 + 0.1 * swell(step, 6, 0)
        break
      default:
        level = still
          ? 0.5
          : 0.15 + 0.85 * chase(i, count, step, 0.4, count / 5)
    }
    let color = dim(show.color, level)
    // Storm Crow: a white lightning stroke now and then over the cyan.
    if (show.id === 'storm' && !still && flash(step, 0.66, 0.08))
      color = lighten(color, dim(LED_COLORS.white, 0.9))
    // The Last Bell: a red comet circling the gold.
    if (show.id === 'last-bell' && !still)
      color = lighten(
        color,
        dim(LED_COLORS.red, chase(i, count, step, 0.6, count / 8)),
      )
    frame[i] = color
  }
  ballSave(frame, state, step, still)
  croc(frame, state, step, still)
  return frame
}

/** Both ends of the strip glow white while a drain would be given back. */
function ballSave(
  frame: LedFrame,
  state: ZuzuRulesState,
  step: number,
  still: boolean,
) {
  const saving =
    step < state.ballSave.until ||
    (state.multiball.kind !== null && step < state.multiball.saveUntil)
  if (!saving) return
  const n = frame.length
  const ends = Math.max(2, Math.round(n * 0.08))
  const level = still ? 0.8 : flash(step, 1, 0.6) ? 0.9 : 0.4
  for (let i = 0; i < ends; i++) {
    frame[i] = lighten(frame[i]!, dim(LED_COLORS.white, level))
    frame[n - 1 - i] = lighten(frame[n - 1 - i]!, dim(LED_COLORS.white, level))
  }
}

/** The LEDs beside the River Croc tell his cycle. */
function croc(
  frame: LedFrame,
  state: ZuzuRulesState,
  step: number,
  still: boolean,
) {
  const cycle = state.croc.cycle
  let color: number
  switch (cycle.phase) {
    case 'open':
      color = dim(
        LED_COLORS.teal,
        state.wateringHole.lit && !still && flash(step, 2) ? 1 : 0.55,
      )
      break
    case 'rising':
      color = dim(LED_COLORS.teal, 0.3)
      break
    case 'captured':
      color = LED_COLORS.teal
      break
    case 'death-roll':
      color = LED_COLORS.red
      break
    case 'spit':
      color = LED_COLORS.white
      break
    default:
      return
  }
  const n = frame.length
  const center = CROC_LED_AT * n
  const half = CROC_LED_SPAN * n
  for (let i = 0; i < n; i++) {
    if (Math.abs(i + 0.5 - center) > half) continue
    // The death roll turns round the Croc: alternate LEDs, at 3 Hz.
    if (
      cycle.phase === 'death-roll' &&
      !still &&
      (i + Math.floor(flash(step, 3, 0.5) ? 1 : 0)) % 2 === 0
    )
      continue
    frame[i] = lighten(frame[i]!, color)
  }
}
