// /utils/makeNoise2D.ts
// Lightweight seeded value noise for UI animation. This keeps butterfly motion
// deterministic without depending on an undeclared third-party package.

const fade = (value: number): number => value * value * (3 - 2 * value)
const lerp = (start: number, end: number, amount: number): number =>
  start + (end - start) * amount

function hash2D(x: number, y: number, seed: number): number {
  let value = Math.imul(x, 374761393) + Math.imul(y, 668265263)
  value = Math.imul(value ^ (value >>> 13), 1274126177)
  value ^= seed | 0
  value = Math.imul(value ^ (value >>> 16), 2246822519)
  value ^= value >>> 13
  return ((value >>> 0) / 0xffffffff) * 2 - 1
}

export function makeNoise2D(seed: number): (x: number, y: number) => number {
  const normalizedSeed = Number.isFinite(seed) ? Math.trunc(seed) : 0

  return (x: number, y: number): number => {
    const x0 = Math.floor(x)
    const y0 = Math.floor(y)
    const x1 = x0 + 1
    const y1 = y0 + 1
    const tx = fade(x - x0)
    const ty = fade(y - y0)

    const top = lerp(
      hash2D(x0, y0, normalizedSeed),
      hash2D(x1, y0, normalizedSeed),
      tx,
    )
    const bottom = lerp(
      hash2D(x0, y1, normalizedSeed),
      hash2D(x1, y1, normalizedSeed),
      tx,
    )

    return lerp(top, bottom, ty)
  }
}
