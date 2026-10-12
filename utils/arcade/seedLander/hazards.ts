// /utils/arcade/seedLander/hazards.ts
//
// Seed Lander's hazards in the air (conductor kr-arcade/t-070, the roster in CABINETS.md
// section 9), each with a tell and an answer:
//   - gust lanes: bands of steady wind you can see (streamers); lean into them;
//   - windmills: sails sweeping round a hub; time the gap;
//   - dandelion drift: fluff blowing across that sticks to the pod and weighs it down; puff hard
//     (or hop) to shake it off;
//   - crow-bots: they circle a roost, caw, then dive at the shadow of what they want (towed cargo
//     first, else the pod). A hit knocks the pod's lean or steals a seedling; a resting pod is
//     left alone.
// Updraft vents live with the mission format (missions.ts). Gameplay dice come from the game's rng.

/** A band of steady wind across part of the island. */
export type LaneSpec = {
  x0: number
  x1: number
  y0: number
  y1: number
  /** Push per tick (positive blows right). */
  push: number
}

export type WindmillSpec = {
  x: number
  /** The hub's height. */
  y: number
  /** Sail length. */
  r: number
  /** Radians per tick (negative turns the other way). */
  speed: number
  sails?: number
}

/** A dandelion field: fluff blows off it across a band of sky. */
export type FluffSpec = {
  x0: number
  x1: number
  y0: number
  y1: number
  /** Ticks between puffs of fluff. */
  every: number
  /** Drift speed across (sign is the direction). */
  drift: number
}

export type CrowSpec = { x: number; y: number }

export type Windmill = WindmillSpec & { angle: number }
export type Fluff = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
}
export type CrowState = 'circle' | 'tell' | 'dive' | 'rise'
export type Crow = {
  roostX: number
  roostY: number
  x: number
  y: number
  vx: number
  vy: number
  state: CrowState
  t: number
  /** Where it dives (the shadow it marked). */
  aimX: number
  aimY: number
  cool: number
}

export const SAIL = {
  /** How close to a sail's line counts as clipping it. */
  hit: 4.5,
  /** The hub's own radius. */
  hub: 6,
} as const

export const FLUFF = {
  /** Most fluff a pod can carry. */
  max: 6,
  /** Each fluff adds this much gravity... */
  weight: 0.07,
  /** ...and this much drag across. */
  drag: 0.004,
  /** Ticks of steady puffing that shake one off. */
  shake: 24,
  reach: 7,
} as const

export const CROW = {
  /** How far across a crow notices its quarry. */
  sight: 110,
  circle: 18,
  /** The caw before the dive. */
  tell: 45,
  dive: 2.3,
  /** A dive gives up after this long. */
  diveTicks: 70,
  rest: 150,
  hit: 8,
  /** The knock a hit gives the pod's lean and drift. */
  knock: 0.55,
} as const

/** Push from any gust lanes at a point. */
export function lanePush(
  lanes: readonly LaneSpec[],
  x: number,
  y: number,
): number {
  let push = 0
  for (const l of lanes)
    if (x >= l.x0 && x <= l.x1 && y >= l.y0 && y <= l.y1) push += l.push
  return push
}

export function newWindmill(spec: WindmillSpec): Windmill {
  return { ...spec, angle: 0 }
}

/** The sails' angles now. */
export function sailAngles(m: Windmill): number[] {
  const n = m.sails ?? 4
  return Array.from({ length: n }, (_, i) => m.angle + (i * Math.PI * 2) / n)
}

/** Distance from a point to the segment a-b. */
export function segmentDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax
  const dy = by - ay
  const len = dx * dx + dy * dy
  const t = len
    ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len))
    : 0
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t))
}

/** Does a pod at (x, y) clip a sail or the hub? */
export function hitsWindmill(m: Windmill, x: number, y: number): boolean {
  if (Math.hypot(x - m.x, y - m.y) < SAIL.hub + 4) return true
  return sailAngles(m).some(
    (a) =>
      segmentDistance(
        x,
        y,
        m.x,
        m.y,
        m.x + Math.cos(a) * m.r,
        m.y + Math.sin(a) * m.r,
      ) < SAIL.hit,
  )
}

/** A dandelion field puffs fluff out on its beat. */
export function spawnFluff(
  field: FluffSpec,
  tick: number,
  rng: () => number,
): Fluff | null {
  if (tick % field.every !== 0) return null
  return {
    x: field.drift > 0 ? field.x0 : field.x1,
    y: field.y0 + rng() * (field.y1 - field.y0),
    vx: field.drift * (0.7 + rng() * 0.6),
    vy: (rng() - 0.5) * 0.2,
    life: Math.ceil(
      (field.x1 - field.x0) / Math.max(0.1, Math.abs(field.drift)) + 40,
    ),
  }
}

export function driftFluff(f: Fluff, tick: number) {
  f.x += f.vx
  f.y += f.vy + Math.sin((tick + f.x) / 17) * 0.15
  f.life--
}

export function newCrow(spec: CrowSpec): Crow {
  return {
    roostX: spec.x,
    roostY: spec.y,
    x: spec.x + CROW.circle,
    y: spec.y,
    vx: 0,
    vy: 0,
    state: 'circle',
    t: 0,
    aimX: 0,
    aimY: 0,
    cool: 60,
  }
}

/**
 * One tick of a crow-bot. `quarry` is what it would dive at (towed cargo first, else a flying
 * pod; null when there is nothing to go for). Returns 'caw' as the tell starts.
 */
export function flyCrow(
  c: Crow,
  quarry: { x: number; y: number } | null,
): 'caw' | null {
  c.t++
  if (c.cool > 0) c.cool--
  switch (c.state) {
    case 'circle': {
      const a = c.t * 0.05
      c.x = c.roostX + Math.cos(a) * CROW.circle
      c.y = c.roostY + Math.sin(a) * CROW.circle * 0.45
      if (
        quarry &&
        c.cool <= 0 &&
        Math.abs(quarry.x - c.x) < CROW.sight &&
        quarry.y > c.y + 10
      ) {
        c.state = 'tell'
        c.t = 0
        return 'caw'
      }
      return null
    }
    case 'tell':
      // It hangs, flapping, and marks the shadow it will dive at.
      if (quarry) {
        c.aimX = quarry.x
        c.aimY = quarry.y
      }
      if (c.t >= CROW.tell) {
        const d = Math.max(1, Math.hypot(c.aimX - c.x, c.aimY - c.y))
        c.vx = ((c.aimX - c.x) / d) * CROW.dive
        c.vy = ((c.aimY - c.y) / d) * CROW.dive
        c.state = 'dive'
        c.t = 0
      }
      return null
    case 'dive':
      c.x += c.vx
      c.y += c.vy
      if (c.t >= CROW.diveTicks) rise(c)
      return null
    case 'rise': {
      const dx = c.roostX + CROW.circle - c.x
      const dy = c.roostY - c.y
      const d = Math.hypot(dx, dy)
      if (d < 2) {
        c.state = 'circle'
        c.t = 0
        c.cool = CROW.rest
        return null
      }
      c.x += (dx / d) * Math.min(d, 1.3)
      c.y += (dy / d) * Math.min(d, 1.3)
      return null
    }
  }
}

/** Send a crow back up to its roost (after a hit or a miss). */
export function rise(c: Crow) {
  c.state = 'rise'
  c.t = 0
}

/** A diving crow touching a point. */
export function crowHits(c: Crow, x: number, y: number): boolean {
  return c.state === 'dive' && Math.hypot(c.x - x, c.y - y) < CROW.hit
}
