// /utils/oracle/rng.ts
//
// Seeded randomness so a reading can be revisited from `?seed=`.

/** FNV-1a string hash to a 32-bit unsigned integer. */
export const hashSeed = (seed: string): number => {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** mulberry32: returns a function yielding floats in [0, 1). */
export const seededRandom = (seed: string): (() => number) => {
  let a = hashSeed(seed)
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A short shareable seed for a fresh draw (the one place Math.random is used). */
export const newSeed = (): string =>
  Math.floor(Math.random() * 36 ** 8)
    .toString(36)
    .padStart(8, '0')
