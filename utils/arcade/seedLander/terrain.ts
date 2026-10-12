// /utils/arcade/seedLander/terrain.ts
//
// Seed Lander's maps (conductor kr-arcade/t-069): a wide island several screens across (or a
// tall cavern) as data. The ground (and a cavern's roof) is a line of knots, sampled every STEP
// pixels; pads flatten the ground under them, and a pad set above the ground stands on a ledge
// (a stone pillar, a beanstalk top, a cave shelf). The game asks the terrain where the floor and
// roof are and which pad a pod is over.

/** Ground and roof are sampled this often (logical pixels). */
export const STEP = 4

export type Knot = readonly [x: number, y: number]

/**
 * What a pad is for: a seed bed to plant, a sunflower that refuels, a drop zone for towed cargo,
 * or the home perch a mission starts and ends on.
 */
export type PadKind = 'seed' | 'sun' | 'drop' | 'home'

export type PadSpec = {
  id?: string
  /** Centre of the pad. */
  x: number
  w: number
  /** x1..x5 (seed beds; others pay nothing to land on). */
  mult?: number
  kind?: PadKind
  /** Height of the pad; omitted, it is flattened into the ground where it stands. */
  y?: number
  /** A ledge pad with nothing under it (a shelf on a cave wall); otherwise a pillar to the ground. */
  float?: boolean
}

export type LedgeSpec = { x0: number; x1: number; y0: number; y1: number }

export type MapSpec = {
  w: number
  h: number
  ground: readonly Knot[]
  roof?: readonly Knot[]
  ledges?: readonly LedgeSpec[]
  pads: readonly PadSpec[]
}

export type Pad = {
  id: string
  x0: number
  x1: number
  y: number
  mult: number
  kind: PadKind
  /** A seed bed already planted this mission. */
  planted: boolean
  /** A moving pad's speed (a boss's hand, a drifting cloud): landings are judged relative to it. */
  vx: number
  vy: number
}

export type Ledge = { x0: number; x1: number; y0: number; y1: number }

/** Linear interpolation along knots (sorted by x), held flat past either end. */
export function knotAt(knots: readonly Knot[], x: number): number {
  if (!knots.length) return 0
  if (x <= knots[0]![0]) return knots[0]![1]
  for (let i = 1; i < knots.length; i++) {
    const [x1, y1] = knots[i]!
    if (x <= x1) {
      const [x0, y0] = knots[i - 1]!
      const t = x1 === x0 ? 1 : (x - x0) / (x1 - x0)
      return y0 + (y1 - y0) * t
    }
  }
  return knots[knots.length - 1]![1]
}

export class Terrain {
  readonly w: number
  readonly h: number
  readonly ground: number[]
  readonly roof: number[] | null
  readonly ledges: Ledge[]
  readonly pads: Pad[]
  /** Bumped when the map changes shape (a beanstalk grows), so painted art can be refreshed. */
  version = 0

  constructor(spec: MapSpec) {
    this.w = spec.w
    this.h = spec.h
    const n = Math.ceil(spec.w / STEP)
    this.ground = Array.from({ length: n + 1 }, (_, i) =>
      knotAt(spec.ground, i * STEP),
    )
    this.roof = spec.roof
      ? Array.from({ length: n + 1 }, (_, i) => knotAt(spec.roof!, i * STEP))
      : null
    this.ledges = (spec.ledges ?? []).map((l) => ({ ...l }))
    this.pads = []
    spec.pads.forEach((p, i) => this.addPad(p, `p${i}`))
  }

  /** Add a pad (a map's own, or one a plant grows), flattening the ground or raising a ledge. */
  addPad(p: PadSpec, fallbackId: string): Pad {
    const x0 = Math.max(0, Math.floor((p.x - p.w / 2) / STEP) * STEP)
    const x1 = Math.min(this.w, Math.ceil((p.x + p.w / 2) / STEP) * STEP)
    const groundY = this.groundAt((x0 + x1) / 2)
    const y = p.y ?? groundY
    if (y >= groundY - 3) {
      for (let x = x0; x <= x1; x += STEP) {
        const i = Math.round(x / STEP)
        if (i >= 0 && i < this.ground.length) this.ground[i] = y
      }
    } else {
      let bottom = y + 6
      if (!p.float)
        for (let x = x0; x <= x1; x += STEP)
          bottom = Math.max(bottom, this.groundAt(x))
      this.ledges.push({ x0, x1, y0: y, y1: bottom })
    }
    const pad: Pad = {
      id: p.id ?? fallbackId,
      x0,
      x1,
      y,
      mult: p.mult ?? 1,
      kind: p.kind ?? 'seed',
      planted: false,
      vx: 0,
      vy: 0,
    }
    this.pads.push(pad)
    this.version++
    return pad
  }

  private sample(line: readonly number[], x: number): number {
    const f = Math.max(0, Math.min(this.w, x)) / STEP
    const i = Math.min(line.length - 2, Math.floor(f))
    const t = f - i
    return line[i]! + (line[i + 1]! - line[i]!) * t
  }

  /** The ground's height at x (held at the edges). */
  groundAt(x: number): number {
    return this.sample(this.ground, x)
  }

  /** The roof's underside at x (a cavern's), or -Infinity under open sky. */
  roofAt(x: number): number {
    return this.roof ? this.sample(this.roof, x) : -Infinity
  }

  /** The first solid top at or below `y` at x: the ground, or a ledge (or moving pad) above it. */
  floorAt(x: number, y: number): number {
    let floor = this.groundAt(x)
    for (const l of this.ledges)
      if (x >= l.x0 && x <= l.x1 && l.y0 >= y - 2 && l.y0 < floor) floor = l.y0
    for (const p of this.pads)
      if ((p.vx || p.vy) && x >= p.x0 && x <= p.x1 && p.y >= y - 2)
        floor = Math.min(floor, p.y)
    return floor
  }

  /** The lowest solid underside at or above `y` at x: the roof, or a ledge overhead. */
  ceilingAt(x: number, y: number): number {
    let ceiling = this.roofAt(x)
    for (const l of this.ledges)
      if (x >= l.x0 && x <= l.x1 && l.y1 <= y + 2 && l.y1 > ceiling)
        ceiling = l.y1
    return ceiling
  }

  /** Is the point inside a ledge (the pod clipping its side)? */
  insideLedge(x: number, y: number): boolean {
    return this.ledges.some(
      (l) => x > l.x0 && x < l.x1 && y > l.y0 + 1 && y < l.y1,
    )
  }

  /** The pad a pod centred at x stands on (both feet over it, within `slack` pixels). */
  padUnder(x: number, half: number, feet: number, slack = 3): Pad | undefined {
    return this.pads.find(
      (p) =>
        x - half + slack >= p.x0 &&
        x + half - slack <= p.x1 &&
        Math.abs(feet - p.y) <= 4,
    )
  }

  /** The pad with this id. */
  pad(id: string): Pad | undefined {
    return this.pads.find((p) => p.id === id)
  }
}
