/** Reversible, one-person-per-quest planning. No run or skill state is mutated here. */
export type EpisodePlan = Readonly<Record<string, string>>

/**
 * Moving a person between quest cards swaps the displaced person into their
 * previous slot. Removing the same person from a card frees that slot.
 * This makes adjusting the cast safe after the mandatory missions are filled.
 */
export function planEpisodeAssignment(
  current: EpisodePlan,
  encounterId: string,
  lead: string,
): Record<string, string> {
  if (!encounterId || !lead) return { ...current }
  const targetLead = current[encounterId]
  const previousQuest = Object.keys(current).find((id) => current[id] === lead)
  const next = { ...current }
  if (targetLead === lead) {
    delete next[encounterId]
    return next
  }
  if (previousQuest) {
    delete next[previousQuest]
    if (targetLead) next[previousQuest] = targetLead
  }
  next[encounterId] = lead
  return next
}

export function removeEpisodeAssignment(
  current: EpisodePlan,
  encounterId: string,
): Record<string, string> {
  const next = { ...current }
  delete next[encounterId]
  return next
}
