import type { RivalryFish, RivalryResult } from './aquariumRivalry'
import { evaluateRivalry } from './aquariumRivalry'

export interface RivalryProductionFish extends RivalryFish {
  production: number
}

export interface RivalryProductionResult {
  rivalry: RivalryResult
  productionByFishId: ReadonlyMap<number, number>
  totalProduction: number
}

export function applyRivalryToProduction(
  fish: readonly RivalryProductionFish[],
  peaceWardActive = false,
): RivalryProductionResult {
  const rivalry = evaluateRivalry(fish, peaceWardActive)
  const productionByFishId = new Map<number, number>()
  let totalProduction = 0

  for (const entry of fish) {
    const multiplier = rivalry.multiplierByFishId.get(entry.id) ?? 1
    const production = entry.production * multiplier
    productionByFishId.set(entry.id, production)
    totalProduction += production
  }

  return { rivalry, productionByFishId, totalProduction }
}
