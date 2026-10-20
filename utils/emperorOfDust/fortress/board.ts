import { KINGDOM_FACTION_DEFS, LOCAL_FACTION_DEFS } from './factions'
import { followerDef, itemDef } from './followers'
import { LAST_DAY } from './content'
import { INJURY_DAYS, traitApplies, traitKnown } from './engine'
import type { Effects, FortressRun, OddsPreview, QuestDef, Stat } from './types'

// The quest room board (conductor SYSTEMS-V03.md, "Quest room — the board"):
// what a notice promises, what it costs to ignore, what counts for the party
// and the warnings that go with a Send. Warnings never block.

const localName = (id: string) =>
  LOCAL_FACTION_DEFS.find((def) => def.id === id)?.name ?? id
const kingdomName = (id: string) =>
  KINGDOM_FACTION_DEFS.find((def) => def.id === id)?.name ?? id
const signed = (n: number) => (n > 0 ? `+${n}` : `−${Math.abs(n)}`)
const capital = (stat: Stat) => stat[0]!.toUpperCase() + stat.slice(1)

/**
 * Plain lines for a set of effects, as the board shows them. Hidden faction
 * strength is never shown, nor factions still in the fog.
 */
export const effectLines = (
  run: FortressRun,
  effects: Effects,
  mode: 'reward' | 'expiry' = 'reward',
): string[] => {
  const lines: string[] = []
  if (effects.brass) lines.push(`${signed(effects.brass)} brass`)
  for (const [id, delta] of Object.entries(effects.local ?? {}))
    if (delta) lines.push(`${localName(id)} ${signed(delta)}`)
  for (const [id, delta] of Object.entries(effects.affinity ?? {})) {
    if (!delta) continue
    const fogged =
      (id === 'rustline' || id === 'black-verge') &&
      !run.revealedFactions.includes(id)
    lines.push(
      fogged
        ? 'someone unseen takes note'
        : `${kingdomName(id)} ${signed(delta)}`,
    )
  }
  for (const id of effects.items ?? [])
    lines.push(itemDef(id)?.name ?? 'an item')
  const recruits = [...(effects.recruit ?? []), ...(effects.recruitable ?? [])]
  if (recruits.length)
    lines.push(
      recruits.length === 1
        ? 'a new face at the gate'
        : 'new faces at the gate',
    )
  if (Object.values(effects.strength ?? {}).some(Boolean))
    lines.push('the balance out there shifts')
  if (effects.flags?.length)
    lines.push(
      mode === 'reward' ? 'word that travels' : 'it will be remembered',
    )
  return [...new Set(lines)]
}

/** What the board promises on success. */
export const rewardLines = (run: FortressRun, quest: QuestDef): string[] => {
  const lines = effectLines(run, quest.rewards.success)
  return lines.length ? lines : ['thanks, and nothing else']
}

/** The day the quest leaves the board, and what happens if nobody goes. */
export const expiryInfo = (
  run: FortressRun,
  quest: QuestDef,
  lastDay: number,
) => {
  const daysLeft = lastDay - run.day + 1
  const lines = effectLines(run, quest.expired, 'expiry')
  return {
    daysLeft,
    countdown: daysLeft <= 1 ? 'Last day' : `${daysLeft} days left`,
    when:
      daysLeft <= 1
        ? 'Comes down tonight.'
        : `On the board through Day ${lastDay}.`,
    consequence: lines.length
      ? `If nobody goes: ${lines.join(', ')}.`
      : 'If nobody goes, it passes. Nothing follows.',
    punishes: lines.length > 0,
  }
}

/** The danger and wound range a quest carries, as the notice prints it. */
export const dangerLine = (quest: QuestDef): string => {
  const [low, high] = INJURY_DAYS[quest.danger]
  const label = {
    none: 'No danger',
    low: 'Low danger',
    mid: 'Dangerous',
    high: 'Very dangerous',
  }[quest.danger]
  return [
    label,
    ...(high ? [`wounds ${low}–${high} days`] : []),
    ...(quest.lethal ? ['Lethal'] : []),
  ].join(' · ')
}

export type PartyModifier = {
  followerId: string
  label: string
  amount: number
  /** The stats it counts toward; every requirement when omitted. */
  stats?: Stat[]
}

/**
 * The known adjustments the preview counts for each follower: faction
 * modifiers, equipment, revealed traits and Keel's Under the Wall. Unknown
 * secrets apply silently and are never listed.
 */
export const partyModifiers = (
  run: FortressRun,
  quest: QuestDef,
  party: readonly string[],
  known: readonly string[],
): PartyModifier[] => {
  const needs = quest.requirements.map((req) => req.stat)
  const out: PartyModifier[] = []
  for (const id of party) {
    const def = followerDef(id)
    const state = run.roster.find((entry) => entry.id === id)
    if (!def || !state) continue
    const faction = quest.faction && def.factionModifiers[quest.faction]
    if (faction)
      out.push({
        followerId: id,
        label: `with ${kingdomName(quest.faction!)}`,
        amount: faction,
      })
    for (const itemId of Object.values(state.equipment)) {
      const item = itemId ? itemDef(itemId) : undefined
      for (const stat of needs) {
        const bonus = item?.stats?.[stat]
        if (bonus)
          out.push({
            followerId: id,
            label: `${item!.name} (${capital(stat)})`,
            amount: bonus,
            stats: [stat],
          })
      }
    }
    for (const trait of def.traits)
      if (traitApplies(trait, quest) && traitKnown(run, trait, known))
        out.push({ followerId: id, label: trait.name, amount: trait.amount })
    if (def.ability.kind === 'undermine' && needs.includes('might'))
      out.push({
        followerId: id,
        label: `${def.ability.name} (Wits as Might)`,
        amount: def.stats.wits,
        stats: ['might'],
      })
  }
  return out
}

/** Warnings shown beside Send. They inform; they never disable it. */
export const sendWarnings = (
  run: FortressRun,
  quest: QuestDef,
  odds: OddsPreview,
  modifiers: readonly PartyModifier[],
): string[] => {
  const warnings: string[] = []
  odds.perRequirement.forEach((req) => {
    if (!req.hidden && req.total < req.needed)
      warnings.push(
        `Short on ${capital(req.stat)}: ${req.total} of ${req.needed}.`,
      )
  })
  const hidden = odds.perRequirement.filter((req) => req.hidden).length
  if (hidden)
    warnings.push(
      hidden === 1
        ? 'One need is unknown. The odds are a guess.'
        : `${hidden} needs are unknown. The odds are a guess.`,
    )
  for (const mod of modifiers)
    if (mod.amount < 0)
      warnings.push(
        `${followerDef(mod.followerId)?.name ?? mod.followerId}: ${mod.label} (${signed(mod.amount)}).`,
      )
  if (quest.lethal)
    warnings.push(
      odds.deathChance
        ? `Lethal. About ${odds.deathChance}% that someone does not come home.`
        : 'Lethal, but someone in this party keeps the others breathing.',
    )
  if (run.day + odds.durationDays > LAST_DAY + 1)
    warnings.push('They would not be home before the reign ends.')
  return warnings
}
