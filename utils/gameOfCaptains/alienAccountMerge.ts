import { normalizeAlienGuide, type AlienGuide } from './alienFieldGuide'

/**
 * Account copies are monotonic: a lagging tab/device can contribute new records
 * but cannot erase a discovered lifeform or a completed incident. The server's
 * first committed milestone choice wins when devices disagree.
 */
export function mergeAlienGuides(
  persisted: unknown,
  incoming: unknown,
): AlienGuide {
  const first = normalizeAlienGuide(persisted)
  const second = normalizeAlienGuide(incoming)
  const milestoneDecisions = {
    ...(second.milestoneDecisions ?? {}),
    ...(first.milestoneDecisions ?? {}),
  }
  const discovered = [...new Set([...first.discovered, ...second.discovered])]
  const knownFriends = [...new Set([...first.friends, ...second.friends])]
  const fieldReports = [
    ...(first.fieldReports ?? []),
    ...(second.fieldReports ?? []),
  ]
  const distinctReports = [
    ...new Map(
      fieldReports.map((record) => [
        `${record.speciesId}:${record.mood}:${record.outcome}:${record.choice ?? 'unknown'}`,
        record,
      ]),
    ).values(),
  ].slice(-101)
  return normalizeAlienGuide({
    version: 1,
    discovered,
    friends: knownFriends.filter((id) => discovered.includes(id)),
    attempted: [...new Set([...first.attempted, ...second.attempted])].slice(
      -400,
    ),
    milestoneSeen: [
      ...new Set([
        ...first.milestoneSeen,
        ...second.milestoneSeen,
        ...Object.keys(milestoneDecisions).map(Number),
      ]),
    ],
    milestoneDecisions,
    contacts: { ...(first.contacts ?? {}), ...(second.contacts ?? {}) },
    lastContact: second.lastContact ?? first.lastContact,
    fieldReports: distinctReports,
  })
}
