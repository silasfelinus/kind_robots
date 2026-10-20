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
//   - waterfalls (Waterfall Gorge): white water that pushes the pod down, its spray slowing it;
//   - drip stalactites: a drop swells (the tell), waits one beat, then falls and knocks the pod;
//   - pebble rollers: pebbles wobble on a slope, then roll down it and bump what is in the way.
//   - lightning clouds (Storm Shelf): a cloud crackles and glows for 1.5 s (the tell), then a bolt
//     strikes the column under it and knocks the pod's lean; and rain, which wets the pod and makes
//     it heavier the longer it flies (landing on a pad to dry off).
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

// --- Waterfall Gorge (conductor kr-arcade/t-071) ------------------------------------------------

/** A waterfall column: it pushes down, and its spray slows the pod. */
export type FallSpec = {
  x0: number
  x1: number
  y0: number
  y1: number
  /** Downward push per tick. */
  push: number
}

/** A stalactite whose tip hangs at (x, y) and drips every `every` ticks. */
export type DripSpec = { x: number; y: number; every: number; offset?: number }

/** Pebbles that wobble at x0, then roll along the ground to x1 every `every` ticks. */
export type PebbleSpec = {
  x0: number
  x1: number
  every: number
  offset?: number
}

export const FALL = {
  /** The spray: speed across is multiplied by this each tick in the column. */
  spray: 0.965,
} as const

export const DRIP = {
  /** The drop swells this long before it lets go. */
  swell: 54,
  /** Then it hangs one beat. */
  beat: 14,
  gravity: 0.045,
  hit: 5.5,
  /** The knock a hit gives the pod's lean and drift. */
  knock: 0.5,
} as const

export const PEBBLE = {
  wobble: 56,
  speed: 1.15,
  hit: 6,
  knock: 0.5,
} as const

/** Is a point inside a waterfall column? */
export function inFall(falls: readonly FallSpec[], x: number, y: number) {
  return falls.some((f) => x >= f.x0 && x <= f.x1 && y >= f.y0 && y <= f.y1)
}

/** Downward push from any waterfalls at a point. */
export function fallPush(
  falls: readonly FallSpec[],
  x: number,
  y: number,
): number {
  let push = 0
  for (const f of falls)
    if (x >= f.x0 && x <= f.x1 && y >= f.y0 && y <= f.y1) push += f.push
  return push
}

export type DripView = {
  /** 'swell' (the tell), 'hang' (one beat), 'fall', or 'wait'. */
  state: 'swell' | 'hang' | 'fall' | 'wait'
  /** The drop's position now. */
  x: number
  y: number
  /** 0..1 how swollen. */
  swell: number
}

/** A stalactite's drop at `tick`: deterministic from the tick, falling to `floor`. */
export function dripAt(spec: DripSpec, tick: number, floor: number): DripView {
  const t = (tick + (spec.offset ?? 0)) % spec.every
  const x = spec.x
  if (t < DRIP.swell)
    return { state: 'swell', x, y: spec.y, swell: t / DRIP.swell }
  if (t < DRIP.swell + DRIP.beat)
    return { state: 'hang', x, y: spec.y + 1, swell: 1 }
  const dt = t - DRIP.swell - DRIP.beat
  const y = spec.y + 1 + 0.5 * DRIP.gravity * dt * dt
  if (y >= floor) return { state: 'wait', x, y: floor, swell: 0 }
  return { state: 'fall', x, y, swell: 0 }
}

export type PebbleView = { x: number; y: number; rolling: boolean }

/** A pebble roller at `tick`, or null while the slope is quiet. */
export function pebbleAt(
  spec: PebbleSpec,
  tick: number,
  groundAt: (x: number) => number,
): PebbleView | null {
  const t = (tick + (spec.offset ?? 0)) % spec.every
  if (t < PEBBLE.wobble)
    return { x: spec.x0, y: groundAt(spec.x0) - 3, rolling: false }
  const dir = Math.sign(spec.x1 - spec.x0) || 1
  const x = spec.x0 + dir * (t - PEBBLE.wobble) * PEBBLE.speed
  if ((x - spec.x1) * dir > 0) return null
  return { x, y: groundAt(x) - 3, rolling: true }
}

/** A lightning cloud at (x, y): it rests, crackles (the tell), then strikes the column below it. */
export type StormCloudSpec = {
  x: number
  y: number
  every: number
  offset?: number
}

export const STORM = {
  /** The crackle and glow before a strike: 1.5 s. */
  charge: 90,
  /** How long the bolt lasts. */
  strike: 12,
  /** Half-width of the struck column. */
  reach: 7,
  knock: 0.55,
  /** Rain: the pod gets this much wetter each tick it flies, to a full 1, and dries on a pad. */
  soak: 1 / 420,
  dry: 1 / 90,
  /** A fully wet pod weighs this much more. */
  weight: 0.14,
} as const

export type StormCloudView = {
  state: 'rest' | 'charge' | 'strike'
  /** 0..1 how charged. */
  charge: number
}

/** A lightning cloud at `tick`: deterministic from the tick. */
export function stormCloudAt(
  spec: StormCloudSpec,
  tick: number,
): StormCloudView {
  const t = (tick + (spec.offset ?? 0)) % spec.every
  const rest = spec.every - STORM.charge - STORM.strike
  if (t < rest) return { state: 'rest', charge: 0 }
  if (t < rest + STORM.charge)
    return { state: 'charge', charge: (t - rest) / STORM.charge }
  return { state: 'strike', charge: 1 }
}

/** Is a point in the bolt of a striking cloud? */
export function boltHits(
  spec: StormCloudSpec,
  tick: number,
  x: number,
  y: number,
): boolean {
  return (
    stormCloudAt(spec, tick).state === 'strike' &&
    y > spec.y &&
    Math.abs(x - spec.x) <= STORM.reach
  )
}

/** Wetness 0..1 after a tick of flying (or resting on a pad) in the rain. */
export function soakStep(wet: number, flying: boolean): number {
  return Math.min(1, Math.max(0, wet + (flying ? STORM.soak : -STORM.dry)))
}
