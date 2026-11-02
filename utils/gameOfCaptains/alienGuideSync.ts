import {
  normalizeAlienGuide,
  type AlienGuide,
} from '~/utils/gameOfCaptains/alienFieldGuide'

/** Existing discoveries are a monotone collection: switching devices must
 * never erase sightings, friends, marginalia or finished collector incidents.
 * Older server decisions win in a conflict, because an earned story choice is
 * single-use and should not be silently rewritten by another tab.
 */
export function mergeAlienGuideSnapshots(
  remote: unknown,
  incoming: unknown,
): AlienGuide {
  const a = normalizeAlienGuide(remote)
  const b = normalizeAlienGuide(incoming)
  const unique = (items: string[]) => [...new Set(items)]
  const discovered = unique([...a.discovered, ...b.discovered])
  const friends = unique([...a.friends, ...b.friends]).filter((id) =>
    discovered.includes(id),
  )
  const attempted = unique([...a.attempted, ...b.attempted]).slice(-400)
  const milestoneSeen = [...new Set([...a.milestoneSeen, ...b.milestoneSeen])]
  const milestoneDecisions = {
    ...b.milestoneDecisions,
    ...a.milestoneDecisions,
  }
  const fieldReports = [
    ...new Map(
      [...(a.fieldReports ?? []), ...(b.fieldReports ?? [])].map((entry) => [
        [entry.speciesId, entry.mood, entry.choice, entry.outcome].join(':'),
        entry,
      ]),
    ).values(),
  ].slice(-101)
  return normalizeAlienGuide({
    version: 1,
    discovered,
    friends,
    attempted,
    milestoneSeen,
    milestoneDecisions,
    contacts: { ...a.contacts, ...b.contacts },
    lastContact: b.lastContact ?? a.lastContact,
    fieldReports,
  })
}
