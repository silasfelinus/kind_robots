// /utils/arcade/brickBloom/rules.ts
//
// Brick Bloom's slice-1 rules as pure functions (conductor kr-arcade/t-078): the Bloom Bed safety
// net, the Pollen Chain, Last-Crate Rush with Bumble, the Leaf Curl, ball heat, the roof chime and
// the Queen's Compass path. The cabinet owns the state; these own the numbers, so the cabinet test
// can pin each rule without playing a stage.

export const W = 256
export const LEFT = 8
export const RIGHT = W - 8
export const TOP = 26
export const BALL_R = 2.5

// --- Bloom Bed -----------------------------------------------------------------------------

export const PLOTS = 8
/** Flowers a plot needs to be in full bloom: sprout, bud, bloom. */
export const FULL_BLOOM = 3
/** A plot a missed ball bounces off drops back to a sprout. */
export const BLOOM_SPENT = 1
export const PLOT_W = (RIGHT - LEFT) / PLOTS

export type Bed = number[]

export function newBed(): Bed {
  return Array.from({ length: PLOTS }, () => 0)
}

export function plotIndex(x: number): number {
  return Math.max(0, Math.min(PLOTS - 1, Math.floor((x - LEFT) / PLOT_W)))
}

export function plotCenter(plot: number): number {
  return LEFT + (plot + 0.5) * PLOT_W
}

/** A falling flower lands: its plot grows one step. Returns the plot and whether it just bloomed. */
export function plantPetal(
  bed: Bed,
  x: number,
): { plot: number; bloomed: boolean } {
  const plot = plotIndex(x)
  const before = bed[plot]!
  bed[plot] = Math.min(FULL_BLOOM, before + 1)
  return { plot, bloomed: before < FULL_BLOOM && bed[plot] === FULL_BLOOM }
}

/** A missed ball over a plot in full bloom is bounced back up once; the plot is spent. */
export function bedSave(bed: Bed, x: number): number | null {
  const plot = plotIndex(x)
  if (bed[plot]! < FULL_BLOOM) return null
  bed[plot] = BLOOM_SPENT
  return plot
}

/** The tumbleweed (slice 3) and the Gloom Bloom (slice 5) both trample a plot; kept here with the bed. */
export function trample(bed: Bed, plot: number): void {
  if (plot >= 0 && plot < PLOTS) bed[plot] = 0
}

// --- Pollen Chain --------------------------------------------------------------------------

export const MAX_CHAIN = 8
/** A chain of this many crates or more is cashed in when the ball touches the paddle. */
export const CASH_IN_AT = 3
export const CASH_IN_POINTS = 50

/** The multiplier for the next crate, given how many were cracked since the last paddle touch. */
export function chainMultiplier(chain: number): number {
  return Math.max(1, Math.min(MAX_CHAIN, chain + 1))
}

export function cashIn(chain: number): number {
  return chain >= CASH_IN_AT ? CASH_IN_POINTS * Math.min(chain, MAX_CHAIN) : 0
}

/** The trail colour steps through the chain: pink, orange, gold, lime, teal, sky, violet, white. */
export const CHAIN_COLORS = [
  '#f9a8d4',
  '#fb923c',
  '#fde047',
  '#a3e635',
  '#2dd4bf',
  '#38bdf8',
  '#a78bfa',
  '#ffffff',
] as const

export function chainColor(chain: number): string {
  return CHAIN_COLORS[Math.max(0, Math.min(MAX_CHAIN - 1, chain - 1))]!
}

// --- Last-Crate Rush -----------------------------------------------------------------------

/** Rush starts when this many breakable crates (or fewer) are left. */
export const RUSH_AT = 4
/** Bumble taps the nearest crate this often, so the last three can't take long. */
export const BUMBLE_TAP_TICKS = 120
export const RUSH_STEER = 0.1
/** The most the steering may turn a ball in one tick, in radians. */
export const RUSH_MAX_TURN = 0.03
export const RUSH_BONUS = 1000
export const RUSH_BONUS_TICKS = 3

export function rushActive(breakableLeft: number): boolean {
  return breakableLeft > 0 && breakableLeft <= RUSH_AT
}

export function rushBonus(ticksInRush: number): number {
  return Math.max(0, RUSH_BONUS - Math.floor(ticksInRush / RUSH_BONUS_TICKS))
}

export function rotate(
  vx: number,
  vy: number,
  angle: number,
): { vx: number; vy: number } {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return { vx: vx * c - vy * s, vy: vx * s + vy * c }
}

/** Curve a rising ball gently toward a target: 10% of the angle between them, a hair per tick. */
export function steerToward(
  vx: number,
  vy: number,
  dx: number,
  dy: number,
): { vx: number; vy: number } {
  if (vy >= 0) return { vx, vy }
  let diff = Math.atan2(dy, dx) - Math.atan2(vy, vx)
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  const turn = Math.max(
    -RUSH_MAX_TURN,
    Math.min(RUSH_MAX_TURN, diff * RUSH_STEER),
  )
  return rotate(vx, vy, turn)
}

// --- Leaf Curl -----------------------------------------------------------------------------

/** Press B this soon after a paddle hit, while the paddle moves, to curl the ball. */
export const CURL_WINDOW = 12
/** Half a second of bend. */
export const CURL_TICKS = 30
export const CURL_TURN = 0.026
export const CURL_MIN_SPEED = 1.5

export function curlDirection(paddleV: number): -1 | 0 | 1 {
  return Math.abs(paddleV) < CURL_MIN_SPEED ? 0 : paddleV > 0 ? 1 : -1
}

// --- Ball heat -----------------------------------------------------------------------------

export type Heat = 0 | 1 | 2
/** Speeds (pixels per tick) at which the ball turns orange, then white-hot. */
export const HEAT_STEPS = [3.3, 4.1] as const
export const HEAT_COLORS = ['#fde68a', '#fb923c', '#ffffff'] as const
export const HEAT_COOL = 0.6
export const MIN_SPEED = 2

export function ballHeat(speed: number): Heat {
  return speed >= HEAT_STEPS[1] ? 2 : speed >= HEAT_STEPS[0] ? 1 : 0
}

/** A bloom-bed save cools the ball a step. */
export function coolSpeed(speed: number): number {
  return Math.max(MIN_SPEED, speed - HEAT_COOL)
}

// --- Roof chime ----------------------------------------------------------------------------

export const CHIME_MULT = 2

// --- Seeds ---------------------------------------------------------------------------------

export const RAIN_TICKS = 60 * 10
export const RAIN_EVERY = 14
export const THORN_TICKS = 60 * 8
export const COMPASS_TICKS = 60 * 10

// --- Queen's Compass -----------------------------------------------------------------------

export type Rect = { x: number; y: number; w: number; h: number }

/**
 * The ball's path two bounces ahead: marched in 2 px steps off the roof, the side walls and the
 * given solid rects (a bounce is any reflection). Returns the points to dot on the screen.
 */
export function predictPath(
  ball: { x: number; y: number; vx: number; vy: number },
  solids: readonly Rect[],
  bounces = 2,
  maxSteps = 260,
): Array<{ x: number; y: number }> {
  const s = Math.hypot(ball.vx, ball.vy)
  if (s === 0) return []
  let { x, y } = ball
  let dx = (ball.vx / s) * 2
  let dy = (ball.vy / s) * 2
  const out: Array<{ x: number; y: number }> = []
  let left = bounces
  const inside = (px: number, py: number) =>
    solids.some(
      (r) =>
        px + BALL_R > r.x &&
        px - BALL_R < r.x + r.w &&
        py + BALL_R > r.y &&
        py - BALL_R < r.y + r.h,
    )
  for (let i = 0; i < maxSteps && left >= 0; i++) {
    x += dx
    if (x < LEFT + BALL_R || x > RIGHT - BALL_R || inside(x, y)) {
      x -= dx
      dx = -dx
      left--
    }
    y += dy
    if (y < TOP + BALL_R || inside(x, y)) {
      y -= dy
      dy = -dy
      left--
    }
    if (i % 2 === 0) out.push({ x, y })
    if (y > 320) break
  }
  return out
}
