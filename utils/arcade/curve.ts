// /utils/arcade/curve.ts
//
// Difficulty as data: each game declares how a parameter moves with level
// instead of scattering constants through its update loop.

export type CurveSpec = {
  /** Value at level 1. */
  start: number
  /** Change per level after the first (negative to shrink). */
  step: number
  /** Optional clamp in the direction of travel. */
  limit?: number
}

export function levelCurve(level: number, spec: CurveSpec): number {
  const value = spec.start + spec.step * (Math.max(1, Math.floor(level)) - 1)
  if (spec.limit === undefined) return value
  return spec.step >= 0
    ? Math.min(value, spec.limit)
    : Math.max(value, spec.limit)
}

/** True on every nth level (bonus rounds, intermissions). */
export function everyNthLevel(level: number, n: number): boolean {
  return n > 0 && level > 0 && level % n === 0
}

/** Small deterministic PRNG so demos and tests can be reproduced. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
