// /utils/arcade/pinball/rules/lightShows.ts
//
// Light shows (conductor kind-pinball/t-009): short lamp sequences that play
// over the lamp matrix when something happens, the way a Williams machine
// answers a shot with a sweep of light toward it. Pure: a show is a start
// tick and an id, its frames are a function of the table and the tick, and
// what starts one is read from two rules states. The runtime only keeps the
// list.
//
//   shot        lamps converge on the made shot's arrow; its flasher fires
//   multiplier  the rainbow runs round three times, then the flashers fire
//   secret      the room is found: flashers strobe, the GI drops, a chase
//   ball-start  a wave runs up the table and the GI comes up behind it
//   kickback    the kickback lamp and the left flasher strobe
//   drain       the inserts go out and the GI browns down
//
// The attract show cycles several patterns so the machine looks alive while
// it waits for a player.

import type { InsertDef, LampLevel, PostCollider, TableDef } from '../types'
import type { PinballRulesState } from './engine'
import { RAINBOW_LAMPS, type LampFrame } from './lamps'

export type LightShowId =
  'shot' | 'multiplier' | 'secret' | 'ball-start' | 'kickback' | 'drain'

export type LightShow = {
  id: LightShowId
  /** Arcade tick the show started on. */
  start: number
  /** The shot a 'shot' show converges on. */
  shot?: string
}

/** How long each show runs, in arcade ticks (60 a second). */
export const SHOW_TICKS: Record<LightShowId, number> = {
  shot: 30,
  multiplier: 60,
  secret: 120,
  'ball-start': 36,
  kickback: 30,
  drain: 50,
}

/** At most this many shows play at once; the oldest give way. */
export const MAX_SHOWS = 3

/** Shows the change from one rules state to the next calls for. */
export function showTriggers(
  before: PinballRulesState,
  after: PinballRulesState,
  tick: number,
): LightShow[] {
  const shows: LightShow[] = []
  for (const [shot, made] of Object.entries(after.shotsMade)) {
    if (made > (before.shotsMade[shot] ?? 0))
      shows.push({ id: 'shot', start: tick, shot })
  }
  if (after.bonusMultiplier > before.bonusMultiplier)
    shows.push({ id: 'multiplier', start: tick })
  if (after.sub.found > before.sub.found)
    shows.push({ id: 'secret', start: tick })
  if (before.kickbackLit && !after.kickbackLit && !after.tilted)
    shows.push({ id: 'kickback', start: tick })
  if (after.lives < before.lives && !after.over)
    shows.push({ id: 'drain', start: tick })
  if (after.ball > before.ball && !after.over)
    shows.push({ id: 'ball-start', start: tick + SHOW_TICKS.drain })
  return shows
}

/** Keep the shows still playing at `tick`, newest last, at most MAX_SHOWS. */
export function liveShows(shows: LightShow[], tick: number): LightShow[] {
  return shows
    .filter((s) => tick < s.start + SHOW_TICKS[s.id])
    .slice(-MAX_SHOWS)
}

const BLINK = (tick: number, period: number) =>
  Math.floor(tick / period) % 2 === 0

/** How far up the table an insert sits, 0 (flippers) to 1 (the arch). */
function height(insert: InsertDef, table: TableDef): number {
  const main = table.cameras.find((c) => c.id === 'main')
  const near = main?.frame.max[2] ?? 0.2
  const far = main?.frame.min[2] ?? -1
  return Math.min(1, Math.max(0, (near - insert.at[1]) / (near - far)))
}

/** Lay one show's frame at `tick` over the lamps beneath it. */
function overlay(
  frame: LampFrame,
  show: LightShow,
  table: TableDef,
  tick: number,
): LampFrame {
  const lamps = { ...frame.lamps }
  let gi = frame.gi
  const t = (tick - show.start) / SHOW_TICKS[show.id]
  if (t < 0 || t >= 1) return frame
  const inserts = table.inserts ?? []
  const set = (id: string | undefined, level: LampLevel) => {
    if (id && id in lamps) lamps[id] = level
  }
  switch (show.id) {
    case 'shot': {
      const target = inserts.find((i) => i.shot === show.shot)
      if (!target) break
      // A ring of light closing in on the shot's arrow.
      const radius = 0.35 * (1 - t)
      for (const insert of inserts) {
        const d = Math.hypot(
          insert.at[0] - target.at[0],
          insert.at[1] - target.at[1],
        )
        if (Math.abs(d - radius) < 0.06) set(insert.id, 'on')
      }
      set(target.id, BLINK(tick, 3) ? 'on' : 'off')
      if (t < 0.4) set(target.flasher, 'on')
      break
    }
    case 'multiplier': {
      const step = Math.floor(t * RAINBOW_LAMPS.length * 3)
      for (const [i, id] of RAINBOW_LAMPS.entries())
        set(id, i === step % RAINBOW_LAMPS.length ? 'on' : 'off')
      if (t > 0.8) for (const f of table.flashers ?? []) set(f.id, 'on')
      break
    }
    case 'secret': {
      gi *= 0.35
      const strobe = BLINK(tick, 4)
      for (const f of table.flashers ?? []) set(f.id, strobe ? 'on' : 'off')
      const band = (t * 8) % 1
      for (const insert of inserts)
        set(
          insert.id,
          Math.abs(height(insert, table) - band) < 0.12 ? 'on' : 'off',
        )
      break
    }
    case 'ball-start': {
      gi *= 0.4 + 0.6 * t
      for (const insert of inserts)
        set(
          insert.id,
          Math.abs(height(insert, table) - t * 1.2) < 0.15
            ? 'on'
            : lamps[insert.id]!,
        )
      break
    }
    case 'kickback': {
      const strobe = BLINK(tick, 3)
      set('lamp-kickback', strobe ? 'on' : 'off')
      set('flasher-left', strobe ? 'on' : 'off')
      break
    }
    case 'drain': {
      gi *= 1 - 0.5 * Math.min(1, t * 2)
      for (const insert of inserts) set(insert.id, 'off')
      break
    }
  }
  return { lamps, gi }
}

/** The lamp matrix with every live show laid over it, oldest first. */
export function applyShows(
  frame: LampFrame,
  shows: LightShow[],
  table: TableDef,
  tick: number,
): LampFrame {
  return shows.reduce((acc, show) => overlay(acc, show, table, tick), frame)
}

/** Ticks each attract pattern runs before the next takes over. */
export const ATTRACT_PATTERN_TICKS = 240

/**
 * The attract show: a chase up the table, a sweep side to side, a ring
 * pulsing out from the pops, and the whole table blinking in two halves,
 * with the flashers keeping time.
 */
export function attractShow(table: TableDef, tick: number): LampFrame {
  const lamps: Record<string, LampLevel> = {}
  const inserts = table.inserts ?? []
  const pattern = Math.floor(tick / ATTRACT_PATTERN_TICKS) % 4
  const phase = (tick % ATTRACT_PATTERN_TICKS) / ATTRACT_PATTERN_TICKS
  const xs = inserts.map((i) => i.at[0])
  const left = Math.min(...xs)
  const span = Math.max(...xs) - left || 1
  const hub = table.colliders.filter(
    (c): c is PostCollider => c.kind === 'post' && !!c.kick,
  )
  const cx = hub.reduce((a, c) => a + c.at[0], 0) / (hub.length || 1)
  const cz = hub.reduce((a, c) => a + c.at[2], 0) / (hub.length || 1)
  const lit = (insert: InsertDef, index: number): boolean => {
    if (pattern === 0)
      return Math.abs(height(insert, table) - ((phase * 4) % 1)) < 0.14
    if (pattern === 1) {
      const across = (insert.at[0] - left) / span
      return Math.abs(across - Math.abs(((phase * 3) % 2) - 1)) < 0.16
    }
    if (pattern === 2) {
      const d = Math.hypot(insert.at[0] - cx, insert.at[1] - cz)
      return Math.abs(d - ((phase * 3) % 1) * 0.9) < 0.08
    }
    return (index % 2 === 0) === BLINK(tick, 15)
  }
  for (const [index, insert] of inserts.entries())
    lamps[insert.id] = lit(insert, index) ? 'on' : 'off'
  for (const [i, flasher] of (table.flashers ?? []).entries()) {
    const beat = Math.floor(tick / 20) % ((table.flashers ?? []).length * 2)
    lamps[flasher.id] = beat === i * 2 ? 'on' : 'off'
  }
  return { lamps, gi: 1 }
}
