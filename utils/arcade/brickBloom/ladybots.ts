// /utils/arcade/brickBloom/ladybots.ts
//
// Brick Bloom's ladybot ring (conductor kr-arcade/t-079, depth-pass CABINETS.md section 11, slice 2):
// five ladybot dots orbit one Vine Hall crate and shield it. Break the ring dot by dot, then crack
// the crate. Pure functions; the cabinet owns the state and the drawing.

export type Ladybot = { angle: number; x: number; y: number }
export type LadybotRing = {
  cx: number
  cy: number
  dots: Ladybot[]
  popped: number
  total: number
}

export const RING_DOTS = 5
export const RING_RADIUS = 13
export const RING_SPIN = 0.035
export const LADYBOT_RADIUS = 3.5
export const LADYBOT_POP_SCORE = 40
export const RING_CLEAR_SCORE = 400

/** Vine Hall (house 1) rings one crate on its Tangle Column, Hanging Garden and Rose Window walls. */
const RING_WALLS: Readonly<Record<string, { col: number; row: number }>> = {
  'vine-2b': { col: 5, row: 2 },
  'vine-3b': { col: 5, row: 0 },
  'vine-4b': { col: 5, row: 3 },
}

export function ringedCrate(
  house: number,
  wallId: string,
): { col: number; row: number } | null {
  return house === 1 ? (RING_WALLS[wallId] ?? null) : null
}

function place(ring: LadybotRing, dot: Ladybot): void {
  dot.x = ring.cx + Math.cos(dot.angle) * RING_RADIUS
  dot.y = ring.cy + Math.sin(dot.angle) * RING_RADIUS
}

/** Five dots evenly spaced round a crate centred at (cx, cy). */
export function spawnRing(cx: number, cy: number): LadybotRing {
  const ring: LadybotRing = { cx, cy, dots: [], popped: 0, total: RING_DOTS }
  for (let i = 0; i < RING_DOTS; i++) {
    const dot = { angle: (i / RING_DOTS) * Math.PI * 2, x: cx, y: cy }
    place(ring, dot)
    ring.dots.push(dot)
  }
  return ring
}

/** One tick: the surviving dots orbit together. */
export function stepRing(ring: LadybotRing): void {
  for (const dot of ring.dots) {
    dot.angle += RING_SPIN
    place(ring, dot)
  }
}

/** The crate is shielded for as long as any dot is left. */
export function ringShields(ring: LadybotRing | null): boolean {
  return !!ring && ring.dots.length > 0
}

export function dotHit(dot: Ladybot, x: number, y: number): boolean {
  return Math.hypot(dot.x - x, dot.y - y) <= LADYBOT_RADIUS
}

/** Pop one dot. Returns the score, with the clear bonus when it was the ring's last. */
export function popDot(ring: LadybotRing, dot: Ladybot, level: number): number {
  const at = ring.dots.indexOf(dot)
  if (at < 0) return 0
  ring.dots.splice(at, 1)
  ring.popped++
  const cleared = ring.popped === ring.total
  return (
    (LADYBOT_POP_SCORE + (cleared ? RING_CLEAR_SCORE : 0)) * Math.max(1, level)
  )
}
