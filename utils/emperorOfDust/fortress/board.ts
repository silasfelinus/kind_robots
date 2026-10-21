import { KINGDOM_FACTION_DEFS, LOCAL_FACTION_DEFS } from './factions'
import { followerDef, itemDef } from './followers'
import { LAST_DAY, dueDef, questDef } from './content'
import { INJURY_DAYS, aidResolution, traitApplies, traitKnown } from './engine'
import { gateHolds } from './types'
import type {
  AudienceOption,
  Effects,
  FortressRun,
  OddsPreview,
  QuestDef,
  QuestResultTier,
  Stat,
} from './types'

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
  const aid = aidResolution(run, quest.id)
  if (aid?.resolve) {
    const rewards =
      aid.resolve === 'triumph'
        ? (quest.rewards.triumph ?? quest.rewards.success)
        : (quest.rewards[aid.resolve] ?? {})
    const gained = effectLines(run, rewards)
    return {
      daysLeft,
      countdown: daysLeft <= 1 ? 'Last day' : `${daysLeft} days left`,
      when:
        daysLeft <= 1
          ? 'Comes down tonight.'
          : `On the board through Day ${lastDay}.`,
      consequence: `If nobody goes: ${aid.label}. It ends as ${TIER_WORDS[aid.resolve]}${gained.length ? `: ${gained.join(', ')}` : ''}.`,
      punishes: aid.resolve === 'failure',
    }
  }
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

const TIER_WORDS: Record<QuestResultTier, string> = {
  triumph: 'a triumph',
  success: 'a success',
  partial: 'a partial success',
  failure: 'a failure',
}

// --- honest stakes on the throne (t-040) -------------------------------------

/** One chip under an answer: what it touches, never the flags it sets. */
export type Stake = {
  text: string
  tone: 'gain' | 'loss' | 'neutral' | 'warning'
}

const toward = (name: string) =>
  name.startsWith('The ') ? `the ${name.slice(4)}` : name

/**
 * What an answer visibly does, in direction rather than numbers: brass in
 * and out, which supports warm or cool, who joins or leaves, quests posted or
 * helped, what comes due later and whether the scene goes on. Faction
 * strength, flags and anything kept hidden are never shown; factions still in
 * the fog read as "someone unseen".
 */
export const optionStakes = (
  run: FortressRun,
  option: AudienceOption,
): Stake[] => {
  const stakes: Stake[] = []
  const effects = option.effects
  const brass = (effects.brass ?? 0) - (option.requires?.cost ?? 0)
  if (brass)
    stakes.push({
      text: `${signed(brass)} brass`,
      tone: brass > 0 ? 'gain' : 'loss',
    })
  for (const [id, delta] of Object.entries(effects.local ?? {}))
    if (delta)
      stakes.push({
        text: `${delta > 0 ? 'Warms' : 'Cools'} ${toward(localName(id))}`,
        tone: delta > 0 ? 'gain' : 'loss',
      })
  let unseen = false
  for (const [id, delta] of Object.entries(effects.affinity ?? {})) {
    if (!delta) continue
    if (
      (id === 'rustline' || id === 'black-verge') &&
      !run.revealedFactions.includes(id)
    ) {
      unseen = true
      continue
    }
    stakes.push({
      text: `${delta > 0 ? 'Warms' : 'Cools'} ${toward(kingdomName(id))}`,
      tone: delta > 0 ? 'gain' : 'loss',
    })
  }
  if (unseen)
    stakes.push({ text: 'Someone unseen takes note', tone: 'neutral' })
  for (const id of effects.recruit ?? [])
    stakes.push({
      text: `${followerDef(id)?.name ?? 'Someone'} joins the court`,
      tone: 'gain',
    })
  if (effects.recruitable?.length)
    stakes.push({ text: 'A new face at the gate', tone: 'gain' })
  for (const { follower } of effects.dismiss ?? [])
    stakes.push({
      text: `${followerDef(follower)?.name ?? 'Someone'} leaves the court`,
      tone: 'loss',
    })
  for (const id of effects.items ?? [])
    stakes.push({ text: itemDef(id)?.name ?? 'An item', tone: 'gain' })
  for (const id of option.postsQuests ?? [])
    stakes.push({
      text: `Posts a quest: ${questDef(id)?.title ?? id}`,
      tone: 'neutral',
    })
  for (const aid of effects.questAid ?? []) {
    const title = questDef(aid.questId)?.title ?? aid.questId
    stakes.push({
      text: aid.resolve
        ? `Settles “${title}” if nobody goes`
        : `Helps “${title}”`,
      tone: 'gain',
    })
  }
  for (const id of effects.schedule ?? []) {
    const def = dueDef(id)
    if (!def || def.hidden) continue
    const day = Math.max(run.day + 1, def.day ?? run.day + (def.inDays ?? 1))
    stakes.push({
      text: def.every
        ? `${def.title}: every ${def.every} days`
        : `Comes due Day ${day}: ${def.title}${def.cost ? `, ${def.cost} brass` : ''}`,
      tone: 'warning',
    })
  }
  for (const id of effects.cancelDues ?? []) {
    const pending = (run.dues ?? []).find((due) => due.id === id)
    const def = dueDef(id)
    if (pending && def && !def.hidden && gateHolds(run.flags, def.when))
      stakes.push({ text: `Settles: ${def.title}`, tone: 'gain' })
  }
  if (effects.relocate)
    stakes.push({ text: 'The court moves tonight', tone: 'warning' })
  if (option.next)
    stakes.push({
      text: 'Leads on: the audience continues',
      tone: 'neutral',
    })
  return stakes
}
