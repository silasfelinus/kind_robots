// /utils/arcade/rescueRally/floors.ts
//
// The floors of Rescue Rally's last three districts (conductor kr-arcade t-037, depth-pass/CABINETS.md
// section 1, "The districts"). Each is data on a wave script, and these are their rules:
//
// - the Botanic Dome: vine walls (solid; they grow wave by wave), sprinkler zones that slow everyone
//   in them, and flowerbeds where the family hides from hypnos and stompers;
// - the Data Docks: teleport pads (step on one, step out of its twin), laser gates that hum on a
//   beat (they flicker first), and magnet floors that pull walkers and bend the beam;
// - the Storm Rooftops: wind that turns and gusts, lightning that strikes after a glowing ring, and
//   low roof edges: a rescuee the wind blows to the edge clings on, dizzy, and heads home.

import { dist } from './arena'
import type { Point } from './arena'

export type Rect = { x: number; y: number; w: number; h: number }
export type Sprinkler = { x: number; y: number; r: number }
export type PadPair = readonly [Point, Point]
/** A laser gate: a segment, hot for `on` ticks of every `period` (from `offset`). */
export type LaserGate = {
  x0: number
  y0: number
  x1: number
  y1: number
  period: number
  on: number
  offset: number
}
/** The rooftop weather: a strike every so often, and wind of this strength (px per tick). */
export type Storm = { lightningEvery: number; wind: number }

/** In a sprinkler's spray everyone moves at this fraction of their speed. */
export const SPRINKLER_SLOW = 0.55
export const PAD_RADIUS = 11
/** A pad won't send the same one back for this long. */
export const PAD_COOLDOWN = 70
/** A gate flickers this long before it goes hot; it hurts within this many px of its line. */
export const GATE_TELL = 30
export const GATE_REACH = 5
/** A magnet floor pulls this hard toward its centre line. */
export const MAGNET_FLOOR_PULL = 0.45
/** Lightning: the ring glows this long, then the strike hits everything this close. */
export const LIGHTNING_TELL = 60
export const LIGHTNING_RADIUS = 20
/** The wind turns to a new heading this often. */
export const WIND_TURN = 60 * 9

export function inRect(p: Point, r: Rect) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h
}

/** Push a circle at `o` of radius `r` out of a solid rectangle; true when it had to move. */
export function pushOutOfRect(o: Point, r: number, rect: Rect): boolean {
  const cx = Math.max(rect.x, Math.min(o.x, rect.x + rect.w))
  const cy = Math.max(rect.y, Math.min(o.y, rect.y + rect.h))
  const dx = o.x - cx
  const dy = o.y - cy
  const d = Math.hypot(dx, dy)
  if (d >= r) return false
  if (d > 0.01) {
    o.x = cx + (dx / d) * r
    o.y = cy + (dy / d) * r
    return true
  }
  // Dead inside: out by the nearest side.
  const sides = [
    { d: o.x - rect.x, x: rect.x - r, y: o.y },
    { d: rect.x + rect.w - o.x, x: rect.x + rect.w + r, y: o.y },
    { d: o.y - rect.y, x: o.x, y: rect.y - r },
    { d: rect.y + rect.h - o.y, x: o.x, y: rect.y + rect.h + r },
  ].sort((a, b) => a.d - b.d)
  o.x = sides[0]!.x
  o.y = sides[0]!.y
  return true
}

export function gateState(g: LaserGate, tick: number): 'off' | 'tell' | 'on' {
  const t = (tick + g.offset) % g.period
  if (t < g.on) return 'on'
  if (t >= g.period - GATE_TELL) return 'tell'
  return 'off'
}

/** How far a point is from a segment. */
export function segmentDistance(
  p: Point,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  const dx = x1 - x0
  const dy = y1 - y0
  const len2 = dx * dx + dy * dy || 1
  const t = Math.max(0, Math.min(1, ((p.x - x0) * dx + (p.y - y0) * dy) / len2))
  return Math.hypot(x0 + dx * t - p.x, y0 + dy * t - p.y)
}

/** The far end of the pad a point stands on, or null. */
export function padExit(p: Point, pads: readonly PadPair[]): Point | null {
  for (const [a, b] of pads) {
    if (dist(p, a) < PAD_RADIUS) return b
    if (dist(p, b) < PAD_RADIUS) return a
  }
  return null
}

/** The wind at a moment: a heading that turns every WIND_TURN ticks, gusting. */
export function windAt(tick: number, storm: Storm | undefined): Point {
  if (!storm || !storm.wind) return { x: 0, y: 0 }
  const leg = Math.floor(tick / WIND_TURN)
  const heading = leg * 2.4 + 0.7
  const gust = 0.6 + 0.4 * Math.sin(tick / 45) * Math.sin(tick / 17)
  return {
    x: Math.cos(heading) * storm.wind * gust,
    y: Math.sin(heading) * storm.wind * gust,
  }
}
