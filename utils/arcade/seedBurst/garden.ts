// /utils/arcade/seedBurst/garden.ts
//
// The garden grows (conductor kr-arcade/t-136, depth-pass CABINETS.md section 24, slice 1). Every
// tile a bloom crosses becomes a flowerbed: a sprout, then a bud, then a flower, over ten seconds.
// Grumps wading through flowers slow to half speed, and the plot's In Bloom % shows on the Garden
// Gate and pays out when the plot is cleared. Also here: the power a bonked gardener drops.

/** Ticks from sprout to full flower. */
export const BED_GROW = 600
/** Grumps on a flowered tile move at this share of their pace. */
export const FLOWER_PACE = 0.5
/** Points per In Bloom percent when a plot is cleared. */
export const BLOOM_POINTS = 20

/** 0 sprout, 1 bud, 2 flower. */
export function bedStage(age: number): 0 | 1 | 2 {
  if (age >= BED_GROW) return 2
  return age >= BED_GROW / 2 ? 1 : 0
}

/** Whole percent of the plot's `area` tiles that are in full flower. */
export function inBloomPercent(
  beds: ReadonlyMap<number, number>,
  area: number,
): number {
  if (area <= 0) return 0
  let flowered = 0
  for (const age of beds.values()) if (age >= BED_GROW) flowered++
  return Math.min(100, Math.floor((flowered * 100) / area))
}

export type Stats = { pods: number; range: number; speed: number }
export type Drop = 'pod' | 'bloom' | 'shoe'

/**
 * Power has a price again: a bonked gardener drops one level of each stat above the starting
 * level. Returns the stats they keep and the pickups they drop, to be won back.
 */
export function dropPower(
  stats: Stats,
  base: Stats,
  speedStep: number,
): { keep: Stats; drops: Drop[] } {
  const keep = { ...stats }
  const drops: Drop[] = []
  if (stats.pods > base.pods) {
    keep.pods--
    drops.push('pod')
  }
  if (stats.range > base.range) {
    keep.range--
    drops.push('bloom')
  }
  if (stats.speed > base.speed + 1e-6) {
    keep.speed = Math.max(base.speed, stats.speed - speedStep)
    drops.push('shoe')
  }
  return { keep, drops }
}

/**
 * Tiles to scatter `count` dropped pickups on: open tiles within two steps of `at`, nearest first,
 * `roll` (a 0..1 source) shuffling each ring. Falls back to `at` itself.
 */
export function dropSpots(
  at: { x: number; y: number },
  count: number,
  open: (x: number, y: number) => boolean,
  roll: () => number,
): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  for (const ring of [1, 2]) {
    const spots: { x: number; y: number }[] = []
    for (let dy = -ring; dy <= ring; dy++)
      for (let dx = -ring; dx <= ring; dx++)
        if (Math.abs(dx) + Math.abs(dy) === ring && open(at.x + dx, at.y + dy))
          spots.push({ x: at.x + dx, y: at.y + dy })
    while (spots.length && out.length < count)
      out.push(spots.splice(Math.floor(roll() * spots.length), 1)[0]!)
  }
  while (out.length < count) out.push({ ...at })
  return out
}
