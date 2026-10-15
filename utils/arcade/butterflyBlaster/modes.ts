// /utils/arcade/butterflyBlaster/modes.ts
//
// Butterfly Blaster's modes and medals (conductor kr-arcade t-058 part 1, depth-pass/CABINETS.md
// section 6, "Modes"):
//
// - Season: the campaign, The Rainy Season (the existing watch, saved at every night).
// - Long Night: endless nights with every pest mixed in, the leaderboard's main event.
// - Region Time Attack: one region's four nights against the clock, once a season has cleared it.
// - Classic Night: the cabinet's original rules on the original sky, kept as a tribute.
//
// And the medals: every night can win three, Not a Bite (no hut bitten), Lasso Master (twenty or
// more mosquitoes in one loop) and Swift Night (under par), kept on a medal board per region.
// (Co-op Flight is the slice's second part.)

import { drawText } from '../font'
import { levelCurve } from '../curve'
import { INK, RAMPS, hudPanel } from '../snes'
import { REGIONS, THREAD_REGIONS, campaignSteps } from './season'
import type { NightDef, RegionId } from './season'
import { H, W } from './sky'

export type ModeId = 'season' | 'longnight' | 'timeattack' | 'classic'

export const MENU = [
  {
    id: 'season',
    name: 'THE RAINY SEASON',
    line: 'KEEP THE WATCH, REGION BY REGION',
  },
  {
    id: 'longnight',
    name: 'LONG NIGHT',
    line: 'ENDLESS NIGHTS. THE MAIN EVENT',
  },
  {
    id: 'timeattack',
    name: 'REGION TIME ATTACK',
    line: 'ONE REGION AGAINST THE CLOCK',
  },
  { id: 'classic', name: 'CLASSIC NIGHT', line: 'THE ORIGINAL RULES, ONE SKY' },
  { id: 'board', name: 'MEDAL BOARD', line: 'EVERY MEDAL YOU HAVE WON' },
] as const

export type MenuId = (typeof MENU)[number]['id']

// --- Long Night ------------------------------------------------------------------------------------

/** Long Night starts where the pests are already mixed: night 1 of it is a late-season night. */
export const LONG_NIGHT_OFFSET = 12

export const longNightLevel = (n: number) => n + LONG_NIGHT_OFFSET

// --- Classic Night ---------------------------------------------------------------------------------

/** The original cabinet's curves, as they were: flat from wave 13. */
export const CLASSIC_CURVES = {
  big: { start: 4, step: 1, limit: 11 },
  speed: { start: 1, step: 0.07, limit: 1.9 },
  cloudEvery: { start: 1500, step: -80, limit: 520 },
  cloudFire: { start: 90, step: -5, limit: 36 },
  cloudAim: { start: 0.6, step: -0.05, limit: 0.08 },
  amiEvery: { start: 1100, step: 90, limit: 2300 },
} as const

/** Wave n of Classic Night: big swarms and the cloud and AMI, no pools, pests or bites to come. */
export function classicNight(n: number): NightDef {
  const c = (k: keyof typeof CLASSIC_CURVES) => levelCurve(n, CLASSIC_CURVES[k])
  return {
    title: `WAVE ${n}`,
    waves: [
      {
        big: Math.round(c('big')),
        medium: 0,
        needles: 0,
        skimmers: 0,
        cloud: n >= 3,
      },
    ],
    pools: [],
    poolEvery: 99999,
    speed: c('speed'),
    // The original's swarms never go hunting: they just fly.
    hunger: [999_999, 0],
    cloudEvery: Math.round(c('cloudEvery')),
    cloudFire: Math.round(c('cloudFire')),
    cloudAim: c('cloudAim'),
    amiEvery: Math.round(c('amiEvery')),
  }
}

// --- medals ----------------------------------------------------------------------------------------

export const MEDALS = [
  { bit: 1, name: 'NOT A BITE', ramp: RAMPS.leaf },
  { bit: 2, name: 'LASSO MASTER', ramp: RAMPS.sky },
  { bit: 4, name: 'SWIFT NIGHT', ramp: RAMPS.gold },
] as const

/** Mosquitoes netted in one loop for the Lasso Master medal. */
export const LASSO_MASTER = 20

/** Ticks of play a night's Swift Night medal allows: a minute and a half, and more with the swarms. */
export function parTicks(night: NightDef): number {
  const swarms = night.waves.reduce((n, w) => n + w.big + w.medium, 0)
  return 5400 + swarms * 120 + (night.special ? 1800 : 0)
}

export type MedalBoard = Record<string, number>

/** A night's key on the board: its region and number (riverbend:1). */
export function medalKey(region: RegionId, night: number) {
  return `${region}:${night + 1}`
}

const BOARD_KEYS = new Set(
  (Object.keys(REGIONS) as RegionId[]).flatMap((r) =>
    REGIONS[r].nights.map((_, i) => medalKey(r, i)),
  ),
)

/** A stored medal board, checked; null when it is not one (undefined reads as empty). */
export function readMedals(raw: unknown): MedalBoard | null {
  if (raw === undefined) return {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const out: MedalBoard = {}
  for (const [k, v] of Object.entries(raw)) {
    if (
      !BOARD_KEYS.has(k) ||
      typeof v !== 'number' ||
      !Number.isInteger(v) ||
      v < 0 ||
      v > 7
    )
      return null
    out[k] = v
  }
  return out
}

/** Medal bits won by a night that ended with `bitten` huts bitten. */
export function medalsWon(args: {
  perfect: boolean
  biggestLoop: number
  ticks: number
  night: NightDef
}): number {
  let bits = 0
  if (args.perfect) bits |= 1
  if (args.biggestLoop >= LASSO_MASTER) bits |= 2
  if (args.ticks <= parTicks(args.night)) bits |= 4
  return bits
}

export const medalCount = (bits: number) =>
  MEDALS.filter((m) => bits & m.bit).length

/** Best Region Time Attack times (ticks of play) by region id. */
export type BestTimes = Record<string, number>

export function readTimes(raw: unknown): BestTimes | null {
  if (raw === undefined) return {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const out: BestTimes = {}
  for (const [k, v] of Object.entries(raw)) {
    if (
      !THREAD_REGIONS.includes(k as RegionId) ||
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

/**
 * The story regions Time Attack has opened: a region opens once all four of its nights are in the
 * record (finished once), and the whole story opens when the season has cleared.
 */
export function openRegions(
  record: ReadonlyMap<number, number>,
  cleared: boolean,
): RegionId[] {
  if (cleared) return [...THREAD_REGIONS]
  const steps = campaignSteps()
  return THREAD_REGIONS.filter((region) => {
    const idx = steps
      .map((s, i) => (s.kind === 'night' && s.region === region ? i : -1))
      .filter((i) => i >= 0)
    return idx.length > 0 && idx.every((i) => record.has(i))
  })
}

/** A Time Attack run: the region's nights as the season plays them. */
export function regionNights(region: RegionId): readonly NightDef[] {
  return REGIONS[region].nights
}

// --- screens ---------------------------------------------------------------------------------------

export type MenuView = {
  cursor: number
  region: number
  open: readonly RegionId[]
  times: BestTimes
  board: boolean
  medals: MedalBoard
}

export function renderMenu(
  g: CanvasRenderingContext2D,
  view: MenuView,
  tick: number,
) {
  g.fillStyle = INK
  g.fillRect(0, 0, W, H)
  if (view.board) return renderBoard(g, view, tick)
  hudPanel(g, 50, 24, W - 100, H - 48, RAMPS.purple)
  drawText(g, 'BUTTERFLY BLASTER', W / 2, 38, {
    scale: 2,
    align: 'center',
    color: '#ffffff',
    outline: INK,
  })
  MENU.forEach((m, i) => {
    const on = i === view.cursor
    const y = 80 + i * 40
    drawText(g, m.name, W / 2, y, {
      scale: 2,
      align: 'center',
      color: on ? RAMPS.gold[4] : RAMPS.cream[3],
      outline: INK,
    })
    if (on) {
      const sub =
        m.id === 'timeattack'
          ? `< ${REGIONS[THREAD_REGIONS[view.region]!].name} >  ${
              view.open.includes(THREAD_REGIONS[view.region]!)
                ? view.times[THREAD_REGIONS[view.region]!] === undefined
                  ? 'NO TIME YET'
                  : `BEST ${clock(view.times[THREAD_REGIONS[view.region]!]!)}`
                : 'CLEAR IT IN THE SEASON FIRST'
            }`
          : m.line
      drawText(g, sub, W / 2, y + 18, {
        align: 'center',
        color: RAMPS.sky[4],
        outline: INK,
      })
    }
  })
  const blink = Math.floor(tick / 20) % 2 === 0
  drawText(g, 'UP/DOWN CHOOSE   A GO', W / 2, H - 44, {
    align: 'center',
    color: blink ? RAMPS.gold[4] : '#ffffff',
    outline: INK,
  })
}

function renderBoard(
  g: CanvasRenderingContext2D,
  view: MenuView,
  _tick: number,
) {
  hudPanel(g, 30, 14, W - 60, H - 28, RAMPS.purple)
  drawText(g, 'MEDAL BOARD', W / 2, 24, {
    scale: 2,
    align: 'center',
    color: '#ffffff',
    outline: INK,
  })
  THREAD_REGIONS.forEach((region, r) => {
    const y = 54 + r * 38
    drawText(g, REGIONS[region].name, 48, y, {
      color: RAMPS.cream[3],
      outline: INK,
    })
    REGIONS[region].nights.forEach((_, night) => {
      const bits = view.medals[medalKey(region, night)] ?? 0
      MEDALS.forEach((m, k) => {
        const x = 60 + night * 90 + k * 22
        g.fillStyle = bits & m.bit ? m.ramp[4] : RAMPS.purple[1]
        g.beginPath()
        g.arc(x, y + 18, 7, 0, Math.PI * 2)
        g.fill()
      })
    })
  })
  drawText(g, 'A: BACK', W / 2, H - 28, {
    align: 'center',
    color: RAMPS.gold[4],
    outline: INK,
  })
}
