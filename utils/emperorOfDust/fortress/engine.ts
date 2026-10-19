import {
  KINGDOM_FACTION_DEFS,
  LOCAL_MAX,
  LOCAL_START,
  REGIONS,
  affinityTier,
} from './factions'
import { FOLLOWERS, followerDef, itemDef } from './followers'
import {
  LAST_DAY,
  QUEST_TEMPLATES,
  dayDef,
  isTemplateInstance,
  questDef,
} from './content'
import { AFFINITY_TIERS, KINGDOM_FACTIONS, LOCAL_FACTIONS } from './types'
import type {
  AbilityKind,
  ActiveQuest,
  AudienceDef,
  AudienceOption,
  Band,
  DawnReport,
  Effects,
  FollowerDef,
  FollowerState,
  FortressRun,
  KingdomFactionId,
  LocalFactionId,
  OddsPreview,
  QuestDef,
  QuestReport,
  QuestResultTier,
  Requirement,
  Stat,
  TraitDef,
} from './types'

export const START_BRASS = 120
export const WAGE = 6
export const LOAN = 50
export const BAND_NEED: Record<Band, number> = {
  low: 5,
  mid: 10,
  high: 16,
  extreme: 22,
}
const INJURY_CHANCE: Record<
  QuestDef['danger'],
  Record<QuestResultTier, number>
> = {
  none: { triumph: 0, success: 0, partial: 0, failure: 0 },
  low: { triumph: 0, success: 0, partial: 20, failure: 40 },
  mid: { triumph: 0, success: 10, partial: 35, failure: 60 },
  high: { triumph: 5, success: 20, partial: 50, failure: 80 },
}
const INJURY_DAYS: Record<QuestDef['danger'], [number, number]> = {
  none: [0, 0],
  low: [1, 2],
  mid: [2, 5],
  high: [3, 8],
}
export const BED_UPGRADES = {
  9: { cost: 40, gateWatch: 0 },
  12: { cost: 80, gateWatch: 12 },
} as const
const HOURGLASS = 'komodo-brass-hourglass'

const clamp = (value: number, low: number, high: number): number =>
  Math.max(low, Math.min(high, value))

export const actOf = (day: number): number => clamp(Math.ceil(day / 10), 1, 5)

export const isOver = (run: FortressRun): boolean => run.day > LAST_DAY

// --- seeded randomness ------------------------------------------------------

/** Deterministic 0-99 for (seed, branch, key). A rewind bumps `branch`. */
export const rollFor = (run: FortressRun, key: string): number => {
  const identity = `${run.seed}|${run.branch}|${key}`
  let hash = 2166136261
  for (let i = 0; i < identity.length; i += 1) {
    hash = Math.imul(hash ^ identity.charCodeAt(i), 16777619)
  }
  hash ^= hash << 13
  hash ^= hash >>> 17
  hash ^= hash << 5
  return (hash >>> 0) % 100
}

// --- creation ---------------------------------------------------------------

const cloneRun = (run: FortressRun): FortressRun =>
  JSON.parse(JSON.stringify(run)) as FortressRun

export const createRun = (
  seed: number,
  equippedRelics: string[] = [],
): FortressRun => {
  if (!Number.isSafeInteger(seed)) throw new Error('seed must be an integer')
  const run: FortressRun = {
    version: 3,
    seed,
    branch: 0,
    day: 1,
    brass: START_BRASS,
    loans: 0,
    local: Object.fromEntries(
      LOCAL_FACTIONS.map((id) => [id, LOCAL_START]),
    ) as FortressRun['local'],
    affinity: Object.fromEntries(
      KINGDOM_FACTION_DEFS.map((def) => [def.id, def.startAffinity]),
    ) as FortressRun['affinity'],
    strength: Object.fromEntries(
      KINGDOM_FACTION_DEFS.map((def) => [def.id, def.startStrength]),
    ) as FortressRun['strength'],
    revealedFactions: KINGDOM_FACTION_DEFS.filter(
      (def) => def.revealedOnDay <= 1,
    ).map((def) => def.id),
    wipedOut: [],
    beds: 6,
    roster: FOLLOWERS.filter((def) => def.starter).map((def) => ({
      id: def.id,
      joinedDay: 1,
      equipment: {},
    })),
    recruitable: [],
    inventory: [],
    board: [],
    active: [],
    audiencesHeard: [],
    flags: [],
    equippedRelics: [...equippedRelics],
    relicUses: {},
    reports: [],
    memorials: [],
  }
  postDawnQuests(run)
  return run
}

/** Posts the day's authored quests plus seeded template quests. */
export const postDawnQuests = (run: FortressRun): void => {
  if (isOver(run)) return
  for (const id of dayDef(run.day)?.quests ?? []) postQuest(run, id)
  drawTemplates(run)
  // Whoever is eligible at dawn stays at court all day, whatever is decided
  // in the other audiences.
  run.dayAudiences = (dayDef(run.day)?.audiences ?? [])
    .filter(
      (audience) => unmetRequirements(run, audience.requires).length === 0,
    )
    .map((audience) => audience.id)
}

/** Authored days draw one seeded chore, unscripted days draw two. */
const drawTemplates = (run: FortressRun): void => {
  const draws = dayDef(run.day) ? 1 : 2
  const pool = [...QUEST_TEMPLATES]
  for (let i = 0; i < draws && pool.length; i += 1) {
    const index = rollFor(run, `dawn:${run.day}:${i}`) % pool.length
    const [template] = pool.splice(index, 1)
    if (template) postQuest(run, `${template.id}@${run.day}`)
  }
}

const postQuest = (run: FortressRun, questId: string): void => {
  const def = questDef(questId)
  if (!def) throw new Error(`unknown quest: ${questId}`)
  if (
    run.board.some((entry) => entry.questId === questId) ||
    run.active.some((entry) => entry.questId === questId) ||
    run.reports.some((report) =>
      report.quests.some((entry) => entry.questId === questId),
    )
  )
    return
  run.board.push({
    questId,
    postedDay: run.day,
    lastDay: run.day + def.boardDays - 1,
  })
}

// --- followers --------------------------------------------------------------

export type FollowerStatus = 'ready' | 'on-quest' | 'injured' | 'dead'

export const followerStatus = (
  run: FortressRun,
  id: string,
): FollowerStatus | null => {
  const state = run.roster.find((entry) => entry.id === id)
  if (!state) return null
  if (state.dead) return 'dead'
  if (run.active.some((quest) => quest.party.includes(id))) return 'on-quest'
  if ((state.injuredUntilDay ?? 0) > run.day) return 'injured'
  return 'ready'
}

export const injuryDaysLeft = (run: FortressRun, id: string): number => {
  const state = run.roster.find((entry) => entry.id === id)
  return Math.max(0, (state?.injuredUntilDay ?? 0) - run.day)
}

export const bedsUsed = (run: FortressRun): number =>
  run.roster.filter((entry) => !entry.dead).length

// --- requirements and effects -------------------------------------------------

const tierRank = (tier: string): number =>
  AFFINITY_TIERS.indexOf(tier as (typeof AFFINITY_TIERS)[number])

/** Reasons a requirement is unmet; empty when it can be taken. */
export const unmetRequirements = (
  run: FortressRun,
  requires: Requirement | undefined,
  recruits: string[] = [],
): string[] => {
  const reasons: string[] = []
  if (!requires && !recruits.length) return reasons
  if (requires?.cost && run.brass < requires.cost)
    reasons.push(`Needs ${requires.cost} brass`)
  for (const [faction, min] of Object.entries(requires?.local ?? {})) {
    if (run.local[faction as keyof FortressRun['local']] < (min ?? 0))
      reasons.push(`Needs ${faction} support ${min}`)
  }
  for (const [faction, tier] of Object.entries(requires?.affinity ?? {})) {
    const current = affinityTier(run.affinity[faction as KingdomFactionId])
    if (tierRank(current) < tierRank(tier ?? 'neutral'))
      reasons.push(`Needs ${faction} ${tier}`)
  }
  if (requires?.follower) {
    const status = followerStatus(run, requires.follower)
    if (!status || status === 'dead')
      reasons.push(
        `Needs ${followerDef(requires.follower)?.name ?? requires.follower} at court`,
      )
  }
  for (const flag of requires?.flags ?? [])
    if (!run.flags.includes(flag)) reasons.push('Not yet possible')
  for (const flag of requires?.notFlags ?? [])
    if (run.flags.includes(flag)) reasons.push('No longer possible')
  if (bedsUsed(run) + recruits.length > run.beds)
    reasons.push('The barracks are full')
  return reasons
}

export const applyEffects = (
  run: FortressRun,
  effects: Effects,
  events: string[] = [],
): void => {
  run.brass += effects.brass ?? 0
  for (const [id, delta] of Object.entries(effects.local ?? {})) {
    const key = id as keyof FortressRun['local']
    const before = run.local[key]
    run.local[key] = clamp(before + (delta ?? 0), 0, LOCAL_MAX)
    if (before > 0 && run.local[key] === 0) {
      run.flags.push(`crisis:${key}`)
      events.push(`The ${key} has lost all faith in the throne.`)
    }
  }
  for (const [id, delta] of Object.entries(effects.affinity ?? {})) {
    const key = id as KingdomFactionId
    run.affinity[key] = clamp(run.affinity[key] + (delta ?? 0), -100, 100)
  }
  for (const [id, delta] of Object.entries(effects.strength ?? {})) {
    const key = id as KingdomFactionId
    run.strength[key] = clamp(run.strength[key] + (delta ?? 0), 0, 10)
  }
  for (const flag of effects.flags ?? [])
    if (!run.flags.includes(flag)) run.flags.push(flag)
  run.flags = run.flags.filter(
    (flag) => !(effects.clearFlags ?? []).includes(flag),
  )
  for (const id of effects.recruitable ?? [])
    if (!run.recruitable.includes(id) && !run.roster.some((s) => s.id === id))
      run.recruitable.push(id)
  for (const id of effects.recruit ?? []) {
    if (run.roster.some((entry) => entry.id === id)) continue
    if (bedsUsed(run) < run.beds) {
      run.roster.push({ id, joinedDay: run.day, equipment: {} })
      run.recruitable = run.recruitable.filter((entry) => entry !== id)
      events.push(`${followerDef(id)?.name ?? id} joined the court.`)
    } else if (!run.recruitable.includes(id)) {
      run.recruitable.push(id)
    }
  }
  for (const id of effects.items ?? []) run.inventory.push(id)
}

// --- throne room ------------------------------------------------------------

export const audiencesToday = (run: FortressRun): AudienceDef[] =>
  (dayDef(run.day)?.audiences ?? []).filter((audience) =>
    run.dayAudiences
      ? run.dayAudiences.includes(audience.id)
      : unmetRequirements(run, audience.requires).length === 0,
  )

export const optionBlockers = (
  run: FortressRun,
  option: AudienceOption,
): string[] => unmetRequirements(run, option.requires, option.effects.recruit)

export const chooseAudienceOption = (
  run: FortressRun,
  audienceId: string,
  optionId: string,
): { run: FortressRun; response: string } => {
  if (isOver(run)) throw new Error('the campaign is over')
  const audience = audiencesToday(run).find((entry) => entry.id === audienceId)
  if (!audience) throw new Error('that audience is not at court today')
  if (run.audiencesHeard.includes(audienceId))
    throw new Error('that audience was already answered')
  const option = audience.options.find((entry) => entry.id === optionId)
  if (!option) throw new Error(`unknown option: ${optionId}`)
  const blockers = optionBlockers(run, option)
  if (blockers.length) throw new Error(blockers.join('; '))
  const next = cloneRun(run)
  next.brass -= option.requires?.cost ?? 0
  applyEffects(next, option.effects)
  for (const questId of option.postsQuests ?? []) postQuest(next, questId)
  next.audiencesHeard.push(audienceId)
  next.flags.push(`chose:${audienceId}:${optionId}`)
  return { run: next, response: option.response }
}

// --- quest odds -------------------------------------------------------------

type Member = { def: FollowerDef; state: FollowerState }

const membersOf = (run: FortressRun, party: string[]): Member[] =>
  party.map((id) => {
    const def = followerDef(id)
    const state = run.roster.find((entry) => entry.id === id)
    if (!def || !state) throw new Error(`not in the barracks: ${id}`)
    return { def, state }
  })

const traitApplies = (trait: TraitDef, quest: QuestDef): boolean =>
  (trait.trigger.stat !== undefined &&
    quest.requirements.some((req) => req.stat === trait.trigger.stat)) ||
  (trait.trigger.faction !== undefined &&
    trait.trigger.faction === quest.faction) ||
  (trait.trigger.tag !== undefined &&
    (quest.tags ?? []).includes(trait.trigger.tag))

/** A trait is known if the Codex holds it, or its allegiance flag is set. */
export const traitKnown = (
  run: FortressRun,
  trait: TraitDef,
  known: readonly string[],
): boolean =>
  known.includes(trait.id) ||
  (trait.revealFlag !== undefined && run.flags.includes(trait.revealFlag))

type PartyAbility = {
  kind: AbilityKind
  amount: number
  stat?: Stat
  local?: LocalFactionId
  ownerId: string
}

const abilitiesOf = (members: Member[]): PartyAbility[] =>
  members.flatMap(({ def, state }) =>
    [
      def.ability,
      ...Object.values(state.equipment)
        .map((id) => (id ? itemDef(id)?.ability : undefined))
        .filter((ability): ability is NonNullable<typeof ability> => !!ability),
    ].map((ability) => ({ ...ability, ownerId: def.id })),
  )

const hasAbility = (abilities: PartyAbility[], kind: AbilityKind): boolean =>
  abilities.some((ability) => ability.kind === kind)

/** Cave-Luck rolls twice and keeps the better: the honest odds change too. */
const luckyChance = (chance: number): number =>
  Math.min(99, Math.round(100 * (1 - (1 - chance / 100) ** 2)))

const abilityTotal = (
  abilities: ReturnType<typeof abilitiesOf>,
  kind: AbilityKind,
): number =>
  abilities
    .filter((ability) => ability.kind === kind)
    .reduce((sum, ability) => sum + ability.amount, 0)

export const questDuration = (
  quest: QuestDef,
  members: Member[],
  hourglass = false,
): number => {
  const swift = abilitiesOf(members).some((ability) => ability.kind === 'swift')
  return Math.max(1, quest.durationDays - Number(swift) - Number(hourglass))
}

const contribution = (
  run: FortressRun,
  member: Member,
  stat: Stat,
  quest: QuestDef,
  known: readonly string[] | 'all',
): number => {
  let value = member.def.stats[stat]
  for (const id of Object.values(member.state.equipment)) {
    value += (id ? itemDef(id)?.stats?.[stat] : 0) ?? 0
  }
  if (quest.faction) value += member.def.factionModifiers[quest.faction] ?? 0
  for (const trait of member.def.traits) {
    if (!traitApplies(trait, quest)) continue
    if (known === 'all' || traitKnown(run, trait, known)) value += trait.amount
  }
  return Math.max(0, value)
}

const chanceFrom = (ratios: number[]): number => {
  if (!ratios.length) return 95
  const met =
    ratios.reduce((sum, ratio) => sum + Math.min(1, ratio), 0) / ratios.length
  const over =
    ratios.reduce(
      (sum, ratio) => sum + Math.max(0, Math.min(1.25, ratio) - 1),
      0,
    ) / ratios.length
  return clamp(Math.round(10 + 80 * met + 20 * over), 5, 95)
}

const partyRatios = (
  totals: number[],
  needs: number[],
  juryRig: boolean,
): number[] => {
  const ratios = totals.map((total, i) => total / (needs[i] ?? 1))
  if (juryRig && ratios.length) {
    let lowest = 0
    ratios.forEach((ratio, i) => {
      if (ratio < (ratios[lowest] ?? 0)) lowest = i
    })
    const ratio = ratios[lowest] ?? 0
    if (ratio < 1) ratios[lowest] = Math.min(1, ratio + 0.3)
  }
  return ratios
}

const evaluate = (
  run: FortressRun,
  quest: QuestDef,
  members: Member[],
  known: readonly string[] | 'all',
) => {
  const abilities = abilitiesOf(members)
  const juryRig = abilities.some((ability) => ability.kind === 'jury-rig')
  const totals = quest.requirements.map((req) => {
    const base = members.reduce(
      (sum, member) => sum + contribution(run, member, req.stat, quest, known),
      0,
    )
    const rally = abilities
      .filter(
        (ability) => ability.kind === 'rally' && ability.stat === req.stat,
      )
      .reduce((sum, ability) => sum + ability.amount * members.length, 0)
    return base + rally
  })
  return { abilities, juryRig, totals }
}

export const previewQuest = (
  run: FortressRun,
  questId: string,
  party: string[],
  known: readonly string[] = [],
  hourglass = false,
): OddsPreview => {
  const quest = questDef(questId)
  if (!quest) throw new Error(`unknown quest: ${questId}`)
  const members = membersOf(run, party)
  const { abilities, juryRig, totals } = evaluate(run, quest, members, known)
  const scouted =
    abilities.some((ability) => ability.kind === 'scout') ||
    run.flags.includes(`scouted:${questId}`)
  const hiddenIndexes = quest.requirements
    .map((req, i) => (req.hidden && !scouted ? i : -1))
    .filter((i) => i >= 0)
  const needs = quest.requirements.map((req) => BAND_NEED[req.band])
  const chanceWith = (override?: Band) =>
    chanceFrom(
      partyRatios(
        totals,
        needs.map((need, i) =>
          override && hiddenIndexes.includes(i) ? BAND_NEED[override] : need,
        ),
        juryRig,
      ),
    )
  const estimate = hiddenIndexes.length > 0 && members.length > 0
  const low = members.length
    ? estimate
      ? chanceWith('extreme')
      : chanceWith()
    : 0
  const high = members.length
    ? estimate
      ? chanceWith('low')
      : chanceWith()
    : 0
  const guardian = abilityTotal(abilities, 'guardian')
  const luck = hasAbility(abilities, 'lucky') ? luckyChance : (c: number) => c
  return {
    chance: luck(estimate ? Math.round((low + high) / 2) : low),
    estimate,
    low: luck(low),
    high: luck(high),
    perRequirement: quest.requirements.map((req, i) => ({
      stat: req.stat,
      band: req.band,
      hidden: hiddenIndexes.includes(i),
      total: totals[i] ?? 0,
      needed: hiddenIndexes.includes(i) ? 0 : (needs[i] ?? 0),
    })),
    durationDays: questDuration(quest, members, hourglass),
    injuryChance: clamp(INJURY_CHANCE[quest.danger].failure - guardian, 0, 100),
  }
}

// --- quest room -------------------------------------------------------------

export const canUseHourglass = (run: FortressRun): boolean =>
  run.equippedRelics.includes(HOURGLASS) &&
  run.relicUses[HOURGLASS] !== actOf(run.day)

export const assignQuest = (
  run: FortressRun,
  questId: string,
  party: string[],
  hourglass = false,
): FortressRun => {
  if (isOver(run)) throw new Error('the campaign is over')
  const entry = run.board.find((item) => item.questId === questId)
  const quest = questDef(questId)
  if (!entry || !quest || entry.lastDay < run.day)
    throw new Error('that quest is not on the board')
  if (new Set(party).size !== party.length)
    throw new Error('a follower can only be sent once')
  if (quest.mustInclude && !party.includes(quest.mustInclude))
    throw new Error(
      `${followerDef(quest.mustInclude)?.name ?? quest.mustInclude} must go on this quest`,
    )
  if (party.length < quest.party.min || party.length > quest.party.max)
    throw new Error(
      `this quest needs ${quest.party.min}-${quest.party.max} followers`,
    )
  for (const id of party) {
    if (followerStatus(run, id) !== 'ready')
      throw new Error(`${followerDef(id)?.name ?? id} is not ready`)
  }
  if (hourglass && !canUseHourglass(run))
    throw new Error('the Brass Hourglass is spent this act')
  const next = cloneRun(run)
  const duration = questDuration(quest, membersOf(next, party), hourglass)
  next.board = next.board.filter((item) => item.questId !== questId)
  next.active.push({
    questId,
    party: [...party],
    departedDay: next.day,
    returnsDay: next.day + duration,
    postedDay: entry.postedDay,
    lastDay: entry.lastDay,
  })
  if (hourglass) next.relicUses[HOURGLASS] = actOf(next.day)
  return next
}

/** Withdraw an assignment made today, before Finish. */
export const withdrawQuest = (
  run: FortressRun,
  questId: string,
): FortressRun => {
  const active = run.active.find((item) => item.questId === questId)
  if (!active || active.departedDay !== run.day)
    throw new Error('only today’s assignments can be withdrawn')
  const next = cloneRun(run)
  next.active = next.active.filter((item) => item.questId !== questId)
  next.board.push({
    questId,
    postedDay: active.postedDay,
    lastDay: active.lastDay,
  })
  return next
}

// --- barracks and market ----------------------------------------------------

export const recruit = (run: FortressRun, id: string): FortressRun => {
  const def = followerDef(id)
  if (!def || !run.recruitable.includes(id))
    throw new Error('that follower is not offering to join')
  const blockers = unmetRequirements(run, { cost: def.recruitFee }, [id])
  if (blockers.length) throw new Error(blockers.join('; '))
  const next = cloneRun(run)
  next.brass -= def.recruitFee
  applyEffects(next, { recruit: [id] })
  return next
}

export const upgradeBeds = (run: FortressRun): FortressRun => {
  if (run.beds === 12) throw new Error('the barracks are at full size')
  const target = run.beds === 6 ? 9 : 12
  const rule = BED_UPGRADES[target]
  if (run.brass < rule.cost) throw new Error(`Needs ${rule.cost} brass`)
  if (run.local['gate-watch'] < rule.gateWatch)
    throw new Error(`Needs gate-watch support ${rule.gateWatch}`)
  const next = cloneRun(run)
  next.brass -= rule.cost
  next.beds = target
  return next
}

export const buyItem = (run: FortressRun, itemId: string): FortressRun => {
  const item = itemDef(itemId)
  if (!item) throw new Error(`unknown item: ${itemId}`)
  if (run.brass < item.price) throw new Error(`Needs ${item.price} brass`)
  const next = cloneRun(run)
  next.brass -= item.price
  next.inventory.push(itemId)
  return next
}

/** Equip an owned item (or clear a slot with null). */
export const equipItem = (
  run: FortressRun,
  followerId: string,
  slot: 'tool' | 'charm',
  itemId: string | null,
): FortressRun => {
  const status = followerStatus(run, followerId)
  if (status === 'on-quest') throw new Error('that follower is away')
  if (!status || status === 'dead')
    throw new Error('that follower is not at court')
  const next = cloneRun(run)
  const state = next.roster.find((entry) => entry.id === followerId)!
  const previous = state.equipment[slot]
  if (itemId) {
    const item = itemDef(itemId)
    if (!item || item.slot !== slot) throw new Error('that item does not fit')
    const index = next.inventory.indexOf(itemId)
    if (index < 0) throw new Error('the court does not own that item')
    next.inventory.splice(index, 1)
    state.equipment[slot] = itemId
  } else {
    state.equipment = Object.fromEntries(
      Object.entries(state.equipment).filter(([key]) => key !== slot),
    )
  }
  if (previous) next.inventory.push(previous)
  return next
}

export const earnFlag = (run: FortressRun, flag: string): FortressRun => {
  if (run.flags.includes(flag)) return run
  const next = cloneRun(run)
  next.flags.push(flag)
  return next
}

// --- finishing the day ------------------------------------------------------

const tierFor = (
  chance: number,
  roll: number,
  encore = false,
): QuestResultTier => {
  if (roll < Math.floor(chance * (encore ? 0.6 : 0.3))) return 'triumph'
  if (roll < chance) return 'success'
  if (roll < chance + Math.floor((100 - chance) * 0.4)) return 'partial'
  return 'failure'
}

const resolveQuest = (
  run: FortressRun,
  active: ActiveQuest,
  known: readonly string[],
  events: string[],
): QuestReport => {
  const quest = questDef(active.questId)
  if (!quest) throw new Error(`unknown quest: ${active.questId}`)
  const members = membersOf(run, active.party)
  const { abilities, juryRig, totals } = evaluate(run, quest, members, 'all')
  const chance = chanceFrom(
    partyRatios(
      totals,
      quest.requirements.map((req) => BAND_NEED[req.band]),
      juryRig,
    ),
  )
  const key = `${active.questId}:${active.departedDay}`
  const firstRoll = rollFor(run, `quest:${key}`)
  const roll = hasAbility(abilities, 'lucky')
    ? Math.min(firstRoll, rollFor(run, `luck:${key}`))
    : firstRoll
  const rolledTier = tierFor(chance, roll, hasAbility(abilities, 'encore'))
  const tier =
    rolledTier === 'failure' && hasAbility(abilities, 'omen')
      ? 'partial'
      : rolledTier
  const rewards =
    tier === 'triumph'
      ? (quest.rewards.triumph ?? quest.rewards.success)
      : tier === 'partial'
        ? (quest.rewards.partial ?? {})
        : quest.rewards[tier]
  const effects: Effects = JSON.parse(JSON.stringify(rewards)) as Effects
  const succeeded = tier === 'success' || tier === 'triumph'
  const envoy = abilityTotal(abilities, 'envoy')
  if (envoy && quest.faction && succeeded) {
    effects.affinity = {
      ...effects.affinity,
      [quest.faction]: (effects.affinity?.[quest.faction] ?? 0) + envoy,
    }
  }
  if (succeeded) {
    effects.brass = (effects.brass ?? 0) + abilityTotal(abilities, 'bounty')
    for (const ability of abilities) {
      if (ability.kind !== 'beloved' || !ability.local) continue
      effects.local = {
        ...effects.local,
        [ability.local]: (effects.local?.[ability.local] ?? 0) + ability.amount,
      }
    }
    if (!effects.brass) delete effects.brass
  } else if (hasAbility(abilities, 'apology')) {
    effects.affinity = Object.fromEntries(
      Object.entries(effects.affinity ?? {}).map(([id, delta]) => [
        id,
        (delta ?? 0) < 0 ? Math.trunc((delta ?? 0) / 2) : delta,
      ]),
    )
  }
  applyEffects(run, effects, events)

  const guardian = abilityTotal(abilities, 'guardian')
  const surgery = abilityTotal(abilities, 'field-surgery')
  const [lowDays, highDays] = INJURY_DAYS[quest.danger]
  const injuries: QuestReport['injuries'] = []
  const deaths: string[] = []
  for (const { def, state } of members) {
    const odds = clamp(INJURY_CHANCE[quest.danger][tier] - guardian, 0, 100)
    if (rollFor(run, `injury:${key}:${def.id}`) >= odds) continue
    const span = highDays - lowDays + 1
    const raw = lowDays + (rollFor(run, `wound:${key}:${def.id}`) % span)
    const lethalBlow =
      quest.lethal &&
      !hasAbility(abilities, 'warden') &&
      tier === 'failure' &&
      deaths.length === 0 &&
      raw >= 5 &&
      rollFor(run, `death:${key}:${def.id}`) < 35
    if (lethalBlow) {
      state.dead = true
      state.deathDay = run.day
      run.memorials.push({
        followerId: def.id,
        questId: active.questId,
        day: run.day,
      })
      deaths.push(def.id)
      events.push(`${def.name} did not come home.`)
      continue
    }
    const ownHide = def.ability.kind === 'thick-hide'
    const days = (ownHide ? Math.ceil(raw / 2) : raw) - surgery
    if (days <= 0) continue
    state.injuredUntilDay = Math.max(state.injuredUntilDay ?? 0, run.day + days)
    injuries.push({ followerId: def.id, days })
  }

  const revealedTraits = members.flatMap(({ def }) =>
    def.traits
      .filter(
        (trait) =>
          trait.kind !== 'allegiance' &&
          traitApplies(trait, quest) &&
          !known.includes(trait.id),
      )
      .map((trait) => trait.id),
  )
  const confessors = abilities.filter((ability) => ability.kind === 'confessor')
  if (succeeded && confessors.length) {
    for (const { def } of members) {
      if (confessors.every((ability) => ability.ownerId === def.id)) continue
      const secret = def.traits.find(
        (trait) =>
          trait.kind !== 'allegiance' &&
          !known.includes(trait.id) &&
          !revealedTraits.includes(trait.id),
      )
      if (secret) revealedTraits.push(secret.id)
    }
  }
  if (hasAbility(abilities, 'chronicle')) {
    for (const entry of run.board) {
      const flag = `scouted:${entry.questId}`
      if (!run.flags.includes(flag)) run.flags.push(flag)
    }
  }
  return {
    questId: active.questId,
    tier,
    party: [...active.party],
    chance,
    roll,
    injuries,
    deaths,
    revealedTraits,
    effects,
  }
}

const HIDEOUTS: [KingdomFactionId, string][] = [
  ['moles', 'mole-tunnels'],
  ['storm-crows', 'crow-cave'],
  ['hollow-bell', 'bell-cellars'],
  ['jackalwire', 'wagon-circle'],
  ['saltroad', 'moving-caravan'],
  ['freeholds', 'freehold-barn'],
  ['rustline', 'rail-station'],
]

/** Act V hideout: the strongest Friendly-or-better ally, else the cave. */
export const selectHideout = (run: FortressRun): string => {
  const candidates = HIDEOUTS.filter(
    ([faction]) =>
      !run.wipedOut.includes(faction) &&
      run.revealedFactions.includes(faction) &&
      tierRank(affinityTier(run.affinity[faction])) >= tierRank('friendly'),
  ).sort(
    ([a], [b]) =>
      run.affinity[b] - run.affinity[a] || run.strength[b] - run.strength[a],
  )
  return candidates[0]?.[1] ?? 'nameless-cave'
}

const actEnd = (run: FortressRun, events: string[]): void => {
  for (const def of KINGDOM_FACTION_DEFS) {
    if (
      def.revealedOnDay <= run.day &&
      !run.revealedFactions.includes(def.id)
    ) {
      run.revealedFactions.push(def.id)
      events.push(`The map room has a new banner: ${def.name}.`)
    }
  }
  if (![11, 21, 31, 41].includes(run.day)) return
  for (const id of KINGDOM_FACTIONS) {
    if (
      run.revealedFactions.includes(id) &&
      !run.wipedOut.includes(id) &&
      run.strength[id] <= 0
    ) {
      run.wipedOut.push(id)
      events.push(
        `${KINGDOM_FACTION_DEFS.find((def) => def.id === id)?.name ?? id} is gone from the map.`,
      )
    }
  }
  if (run.day === 41 && !run.flags.includes('komodo-betrayal')) {
    run.flags.push('komodo-betrayal')
    run.hideout = selectHideout(run)
    events.push('Young Komodo has betrayed the throne. The court flees.')
  }
}

export const dailyTaxes = (run: FortressRun): number =>
  REGIONS.filter(
    (region) =>
      run.revealedFactions.includes(region.controller) &&
      !run.wipedOut.includes(region.controller) &&
      tierRank(affinityTier(run.affinity[region.controller])) >=
        tierRank('neutral'),
  ).reduce((sum, region) => sum + region.tax, 0)

/**
 * Ends the day: quests ride out, the next dawn resolves returns and expiries,
 * collects taxes and wages, applies act-end map changes and posts new quests.
 * `known` is the Codex's revealed trait ids (merged by the caller).
 */
export const finishDay = (
  run: FortressRun,
  known: readonly string[] = [],
): { run: FortressRun; report: DawnReport } => {
  if (isOver(run)) throw new Error('the campaign is over')
  const next = cloneRun(run)
  next.day += 1
  next.audiencesHeard = []
  const events: string[] = []
  const quests: QuestReport[] = []
  const knownNow = [...known]
  for (const active of next.active.filter(
    (item) => item.returnsDay <= next.day,
  )) {
    const report = resolveQuest(next, active, knownNow, events)
    knownNow.push(...report.revealedTraits)
    quests.push(report)
  }
  next.active = next.active.filter((item) => item.returnsDay > next.day)
  for (const entry of next.board.filter((item) => item.lastDay < next.day)) {
    const quest = questDef(entry.questId)
    if (!quest) continue
    applyEffects(next, quest.expired, events)
    quests.push({
      questId: entry.questId,
      tier: 'expired',
      party: [],
      chance: 0,
      roll: 0,
      injuries: [],
      deaths: [],
      revealedTraits: [],
      effects: quest.expired,
    })
  }
  next.board = next.board.filter((item) => item.lastDay >= next.day)
  const taxes = dailyTaxes(next)
  const wages = WAGE * bedsUsed(next)
  next.brass += taxes - wages
  let loanTaken = false
  if (next.brass < 0) {
    next.brass += LOAN
    next.loans += 1
    loanTaken = true
    applyEffects(next, { local: { ledger: -3 } }, events)
    events.push('The Ledger lent the throne 50 brass to cover wages.')
    if (next.loans >= 2 && !next.flags.includes('ledger-crisis')) {
      next.flags.push('ledger-crisis')
      events.push('The Ledger is calling in its loans.')
    }
  }
  actEnd(next, events)
  postDawnQuests(next)
  const report: DawnReport = {
    day: next.day,
    quests,
    taxes,
    wages,
    loanTaken,
    events,
  }
  next.reports = [...next.reports, report]
  return { run: next, report }
}

/** Re-post today's seeded template quests after a rewind bumps the branch. */
export const rerollDawn = (run: FortressRun): FortressRun => {
  const next = cloneRun(run)
  next.board = next.board.filter(
    (entry) =>
      !(isTemplateInstance(entry.questId) && entry.postedDay === next.day),
  )
  drawTemplates(next)
  return next
}
