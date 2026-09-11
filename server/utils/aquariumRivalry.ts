// /server/utils/aquariumRivalry.ts
// Pure rivalry rules for Cthulhuquarium. Persistence and tick settlement stay in
// aquarium.ts/aquariumEconomy.ts; this module only answers which occupants are
// squabbling and the production multiplier each one receives.

export const RIVALRY_PREDATOR_PREY_MULTIPLIER = 0.7
export const RIVALRY_SCHOOL_ANCHOR_MULTIPLIER = 0.85
export const RIVALRY_AUTHORED_MULTIPLIER = 0.6
export const RIVALRY_SAME_SPECIES_MULTIPLIER = 0.85

export interface RivalryFish {
  id: number
  slug: string
  dietRole?: string | null
  schoolRole?: string | null
  rivals?: readonly string[] | null
}

export type RivalryReason =
  | 'predator-prey'
  | 'school-anchor'
  | 'authored'
  | 'same-species'

export interface RivalryPair {
  aId: number
  bId: number
  multiplierEach: number
  reasons: readonly RivalryReason[]
}

export interface RivalryResult {
  active: boolean
  pairs: readonly RivalryPair[]
  multiplierByFishId: ReadonlyMap<number, number>
}

function isPair(a: string | null | undefined, b: string | null | undefined, x: string, y: string): boolean {
  return (a === x && b === y) || (a === y && b === x)
}

export function evaluateRivalry(
  fish: readonly RivalryFish[],
  peaceWardActive = false,
): RivalryResult {
  const multiplierByFishId = new Map<number, number>(fish.map((entry) => [entry.id, 1]))
  if (peaceWardActive || fish.length < 2) {
    return { active: false, pairs: [], multiplierByFishId }
  }

  const pairs: RivalryPair[] = []
  for (let i = 0; i < fish.length; i += 1) {
    const a = fish[i]
    if (!a) continue
    for (let j = i + 1; j < fish.length; j += 1) {
      const b = fish[j]
      if (!b) continue

      const reasons: RivalryReason[] = []
      const penalties: number[] = []

      if (isPair(a.dietRole, b.dietRole, 'predator', 'prey')) {
        reasons.push('predator-prey')
        penalties.push(RIVALRY_PREDATOR_PREY_MULTIPLIER)
      }
      if (isPair(a.schoolRole, b.schoolRole, 'school', 'anchor')) {
        reasons.push('school-anchor')
        penalties.push(RIVALRY_SCHOOL_ANCHOR_MULTIPLIER)
      }
      if (a.rivals?.includes(b.slug) || b.rivals?.includes(a.slug)) {
        reasons.push('authored')
        penalties.push(RIVALRY_AUTHORED_MULTIPLIER)
      }
      if (a.slug === b.slug) {
        reasons.push('same-species')
        penalties.push(RIVALRY_SAME_SPECIES_MULTIPLIER)
      }

      if (penalties.length === 0) continue

      // Multiple reasons describe one squabble, not several simultaneous fights.
      // The strongest applicable rule wins, preventing pair-order or tag-count from
      // multiplying a fish all the way toward zero production.
      const multiplierEach = Math.min(...penalties)
      pairs.push({ aId: a.id, bId: b.id, multiplierEach, reasons })
      multiplierByFishId.set(a.id, Math.min(multiplierByFishId.get(a.id) ?? 1, multiplierEach))
      multiplierByFishId.set(b.id, Math.min(multiplierByFishId.get(b.id) ?? 1, multiplierEach))
    }
  }

  return { active: pairs.length > 0, pairs, multiplierByFishId }
}
