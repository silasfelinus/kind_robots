// /utils/arcade/brickBloom/mites.ts
//
// Brick Bloom's pollen mite (conductor kr-arcade/t-079, depth-pass CABINETS.md section 11, slice 2):
// a line of three hatch enemies that sway down from the Seedling House roof vents. Pop the whole
// line for a petal chain. Pure functions; the cabinet owns the state and the drawing.

import { LEFT, RIGHT, TOP } from './rules'

export type Mite = { baseX: number; x: number; y: number; phase: number }
export type MiteLine = { mites: Mite[]; popped: number; total: number }

export const MITE_LINE = 3
export const MITE_RADIUS = 7
export const MITE_SWAY = 14
export const MITE_FALL = 0.22
/** The mites give up and drift back into the vents below this height. */
export const MITE_FLOOR = 215
export const MITE_POP_SCORE = 50
export const MITE_CHAIN_SCORE = 300

/** The Seedling House (house 0) is where mites hatch, from its second wall on. */
export function mitesHatch(house: number, wallId: string): boolean {
  return house === 0 && wallId !== 'seed-1'
}

/** Three mites in a spaced line under the roof, swaying out of step with each other. */
export function spawnMiteLine(centerX: number): MiteLine {
  const mid = Math.max(
    LEFT + MITE_SWAY + 26,
    Math.min(RIGHT - MITE_SWAY - 26, centerX),
  )
  const mites: Mite[] = []
  for (let i = 0; i < MITE_LINE; i++) {
    const baseX = mid + (i - 1) * 26
    mites.push({ baseX, x: baseX, y: TOP + 6 - i * 4, phase: i * 0.9 })
  }
  return { mites, popped: 0, total: MITE_LINE }
}

/** One tick: fall, sway side to side. */
export function stepMite(m: Mite, tick: number): void {
  m.y += MITE_FALL
  m.x = m.baseX + Math.sin(tick / 22 + m.phase) * MITE_SWAY
}

export function miteGone(m: Mite): boolean {
  return m.y > MITE_FLOOR
}

export function miteHit(m: Mite, x: number, y: number): boolean {
  return Math.hypot(m.x - x, m.y - y) <= MITE_RADIUS
}

/** Pop one mite. Returns the score, with the chain bonus when it was the line's last. */
export function popMite(line: MiteLine, m: Mite, level: number): number {
  const at = line.mites.indexOf(m)
  if (at < 0) return 0
  line.mites.splice(at, 1)
  line.popped++
  const chained = line.popped === line.total
  return (
    (MITE_POP_SCORE + (chained ? MITE_CHAIN_SCORE : 0)) * Math.max(1, level)
  )
}
