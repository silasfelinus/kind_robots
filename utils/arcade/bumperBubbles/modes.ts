// /utils/arcade/bumperBubbles/modes.ts
//
// Bumper Bubbles' extra modes, stars and medals (conductor kr-arcade t-063, depth-pass/CABINETS.md
// section 7, slice 5):
//
// - The Climb: the hundred floors of Fizzwick Tower (the existing game, saved at every wing).
// - Floor Select: start the climb from any floor you have reached.
// - Pop Party: one floor from each wing, every grump already trapped, pop them for the ladder.
// - Endless Fizz: the tower on repeat, with Old Flat Fizz arriving sooner on every floor.
// - Time Trial: one wing's ten floors against the clock.
//
// And the stars: every floor clear earns one to three (cleared, no robot lost, fast), kept on a
// hundred-digit string in the save. A wing whose ten floors are all cleared, all two-star or all
// three-star earns a bronze, silver or gold wing medal; a Time Trial earns its own medal by time.
// Co-op needs no mode: seat two to four robots and any of these plays together.

import { drawText } from '../font'
import { INK, RAMPS, hudPanel } from '../snes'
import { H, W } from './tower'
import { FLOORS_PER_WING, WINGS } from './wings'

export type ModeId = 'climb' | 'select' | 'party' | 'fizz' | 'trial'

export const MENU = [
  {
    id: 'climb',
    name: 'THE CLIMB',
    line: 'ALL HUNDRED FLOORS OF FIZZWICK TOWER',
  },
  {
    id: 'select',
    name: 'FLOOR SELECT',
    line: 'START FROM ANY FLOOR YOU REACHED',
  },
  {
    id: 'party',
    name: 'POP PARTY',
    line: 'EVERY GRUMP ALREADY BUBBLED. POP THEM ALL',
  },
  {
    id: 'fizz',
    name: 'ENDLESS FIZZ',
    line: 'THE TOWER ON REPEAT. FIZZ ARRIVES SOONER',
  },
  { id: 'trial', name: 'TIME TRIAL', line: 'ONE WING AGAINST THE CLOCK' },
  {
    id: 'stars',
    name: 'STAR BOARD',
    line: 'EVERY STAR AND MEDAL YOU HAVE WON',
  },
] as const

export type MenuId = (typeof MENU)[number]['id']

export const TOTAL_FLOORS = WINGS.length * FLOORS_PER_WING

// --- stars -----------------------------------------------------------------------------------------

/** Ticks a floor must be cleared inside for its third star (the Speedy bonus window). */
export const STAR_PAR_TICKS = 1200

export const emptyStars = () => '0'.repeat(TOTAL_FLOORS)

/** A stored star string (undefined reads as empty); null when it is not one. */
export function readStars(raw: unknown): string | null {
  if (raw === undefined) return emptyStars()
  if (typeof raw !== 'string' || !/^[0-3]+$/.test(raw)) return null
  return raw.length === TOTAL_FLOORS ? raw : null
}

/** One to three stars for a cleared floor. */
export function starsEarned(args: { lost: boolean; ticks: number }): number {
  return 1 + (args.lost ? 0 : 1) + (args.ticks < STAR_PAR_TICKS ? 1 : 0)
}

/** `stars` with the floor's best kept. */
export function withStars(stars: string, floor: number, n: number): string {
  if (floor < 1 || floor > TOTAL_FLOORS) return stars
  const i = floor - 1
  if (Number(stars[i]) >= n) return stars
  return stars.slice(0, i) + String(n) + stars.slice(i + 1)
}

export const starsAt = (stars: string, floor: number) =>
  Number(stars[floor - 1] ?? 0)

/** The highest floor with a star (0 before the first clear). */
export function topFloor(stars: string): number {
  for (let i = stars.length - 1; i >= 0; i--) if (stars[i] !== '0') return i + 1
  return 0
}

/** The floors Floor Select offers: up to one past the highest cleared (or the saved wing's start). */
export function selectableFloors(stars: string, savedWing = 1): number {
  const wingStart = (savedWing - 1) * FLOORS_PER_WING + 1
  return Math.min(TOTAL_FLOORS, Math.max(1, topFloor(stars) + 1, wingStart))
}

/** The wings Time Trial offers: every wing reached. */
export function trialWings(stars: string, savedWing = 1): number {
  return Math.min(
    WINGS.length,
    Math.max(1, Math.floor(topFloor(stars) / FLOORS_PER_WING) + 1, savedWing),
  )
}

/** 0 none, 1 bronze (all ten cleared), 2 silver (all two-star), 3 gold (all three-star). */
export function wingMedal(stars: string, wing: number): number {
  const from = (wing - 1) * FLOORS_PER_WING
  const mine = [...stars.slice(from, from + FLOORS_PER_WING)].map(Number)
  if (mine.length < FLOORS_PER_WING || mine.some((n) => n === 0)) return 0
  return Math.min(...mine)
}

export const MEDAL_NAMES = ['', 'BRONZE', 'SILVER', 'GOLD'] as const

export function starTotal(stars: string): number {
  return [...stars].reduce((n, ch) => n + Number(ch), 0)
}

// --- Time Trial ------------------------------------------------------------------------------------

/** Par for a wing's ten floors, in ticks: a floor is allowed longer as the tower gets harder. */
export function trialPar(wing: number): number {
  return FLOORS_PER_WING * (1300 + 80 * wing)
}

/** Gold inside par, silver inside a third over, bronze for finishing. */
export function trialMedal(ticks: number, wing: number): number {
  const par = trialPar(wing)
  return ticks <= par ? 3 : ticks <= par * 1.33 ? 2 : 1
}

/** Best Time Trial times (ticks of play) by wing number. */
export type BestTimes = Record<string, number>

export function readBest(raw: unknown): BestTimes | null {
  if (raw === undefined) return {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const out: BestTimes = {}
  for (const [k, v] of Object.entries(raw)) {
    const wing = Number(k)
    if (
      !Number.isInteger(wing) ||
      wing < 1 ||
      wing > WINGS.length ||
      typeof v !== 'number' ||
      !Number.isInteger(v) ||
      v <= 0 ||
      v > 9_999_999
    )
      return null
    out[k] = v
  }
  return out
}

/** `m:ss.t` from ticks at 60 Hz. */
export function clock(ticks: number): string {
  const s = Math.floor(ticks / 60)
  const tenth = Math.floor(((ticks % 60) * 10) / 60)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}.${tenth}`
}

// --- Pop Party and Endless Fizz --------------------------------------------------------------------

/** Pop Party visits one floor of every wing: 1, 11, 21 ... 91. */
export const partyFloor = (k: number) => 1 + (k - 1) * FLOORS_PER_WING
export const PARTY_LAST = partyFloor(WINGS.length)
/** Ticks a party bubble holds its grump (long, so the party is a pop-fest, not a rescue). */
export const PARTY_HOLD = 1500
export const PARTY_BONUS = 10_000

/** Endless Fizz: [hurry warning, Old Flat Fizz] ticks on a floor; sooner every floor, never under 10 s. */
export function fizzClock(level: number): [number, number] {
  const fizz = Math.max(600, 1800 - 12 * (level - 1))
  return [fizz - 300, fizz]
}

// --- screens ---------------------------------------------------------------------------------------

export type MenuView = {
  cursor: number
  floor: number
  floors: number
  wing: number
  wings: number
  stars: string
  best: BestTimes
  board: boolean
}

export function renderMenu(
  g: CanvasRenderingContext2D,
  view: MenuView,
  tick: number,
) {
  g.fillStyle = INK
  g.fillRect(0, 0, W, H)
  if (view.board) return renderBoard(g, view)
  hudPanel(g, 14, 16, W - 28, H - 32, RAMPS.purple)
  drawText(g, 'BUMPER BUBBLES', W / 2, 26, {
    scale: 2,
    align: 'center',
    color: '#ffffff',
    outline: INK,
  })
  MENU.forEach((m, i) => {
    const on = i === view.cursor
    const y = 56 + i * 26
    drawText(g, m.name, W / 2, y, {
      scale: on ? 2 : 1,
      align: 'center',
      color: on ? RAMPS.gold[4] : RAMPS.cream[3],
      outline: INK,
    })
    if (!on) return
    let sub: string = m.line
    if (m.id === 'select')
      sub = `< FLOOR ${view.floor} >  OF ${view.floors} REACHED`
    if (m.id === 'trial') {
      const best = view.best[String(view.wing)]
      sub = `< WING ${view.wing} >  ${best === undefined ? 'NO TIME YET' : `BEST ${clock(best)}`}`
    }
    drawText(g, sub, W / 2, y + 12, {
      align: 'center',
      color: RAMPS.sky[4],
      outline: INK,
    })
  })
  const blink = Math.floor(tick / 20) % 2 === 0
  drawText(g, 'UP/DOWN CHOOSE   A GO', W / 2, H - 34, {
    align: 'center',
    color: blink ? RAMPS.gold[4] : '#ffffff',
    outline: INK,
  })
}

const STAR_RAMPS = [RAMPS.purple[1], RAMPS.leaf[3], RAMPS.sky[4], RAMPS.gold[4]]

function renderBoard(g: CanvasRenderingContext2D, view: MenuView) {
  hudPanel(g, 10, 8, W - 20, H - 16, RAMPS.purple)
  drawText(g, 'STAR BOARD', W / 2, 16, {
    scale: 2,
    align: 'center',
    color: '#ffffff',
    outline: INK,
  })
  WINGS.forEach((_, w) => {
    const y = 40 + w * 17
    for (let f = 0; f < FLOORS_PER_WING; f++) {
      g.fillStyle =
        STAR_RAMPS[starsAt(view.stars, w * FLOORS_PER_WING + f + 1)]!
      g.fillRect(20 + f * 12, y, 10, 10)
    }
    const medal = wingMedal(view.stars, w + 1)
    drawText(g, medal ? MEDAL_NAMES[medal]! : '-', 150, y + 1, {
      color: medal ? STAR_RAMPS[medal]! : RAMPS.cream[3],
      outline: INK,
    })
    const best = view.best[String(w + 1)]
    if (best !== undefined)
      drawText(g, clock(best), 198, y + 1, {
        color: RAMPS.sky[4],
        outline: INK,
      })
  })
  drawText(
    g,
    `${starTotal(view.stars)} OF ${TOTAL_FLOORS * 3} STARS   A: BACK`,
    W / 2,
    H - 20,
    {
      align: 'center',
      color: RAMPS.gold[4],
      outline: INK,
    },
  )
}

export function renderResult(
  g: CanvasRenderingContext2D,
  result: { title: string; lines: string[] },
) {
  g.fillStyle = 'rgba(0,0,0,0.78)'
  g.fillRect(0, 0, W, H)
  hudPanel(g, 20, 56, W - 40, 128, RAMPS.purple)
  drawText(g, result.title, W / 2, 68, {
    scale: 2,
    align: 'center',
    color: '#ffffff',
    outline: INK,
  })
  result.lines.forEach((line, i) =>
    drawText(g, line, W / 2, 100 + i * 16, {
      align: 'center',
      color: i === 0 ? RAMPS.gold[4] : RAMPS.cream[3],
      outline: INK,
    }),
  )
}
