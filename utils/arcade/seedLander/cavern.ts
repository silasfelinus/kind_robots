// /utils/arcade/seedLander/cavern.ts
//
// Firefly Caverns (conductor kr-arcade/t-071 part 2): the pure rules of the island's dark caves.
//   - the dark: the cave is lit only by the pod's glow (a puff brightens it), the fireflies and the
//     lanterns you have relit;
//   - crystal bumpers: gems the pod bounces off gently (never a crash);
//   - spore puffballs: they swell as you fly over, then blur your gauges for 2 s;
//   - cave lanterns: land beside one to relight it (the Lantern Run mission).
// Everything here is deterministic from the tick, so the attract demo stays reproducible.

/** A crystal bumper: a gem the pod bounces off gently. */
export type CrystalSpec = { x: number; y: number; r: number }

/** A spore puffball resting at (x, y). */
export type SporeSpec = { x: number; y: number; r: number }

/** A cave lantern on the ground at x, lit when the pod lands beside it. */
export type LanternSpec = { id: string; x: number }

export const CRYSTAL = {
  /** The pod's radius against a crystal's. */
  pod: 5,
  /** Share of the incoming speed given back, so a bump is gentle. */
  give: 0.55,
  /** The least nudge a bump gives, so a drifting pod is pushed clear. */
  min: 0.4,
} as const

export const SPORE = {
  /** The pod this close to the puffball's edge sets it off. */
  trigger: 16,
  /** Ticks the cloud blurs the gauges (2 s). */
  blur: 120,
  /** Ticks before the same puffball can go off again. */
  cool: 240,
} as const

export const LANTERN = {
  /** Landing this close (pod centre to lantern) relights it. */
  reach: 26,
  /** Light radius of a lit lantern. */
  light: 76,
} as const

export const LIGHT = {
  pod: 46,
  /** Extra radius while puffing. */
  puff: 14,
  firefly: 26,
  /** The darkest the cave gets away from every light. */
  night: 0.9,
  /** Pixel size of the dark cells. */
  cell: 6,
} as const

export type LightSource = { x: number; y: number; r: number }

/** Bounce a pod off a crystal it is flying into: its new velocity, or null when clear. */
export function crystalBump(
  c: CrystalSpec,
  x: number,
  y: number,
  vx: number,
  vy: number,
): { vx: number; vy: number } | null {
  const dx = x - c.x
  const dy = y - c.y
  const d = Math.hypot(dx, dy)
  if (d >= c.r + CRYSTAL.pod) return null
  const nx = d > 0.001 ? dx / d : 0
  const ny = d > 0.001 ? dy / d : -1
  const into = vx * nx + vy * ny
  // Only a pod moving toward the gem bounces; one already leaving is left alone.
  if (into >= 0) return null
  const nudge = CRYSTAL.min
  return {
    vx: vx - (1 + CRYSTAL.give) * into * nx + nx * nudge,
    vy: vy - (1 + CRYSTAL.give) * into * ny + ny * nudge,
  }
}

/** A puffball's swell (0..1) given how close the pod is: its tell. */
export function sporeSwell(s: SporeSpec, x: number, y: number): number {
  const d = Math.hypot(s.x - x, s.y - y) - s.r
  return Math.max(0, Math.min(1, 1 - d / (SPORE.trigger * 2.5)))
}

/** Does the pod set this puffball off? */
export function sporeTriggered(s: SporeSpec, x: number, y: number): boolean {
  return Math.hypot(s.x - x, s.y - y) < s.r + SPORE.trigger
}

/** Is the pod close enough to a lantern to relight it? */
export function lanternReached(l: LanternSpec, podX: number): boolean {
  return Math.abs(l.x - podX) <= LANTERN.reach
}

/** How dark a point is (0 lit .. LIGHT.night), from the nearest light with a soft edge. */
export function darkAt(
  lights: readonly LightSource[],
  x: number,
  y: number,
): number {
  let best = 0
  for (const l of lights) {
    const d = Math.hypot(l.x - x, l.y - y) / l.r
    if (d < 1) best = Math.max(best, 1 - d * d)
  }
  return LIGHT.night * (1 - best)
}

/** A firefly's drifting position: a slow loop around its home, from the tick alone. */
export function fireflyAt(
  homeX: number,
  homeY: number,
  seed: number,
  tick: number,
): { x: number; y: number } {
  const t = tick / 50 + seed * 2.3
  return {
    x: homeX + Math.sin(t) * 14 + Math.sin(t * 0.37 + seed) * 8,
    y: homeY + Math.cos(t * 0.8) * 9,
  }
}
