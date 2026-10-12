// /utils/arcade/pinball/dmdScenes.ts
//
// What each DMD scene draws (conductor kind-pinball/t-006): the dot pictures
// for the score, ball start, skill shot, lock, multiball, jackpots, modes,
// wizard mode, extra ball, tilt, bonus count, match and game over, plus the
// attract pages. Each scene draws into the 128x32 Dmd framebuffer from its
// request and how long it has been up, so it is pure and testable without a
// canvas. The queue (dmdQueue.ts) decides which one is up.

import {
  DMD_COLS,
  DMD_ROWS,
  dmdTextWidth,
  type Dmd,
  type DmdLevel,
} from './dmd'
import { BONUS_LINE_MS, type DmdShowing } from './dmdQueue'
import type { AttractPages } from './types'

/** What the idle score scene needs from the game. */
export type DmdIdle = {
  score: number
  ball: number
  /** The bonus multiplier, shown when above 1. */
  multiplier: number
  /** Attract mode: pages instead of a score. */
  attract?: boolean
  highScore?: number
  /** The table's name on the attract pages (Kind Pinball's by default). */
  pages?: AttractPages
}

/** Kind Pinball's attract pages, for a table that names none. */
export const KIND_PINBALL_PAGES: AttractPages = {
  title: 'KIND PINBALL',
  kicker: 'AMI VILLAGE',
  subtitle: 'RESCUE',
}

/** Ms the high score takes to count up on its attract page. */
export const HIGH_SCORE_COUNT_MS = 1200

/** Whether this game's score beats the high score it started against. */
export function beatsHighScore(idle: DmdIdle): boolean {
  return (
    !idle.attract && idle.highScore !== undefined && idle.score > idle.highScore
  )
}

export function formatScore(score: number): string {
  return Math.max(0, Math.floor(score)).toLocaleString('en-US')
}

/** The biggest scale (3, 2 or 1) at which `text` fits `width` dots. */
export function fitScale(text: string, width = DMD_COLS - 4, max = 3): number {
  for (let scale = max; scale > 1; scale--)
    if (dmdTextWidth(text, scale, true) <= width) return scale
  return 1
}

/** Text centred across the display at row `y`, as big as fits. */
function headline(
  dmd: Dmd,
  text: string,
  y: number,
  options: { max?: number; level?: DmdLevel; reveal?: number } = {},
) {
  const scale = fitScale(text, DMD_COLS - 4, options.max ?? 3)
  dmd.text(text, DMD_COLS / 2, y, {
    scale,
    bold: scale > 1,
    align: 'center',
    level: options.level ?? 3,
    reveal: options.reveal,
  })
  return scale
}

function small(dmd: Dmd, text: string, y: number, level: DmdLevel = 2) {
  dmd.text(text, DMD_COLS / 2, y, { align: 'center', level })
}

/** A sparkle field: a few dots that twinkle, seeded by position. */
function sparkle(dmd: Dmd, t: number, density = 24) {
  for (let i = 0; i < density; i++) {
    const x = (i * 53 + 7) % DMD_COLS
    const y = (i * 29 + 3) % DMD_ROWS
    const phase = Math.floor(t / 90 + i * 1.7) % 4
    if (phase === 0) dmd.dot(x, y, 3)
    else if (phase === 1) dmd.dot(x, y, 1)
  }
}

/** A chase of lit dots running round the border. */
function borderChase(dmd: Dmd, t: number) {
  const perimeter = 2 * (DMD_COLS + DMD_ROWS) - 4
  const offset = Math.floor(t / 20)
  for (let i = 0; i < perimeter; i++) {
    if ((i + offset) % 6 > 2) continue
    let x: number
    let y: number
    if (i < DMD_COLS) [x, y] = [i, 0]
    else if (i < DMD_COLS + DMD_ROWS - 1)
      [x, y] = [DMD_COLS - 1, i - DMD_COLS + 1]
    else if (i < 2 * DMD_COLS + DMD_ROWS - 2)
      [x, y] = [DMD_COLS - 1 - (i - DMD_COLS - DMD_ROWS + 2), DMD_ROWS - 1]
    else [x, y] = [0, DMD_ROWS - 1 - (i - 2 * DMD_COLS - DMD_ROWS + 3)]
    dmd.dot(x, y, 2)
  }
}

/** A padlock picture, for the lock. */
function padlock(dmd: Dmd, x: number, y: number) {
  dmd.frame(x + 2, y, 7, 7, 2)
  dmd.rect(x, y + 6, 11, 9, 3)
  dmd.rect(x + 5, y + 9, 1, 3, 0)
}

/** Jaws that meet in the middle of the display: `gap` dots apart. */
function jaws(dmd: Dmd, gap: number, level: DmdLevel = 2) {
  const mid = DMD_ROWS / 2
  const upper = Math.round(mid - gap / 2)
  const lower = Math.round(mid + gap / 2)
  for (let x = 0; x < DMD_COLS; x++) {
    // Teeth: a saw edge, the lower row offset half a tooth from the upper.
    const up = 3 - Math.abs((x % 8) - 4) * 0.75
    const down = 3 - Math.abs(((x + 4) % 8) - 4) * 0.75
    for (let y = 0; y < upper - 3 + up; y++) dmd.dot(x, y, level)
    for (let y = lower + 3 - down; y < DMD_ROWS; y++) dmd.dot(x, y, level)
  }
  // His eye, on the upper jaw.
  dmd.rect(DMD_COLS - 22, Math.max(1, upper - 12), 3, 2, 3)
}

/** Count a value up from zero over `ms`. */
function countUp(value: number, elapsed: number, ms: number): number {
  return Math.round(value * Math.min(1, elapsed / ms))
}

/** The idle scene: the score, big, with the ball and multiplier under it. */
export function drawScore(dmd: Dmd, idle: DmdIdle) {
  const score = formatScore(idle.score)
  const scale = fitScale(score)
  dmd.text(score, DMD_COLS / 2, scale === 3 ? 2 : 5, {
    scale,
    bold: true,
    align: 'center',
  })
  dmd.text(`BALL ${Math.max(1, idle.ball)}`, 2, 24, { level: 2 })
  if (idle.multiplier > 1)
    dmd.text(`${idle.multiplier}X`, DMD_COLS - 2, 24, {
      level: 3,
      align: 'right',
    })
}

/**
 * Attract mode: the title, the table, its picture if it has one, the high
 * score counting up, an invitation.
 */
export const ATTRACT_PAGE_MS = 2500

/** The attract pages in order, for a table's pages. */
export function attractPages(pages: AttractPages = KIND_PINBALL_PAGES) {
  return pages.picture
    ? (['title', 'name', 'picture', 'high-score', 'start'] as const)
    : (['title', 'name', 'high-score', 'start'] as const)
}

export function drawAttract(dmd: Dmd, idle: DmdIdle, now: number) {
  const pages = idle.pages ?? KIND_PINBALL_PAGES
  const order = attractPages(pages)
  const page = order[Math.floor(now / ATTRACT_PAGE_MS) % order.length]
  const t = now % ATTRACT_PAGE_MS
  if (page === 'title') {
    sparkle(dmd, now)
    headline(dmd, pages.title, 9, { max: 2, reveal: 1 + Math.floor(t / 80) })
  } else if (page === 'name') {
    small(dmd, pages.kicker, 6, 3)
    headline(dmd, pages.subtitle, 15, { max: 2 })
  } else if (page === 'picture') {
    // The River Croc's jaws, snapping slowly shut and open again.
    jaws(dmd, 4 + 18 * Math.abs(Math.cos((t / ATTRACT_PAGE_MS) * Math.PI)))
  } else if (page === 'high-score') {
    borderChase(dmd, now)
    small(dmd, 'HIGH SCORE', 3, 2)
    headline(
      dmd,
      formatScore(countUp(idle.highScore ?? 0, t, HIGH_SCORE_COUNT_MS)),
      13,
      { max: 2, level: t < HIGH_SCORE_COUNT_MS ? 2 : 3 },
    )
  } else {
    borderChase(dmd, now)
    headline(dmd, 'PRESS START', 12, {
      max: 2,
      level: Math.floor(t / 400) % 2 ? 3 : 2,
    })
  }
}

/** Draw the scene that is up (or the idle score) into the framebuffer. */
export function drawDmd(
  dmd: Dmd,
  showing: DmdShowing | null,
  idle: DmdIdle,
  now: number,
) {
  dmd.clear()
  if (!showing) {
    if (idle.attract) drawAttract(dmd, idle, now)
    else drawScore(dmd, idle)
    return
  }
  const { request } = showing
  const t = showing.elapsed
  const text = request.text ?? ''
  const value = request.value ?? 0
  switch (request.scene) {
    case 'message': {
      const reveal = Math.floor(t / 30)
      headline(dmd, text, request.sub ? 3 : 9, { max: 2, reveal })
      if (request.sub && reveal > text.length) small(dmd, request.sub, 23)
      break
    }
    case 'ball': {
      // Slides in from the right.
      const label = text || `BALL ${Math.max(1, value)}`
      const scale = fitScale(label)
      const width = dmdTextWidth(label, scale, true)
      const home = Math.round((DMD_COLS - width) / 2)
      const x = Math.round(home + (DMD_COLS - home) * Math.max(0, 1 - t / 300))
      dmd.text(label, x, 5, { scale, bold: true })
      break
    }
    case 'skill-shot': {
      sparkle(dmd, t, 16)
      headline(dmd, 'SKILL SHOT', 3, { max: 2 })
      small(dmd, formatScore(countUp(value, t, 800)), 23, 3)
      break
    }
    case 'lock': {
      padlock(dmd, 8, 9)
      dmd.text(text || 'BALL LOCKED', 26, 8, { scale: 2, bold: true })
      if (request.sub) dmd.text(request.sub, 26, 24, { level: 2 })
      break
    }
    case 'mode-intro': {
      borderChase(dmd, t)
      headline(dmd, text, 4, { max: 2, reveal: Math.floor(t / 40) })
      if (request.sub) small(dmd, request.sub, 22)
      break
    }
    case 'mode-total': {
      small(dmd, text || 'MODE TOTAL', 3, 2)
      headline(dmd, formatScore(countUp(value, t, 1000)), 13, { max: 2 })
      break
    }
    case 'bonus': {
      const items = request.items ?? []
      const line = Math.floor(t / BONUS_LINE_MS)
      if (line < items.length) {
        const item = items[line]!
        small(dmd, item.label, 4, 3)
        headline(dmd, formatScore(item.value), 14, { max: 2 })
      } else {
        const total = items.reduce((a, i) => a + i.value, 0) * (value || 1)
        small(dmd, value > 1 ? `BONUS X ${value}` : 'TOTAL BONUS', 3, 3)
        headline(dmd, formatScore(total), 13, { max: 2 })
      }
      break
    }
    case 'match': {
      small(dmd, 'MATCH', 3, 3)
      // The digits spin, then settle on the match number.
      const shown = t < 2000 ? Math.floor(t / 70) % 10 : value
      headline(dmd, `${shown}0`.padStart(2, '0'), 13, { max: 2 })
      break
    }
    case 'multiball': {
      borderChase(dmd, t)
      headline(dmd, text || 'MULTIBALL', 9, {
        max: 2,
        level: Math.floor(t / 120) % 2 ? 3 : 2,
      })
      break
    }
    case 'extra-ball': {
      sparkle(dmd, t)
      headline(dmd, Math.floor(t / 700) % 2 ? 'SHOOT AGAIN' : 'EXTRA BALL', 9, {
        max: 2,
      })
      break
    }
    case 'wizard': {
      sparkle(dmd, t, 40)
      small(dmd, 'WIZARD MODE', 3, 2)
      headline(dmd, text || 'VILLAGE RESCUE', 13, { max: 2 })
      break
    }
    case 'jackpot':
    case 'super-jackpot': {
      const label = request.scene === 'jackpot' ? 'JACKPOT' : 'SUPER JACKPOT'
      headline(dmd, text || label, 2, { max: 2 })
      small(dmd, formatScore(countUp(value, t, 700)), 23, 3)
      // The classic flash: the whole display inverts on the beat.
      if (t < 800 && Math.floor(t / 100) % 2 === 0) dmd.invert()
      break
    }
    case 'death-roll': {
      // The mouth close up: the jaws shut on the ball, then the award
      // between the teeth. One flash at the bite, no strobe.
      if (t < 600) {
        const gap = Math.max(0, 22 * (1 - t / 500))
        for (let y = -4; y <= 4; y++)
          for (let x = -4; x <= 4; x++)
            if (x * x + y * y <= 16) dmd.dot(DMD_COLS / 2 + x, 16 + y, 3)
        jaws(dmd, gap)
        if (t >= 480) dmd.invert()
        break
      }
      jaws(dmd, 26, 1)
      headline(dmd, text || 'DEATH ROLL', 5, { max: 2 })
      small(dmd, formatScore(countUp(value, t - 600, 700)), 20, 3)
      break
    }
    case 'mode-timer': {
      dmd.text(text || 'MODE', 2, 2, { level: 2 })
      if (request.sub) dmd.text(request.sub, 2, 13, { level: 3 })
      dmd.text(formatScore(idle.score), 2, 24, { level: 2 })
      const seconds = String(Math.max(0, Math.ceil(value)))
      const hurry = value <= 5 && Math.floor(t / 250) % 2 === 0
      dmd.text(seconds, DMD_COLS - 3, 4, {
        scale: 3,
        bold: true,
        align: 'right',
        level: hurry ? 2 : 3,
      })
      break
    }
    case 'tilt-warning': {
      headline(dmd, text || 'WARNING', 9, {
        max: 3,
        level: Math.floor(t / 150) % 2 ? 3 : 1,
      })
      break
    }
    case 'tilt': {
      headline(dmd, 'TILT', 5)
      break
    }
    case 'game-over': {
      if (beatsHighScore(idle)) {
        // A new high score: it says so over the score, in a sparkle.
        sparkle(dmd, t)
        small(dmd, 'NEW HIGH SCORE', 2, 3)
        headline(dmd, formatScore(idle.score), 12, { max: 2 })
        break
      }
      headline(dmd, 'GAME OVER', 3, { max: 2 })
      small(dmd, formatScore(idle.score), 23, 2)
      break
    }
  }
}
