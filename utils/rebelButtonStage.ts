// /utils/rebelButtonStage.ts
// Pure stage logic for the escalating Rebel Button (conductor rebel-button/t-003).
// Presses 1-10 are unchanged; from press 11 the button relocates inside its stage,
// shrinks in steps, and walls rise in front of it. Fully deterministic per seed.

export const REBEL_CALM_PRESSES = 10
export const REBEL_FINALE_PRESSES = 100
export const REBEL_MIN_SCALE = 0.3
export const REBEL_MAX_WALLS = 4

export type RebelStage = {
  /** Horizontal / vertical offset as a percentage of free room, 0..100 (50 = centered). */
  x: number
  y: number
  /** Button scale, 1 at rest, never below REBEL_MIN_SCALE. */
  scale: number
  /** Number of walls currently in front of the button, 0..REBEL_MAX_WALLS. */
  walls: number
  /** True once the button has started to misbehave (press 11+). */
  rebelling: boolean
}

/** Small deterministic hash -> [0,1). */
export function rebelRandom(seed: number, press: number, lane: number): number {
  let h =
    (seed ^
      Math.imul(press + 1, 0x9e3779b1) ^
      Math.imul(lane + 1, 0x85ebca6b)) >>>
    0
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

export function rebelScaleFor(press: number): number {
  if (press <= REBEL_CALM_PRESSES) return 1
  const steps = Math.floor((press - REBEL_CALM_PRESSES - 1) / 10) + 1
  return Math.max(REBEL_MIN_SCALE, Number((1 - steps * 0.08).toFixed(2)))
}

export function rebelWallsFor(press: number): number {
  if (press <= REBEL_CALM_PRESSES) return 0
  return Math.min(
    REBEL_MAX_WALLS,
    Math.floor((press - REBEL_CALM_PRESSES) / 20) + 1,
  )
}

export function rebelStageFor(press: number, seed: number): RebelStage {
  const p = Math.max(0, Math.floor(press))
  if (p <= REBEL_CALM_PRESSES) {
    return { x: 50, y: 50, scale: 1, walls: 0, rebelling: false }
  }
  return {
    x: Math.round(rebelRandom(seed, p, 0) * 100),
    y: Math.round(rebelRandom(seed, p, 1) * 100),
    scale: rebelScaleFor(p),
    walls: rebelWallsFor(p),
    rebelling: true,
  }
}
