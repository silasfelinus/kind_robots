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
  ledger.push(encounter)
  purse.lanterns += reward.lanterns ?? 0
  purse.wildflowers += reward.wildflowers ?? 0
  return true
}
