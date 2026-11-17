import { COMPANIONS, type CompanionId } from './content'

/**
 * Which guides the Guides tab may introduce in full (portrait, bio, line and
 * meeting place). A guide is revealed once met in the current run, or once
 * any earned ending in the browser-local ledger names them as the final lead
 * (`lead.lens.fate`). Everyone else stays a silhouette so the tab never
 * spoils a meeting the player hasn't had yet. Derived only: no save change.
 */
export function revealedGuides(
  meetingOrder: readonly string[] | null | undefined,
  endings: readonly string[],
): Set<CompanionId> {
  const ids = new Set<string>(COMPANIONS.map((companion) => companion.id))
  const revealed = new Set<CompanionId>()
  for (const id of meetingOrder ?? [])
    if (ids.has(id)) revealed.add(id as CompanionId)
  for (const ending of endings) {
    const lead = ending.split('.')[0]
    if (lead && ids.has(lead)) revealed.add(lead as CompanionId)
  }
  return revealed
}
