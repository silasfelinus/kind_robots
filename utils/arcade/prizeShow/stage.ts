// /utils/arcade/prizeShow/stage.ts
//
// Prize Show Panic's studio geometry, shared by the game, its roster and its art: a 320x240 screen,
// a 16px HUD, 10px walls, and a door in the middle of each wall (0 top, 1 right, 2 bottom, 3 left).

import type { Side } from './season'

export const W = 320
export const H = 240
export const HUD = 16
export const WALL = 10
export const LEFT = WALL
export const RIGHT = W - WALL
export const TOP = HUD + WALL
export const BOTTOM = H - WALL
export const DOOR = 18
export const CX = W / 2
export const CY = (TOP + BOTTOM) / 2

/** Sparkle's walking speed (px a tick); no crasher walks quite this fast. */
export const SPEED = 1.6

/** The four doors, by side: where crashers come in and the exits open. */
export const DOORS: ReadonlyArray<{ x: number; y: number; side: Side }> = [
  { x: CX, y: TOP, side: 0 },
  { x: RIGHT, y: CY, side: 1 },
  { x: CX, y: BOTTOM, side: 2 },
  { x: LEFT, y: CY, side: 3 },
]

export type Point = { x: number; y: number }

export function clampX(x: number, margin = 4): number {
  return Math.max(LEFT + margin, Math.min(RIGHT - margin, x))
}

export function clampY(y: number, margin = 4): number {
  return Math.max(TOP + margin, Math.min(BOTTOM - margin, y))
}

/** Where a wall turret hangs: `at` -1..1 along its wall, either side of the door, just inside. */
export function wallSpot(side: Side, at: number): Point {
  const door = DOORS[side]!
  const along = side % 2 === 0
  const half = along ? (RIGHT - LEFT) / 2 : (BOTTOM - TOP) / 2
  const reach = DOOR + 12 + Math.abs(at) * (half - DOOR - 26)
  const off = Math.sign(at) * reach
  if (along) return { x: door.x + off, y: side === 0 ? TOP + 5 : BOTTOM - 5 }
  return { x: side === 3 ? LEFT + 5 : RIGHT - 5, y: door.y + off }
}
