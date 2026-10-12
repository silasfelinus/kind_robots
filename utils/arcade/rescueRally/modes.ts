// /utils/arcade/rescueRally/modes.ts
//
// Rescue Rally's modes (conductor kr-arcade t-038, depth-pass/CABINETS.md section 1, "Modes"):
//
// - Campaign: Citywide Reboot, five districts and the endings (districts.ts).
// - Rally 100: a hundred waves in a long cycle, the leaderboard's main event. It walks every non-boss
//   wave of the city in order, round and round, each time round bigger and faster.
// - Time Attack: one district (once the campaign has reached it) against the clock, boss and all.
// - Classic Rally: the cabinet's original rules, kept: one arena, the five original foes, the old
//   random mix rising wave by wave, no beacons, no power-ups, no squad.
//
// And the medals: every district wave can win three, Everyone Home (every rescuee saved), Untouched
// (no hit) and Full Squad (three squad bots at the clear), kept on a board per district.

import { drawText, measureText } from '../font'
import { levelCurve } from '../curve'
import { INK, RAMPS, bandedGradient, hudPanel, shadedOrb } from '../snes'
import { H, W } from './arena'
import { DISTRICTS, WAVES_PER_DISTRICT } from './districts'
import type { WaveScript } from './waves'

export type ModeId = 'campaign' | 'rally100' | 'timeattack' | 'classic'

export const MENU = [
  {
    id: 'campaign',
    name: 'CAMPAIGN',
    line: 'SWEEP THE CITY, DISTRICT BY DISTRICT',
  },
  {
    id: 'rally100',
    name: 'RALLY 100',
    line: 'A HUNDRED WAVES. THE MAIN EVENT',
  },
  {
    id: 'timeattack',
    name: 'TIME ATTACK',
    line: 'ONE DISTRICT AGAINST THE CLOCK',
  },
  {
    id: 'classic',
    name: 'CLASSIC RALLY',
    line: 'THE ORIGINAL RULES, ONE ARENA',
  },
  { id: 'board', name: 'MEDAL BOARD', line: 'EVERY MEDAL YOU HAVE WON' },
] as const

export type MenuId = (typeof MENU)[number]['id']

// --- Rally 100 -------------------------------------------------------------------------------------

export const RALLY_LENGTH = 100
/** Rally 100 walks the city's non-boss waves; each time round they grow a loop's worth. */
const CYCLE = DISTRICTS.flatMap((d, district) =>
  d.waves
    .map((script, index) => ({ script, district, index }))
    .filter((w) => !w.script.boss),
)
export const RALLY_CYCLE = CYCLE.length
/** Points for finishing all hundred. */
export const RALLY_BONUS = 500_000

export function rallyWave(n: number) {
  const i = Math.max(0, Math.min(RALLY_LENGTH, Math.floor(n)) - 1)
  const entry = CYCLE[i % CYCLE.length]!
  return { ...entry, loop: 1 + Math.floor(i / 25) }
}

// --- Classic Rally ---------------------------------------------------------------------------------

/** The original cabinet's curves, as they were: flat from wave 12. */
export const CLASSIC_CURVES = {
  drones: { start: 14, step: 4, limit: 50 },
  puddles: { start: 2, step: 2, limit: 14 },
  spawners: { start: 0, step: 0.75, limit: 5 },
  tanks: { start: -1, step: 0.75, limit: 5 },
  rescuees: { start: 4, step: 1, limit: 9 },
} as const

export function classicWave(n: number): WaveScript {
  const count = (spec: { start: number; step: number; limit: number }) =>
    Math.max(0, Math.floor(levelCurve(n, spec)))
  const groups = [
    {
      kind: 'drone' as const,
      count: count(CLASSIC_CURVES.drones),
      from: 'scatter' as const,
    },
    {
      kind: 'spawner' as const,
      count: count(CLASSIC_CURVES.spawners),
      from: 'scatter' as const,
    },
    {
      kind: 'tank' as const,
      count: count(CLASSIC_CURVES.tanks),
      from: 'scatter' as const,
    },
  ].filter((g) => g.count > 0)
  return {
    name: 'CLASSIC',
    hint: 'THE ORIGINAL RULES',
    groups,
    puddles: count(CLASSIC_CURVES.puddles),
    family: { count: count(CLASSIC_CURVES.rescuees), at: 'scatter' },
    beacon: null,
  }
}

// --- medals ----------------------------------------------------------------------------------------

export const MEDALS = [
  { bit: 1, name: 'EVERYONE HOME', ramp: RAMPS.leaf },
  { bit: 2, name: 'UNTOUCHED', ramp: RAMPS.sky },
  { bit: 4, name: 'FULL SQUAD', ramp: RAMPS.gold },
] as const

export type MedalBoard = Record<string, number>

export function medalKey(district: number, index: number) {
  return `${DISTRICTS[district]!.id}:${index + 1}`
}

/** A stored medal board, checked; null when it is not one. */
export function readMedals(raw: unknown): MedalBoard | null {
  if (raw === undefined) return {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const keys = new Set(
    DISTRICTS.flatMap((d, di) =>
      Array.from({ length: WAVES_PER_DISTRICT }, (_, i) => medalKey(di, i)),
    ),
  )
  const out: MedalBoard = {}
  for (const [k, v] of Object.entries(raw)) {
    if (
      !keys.has(k) ||
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

/** Best Time Attack times (ticks) by district id. */
export type BestTimes = Record<string, number>

export function readTimes(raw: unknown): BestTimes | null {
  if (raw === undefined) return {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const ids = new Set(DISTRICTS.map((d) => d.id as string))
  const out: BestTimes = {}
  for (const [k, v] of Object.entries(raw)) {
    if (
      !ids.has(k) ||
      typeof v !== 'number' ||
      !Number.isInteger(v) ||
      v <= 0 ||
      v > 60 * 60 * 600
    )
      return null
    out[k] = v
  }
  return out
}

/** Ticks as M:SS.T. */
export function clock(ticks: number) {
  const tenths = Math.floor(ticks / 6)
  const m = Math.floor(tenths / 600)
  const s = Math.floor((tenths % 600) / 10)
  return `${m}:${String(s).padStart(2, '0')}.${tenths % 10}`
}

// --- screens ---------------------------------------------------------------------------------------

export type MenuView = {
  tick: number
  cursor: number
  /** The Time Attack district picked, and how far the campaign has reached. */
  district: number
  reached: number
  times: BestTimes
  players: number
}

export function renderMenu(g: CanvasRenderingContext2D, v: MenuView) {
  g.fillStyle = 'rgba(20, 10, 38, 0.86)'
  g.fillRect(0, 0, W, H)
  drawText(g, 'RESCUE RALLY', W / 2, 26, {
    scale: 3,
    align: 'center',
    color: RAMPS.teal[4],
    outline: INK,
    shadow: RAMPS.pink[1],
  })
  drawText(g, 'CITYWIDE REBOOT', W / 2, 56, {
    scale: 2,
    align: 'center',
    color: RAMPS.gold[3],
    outline: INK,
  })
  MENU.forEach((item, i) => {
    const y = 86 + i * 44
    const on = i === v.cursor
    hudPanel(g, 60, y, W - 120, 38, on ? RAMPS.gold : RAMPS.purple)
    drawText(g, item.name, W / 2, y + 5, {
      scale: 2,
      align: 'center',
      color: on ? '#ffffff' : RAMPS.steel[3],
      outline: INK,
    })
    let line: string = item.line
    if (item.id === 'timeattack') {
      const d = DISTRICTS[v.district]!
      const best = v.times[d.id]
      line =
        v.district > v.reached
          ? `< ${d.name} > LOCKED`
          : `< ${d.name} >  BEST ${best ? clock(best) : '-:--.-'}`
    }
    drawText(g, line, W / 2, y + 24, {
      align: 'center',
      color: on ? RAMPS.cream[3] : RAMPS.steel[2],
      outline: INK,
    })
  })
  const seats =
    v.players > 1 ? `${v.players} HEROES, ONE TEAM` : 'UP/DOWN PICK   A GO'
  drawText(g, seats, W / 2, H - 16, {
    align: 'center',
    color: RAMPS.teal[3],
    outline: INK,
  })
}

export function renderBoard(
  g: CanvasRenderingContext2D,
  medals: MedalBoard,
  times: BestTimes,
  reached: number,
) {
  bandedGradient(
    g,
    0,
    0,
    W,
    H,
    [RAMPS.night[2], RAMPS.night[1], RAMPS.night[0]],
    6,
  )
  drawText(g, 'MEDAL BOARD', W / 2, 14, {
    scale: 3,
    align: 'center',
    color: RAMPS.gold[4],
    outline: INK,
    shadow: RAMPS.pink[1],
  })
  const left = 150
  const cell = 36
  for (let i = 0; i < WAVES_PER_DISTRICT; i++) {
    drawText(g, i === 7 ? 'B' : String(i + 1), left + i * cell + cell / 2, 54, {
      align: 'center',
      color: RAMPS.steel[3],
      outline: INK,
    })
  }
  DISTRICTS.forEach((d, di) => {
    const y = 70 + di * 52
    const open = di <= reached
    hudPanel(g, 8, y, W - 16, 46, open ? RAMPS.purple : RAMPS.steel)
    drawText(g, d.name, 16, y + 8, {
      color: open ? '#ffffff' : RAMPS.steel[2],
      outline: INK,
    })
    const best = times[d.id]
    drawText(
      g,
      best ? `BEST ${clock(best)}` : open ? 'NO TIME YET' : 'LOCKED',
      16,
      y + 26,
      {
        color: best ? RAMPS.gold[3] : RAMPS.steel[2],
        outline: INK,
      },
    )
    for (let i = 0; i < WAVES_PER_DISTRICT; i++) {
      const bits = medals[medalKey(di, i)] ?? 0
      MEDALS.forEach((m, k) => {
        const x = left + i * cell + 8 + k * 10
        const has = (bits & m.bit) !== 0
        if (has) shadedOrb(g, x, y + 23, 4, m.ramp)
        else {
          g.fillStyle = INK
          g.fillRect(x - 3, y + 20, 7, 7)
          g.fillStyle = RAMPS.night[2]
          g.fillRect(x - 2, y + 21, 5, 5)
        }
      })
    }
  })
  // The legend: each medal's orb and name.
  let lx = 40
  for (const m of MEDALS) {
    shadedOrb(g, lx, H - 19, 4, m.ramp)
    drawText(g, m.name, lx + 8, H - 22, { color: RAMPS.cream[3], outline: INK })
    lx += measureText(m.name) + 40
  }
  drawText(g, 'A TO GO BACK', W / 2, H - 10, {
    align: 'center',
    color: RAMPS.teal[3],
    outline: INK,
  })
}
