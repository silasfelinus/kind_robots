export interface MemoryRewardPurse {
  lanterns: number
  wildflowers: number
}

export interface MemoryEncounterReward {
  lanterns?: number
  wildflowers?: number
}

/** A cleared encounter may be replayed, but its treasure can only be claimed once. */
export function grantMemoryRewardOnce(
  ledger: string[],
  encounter: string,
  purse: MemoryRewardPurse,
  reward: MemoryEncounterReward,
): boolean {
  if (ledger.includes(encounter)) return false
  const lanterns = reward.lanterns ?? 0
  const wildflowers = reward.wildflowers ?? 0
  if (
    !encounter.trim() ||
    !Number.isSafeInteger(lanterns) ||
    !Number.isSafeInteger(wildflowers) ||
    lanterns < 0 ||
    wildflowers < 0 ||
    !Number.isSafeInteger(purse.lanterns) ||
    !Number.isSafeInteger(purse.wildflowers) ||
    !Number.isSafeInteger(purse.lanterns + lanterns) ||
    !Number.isSafeInteger(purse.wildflowers + wildflowers)
  ) return false
  ledger.push(encounter)
  purse.lanterns += lanterns
  purse.wildflowers += wildflowers
  return true
}
