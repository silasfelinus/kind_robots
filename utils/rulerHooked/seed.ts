// utils/rulerHooked/seed.ts
//
// Deterministic RNG for "The Ruler is Hooked" (data-model.md §0.5). A save's
// `seed` + its choiceLog fully reconstruct a run, and the compositor is a pure
// function of the save — so replay and reload always match. This is the single
// interface all randomness goes through (`nextRandom(stream)`), which is what
// makes the Unreal port a one-file swap to FRandomStream (unreal-migration.md §7).
//
// Framework-free, no imports.

export interface RngStream {
  /** Next float in [0, 1). Mutates the stream's internal state. */
  next(): number
  /** Integer in [0, n). */
  int(n: number): number
  /** Current 32-bit state — serialize alongside the save to resume mid-run. */
  state(): number
}

/** FNV-1a 32-bit hash of a string → a stable numeric seed. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    // 32-bit FNV prime multiply
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** mulberry32 — small, fast, well-distributed 32-bit PRNG. */
export function makeRng(seed: string | number, startState?: number): RngStream {
  let s =
    startState !== undefined
      ? startState >>> 0
      : typeof seed === 'number'
        ? seed >>> 0
        : hashSeed(seed)
  const next = (): number => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (n: number) => Math.floor(next() * Math.max(1, n)),
    state: () => s >>> 0,
  }
}
