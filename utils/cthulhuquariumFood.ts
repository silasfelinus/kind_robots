/**
 * Client-only aquarium food choreography.
 * These positions affect animation, not the server-authoritative feed economy.
 * Keep this deterministic for regression tests by accepting a random source.
 */
export interface FoodPosition {
  x: number
  y: number
}

export interface FedSwimmer extends FoodPosition {
  stockId: number
}

export interface FeedParticle extends FoodPosition {
  phase: number
  lean: number
}

export const MAX_FOOD_PER_FEED = 12
export const MAX_VISIBLE_FOOD = 42

const clamp = (value: number, low: number, high: number): number =>
  Math.max(low, Math.min(high, value))

/**
 * Place independent morsels around fish that actually received food.
 * A fish close to the surface gets food below it instead of forcing every
 * morsel into the same clipped y=12 row. Round-robin offsets also spread
 * particles if multiple stock rows currently share a position.
 */
export function makeFeedParticles(
  fedStockIds: readonly number[],
  swimmers: readonly FedSwimmer[],
  width: number,
  height: number,
  random: () => number = Math.random,
): FeedParticle[] {
  if (!fedStockIds.length || width < 72 || height < 88) return []

  const byId = new Map(swimmers.map((swimmer) => [swimmer.stockId, swimmer]))
  const count = Math.min(MAX_FOOD_PER_FEED, fedStockIds.length)
  return Array.from({ length: count }, (_, index) => {
    // Sample from the entire fed list instead of always showing its first 3.
    const stockId = fedStockIds[Math.floor((index * fedStockIds.length) / count)]
    const fish = byId.get(stockId!)
    const spreadX = ((index % 5) - 2) * 13
    const spreadY = ((index % 3) - 1) * 10
    const x = fish
      ? fish.x + (random() - 0.5) * 110 + spreadX
      : 36 + random() * (width - 72)
    const y = fish
      ? fish.y < 110
        ? fish.y + 46 + random() * 55 + spreadY
        : fish.y - 48 - random() * 75 + spreadY
      : 32 + random() * (height * 0.58)
    return {
      x: clamp(x, 24, width - 24),
      y: clamp(y, 24, height - 30),
      phase: random() * Math.PI * 2,
      lean: (random() - 0.5) * 1.6,
    }
  })
}

/** Give each swimmer its nearest reachable morsel, not feed[0]. */
export function nearestFood(
  swimmer: FoodPosition,
  particles: readonly FoodPosition[],
  maxDistance = 220,
): FoodPosition | null {
  let best: FoodPosition | null = null
  let bestSq = maxDistance * maxDistance
  for (const candidate of particles) {
    const dx = candidate.x - swimmer.x
    const dy = candidate.y - swimmer.y
    const distanceSq = dx * dx + dy * dy
    if (distanceSq < bestSq) {
      bestSq = distanceSq
      best = candidate
    }
  }
  return best
}
