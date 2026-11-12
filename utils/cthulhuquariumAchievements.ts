// /utils/cthulhuquariumAchievements.ts
//
// Which Cthulhuquarium achievement codes a server-confirmed deed earns. The
// tank store calls these with what the server just answered (a fired
// milestone, a purchase, a feed), never with a restored or imported state.
// Codes are the catalog's (utils/achievements/catalog/main/cthulhuquarium.ts).

const BESTIARY_ACHIEVEMENTS: ReadonlyArray<readonly [number, string]> = [
  [10, 'cthulhuquarium-bestiary-10'],
  [25, 'cthulhuquarium-bestiary-25'],
  [50, 'cthulhuquarium-bestiary-50'],
  [95, 'cthulhuquarium-bestiary-95'],
]

const LANDMARK_ACHIEVEMENTS: Readonly<Record<string, string>> = {
  first_full_tank: 'cthulhuquarium-full-tank',
  first_spotless_tank: 'cthulhuquarium-spotless',
  first_rivalry_resolved: 'cthulhuquarium-rivalry',
}

export const CTHULHUQUARIUM_FEEDING_FRENZY = 5
export const CTHULHUQUARIUM_DECORATOR = 10

/** Bestiary achievements for a recorded-species count (every threshold reached). */
export function bestiaryAchievementCodes(collected: number): string[] {
  return BESTIARY_ACHIEVEMENTS.filter(
    ([threshold]) => collected >= threshold,
  ).map(([, code]) => code)
}

/**
 * Codes a fired milestone earns. A bestiary breakpoint (`bestiary_<n>`) earns
 * every bestiary achievement at or under n, so a keeper who crossed a lower
 * one before achievements existed gets it at the next breakpoint.
 */
export function milestoneAchievementCodes(milestoneId: string): string[] {
  const landmark = LANDMARK_ACHIEVEMENTS[milestoneId]
  if (landmark) return [landmark]
  const match = /^bestiary_(\d+)$/.exec(milestoneId)
  return match ? bestiaryAchievementCodes(Number(match[1])) : []
}

/** Codes adopting a fish earns; `tier` is its rarity as the server sends it. */
export function unlockAchievementCodes(
  tier: string | null | undefined,
): string[] {
  const codes = ['cthulhuquarium-first-adoption']
  if ((tier ?? '').trim().toLowerCase() === 'mythic')
    codes.push('cthulhuquarium-mythic')
  return codes
}

/** Whether any upgrade track has just been bought to its last level. */
export function anyUpgradeMaxed(
  upgrades: ReadonlyArray<{ level: number; maxLevel: number }>,
): boolean {
  return upgrades.some(
    (track) => track.maxLevel > 0 && track.level >= track.maxLevel,
  )
}
