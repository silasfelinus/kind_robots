// /utils/arcade/ribbonRiders/rivals.ts
//
// The rival crews' personalities (conductor kr-arcade/t-074; the Snowplow, the Tandem, the Lantern
// Kid and the Carousel Keeper's ponies joined in t-075): one steering brain became a table.
// Every rival weighs the same three choices each cell (straight on, left or right) by how much room
// lies that way, then leans by its own personality. Each has a look you can read (its tell) and a
// way to beat it (its answer), shown on the arena's title card.

import { DX, DY, mirrorY, turnLeft, turnRight, type Dir } from './grid'

export type RivalKind =
  | 'roamer'
  | 'cutter'
  | 'copycat'
  | 'pacer'
  | 'hugger'
  | 'dasher'
  | 'snowplow'
  | 'tandem'
  | 'lanternKid'
  | 'pony'

/** What a rival's brain can see. */
export type SteerCtx = {
  rng: () => number
  /** 0..1: how hard this round's crews press their personality. */
  cunning: number
  /** Free cells reachable from a cell (0 when it is blocked), capped. */
  room(x: number, y: number): number
  /** The cell a step that way lands on (wrapping edges), or null off the board. */
  next(x: number, y: number, d: Dir): [number, number] | null
  /** Solid: terrain, the wall, any ribbon. */
  solid(x: number, y: number): boolean
  /** The nearest rider still rolling. */
  target: { x: number; y: number; dir: Dir } | null
  /** Somewhere this rival wants to be (its next arch, the nearest glowbug), or null. */
  goal?: { x: number; y: number } | null
}

export type SteerBike = { x: number; y: number; dir: Dir }

export type RivalSpec = {
  name: string
  colour: string
  /** Speed against the round's pace; 'match' rides at its target's speed. */
  speed: number | 'match'
  /** Chance of a random free turn on any cell. */
  wander: number
  tell: string
  answer: string
  /** Drives over ribbons, erasing them (the Snowplow). */
  plow?: boolean
  /** Lays no ribbon and bumps nobody (the Lantern Kid). It is never needed to clear a round. */
  harmless?: boolean
  /** Spawns as two bikes riding a fixed offset apart and turning together (the Tandem). */
  pair?: boolean
  /** How hard it pulls toward its goal, when it has one. */
  goalPull?: number
  /** Points of preference for heading `d` into (nx, ny) with `space` room beyond. */
  lean?(
    ctx: SteerCtx,
    b: SteerBike,
    d: Dir,
    nx: number,
    ny: number,
    space: number,
  ): number
}

/** Room counted per choice, at most. */
export const FLOOD_LIMIT = 90
/** A Hugger with a wall or ribbon at its side rides this much faster. */
export const HUG_BOOST = 1.45

function aimPull(
  ctx: SteerCtx,
  nx: number,
  ny: number,
  ax: number,
  ay: number,
  weight: number,
): number {
  return -weight * Math.hypot(nx - ax, ny - ay)
}

/** A solid cell just beside (x, y), across heading d. */
export function besideSolid(
  ctx: SteerCtx,
  x: number,
  y: number,
  d: Dir,
): boolean {
  for (const s of [turnLeft(d), turnRight(d)]) {
    const n = ctx.next(x, y, s)
    if (!n || ctx.solid(n[0], n[1])) return true
  }
  return false
}

export const RIVALS: Record<RivalKind, RivalSpec> = {
  roamer: {
    name: 'ROAMER',
    colour: '#22d3ee',
    speed: 0.95,
    wander: 0.06,
    tell: 'A WOBBLY HEADLIGHT',
    answer: 'GIVE IT SPACE: IT BOXES ITSELF IN',
  },
  cutter: {
    name: 'CUTTER',
    colour: '#f472b6',
    speed: 1,
    wander: 0.02,
    tell: 'ITS HEADLIGHT SWINGS TO YOU',
    answer: 'BRAKE, LET IT CUT AIR, WRAP IT',
    lean(ctx, _b, _d, nx, ny, space) {
      const t = ctx.target
      if (!t || space <= 30) return 0
      const ax = t.x + DX[t.dir] * 8
      const ay = t.y + DY[t.dir] * 8
      return aimPull(ctx, nx, ny, ax, ay, 3 + ctx.cunning * 5)
    },
  },
  copycat: {
    name: 'COPYCAT',
    colour: '#e879f9',
    speed: 1,
    wander: 0.01,
    tell: 'YOUR COLOURS, BACKWARDS',
    answer: 'TURN SO THE MIRROR HITS A WALL',
    lean(ctx, _b, d, _nx, _ny, space) {
      const t = ctx.target
      if (!t || space <= 12) return 0
      return d === mirrorY(t.dir) ? 26 + ctx.cunning * 14 : 0
    },
  },
  pacer: {
    name: 'PACER',
    colour: '#a3e635',
    speed: 'match',
    wander: 0.01,
    tell: 'RIDES BESIDE YOU, TWO CELLS OFF',
    answer: 'BRAKE HARD AND CUT IN BEHIND',
    lean(ctx, b, _d, nx, ny, space) {
      const t = ctx.target
      if (!t || space <= 25) return 0
      // Two cells off the target's flank, on whichever side the Pacer already is.
      const side = turnRight(t.dir)
      const across = (b.x - t.x) * DX[side] + (b.y - t.y) * DY[side]
      const s = across >= 0 ? 1 : -1
      const ax = t.x + DX[side] * 2 * s + DX[t.dir] * 2
      const ay = t.y + DY[side] * 2 * s + DY[t.dir] * 2
      return aimPull(ctx, nx, ny, ax, ay, 4 + ctx.cunning * 4)
    },
  },
  hugger: {
    name: 'HUGGER',
    colour: '#fb923c',
    speed: 0.9,
    wander: 0.02,
    tell: 'SPARKS OFF ITS SIDE',
    answer: 'LEAD IT DOWN A DEAD END',
    lean(ctx, _b, d, nx, ny, space) {
      if (space <= 20) return 0
      return besideSolid(ctx, nx, ny, d) ? 10 + ctx.cunning * 6 : 0
    },
  },
  dasher: {
    name: 'DASHER',
    colour: '#c084fc',
    speed: 1.12,
    wander: 0.03,
    tell: 'A DASHED TRAIL',
    answer: 'SLIP THROUGH ITS GAPS',
    lean(ctx, _b, _d, nx, ny, space) {
      const t = ctx.target
      if (!t || space <= 30) return 0
      const ax = t.x + DX[t.dir] * 5
      const ay = t.y + DY[t.dir] * 5
      return aimPull(ctx, nx, ny, ax, ay, 2 + ctx.cunning * 2)
    },
  },
  snowplow: {
    name: 'SNOWPLOW',
    colour: '#e2e8f0',
    speed: 0.88,
    wander: 0.03,
    tell: 'A SHOVEL NOSE AND WHITE SPRAY',
    answer: 'BAIT IT INTO A LAMP POST',
    plow: true,
    lean(ctx, _b, _d, nx, ny, space) {
      const t = ctx.target
      if (!t || space <= 20) return 0
      return aimPull(ctx, nx, ny, t.x, t.y, 2 + ctx.cunning * 3)
    },
  },
  tandem: {
    name: 'TANDEM',
    colour: '#facc15',
    speed: 0.92,
    wander: 0.02,
    tell: 'TWO BIKES ON A BRIGHT TETHER',
    answer: 'ONE LOOP ROUND BOTH WRAPS BOTH',
    pair: true,
  },
  lanternKid: {
    name: 'LANTERN KID',
    colour: '#fde047',
    speed: 0.9,
    wander: 0.04,
    tell: 'CARRIES A LANTERN, LAYS NO RIBBON',
    answer: 'RACE IT TO THE GLOWBUGS. BE KIND',
    harmless: true,
    goalPull: 9,
  },
  pony: {
    name: 'PONY',
    colour: '#f9a8d4',
    speed: 0.85,
    wander: 0.05,
    tell: 'A CAROUSEL POLE',
    answer: 'WRAP ALL THREE TO CRACK THE RING',
  },
}

/** Pull toward a goal for a rival with no pull of its own (a Tag Lap racer). */
export const GOAL_PULL = 5

/** Clear cells straight on from (x, y) heading d, up to `n`. */
function clearRun(
  ctx: SteerCtx,
  x: number,
  y: number,
  d: Dir,
  n: number,
): number {
  let at: [number, number] | null = [x, y]
  for (let k = 0; k < n; k++) {
    at = ctx.next(at[0], at[1], d)
    if (!at || ctx.solid(at[0], at[1])) return k
  }
  return n
}

/**
 * A Tandem's one shared turn: the way that leaves room for both bikes. A turn toward the partner
 * would cross its ribbon, so a way whose next few cells are not clear for both is all but ruled out.
 */
export function steerPair(
  ctx: SteerCtx,
  lead: SteerBike,
  follow: SteerBike,
): Dir {
  const spec = RIVALS.tandem
  let best: Dir = lead.dir
  let bestScore = -Infinity
  for (const d of [lead.dir, turnLeft(lead.dir), turnRight(lead.dir)]) {
    const a = ctx.next(lead.x, lead.y, d)
    const b = ctx.next(follow.x, follow.y, d)
    if (!a || !b) continue
    const space = Math.min(ctx.room(a[0], a[1]), ctx.room(b[0], b[1]))
    if (space === 0) continue
    const run = Math.min(
      clearRun(ctx, lead.x, lead.y, d, 3),
      clearRun(ctx, follow.x, follow.y, d, 3),
    )
    let score = Math.min(space, FLOOD_LIMIT) + (d === lead.dir ? 4 : 0)
    score -= (3 - run) * 30
    score += ctx.rng() * 3
    if (ctx.rng() < spec.wander) score += 20
    if (score > bestScore) {
      bestScore = score
      best = d
    }
  }
  return best
}

/** The way a rival turns on this cell: the roomiest choice, bent by its personality. */
export function steer(ctx: SteerCtx, b: SteerBike, kind: RivalKind): Dir {
  const spec = RIVALS[kind]
  const options: Dir[] = [b.dir, turnLeft(b.dir), turnRight(b.dir)]
  let best: Dir = b.dir
  let bestScore = -Infinity
  for (const d of options) {
    const n = ctx.next(b.x, b.y, d)
    if (!n) continue
    const space = ctx.room(n[0], n[1])
    if (space === 0) continue
    let score = Math.min(space, FLOOD_LIMIT) + (d === b.dir ? 4 : 0)
    if (ctx.goal && space > 12) {
      const pull = spec.goalPull ?? GOAL_PULL
      score += aimPull(ctx, n[0], n[1], ctx.goal.x, ctx.goal.y, pull)
    } else if (spec.lean) score += spec.lean(ctx, b, d, n[0], n[1], space)
    score += ctx.rng() * 3
    if (ctx.rng() < spec.wander) score += 20
    if (score > bestScore) {
      bestScore = score
      best = d
    }
  }
  return best
}
