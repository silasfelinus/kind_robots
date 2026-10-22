import {
  ACT_END_DAWNS,
  KINGDOM_FACTION_DEFS,
  LOCAL_FACTION_DEFS,
  LOCAL_MAX,
  LOCAL_START,
  PERIL_STRENGTH,
  RAID_GAP,
  REGIONS,
  RIVALRIES,
  affinityTier,
  taxAtTier,
} from './factions'
import type { Mood } from './castArt'
import { FOLLOWERS, followerDef, itemDef } from './followers'
import {
  LAST_DAY,
  QUEST_TEMPLATES,
  dayDef,
  dueDef,
  isTemplateInstance,
  questDef,
} from './content'
import {
  AFFINITY_TIERS,
  KINGDOM_FACTIONS,
  LOCAL_FACTIONS,
  gateHolds,
  pickVariant,
  standingHeld,
  variantText,
} from './types'
import type {
  AbilityKind,
  ActiveQuest,
  AidBonus,
  DueDef,
  AffinityTier,
  AudienceDef,
  AudienceOption,
  Band,
  Briefing,
  DawnReport,
  Effects,
  FollowerDef,
  FollowerState,
  FortressRun,
  ItemDef,
  KingdomFactionId,
  LocalFactionId,
  MapEvent,
  MapThreat,
  OddsPreview,
  QuestAid,
  QuestDef,
  QuestReport,
  QuestResultTier,
  Requirement,
  SceneLine,
  SceneVariant,
  Stat,
  TalkDef,
  TraitDef,
} from './types'
import { TALKS } from './talks'
import { CHANCE_EVENTS, chanceEvent } from './dailyEvents'
import {
  BETRAYAL_DAY,
  HIDEOUT_HOST,
  HIDEOUT_NAMES,
  HIDEOUT_WAGE,
  MIN_LEFT,
  applyBetrayal,
  hostShare,
} from './betrayal'
import { lawTaxes } from './laws'
import { ACT_ONE_DAYS } from './actOne'
import {
  COURT_ONBOARDING_FLAG,
  COURT_RECRUITMENT_IDS,
  FIRST_BELL_AUDIENCES,
  RANDOM_ARRIVALS,
  RIVAL_ARGUMENTS,
} from './onboarding'

export const START_BRASS = 120
export const WAGE = 4
export const LOAN = 50
export const BAND_NEED: Record<Band, number> = {
  low: 5,
  mid: 10,
  high: 16,
  extreme: 22,
}
/**
 * Each act's roads ask more (t-041). A party of three met "high" from Day 3
 * on, so careful staffing was free; needs now rise with the act the party
 * rides out in, and gear, aid and the right people matter again.
 */
export const ACT_NEED_SCALE: readonly number[] = [1, 1.15, 1.3, 1.4, 1.5]
const INJURY_CHANCE: Record<
  QuestDef['danger'],
  Record<QuestResultTier, number>
> = {
  none: { triumph: 0, success: 0, partial: 0, failure: 0 },
  low: { triumph: 0, success: 0, partial: 20, failure: 40 },
  mid: { triumph: 0, success: 10, partial: 35, failure: 60 },
  high: { triumph: 5, success: 20, partial: 50, failure: 80 },
}
/**
 * On a lethal quest, the chance a deep wound (5+ days) kills instead (t-041),
 * by result. A failure was 35% and a partial never killed, so lethal quests
 * showed 0-4% and nobody died in three full campaigns. One death at most.
 */
export const LETHAL_BLOW: Partial<Record<QuestResultTier, number>> = {
  failure: 40,
  partial: 8,
}
export const INJURY_DAYS: Record<QuestDef['danger'], [number, number]> = {
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
/** Lamplight Archive support at which its clerks read every '?' on the board. */
export const LAMPLIGHT_SIGHT = 20

const clamp = (value: number, low: number, high: number): number =>
  Math.max(low, Math.min(high, value))

export const actOf = (day: number): number => clamp(Math.ceil(day / 10), 1, 5)

/**
 * A lethal road asks this much more again (t-041): the best party the court
 * could field still went out at 95% to quests that can kill. Roads that carry
 * standing aid (the Day 50 roads and FINALE_AID) are exempt: there, ten days
 * of preparation decide the odds, not an extra quarter.
 */
export const LETHAL_NEED_SCALE = 1.2

/** Whether a quest's needs take LETHAL_NEED_SCALE. */
export const lethalScaled = (quest: QuestDef): boolean =>
  !!quest.lethal && !quest.aid?.length

/** What a band asks of a party riding out on `day` (t-041). */
export const bandNeed = (band: Band, day: number, lethal = false): number =>
  Math.round(
    BAND_NEED[band] *
      (ACT_NEED_SCALE[actOf(day) - 1] ?? 1) *
      (lethal ? LETHAL_NEED_SCALE : 1),
  )

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
    roster: [],
    recruitable: [],
    inventory: [],
    board: [],
    active: [],
    audiencesHeard: [],
    flags: [COURT_ONBOARDING_FLAG],
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
  drawChanceEvent(run)
  // Whoever is eligible at dawn stays at court all day, whatever is decided
  // in the other audiences.
  run.dayAudiences = courtAudiences(run)
    .filter(
      (audience) => unmetRequirements(run, audience.requires).length === 0,
    )
    .map((audience) => audience.id)
}

/**
 * One optional, unique story encounter each dawn. Each act has twenty-six
 * separate non-recruitment situations. A single hidden traveler gets a
 * seed-selected visit day in their act, so discovery is possible without
 * requiring thirty reloads. The offer does not join the roster by itself.
 */
export const drawChanceEvent = (run: FortressRun): void => {
  delete run.dailyEvent
  delete run.dailyEventOutcome
  if (isOver(run)) return
  if (run.day === 1 && run.flags.includes(COURT_ONBOARDING_FLAG)) return
  const act = actOf(run.day)
  const seen = run.chanceHistory ?? []
  const visitor = CHANCE_EVENTS.find(
    (event) => event.act === act && event.secretFollower,
  )
  const visitDay = (act - 1) * 10 + 4 + (rollFor(run, `visitor:${act}`) % 4)
  let picked =
    visitor &&
    run.day >= visitDay &&
    !seen.includes(visitor.id) &&
    !run.roster.some((entry) => entry.id === visitor.secretFollower) &&
    !run.recruitable.includes(visitor.secretFollower!)
      ? visitor
      : undefined
  if (!picked) {
    const pool = CHANCE_EVENTS.filter(
      (event) =>
        event.act === act && !event.secretFollower && !seen.includes(event.id),
    )
    if (!pool.length) return
    // Following an earlier thread is more likely than running into an
    // unrelated stranger, though the emperor cannot command coincidence.
    const connected = pool.filter((event) =>
      run.flags.includes(`chance:${event.series}:${act - 1}`),
    )
    const follow = connected.length && rollFor(run, `follow:${run.day}`) < 55
    const candidates = follow ? connected : pool
    picked =
      candidates[rollFor(run, `encounter:${run.day}`) % candidates.length]
  }
  if (!picked) return
  run.dailyEvent = picked.id
  run.chanceHistory = [...seen, picked.id]
}

/** Decide a chance encounter exactly once; choices have normal court effects. */
export const chooseChanceEvent = (
  run: FortressRun,
  eventId: string,
  choiceId: string,
): { run: FortressRun; response: string } => {
  if (run.dailyEvent !== eventId)
    throw new Error('that encounter is no longer at court')
  const event = chanceEvent(eventId)
  if (!event || event.act !== actOf(run.day))
    throw new Error('that visitor did not arrive today')
  const choice = event.choices.find((entry) => entry.id === choiceId)
  if (!choice) throw new Error('that answer was not offered')
  const blockers = unmetRequirements(
    run,
    choice.requires,
    choice.effects.recruit,
  )
  if (blockers.length) throw new Error(blockers.join('; '))
  const next = cloneRun(run)
  next.brass -= choice.requires?.cost ?? 0
  applyEffects(next, choice.effects)
  let response = choice.response
  const earlier = (choice.effects.flags ?? []).find((flag) =>
    flag.startsWith('chance:'),
  )
  if (earlier && event.act >= 4) {
    const history = [1, 2, 3].filter((act) =>
      next.flags.includes(`chance:${event.series}:${act}`),
    ).length
    if (history >= 2) {
      const legacy = 10 + history * 5
      applyEffects(next, { brass: legacy, flags: [`legacy:${event.series}`] })
      response += ` The people you helped on earlier roads send ${legacy} brass, without asking for a receipt.`
    }
  }
  delete next.dailyEvent
  next.dailyEventOutcome = {
    id: event.id,
    day: next.day,
    title: event.title,
    text: response,
  }
  return { run: next, response }
}

/** A chore is posted at most this many times a run (t-041). */
export const CHORE_POSTINGS = 2

/** The template a chore instance (`id@day`) was drawn from. */
export const choreOf = (questId: string): string => questId.split('@')[0] ?? ''

/** Instances of a chore posted this run: on the board, out, or come home. */
export const chorePostings = (run: FortressRun, templateId: string): number =>
  [
    ...run.board.map((entry) => entry.questId),
    ...run.active.map((entry) => entry.questId),
    ...run.reports.flatMap((report) =>
      report.quests.map((entry) => entry.questId),
    ),
  ].filter((id) => isTemplateInstance(id) && choreOf(id) === templateId).length

/** Whether a chore can be drawn today (t-041). */
export const choreOpen = (run: FortressRun, template: QuestDef): boolean => {
  const posted = [...run.board, ...run.active].map((entry) => entry.questId)
  return (
    (!template.faction ||
      (run.revealedFactions.includes(template.faction) &&
        !run.wipedOut.includes(template.faction))) &&
    (!template.days ||
      (run.day >= template.days[0] && run.day <= template.days[1])) &&
    // Never two copies at once, never a third posting, never beside its twin.
    !posted.some(
      (id) => isTemplateInstance(id) && choreOf(id) === template.id,
    ) &&
    chorePostings(run, template.id) < CHORE_POSTINGS &&
    !(template.shuns ?? []).some((id) => posted.includes(id))
  )
}

/**
 * Quiet days can offer an optional chore; scripted crises never add an
 * unavoidable extra deadline. A faction's
 * chores only appear once its banner is on the map, and stop if it is wiped out.
 * Each chore keeps to its days, is posted at most twice, and never beside a
 * copy of itself (t-041).
 */
const drawTemplates = (run: FortressRun): void => {
  const scripted = dayDef(run.day)?.quests.length ?? 0
  const backlog = run.board.length + run.active.length
  // The first act has four starters. If authored stories fill their hands,
  // a random chore must not make success mathematically impossible.
  const capacity = run.roster.filter((f) => !f.dead && !f.departed).length
  const crisisDay =
    (scripted > 0 && run.day <= 10) || (scripted > 0 && run.day % 10 === 0)
  const draws = crisisDay || backlog >= Math.max(2, capacity - 1) ? 0 : 1
  const pool = QUEST_TEMPLATES.filter((template) => choreOpen(run, template))
  for (let i = 0; i < draws && pool.length; i += 1) {
    const index = rollFor(run, `dawn:${run.day}:${i}`) % pool.length
    const [template] = pool.splice(index, 1)
    if (template) postQuest(run, `${template.id}@${run.day}`)
  }
}

const postQuest = (run: FortressRun, questId: string): void => {
  const def = questDef(questId)
  if (!def) throw new Error(`unknown quest: ${questId}`)
  // A faction wiped from the map posts no more work.
  if (def.faction && run.wipedOut.includes(def.faction)) return
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
    lastDay:
      run.day +
      Math.max(
        def.boardDays,
        isTemplateInstance(questId) && run.day <= 20 ? 2 : 1,
      ) -
      1,
  })
}

// --- followers --------------------------------------------------------------

export type FollowerStatus =
  'ready' | 'on-quest' | 'injured' | 'dead' | 'departed'

/** Gone from court: dead, or left with Young Komodo. */
export const goneFromCourt = (status: FollowerStatus | null): boolean =>
  !status || status === 'dead' || status === 'departed'

export const followerStatus = (
  run: FortressRun,
  id: string,
): FollowerStatus | null => {
  const state = run.roster.find((entry) => entry.id === id)
  if (!state) return null
  if (state.dead) return 'dead'
  if (state.departed) return 'departed'
  if (run.active.some((quest) => quest.party.includes(id))) return 'on-quest'
  if ((state.injuredUntilDay ?? 0) > run.day) return 'injured'
  return 'ready'
}

/** How a homecoming felt: the tier of a follower's last quest, for a day after. */
const HOMECOMING_MOOD: Partial<Record<QuestReport['tier'], Mood>> = {
  triumph: 'excited',
  success: 'happy',
  failure: 'angry',
}

/** A follower's barracks mood: wounded is sad, else how they last came home. */
export const followerMood = (run: FortressRun, id: string): Mood => {
  if (followerStatus(run, id) === 'injured') return 'sad'
  for (const report of [...run.reports].reverse()) {
    if (report.day < run.day - 1) break
    const quest = report.quests.find((entry) => entry.party.includes(id))
    if (quest) return HOMECOMING_MOOD[quest.tier] ?? 'neutral'
  }
  return 'neutral'
}

/** The follower at the fortress tonight (not away, not dead) with this ability. */
export const homeAbility = (
  run: FortressRun,
  kind: AbilityKind,
): FollowerDef | undefined =>
  run.roster
    .map((state) => followerDef(state.id))
    .find((def): def is FollowerDef => {
      if (def?.ability.kind !== kind) return false
      const status = followerStatus(run, def.id)
      return status === 'ready' || status === 'injured'
    })

/**
 * Reads the Wind: with Nera at home, false briefings are marked, and Komodo's
 * own lies cannot be read at all.
 */
export const forecastMark = (
  run: FortressRun,
  briefing: Briefing,
): 'false' | 'unreadable' | null => {
  if (!homeAbility(run, 'forecast')) return null
  if (briefing.komodoLie) return 'unreadable'
  return briefing.truth ? null : 'false'
}

export const injuryDaysLeft = (run: FortressRun, id: string): number => {
  const state = run.roster.find((entry) => entry.id === id)
  return Math.max(0, (state?.injuredUntilDay ?? 0) - run.day)
}

export const bedsUsed = (run: FortressRun): number =>
  run.roster.filter((entry) => !entry.dead && !entry.departed).length

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
    if (goneFromCourt(status))
      reasons.push(
        `Needs ${followerDef(requires.follower)?.name ?? requires.follower} at court`,
      )
  }
  for (const flag of requires?.flags ?? [])
    if (!run.flags.includes(flag)) reasons.push('Not yet possible')
  for (const flag of requires?.notFlags ?? [])
    if (run.flags.includes(flag)) reasons.push('No longer possible')
  if (!standingHeld(run.flags, requires?.standing))
    reasons.push('Not yet possible')
  for (const id of recruits)
    if (run.flags.includes(`court-excluded:${id}`))
      reasons.push(
        `${followerDef(id)?.name ?? id} was turned away at First Bell`,
      )
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
      events.push(crisisLine(key))
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
    if (
      !run.flags.includes(`court-excluded:${id}`) &&
      !run.recruitable.includes(id) &&
      !run.roster.some((s) => s.id === id)
    )
      run.recruitable.push(id)
  for (const id of effects.recruit ?? []) {
    if (run.flags.includes(`court-excluded:${id}`)) continue
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
  for (const aid of effects.questAid ?? []) {
    const settled = run.reports.some((report) =>
      report.quests.some((quest) => quest.questId === aid.questId),
    )
    if (settled || !questDef(aid.questId)) continue
    run.aid = {
      ...run.aid,
      [aid.questId]: [...(run.aid?.[aid.questId] ?? []), { ...aid }],
    }
  }
  if (effects.cancelDues?.length) {
    run.dues = (run.dues ?? []).filter(
      (due) => !effects.cancelDues!.includes(due.id),
    )
    if (!run.dues.length) delete run.dues
  }
  for (const id of effects.schedule ?? []) scheduleDue(run, id)
  for (const { follower, reason } of effects.dismiss ?? []) {
    const state = run.roster.find((entry) => entry.id === follower)
    if (!state || state.dead || state.departed) continue
    if (run.active.some((quest) => quest.party.includes(follower))) continue
    if (bedsUsed(run) - 1 < MIN_LEFT) continue
    state.departed = { day: run.day, why: 'dismissed', reason }
    for (const item of Object.values(state.equipment))
      if (item) run.inventory.push(item)
    state.equipment = {}
    delete state.injuredUntilDay
    events.push(reason)
  }
  const target = effects.relocate
  if (
    target &&
    run.hideout &&
    target !== run.hideout &&
    HIDEOUT_NAMES[target]
  ) {
    run.flags = run.flags.filter((flag) => flag !== `hideout:${run.hideout}`)
    run.flags.push(`hideout:${target}`)
    run.hideout = target
    events.push(`The court moved to ${HIDEOUT_NAMES[target]}.`)
  }
}

const PLURAL_LOCALS: readonly LocalFactionId[] = ['old-houses']

/** The dawn line when a fortress faction's support reaches zero. */
export const crisisLine = (id: LocalFactionId): string => {
  const name =
    LOCAL_FACTION_DEFS.find((def) => def.id === id)?.name ?? `The ${id}`
  return `${name} ${PLURAL_LOCALS.includes(id) ? 'have' : 'has'} lost all faith in the throne.`
}

// --- dues: debts, fees and threats that come due (t-040) --------------------

/** Puts a due on the calendar; one already waiting is left as it is. */
const scheduleDue = (run: FortressRun, id: string): void => {
  const def = dueDef(id)
  if (!def || (run.dues ?? []).some((due) => due.id === id)) return
  const day = Math.max(run.day + 1, def.day ?? run.day + (def.inDays ?? 1))
  if (day > LAST_DAY + 1 || (def.until !== undefined && day > def.until)) return
  run.dues = [...(run.dues ?? []), { id, day, from: run.day }]
}

/**
 * Settles every due whose dawn has come, in calendar order, after taxes and
 * wages. Never rolled; a recurring due books its next dawn while `when` holds.
 */
const settleDues = (run: FortressRun, events: string[]): void => {
  const waiting = run.dues ?? []
  const due = waiting
    .filter((entry) => entry.day <= run.day)
    .sort((a, b) => a.day - b.day)
  if (!due.length) return
  run.dues = waiting.filter((entry) => entry.day > run.day)
  for (const pending of due) {
    const def = dueDef(pending.id)
    if (!def) continue
    if (!gateHolds(run.flags, def.when)) {
      if (def.lapsed?.effects) applyEffects(run, def.lapsed.effects, events)
      if (def.lapsed?.line) events.push(def.lapsed.line)
      continue
    }
    if (def.cost && run.brass < def.cost) {
      if (def.unpaid?.effects) applyEffects(run, def.unpaid.effects, events)
      events.push(
        def.unpaid?.line ?? `${def.title}: the strongbox could not pay.`,
      )
    } else {
      run.brass -= def.cost ?? 0
      if (def.effects) applyEffects(run, def.effects, events)
      events.push(def.line)
    }
    if (def.every) {
      const next = run.day + def.every
      if (
        next <= LAST_DAY &&
        (def.until === undefined || next <= def.until) &&
        !(run.dues ?? []).some((entry) => entry.id === def.id)
      )
        run.dues = [
          ...(run.dues ?? []),
          { id: def.id, day: next, from: run.day },
        ]
    }
  }
  if (!run.dues?.length) delete run.dues
}

export type DueView = { def: DueDef; day: number; daysLeft: number }

/**
 * What the court ledger shows is coming: every due not kept hidden, whose
 * condition still holds today, soonest first.
 */
export const pendingDues = (run: FortressRun): DueView[] =>
  (run.dues ?? [])
    .map((due) => ({ def: dueDef(due.id), day: due.day }))
    .filter(
      (entry): entry is { def: DueDef; day: number } =>
        !!entry.def &&
        !entry.def.hidden &&
        gateHolds(run.flags, entry.def.when),
    )
    .map((entry) => ({ ...entry, daysLeft: entry.day - run.day }))
    .sort((a, b) => a.day - b.day)

/** Reasons an answer that sends followers away cannot be given today. */
export const dismissBlockers = (
  run: FortressRun,
  effects: Effects,
): string[] => {
  const leaving = effects.dismiss ?? []
  if (!leaving.length) return []
  const reasons: string[] = []
  for (const { follower } of leaving)
    if (followerStatus(run, follower) === 'on-quest')
      reasons.push(`${followerDef(follower)?.name ?? follower} is away`)
  if (bedsUsed(run) - leaving.length < MIN_LEFT)
    reasons.push(`The court cannot spare them: ${MIN_LEFT} must stay`)
  return reasons
}

// --- throne room ------------------------------------------------------------

/**
 * Older campaigns keep their original Day 1 audiences and recruited roster.
 * New campaigns meet three followers in person before petitions start. The
 * other two First Bell disputes move to Days 2 and 3 instead of flooding Day 1.
 */
const courtAudiences = (run: FortressRun): AudienceDef[] => {
  const ordinary = dayDef(run.day)?.audiences ?? []
  if (!run.flags.includes(COURT_ONBOARDING_FLAG)) return ordinary
  if (run.day === 2) return [...ordinary, ACT_ONE_DAYS[0]!.audiences[1]!]
  if (run.day === 3) return [...ordinary, ACT_ONE_DAYS[0]!.audiences[2]!]
  if (run.day !== 1) return ordinary
  const random =
    RANDOM_ARRIVALS[rollFor(run, 'first-bell:visitor') % RANDOM_ARRIVALS.length]
  const argument =
    RIVAL_ARGUMENTS[
      rollFor(run, 'first-bell:argument') % RIVAL_ARGUMENTS.length
    ]
  const chosen = new Set(['d01-kiyo-arrives', random, argument])
  return [
    ...FIRST_BELL_AUDIENCES.filter((audience) => chosen.has(audience.id)),
    ordinary[0]!,
  ]
}

export const audiencesToday = (run: FortressRun): AudienceDef[] =>
  courtAudiences(run).filter((audience) =>
    run.dayAudiences
      ? run.dayAudiences.includes(audience.id)
      : unmetRequirements(run, audience.requires).length === 0,
  )

/**
 * Whether an answer is offered at all. Story gates (flags, and a follower who
 * is not at court) hide an answer rather than lock it, so a player is never
 * shown the road a different past would have opened. Brass, support and
 * affinity gates still show, locked, with what they need.
 */
export const optionVisible = (
  run: FortressRun,
  option: AudienceOption,
): boolean => {
  // Nobody can be sent home who is no longer at court.
  for (const { follower } of option.effects.dismiss ?? [])
    if (goneFromCourt(followerStatus(run, follower))) return false
  const requires = option.requires
  if (!requires) return true
  if ((requires.flags ?? []).some((flag) => !run.flags.includes(flag)))
    return false
  if ((requires.notFlags ?? []).some((flag) => run.flags.includes(flag)))
    return false
  if (!standingHeld(run.flags, requires.standing)) return false
  if (requires.follower) {
    const status = followerStatus(run, requires.follower)
    if (goneFromCourt(status)) return false
  }
  return true
}

export const optionBlockers = (
  run: FortressRun,
  option: AudienceOption,
): string[] => [
  ...unmetRequirements(run, option.requires, option.effects.recruit),
  ...dismissBlockers(run, option.effects),
]

/** The part of an audience the emperor is in now: its opening, or a later beat. */
export type AudienceScene = {
  beatId?: string
  speaker: string
  npc?: string
  lines: SceneLine[]
  options: AudienceOption[]
}

/** A scene's lines as this run reads them: the first matching variant wins. */
export const sceneLines = (
  run: Pick<FortressRun, 'flags'>,
  scene: { lines: SceneLine[]; variants?: SceneVariant[] },
): SceneLine[] => pickVariant(run.flags, scene.variants)?.lines ?? scene.lines

export const audienceScene = (
  run: FortressRun,
  audience: AudienceDef,
): AudienceScene => {
  const beatId = run.audienceBeats?.[audience.id]
  const beat = beatId
    ? audience.beats?.find((entry) => entry.id === beatId)
    : undefined
  if (!beat)
    return {
      speaker: audience.speaker,
      npc: audience.npc,
      lines: sceneLines(run, audience),
      options: audience.options,
    }
  return {
    beatId: beat.id,
    speaker: beat.speaker ?? audience.speaker,
    npc: beat.npc ?? (beat.speaker ? undefined : audience.npc),
    lines: sceneLines(run, beat),
    options: beat.options,
  }
}

/** The text of a scene line, whoever speaks it. */
export const lineText = (line: SceneLine): string =>
  typeof line === 'string' ? line : line.text

export const chooseAudienceOption = (
  run: FortressRun,
  audienceId: string,
  optionId: string,
): { run: FortressRun; response: string; next?: string } => {
  if (isOver(run)) throw new Error('the campaign is over')
  const audience = audiencesToday(run).find((entry) => entry.id === audienceId)
  if (!audience) throw new Error('that audience is not at court today')
  if (run.audiencesHeard.includes(audienceId))
    throw new Error('that audience was already answered')
  const option = audienceScene(run, audience).options.find(
    (entry) => entry.id === optionId,
  )
  if (!option) throw new Error(`unknown option: ${optionId}`)
  const blockers = optionBlockers(run, option)
  if (blockers.length) throw new Error(blockers.join('; '))
  const nextBeat = option.next
    ? audience.beats?.find((entry) => entry.id === option.next)
    : undefined
  if (option.next && !nextBeat) throw new Error(`unknown beat: ${option.next}`)
  const next = cloneRun(run)
  next.brass -= option.requires?.cost ?? 0
  applyEffects(next, option.effects)
  for (const questId of option.postsQuests ?? []) postQuest(next, questId)
  next.flags.push(`chose:${audienceId}:${optionId}`)
  const beats = { ...(next.audienceBeats ?? {}) }
  if (nextBeat) {
    beats[audienceId] = nextBeat.id
  } else {
    delete beats[audienceId]
    next.audiencesHeard.push(audienceId)
  }
  if (Object.keys(beats).length) next.audienceBeats = beats
  else delete next.audienceBeats
  return { run: next, response: option.response, next: nextBeat?.id }
}

// --- barracks talks ---------------------------------------------------------

export const talkDef = (id: string): TalkDef | undefined =>
  TALKS.find((talk) => talk.id === id)

/** True once today's conversation has been had (or is still going). */
export const talkedToday = (run: FortressRun): boolean =>
  run.talkDay === run.day && !run.talkOpen

/**
 * The talk a follower has for the emperor today: their earliest unheard talk
 * whose day has come and whose requirements hold. Followers away on a quest
 * or in the memorial row have nothing to say; the injured still talk.
 */
export const talkFor = (
  run: FortressRun,
  followerId: string,
): TalkDef | undefined => {
  if (run.talkOpen) {
    const open = talkDef(run.talkOpen.id)
    return open?.follower === followerId ? open : undefined
  }
  const status = followerStatus(run, followerId)
  if (status !== 'ready' && status !== 'injured') return undefined
  return TALKS.find(
    (talk) =>
      talk.follower === followerId &&
      talk.fromDay <= run.day &&
      !(run.talksHeard ?? []).includes(talk.id) &&
      unmetRequirements(run, talk.requires).length === 0,
  )
}

export const talkScene = (run: FortressRun, talk: TalkDef): AudienceScene => {
  const beatId = run.talkOpen?.id === talk.id ? run.talkOpen.beat : undefined
  const beat = beatId
    ? talk.beats?.find((entry) => entry.id === beatId)
    : undefined
  const speaker = followerDef(talk.follower)?.name ?? talk.follower
  if (!beat)
    return {
      speaker,
      npc: talk.follower,
      lines: talk.lines,
      options: talk.options,
    }
  return {
    beatId: beat.id,
    speaker: beat.speaker ?? speaker,
    npc: beat.npc ?? (beat.speaker ? undefined : talk.follower),
    lines: beat.lines,
    options: beat.options,
  }
}

/**
 * Answers a barracks talk. Like an audience, answers with `next` lead on and
 * every answer applies at once; the closing answer marks the talk heard and
 * leaves `heard:<talkId>` for later talks and audiences to read.
 */
export const chooseTalkOption = (
  run: FortressRun,
  talkId: string,
  optionId: string,
): { run: FortressRun; response: string; next?: string } => {
  if (isOver(run)) throw new Error('the campaign is over')
  const talk = talkDef(talkId)
  if (!talk || talkFor(run, talk.follower)?.id !== talkId)
    throw new Error('that conversation is not open today')
  if (talkedToday(run))
    throw new Error('the emperor has already sat with someone today')
  const option = talkScene(run, talk).options.find(
    (entry) => entry.id === optionId,
  )
  if (!option) throw new Error(`unknown option: ${optionId}`)
  const blockers = optionBlockers(run, option)
  if (blockers.length) throw new Error(blockers.join('; '))
  const nextBeat = option.next
    ? talk.beats?.find((entry) => entry.id === option.next)
    : undefined
  if (option.next && !nextBeat) throw new Error(`unknown beat: ${option.next}`)
  const next = cloneRun(run)
  next.brass -= option.requires?.cost ?? 0
  applyEffects(next, option.effects)
  next.flags.push(`talk:${talkId}:${optionId}`)
  next.talkDay = next.day
  if (nextBeat) {
    next.talkOpen = { id: talkId, beat: nextBeat.id }
  } else {
    delete next.talkOpen
    next.talksHeard = [...(next.talksHeard ?? []), talkId]
    next.flags.push(`heard:${talkId}`)
  }
  return { run: next, response: option.response, next: nextBeat?.id }
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

export const traitApplies = (trait: TraitDef, quest: QuestDef): boolean =>
  (trait.trigger.stat !== undefined &&
    quest.requirements.some((req) => req.stat === trait.trigger.stat)) ||
  (trait.trigger.faction !== undefined &&
    trait.trigger.faction === quest.faction) ||
  (trait.trigger.tag !== undefined &&
    (quest.tags ?? []).includes(trait.trigger.tag))

/** Allegiance trait ids whose reveal flag is set in `after` but not `before`. */
export const allegiancesUnlocked = (
  before: readonly string[],
  after: readonly string[],
): string[] =>
  FOLLOWERS.flatMap((def) => def.traits)
    .filter(
      (trait) =>
        trait.revealFlag !== undefined &&
        after.includes(trait.revealFlag) &&
        !before.includes(trait.revealFlag),
    )
    .map((trait) => trait.id)

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
): number => contributionOf(run, member, stat, quest, known).value

/**
 * A member's share of one need, and how much of it the court cannot see yet:
 * the size of every trait that applies here and the Codex has not read
 * (t-041). The roll counts those traits; an honest preview has to allow for
 * them either way, without saying which way they cut.
 */
const contributionOf = (
  run: FortressRun,
  member: Member,
  stat: Stat,
  quest: QuestDef,
  known: readonly string[] | 'all',
): { value: number; unread: number } => {
  let value = member.def.stats[stat]
  let unread = 0
  for (const id of Object.values(member.state.equipment)) {
    const item = id ? itemDef(id) : undefined
    value += item?.stats?.[stat] ?? 0
    value += marketEdge(item, quest)
  }
  if (quest.faction) value += member.def.factionModifiers[quest.faction] ?? 0
  for (const trait of member.def.traits) {
    if (!traitApplies(trait, quest)) continue
    if (known === 'all' || traitKnown(run, trait, known)) value += trait.amount
    else unread += Math.abs(trait.amount)
  }
  return { value: Math.max(0, value), unread }
}

// --- market edges (t-024) ----------------------------------------------------

/** A tool or charm that knows one faction's roads or one kind of work. */
export const marketEdge = (
  item: ItemDef | undefined,
  quest: QuestDef,
): number => {
  const edge = item?.edge
  if (!edge) return 0
  const matches =
    (edge.faction !== undefined && edge.faction === quest.faction) ||
    (edge.tag !== undefined && (quest.tags ?? []).includes(edge.tag))
  return matches ? edge.amount : 0
}

/**
 * Success chance from how far a party meets each need (t-041). Meeting every
 * need exactly is a 75% call; it takes half again on every need to reach the
 * 95% ceiling. (It was 90% at bare need and 95% at a quarter over, so the
 * best party was always a safe call.)
 */
export const CHANCE_AT_NEED = 75
const chanceFrom = (ratios: number[]): number => {
  if (!ratios.length) return 95
  const met =
    ratios.reduce((sum, ratio) => sum + Math.min(1, ratio), 0) / ratios.length
  const over =
    ratios.reduce(
      (sum, ratio) => sum + Math.max(0, Math.min(1.5, ratio) - 1),
      0,
    ) / ratios.length
  return clamp(Math.round(5 + (CHANCE_AT_NEED - 5) * met + 40 * over), 5, 95)
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

// --- quest aid (t-040) --------------------------------------------------------

/**
 * Every source of help a quest has today: answers that promised it
 * (`effects.questAid`) and the quest's own standing aid whose flags hold.
 */
export const questAidFor = (
  run: FortressRun,
  quest: QuestDef,
): (AidBonus & { resolve?: QuestResultTier; outcome?: string })[] => [
  ...(run.aid?.[quest.id] ?? []),
  ...(quest.aid ?? []).filter((aid) => gateHolds(run.flags, aid)),
]

/** What aid adds to each of the quest's requirements. */
const aidTotals = (run: FortressRun, quest: QuestDef): number[] => {
  const aid = questAidFor(run, quest)
  return quest.requirements.map((req) =>
    aid.reduce(
      (sum, entry) =>
        sum + (!entry.stat || entry.stat === req.stat ? (entry.bonus ?? 0) : 0),
      0,
    ),
  )
}

const TIER_RANK: QuestResultTier[] = [
  'failure',
  'partial',
  'success',
  'triumph',
]

/** The best tier an answer's aid settles the quest at if nobody goes. */
export const aidResolution = (
  run: FortressRun,
  questId: string,
): QuestAid | undefined =>
  [...(run.aid?.[questId] ?? [])]
    .filter((aid) => aid.resolve)
    .sort(
      (a, b) => TIER_RANK.indexOf(b.resolve!) - TIER_RANK.indexOf(a.resolve!),
    )[0]

/**
 * A chore's dawn line (t-041): its authored line and its `outcomeAlts` take
 * turns, starting from a seeded line, so a chore's second trip home never
 * repeats its first. Authored quests read questOutcomeText as before.
 */
const resultText = (
  run: FortressRun,
  questId: string,
  quest: QuestDef,
  tier: QuestReport['tier'],
): string => {
  const base = questOutcomeText(run, quest, tier)
  if (!isTemplateInstance(questId)) return base
  const alts =
    quest.outcomeAlts?.[tier] ??
    (tier === 'triumph' && !quest.outcomes.triumph
      ? quest.outcomeAlts?.success
      : undefined)
  if (!alts?.length) return base
  const lines = [base, ...alts]
  const earlier = run.reports
    .flatMap((report) => report.quests)
    .filter(
      (entry) =>
        entry.questId !== questId &&
        isTemplateInstance(entry.questId) &&
        choreOf(entry.questId) === quest.id,
    ).length
  return lines[(rollFor(run, `text:${quest.id}`) + earlier) % lines.length]!
}

/** The dawn line for a quest result, as this run's flags read it. */
export const questOutcomeText = (
  run: Pick<FortressRun, 'flags'>,
  quest: QuestDef,
  tier: QuestReport['tier'],
): string =>
  variantText(
    run.flags,
    quest.outcomes[tier] ??
      (tier === 'triumph' ? quest.outcomes.success : undefined) ??
      (tier === 'expired' ? 'Nobody went. The chance passed.' : ''),
    quest.outcomeVariants?.[tier] ??
      (tier === 'triumph' ? quest.outcomeVariants?.success : undefined),
  )

const evaluate = (
  run: FortressRun,
  quest: QuestDef,
  members: Member[],
  known: readonly string[] | 'all',
) => {
  const abilities = abilitiesOf(members)
  const juryRig = abilities.some((ability) => ability.kind === 'jury-rig')
  const aid = members.length
    ? aidTotals(run, quest)
    : quest.requirements.map(() => 0)
  const unread = quest.requirements.map((req) =>
    members.reduce(
      (sum, member) =>
        sum + contributionOf(run, member, req.stat, quest, known).unread,
      0,
    ),
  )
  const totals = quest.requirements.map((req, i) => {
    const base = members.reduce(
      (sum, member) => sum + contribution(run, member, req.stat, quest, known),
      0,
    )
    if (req.stat !== 'might') return base + (aid[i] ?? 0)
    // Under the Wall: Keel's Wits count toward Might requirements too.
    const undermine = members
      .filter(({ def }) => def.ability.kind === 'undermine')
      .reduce((sum, { def }) => sum + def.stats.wits, 0)
    return base + undermine + (aid[i] ?? 0)
  })
  return { abilities, juryRig, totals, aid, unread }
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
  const { abilities, juryRig, totals, aid, unread } = evaluate(
    run,
    quest,
    members,
    known,
  )
  const scouted =
    abilities.some((ability) => ability.kind === 'scout') ||
    run.flags.includes(`scouted:${questId}`) ||
    run.local.lamplight >= LAMPLIGHT_SIGHT
  const hiddenIndexes = quest.requirements
    .map((req, i) => (req.hidden && !scouted ? i : -1))
    .filter((i) => i >= 0)
  const needs = quest.requirements.map((req) =>
    bandNeed(req.band, run.day, lethalScaled(quest)),
  )
  // Unread traits shift a need's total by up to their size, either way.
  const chanceWith = (override?: Band, shift = 0) =>
    chanceFrom(
      partyRatios(
        totals.map((total, i) => Math.max(0, total + shift * (unread[i] ?? 0))),
        needs.map((need, i) =>
          override && hiddenIndexes.includes(i)
            ? bandNeed(override, run.day, lethalScaled(quest))
            : need,
        ),
        juryRig,
      ),
    )
  const unreadTraits = members.filter(({ def }) =>
    def.traits.some(
      (trait) => traitApplies(trait, quest) && !traitKnown(run, trait, known),
    ),
  ).length
  const estimate =
    members.length > 0 && (hiddenIndexes.length > 0 || unreadTraits > 0)
  const low = members.length
    ? estimate
      ? chanceWith(hiddenIndexes.length ? 'extreme' : undefined, -1)
      : chanceWith()
    : 0
  const high = members.length
    ? estimate
      ? chanceWith(hiddenIndexes.length ? 'low' : undefined, 1)
      : chanceWith()
    : 0
  const guardian = abilityTotal(abilities, 'guardian')
  const lucky = hasAbility(abilities, 'lucky')
  const luck = lucky ? luckyChance : (c: number) => c
  const baseChance = estimate ? Math.round((low + high) / 2) : low
  // Wounds and deaths are shown at the bottom of the range: the worst the
  // court cannot yet rule out (t-041).
  const risk = members.length
    ? injuryRisk(quest, low, {
        lucky,
        encore: hasAbility(abilities, 'encore'),
        omen: hasAbility(abilities, 'omen'),
        warden: hasAbility(abilities, 'warden'),
        guardian,
        surgery: abilityTotal(abilities, 'field-surgery'),
        size: members.length,
      })
    : { injuryRisk: 0, deathChance: 0, injuryDays: [0, 0] as [number, number] }
  return {
    ...risk,
    chance: luck(baseChance),
    estimate,
    ...(unreadTraits ? { unread: unreadTraits } : {}),
    low: luck(low),
    high: luck(high),
    perRequirement: quest.requirements.map((req, i) => ({
      stat: req.stat,
      band: req.band,
      hidden: hiddenIndexes.includes(i),
      total: totals[i] ?? 0,
      needed: hiddenIndexes.includes(i) ? 0 : (needs[i] ?? 0),
      aid: aid[i] ?? 0,
    })),
    aid: questAidFor(run, quest)
      .filter(
        (entry) =>
          (entry.bonus ?? 0) !== 0 &&
          quest.requirements.some(
            (req) => !entry.stat || entry.stat === req.stat,
          ),
      )
      .map(({ label, bonus, stat }) => ({
        label,
        bonus,
        ...(stat ? { stat } : {}),
      })),
    ...(aidResolution(run, questId)
      ? { resolvesAs: aidResolution(run, questId)!.resolve }
      : {}),
    durationDays: questDuration(quest, members, hourglass),
    injuryChance: clamp(INJURY_CHANCE[quest.danger].failure - guardian, 0, 100),
  }
}

type RiskParty = {
  lucky: boolean
  encore: boolean
  omen: boolean
  warden: boolean
  guardian: number
  surgery: number
  size: number
}

/** Chance of each result tier for a success chance, as resolveQuest rolls it. */
export const tierOdds = (
  chance: number,
  party: Pick<RiskParty, 'lucky' | 'encore' | 'omen'>,
): Record<QuestResultTier, number> => {
  // P(roll < x) for a 0-99 roll; Cave-Luck keeps the lower of two rolls.
  const below = (x: number) => {
    const p = clamp(x, 0, 100) / 100
    return party.lucky ? 1 - (1 - p) ** 2 : p
  }
  const triumph = below(Math.floor(chance * (party.encore ? 0.6 : 0.3)))
  const success = below(chance)
  const partial = below(chance + Math.floor((100 - chance) * 0.4))
  const failure = 1 - partial
  return {
    triumph,
    success: success - triumph,
    partial: partial - success + (party.omen ? failure : 0),
    failure: party.omen ? 0 : failure,
  }
}

/**
 * Honest injury and death odds for a party, from the same tables resolveQuest
 * uses: the chance each follower comes home wounded, the wound length, and the
 * chance someone does not come home at all.
 */
export const injuryRisk = (
  quest: QuestDef,
  chance: number,
  party: RiskParty,
): Pick<OddsPreview, 'injuryRisk' | 'deathChance' | 'injuryDays'> => {
  const tiers = tierOdds(chance, party)
  const odds = (tier: QuestResultTier) =>
    clamp(INJURY_CHANCE[quest.danger][tier] - party.guardian, 0, 100) / 100
  const wounded = (Object.keys(tiers) as QuestResultTier[]).reduce(
    (sum, tier) => sum + tiers[tier] * odds(tier),
    0,
  )
  const [lowDays, highDays] = INJURY_DAYS[quest.danger]
  const span = highDays - lowDays + 1
  let deep = 0
  let lasting = 0
  for (let roll = 0; roll < 100; roll += 1) {
    const raw = lowDays + (roll % span)
    if (raw >= 5) deep += 1
    // Field Surgery can close a short wound before the party is home.
    if (raw - party.surgery > 0) lasting += 1
  }
  const someoneDies = (tier: QuestResultTier) => {
    const blow = odds(tier) * (deep / 100) * ((LETHAL_BLOW[tier] ?? 0) / 100)
    return tiers[tier] * (1 - (1 - blow) ** party.size)
  }
  const death =
    quest.lethal && !party.warden
      ? someoneDies('failure') + someoneDies('partial')
      : 0
  return {
    injuryRisk: Math.round(wounded * lasting),
    deathChance: Math.round(100 * death),
    injuryDays: [
      Math.max(0, lowDays - party.surgery),
      Math.max(0, highDays - party.surgery),
    ],
  }
}

// --- quest room -------------------------------------------------------------

export const canUseHourglass = (run: FortressRun): boolean =>
  run.equippedRelics.includes(HOURGLASS) &&
  run.relicUses[HOURGLASS] !== actOf(run.day)

/** Many Hands: Lumen never takes a party place. */
export const partyLimit = (quest: QuestDef, party: string[]): number =>
  quest.party.max +
  (party.some((id) => followerDef(id)?.ability.kind === 'many-hands') ? 1 : 0)

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
  if (party.length < quest.party.min || party.length > partyLimit(quest, party))
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

// Buying, selling and treatments live in market.ts (t-024).

/** Equip an owned item (or clear a slot with null). */
export const equipItem = (
  run: FortressRun,
  followerId: string,
  slot: 'tool' | 'charm',
  itemId: string | null,
): FortressRun => {
  const status = followerStatus(run, followerId)
  if (status === 'on-quest') throw new Error('that follower is away')
  if (goneFromCourt(status)) throw new Error('that follower is not at court')
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
      quest.requirements.map((req) =>
        bandNeed(req.band, active.departedDay, lethalScaled(quest)),
      ),
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
      deaths.length === 0 &&
      raw >= 5 &&
      rollFor(run, `death:${key}:${def.id}`) < (LETHAL_BLOW[tier] ?? 0)
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
  markResult(run, active.questId, tier)
  return {
    questId: active.questId,
    tier,
    party: [...active.party],
    // The chance as the preview showed it: Cave-Luck's second roll included.
    chance: hasAbility(abilities, 'lucky') ? luckyChance(chance) : chance,
    roll,
    injuries,
    deaths,
    revealedTraits,
    effects,
    text: resultText(run, active.questId, quest, tier),
  }
}

/**
 * Every authored quest leaves `quest:<id>:<tier>` when it comes home or
 * expires (t-040), so later scenes and dues can read how it went; its
 * promised aid is spent.
 */
const markResult = (
  run: FortressRun,
  questId: string,
  tier: QuestReport['tier'],
): void => {
  if (!isTemplateInstance(questId)) {
    const flag = `quest:${questId}:${tier}`
    if (!run.flags.includes(flag)) run.flags.push(flag)
  }
  if (run.aid?.[questId]) {
    const rest = Object.fromEntries(
      Object.entries(run.aid).filter(([id]) => id !== questId),
    )
    if (Object.keys(rest).length) run.aid = rest
    else delete run.aid
  }
}

/** A quest leaving the board with nobody sent: expired, or settled by aid. */
const expireQuest = (
  run: FortressRun,
  questId: string,
  events: string[],
): QuestReport | null => {
  const quest = questDef(questId)
  if (!quest) return null
  const aid = aidResolution(run, questId)
  const tier: QuestReport['tier'] = aid?.resolve ?? 'expired'
  const effects: Effects = JSON.parse(
    JSON.stringify(
      tier === 'expired'
        ? quest.expired
        : tier === 'triumph'
          ? (quest.rewards.triumph ?? quest.rewards.success)
          : (quest.rewards[tier] ?? {}),
    ),
  ) as Effects
  applyEffects(run, effects, events)
  const text = aid?.outcome ?? resultText(run, questId, quest, tier)
  markResult(run, questId, tier)
  return {
    questId,
    tier,
    party: [],
    chance: 0,
    roll: 0,
    injuries: [],
    deaths: [],
    revealedTraits: [],
    effects,
    text,
    ...(aid ? { aided: true } : {}),
  }
}

const HIDEOUTS: [KingdomFactionId, string][] = Object.entries(HIDEOUT_HOST).map(
  ([hideout, faction]) => [faction, hideout],
)

/**
 * Pledges: story flags where the crown took a faction's side on purpose.
 * Chores raise affinity for whoever lives nearest; pledges are the coalition
 * the player chose, so they weigh heavily in where the court hides.
 */
export const PLEDGES: Partial<Record<KingdomFactionId, readonly string[]>> = {
  moles: [
    'sheltered-moles',
    'mole-truce',
    'mole-talks-opened',
    'route-tunnel',
    'prisoner-pardoned',
    'congress-reseated',
  ],
  'storm-crows': [
    'crow-parcel-delivered',
    'rain-covenant',
    'covenant-paid-in-runners',
    'crow-debt-paid',
    // The tower kept its margin and paid in land (t-036).
    'd20-pastures-ceded',
  ],
  'hollow-bell': [
    'bell-voted-yes',
    'bell-under-protection',
    'mara-protected',
    'abbess-shamed',
    // Paid to open the wells to the Bell's road (t-036).
    'wells-shared',
  ],
  jackalwire: [
    'pack-alliance',
    'pack-truce',
    'pack-engine-fixed',
    'pack-hired-ford',
    'route-trestle',
  ],
  saltroad: ['sheltered-saltroad', 'promised-waystation'],
  freeholds: ['sheltered-freeholds', 'promised-thistledown', 'wells-closed'],
  rustline: [
    'rustline-crate-bought',
    'blue-lantern-route',
    'rustline-barricades',
    'rustline-market',
  ],
}
const PLEDGE_WEIGHT = 20

/** How strongly the crown has bound itself to a host: affinity plus pledges. */
export const hostScore = (run: FortressRun, faction: KingdomFactionId) =>
  run.affinity[faction] +
  PLEDGE_WEIGHT *
    (PLEDGES[faction] ?? []).filter((flag) => run.flags.includes(flag)).length

/** Act V hideout: the most bound Friendly-or-better ally, else the cave. */
export const selectHideout = (run: FortressRun): string => {
  const candidates = HIDEOUTS.filter(
    ([faction]) =>
      !run.wipedOut.includes(faction) &&
      run.revealedFactions.includes(faction) &&
      tierRank(affinityTier(run.affinity[faction])) >= tierRank('friendly'),
  ).sort(
    ([a], [b]) =>
      hostScore(run, b) - hostScore(run, a) ||
      run.strength[b] - run.strength[a],
  )
  return candidates[0]?.[1] ?? 'nameless-cave'
}

/** One possible host on the last night, as the map room names it (t-038). */
export type HideoutCandidate = {
  hideout: string
  host: KingdomFactionId
  tier: AffinityTier
  pledges: number
}

/**
 * Where the court would run if the tower fell tonight, best first: the same
 * ranking as selectHideout, so the map room's hint never lies. Empty means
 * the nameless cave.
 */
export const hideoutForecast = (run: FortressRun): HideoutCandidate[] =>
  HIDEOUTS.filter(
    ([faction]) =>
      !run.wipedOut.includes(faction) &&
      run.revealedFactions.includes(faction) &&
      tierRank(affinityTier(run.affinity[faction])) >= tierRank('friendly'),
  )
    .sort(
      ([a], [b]) =>
        hostScore(run, b) - hostScore(run, a) ||
        run.strength[b] - run.strength[a],
    )
    .map(([host, hideout]) => ({
      hideout,
      host,
      tier: affinityTier(run.affinity[host]),
      pledges: (PLEDGES[host] ?? []).filter((flag) => run.flags.includes(flag))
        .length,
    }))

// --- the map: territories, taxes, act-end events ---------------------------
//
// The map only changes at act-end dawns (Days 11, 21, 31, 41), and a wipe-out
// or a raid only happens if the map room warned of it at the act end before.
// Every warning names what would stop it, and is only given when it can
// actually come true.

export const factionName = (id: KingdomFactionId): string =>
  KINGDOM_FACTION_DEFS.find((def) => def.id === id)?.name ?? id

export const regionName = (id: string): string =>
  REGIONS.find((region) => region.id === id)?.name ?? id

/** Who holds a region now: its first controller unless it was taken. */
export const regionHolder = (
  run: FortressRun,
  regionId: string,
): KingdomFactionId | undefined =>
  run.controllers?.[regionId] ??
  REGIONS.find((region) => region.id === regionId)?.controller

/** The next act-end dawn after `day`, if the campaign has one. */
export const nextActEnd = (day: number): number | undefined =>
  ACT_END_DAWNS.find((dawn) => dawn > day)

let fallible: Set<KingdomFactionId> | undefined
/** Factions some quest or answer in the campaign can weaken. */
const canWeaken = (faction: KingdomFactionId): boolean => {
  if (!fallible) {
    const set = new Set<KingdomFactionId>()
    const scan = (effects?: Effects) => {
      for (const [id, delta] of Object.entries(effects?.strength ?? {}))
        if ((delta ?? 0) < 0) set.add(id as KingdomFactionId)
    }
    const quests = new Set<string>()
    for (const day of Array.from({ length: LAST_DAY }, (_, i) => i + 1)) {
      const def = dayDef(day)
      for (const id of def?.quests ?? []) quests.add(id)
      for (const audience of def?.audiences ?? [])
        for (const option of [
          ...audience.options,
          ...(audience.beats ?? []).flatMap((beat) => beat.options),
        ]) {
          scan(option.effects)
          for (const id of option.postsQuests ?? []) quests.add(id)
        }
    }
    for (const quest of [
      ...[...quests].map((id) => questDef(id)),
      ...QUEST_TEMPLATES,
    ]) {
      if (!quest) continue
      for (const effects of Object.values(quest.rewards)) scan(effects)
      scan(quest.expired)
    }
    fallible = set
  }
  return fallible.has(faction)
}

const onMap = (run: FortressRun, faction: KingdomFactionId): boolean =>
  run.revealedFactions.includes(faction) && !run.wipedOut.includes(faction)

/** The land a stronger rival would take from `weak`: its own back, or the weak side's home. */
const raidTarget = (
  run: FortressRun,
  strong: KingdomFactionId,
  weak: KingdomFactionId,
): string | undefined => {
  const held = REGIONS.filter((region) => regionHolder(run, region.id) === weak)
  return (
    held.find((region) => region.controller === strong) ??
    held.find((region) => region.controller === weak) ??
    held[0]
  )?.id
}

/**
 * The warnings for the act end due at `dueDay`, as the map stands now:
 * factions at or below peril strength that can still fall, and rivals at
 * least RAID_GAP stronger than a neighbour that holds land.
 */
export const threatsFor = (run: FortressRun, dueDay: number): MapThreat[] => {
  const threats: MapThreat[] = []
  for (const faction of KINGDOM_FACTIONS) {
    if (!onMap(run, faction) || run.strength[faction] > PERIL_STRENGTH) continue
    if (run.strength[faction] > 0 && !canWeaken(faction)) continue
    threats.push({ kind: 'wipe', faction, issuedDay: run.day, dueDay })
  }
  for (const [a, b] of RIVALRIES) {
    if (!onMap(run, a) || !onMap(run, b)) continue
    const [strong, weak] = run.strength[a] >= run.strength[b] ? [a, b] : [b, a]
    if (run.strength[strong] - run.strength[weak] < RAID_GAP) continue
    const region = raidTarget(run, strong, weak)
    if (!region) continue
    threats.push({
      kind: 'raid',
      faction: weak,
      by: strong,
      region,
      issuedDay: run.day,
      dueDay,
    })
  }
  return threats
}

/** Resolves the warnings due today; returns what happened to each. */
const resolveThreats = (run: FortressRun): MapEvent[] => {
  const due = (run.mapWatch ?? []).filter((t) => t.dueDay === run.day)
  const happened: MapEvent[] = []
  for (const threat of due.filter((t) => t.kind === 'wipe')) {
    if (!onMap(run, threat.faction)) continue
    const fell = run.strength[threat.faction] <= 0
    if (fell) {
      run.wipedOut.push(threat.faction)
      // Its notices come down with its banner.
      run.board = run.board.filter(
        (entry) => questDef(entry.questId)?.faction !== threat.faction,
      )
    }
    happened.push({
      day: run.day,
      kind: fell ? 'wiped' : 'held',
      faction: threat.faction,
    })
  }
  for (const threat of due.filter((t) => t.kind === 'raid')) {
    const { faction, by, region } = threat
    if (!by || !region || !onMap(run, faction)) continue
    const taken =
      onMap(run, by) &&
      regionHolder(run, region) === faction &&
      run.strength[by] - run.strength[faction] >= RAID_GAP
    if (taken) run.controllers = { ...run.controllers, [region]: by }
    happened.push({
      day: run.day,
      kind: taken ? 'taken' : 'held',
      faction,
      by,
      region,
    })
  }
  return happened
}

const actEnd = (run: FortressRun): MapEvent[] => {
  const map: MapEvent[] = []
  for (const def of KINGDOM_FACTION_DEFS) {
    if (
      def.revealedOnDay <= run.day &&
      !run.revealedFactions.includes(def.id)
    ) {
      run.revealedFactions.push(def.id)
      map.push({ day: run.day, kind: 'revealed', faction: def.id })
    }
  }
  if ((ACT_END_DAWNS as readonly number[]).includes(run.day)) {
    map.push(...resolveThreats(run))
    const due = nextActEnd(run.day)
    run.mapWatch = due ? threatsFor(run, due) : []
    for (const threat of run.mapWatch)
      map.push({
        day: run.day,
        kind: threat.kind === 'wipe' ? 'warned-wipe' : 'warned-raid',
        faction: threat.faction,
        ...(threat.by ? { by: threat.by } : {}),
        ...(threat.region ? { region: threat.region } : {}),
      })
  }
  if (map.length) run.mapLog = [...(run.mapLog ?? []), ...map]
  return map
}

/**
 * The Day 41 dawn: Young Komodo sells the tower (betrayal.ts). The hideout
 * is chosen after the act-end map, then the buyer and who goes with him.
 */
const betray = (
  run: FortressRun,
  events: string[],
): DawnReport['betrayal'] | undefined => {
  if (run.day !== BETRAYAL_DAY || run.flags.includes('komodo-betrayal'))
    return undefined
  run.flags.push('komodo-betrayal')
  run.hideout = selectHideout(run)
  // Act V content gates on the host: `hideout:mole-tunnels` and so on.
  run.flags.push(`hideout:${run.hideout}`)
  events.push('Young Komodo has betrayed the throne. The court flees.')
  return { ...applyBetrayal(run, events), hideout: run.hideout }
}

/** What one region pays the throne each dawn, and why. */
export const regionTax = (
  run: FortressRun,
  regionId: string,
): { holder?: KingdomFactionId; tier?: AffinityTier; paid: number } => {
  const region = REGIONS.find((entry) => entry.id === regionId)
  const holder = regionHolder(run, regionId)
  if (!region || !holder || !onMap(run, holder)) return { holder, paid: 0 }
  const tier = affinityTier(run.affinity[holder])
  return { holder, tier, paid: taxAtTier(region.tax, tier) }
}

/** The regions' taxes, plus or minus the laws on the gate (laws.ts). */
export const dailyTaxes = (run: FortressRun): number =>
  Math.max(
    0,
    REGIONS.reduce((sum, region) => sum + regionTax(run, region.id).paid, 0) +
      lawTaxes(run),
  )

/** Brass in at dawn: the regions' taxes, or in hiding the host's share. */
export const dailyIncome = (run: FortressRun): number =>
  run.hideout ? (hostShare(run)?.paid ?? 0) : dailyTaxes(run)

/** Brass out at dawn: wages for every bed, halved in hiding. */
export const dailyWages = (run: FortressRun): number =>
  (run.hideout ? HIDEOUT_WAGE : WAGE) * bedsUsed(run)

/** Factions whose names read as a crowd ("the Freeholds are"), not a body. */
const PLURAL_NAMES: readonly KingdomFactionId[] = [
  'freeholds',
  'mire-mothers',
  'saltroad',
  'moles',
]
const verb = (faction: KingdomFactionId, many: string, one: string) =>
  PLURAL_NAMES.includes(faction) ? many : one

/** The stark line the map room, the dawn and the history show for an event. */
export const mapEventText = (
  event: MapEvent,
): { title: string; text: string } => {
  const f = event.faction
  const name = factionName(f)
  const by = event.by ? factionName(event.by) : ''
  const raider = event.by ?? f
  const land = event.region ? regionName(event.region) : ''
  const map = `the Day ${event.day + 9} map`
  switch (event.kind) {
    case 'revealed':
      return {
        title: 'A new banner',
        text:
          REVEAL_LINES[f] ??
          `The fog lifted in the night. ${name} ${verb(f, 'hang their', 'hangs its')} banner in the map room.`,
      }
    case 'wiped':
      return {
        title: `${name} ${verb(f, 'are', 'is')} gone`,
        text: `The banner came down in the night. Nobody pays the throne for that land now. The survivors are already on the roads, carrying what they could.`,
      }
    case 'taken':
      return {
        title: `${land} changes hands`,
        text: `${by} took ${land} from ${name}. The new banner went up before the old one hit the dirt. What the land pays now depends on how ${by} ${verb(raider, 'stand', 'stands')} with the throne.`,
      }
    case 'held':
      return event.region
        ? {
            title: `${name} ${verb(f, 'hold', 'holds')} ${land}`,
            text: `${by} came to the line and found it manned. ${land} stays with ${name}. Nobody thanks the crown out loud.`,
          }
        : {
            title: `${name} ${verb(f, 'hold', 'holds')}`,
            text: `Thin, hungry and still standing. The banner stays up. The map room crosses out a line it had already written.`,
          }
    case 'warned-wipe':
      return {
        title: `${name} ${verb(f, 'are', 'is')} failing`,
        text: `Down to the last of ${verb(f, 'their', 'its')} strength. If none is left at ${map}, the banner comes down for good.`,
      }
    case 'warned-raid':
      return {
        title: `${by} ${verb(raider, 'eye', 'eyes')} ${land}`,
        text: `${by} ${verb(raider, 'are', 'is')} massing on ${land}. If the gap to ${name} is still ${RAID_GAP} or more at ${map}, the land changes hands.`,
      }
  }
}

const REVEAL_LINES: Partial<Record<KingdomFactionId, string>> = {
  rustline:
    'The fog burned off the eastern rail yards overnight. Magpies and rats were already down there, picking the bones of the old trains. The Rustline hangs its banner in the map room. It was there all along.',
  'black-verge':
    'A rider came in from the far border with no saddle and no voice. Behind him the map has a new edge. The Black Verge Court hangs its banner, and the gorillas who hold it do not ask leave.',
}

/** A live warning for the map room and the briefing: what is coming and what stops it. */
export type MapWarning = MapThreat & {
  title: string
  text: string
  /** What would stop it, in the faction's current numbers. */
  remedy: string
  daysLeft: number
}

export const mapWarnings = (run: FortressRun): MapWarning[] =>
  (run.mapWatch ?? [])
    .filter((threat) => threat.dueDay > run.day && onMap(run, threat.faction))
    .map((threat) => {
      const event: MapEvent = {
        day: threat.dueDay - 10,
        kind: threat.kind === 'wipe' ? 'warned-wipe' : 'warned-raid',
        faction: threat.faction,
        ...(threat.by ? { by: threat.by } : {}),
        ...(threat.region ? { region: threat.region } : {}),
      }
      const own = run.strength[threat.faction]
      const name = factionName(threat.faction)
      let remedy: string
      if (threat.kind === 'wipe') {
        remedy =
          own > 0
            ? `Strength ${own} of 10. They fall only if it reaches 0. Keep their quests from failing.`
            : `Strength 0 of 10. One point saves them: win a quest for ${name} or take their side at court.`
      } else {
        const rival = threat.by ? run.strength[threat.by] : 0
        const by = threat.by ? factionName(threat.by) : ''
        remedy =
          rival - own >= RAID_GAP
            ? `${by} ${rival}, ${name} ${own}. Close the gap to ${RAID_GAP - 1} or less: strengthen ${name} or weaken ${by}.`
            : `${by} ${rival}, ${name} ${own}. The gap is closed for now. Keep it that way.`
      }
      return {
        ...threat,
        ...mapEventText(event),
        remedy,
        daysLeft: threat.dueDay - run.day,
      }
    })

const COUNTS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven']
const DAYS_WORD = [...COUNTS, 'Eight', 'Nine', 'Ten']

/** The briefing's word from the map room: the warning with least time left. */
export const briefingMapLine = (
  run: FortressRun,
): { source: string; text: string } | undefined => {
  const warnings = mapWarnings(run)
  const first = [...warnings].sort((a, b) => a.daysLeft - b.daysLeft)[0]
  if (!first) return undefined
  const left = first.daysLeft
  const when =
    left <= 1
      ? `Tonight the map is redrawn.`
      : `${DAYS_WORD[left] ?? left} days to the Day ${first.dueDay - 1} map.`
  const more =
    warnings.length > 1
      ? ` ${COUNTS[warnings.length - 1] ?? warnings.length - 1} more warning${warnings.length > 2 ? 's' : ''} on the table.`
      : ''
  return { source: 'The map room', text: `${first.title}. ${when}${more}` }
}

const MAP_EVENT_KINDS: readonly string[] = [
  'revealed',
  'wiped',
  'taken',
  'held',
  'warned-wipe',
  'warned-raid',
]

/** Save validation for the map fields (saves.ts): ids known, sizes bounded. */
export const validMapState = (run: Record<string, unknown>): boolean => {
  const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)
  const faction = (value: unknown) =>
    (KINGDOM_FACTIONS as readonly unknown[]).includes(value)
  const region = (value: unknown) => REGIONS.some((entry) => entry.id === value)
  const day = (value: unknown) =>
    Number.isSafeInteger(value) &&
    (value as number) >= 1 &&
    (value as number) <= LAST_DAY + 1
  const optional = (value: unknown, check: (v: unknown) => boolean) =>
    value === undefined || check(value)
  const event = (value: unknown) =>
    isObject(value) &&
    day(value.day) &&
    MAP_EVENT_KINDS.includes(value.kind as string) &&
    faction(value.faction) &&
    optional(value.by, faction) &&
    optional(value.region, region)
  const threat = (value: unknown) =>
    isObject(value) &&
    (value.kind === 'wipe' || value.kind === 'raid') &&
    faction(value.faction) &&
    optional(value.by, faction) &&
    optional(value.region, region) &&
    day(value.issuedDay) &&
    day(value.dueDay)
  const list = (value: unknown, max: number, check: (v: unknown) => boolean) =>
    value === undefined ||
    (Array.isArray(value) && value.length <= max && value.every(check))
  return (
    (run.controllers === undefined ||
      (isObject(run.controllers) &&
        Object.entries(run.controllers).every(
          ([id, holder]) => region(id) && faction(holder),
        ))) &&
    list(run.mapWatch, 40, threat) &&
    list(run.mapLog, 200, event) &&
    (!Array.isArray(run.reports) ||
      run.reports.every(
        (report: unknown) => !isObject(report) || list(report.map, 40, event),
      ))
  )
}

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
  if (run.day === 1 && run.flags.includes(COURT_ONBOARDING_FLAG)) {
    const appointments = (run.dayAudiences ?? []).filter((id) =>
      COURT_RECRUITMENT_IDS.includes(id),
    )
    if (
      appointments.length !== 3 ||
      appointments.some((id) => !run.audiencesHeard.includes(id))
    )
      throw new Error(
        'Hear all three recruiting petitions before ending your first day',
      )
  }
  const next = cloneRun(run)
  const events: string[] = []
  // Hot Meals First: the wounded resting at home tonight heal a day sooner.
  const cook = homeAbility(run, 'quartermaster')
  if (cook) {
    const resting = next.roster.filter(
      (state) => !state.dead && (state.injuredUntilDay ?? 0) > run.day,
    )
    for (const state of resting)
      state.injuredUntilDay = (state.injuredUntilDay ?? 1) - 1
    if (resting.length)
      events.push(
        `${cook.name}’s kitchen fed ${resting.length} wounded, and they will heal a day sooner.`,
      )
  }
  // Stalling Letters: one quest expiring tonight gets one more day, once.
  const forger = homeAbility(run, 'stall')
  if (forger) {
    const expiring = next.board.filter((entry) => {
      const def = questDef(entry.questId)
      return (
        entry.lastDay === run.day &&
        !!def &&
        entry.lastDay - entry.postedDay + 1 <= def.boardDays
      )
    })
    const stalled =
      expiring.find((entry) => !isTemplateInstance(entry.questId)) ??
      expiring[0]
    if (stalled) {
      stalled.lastDay += 1
      events.push(
        `${forger.name}’s letter bought “${questDef(stalled.questId)?.title}” one more day.`,
      )
    }
  }
  if (next.dailyEvent) {
    const unheard = chanceEvent(next.dailyEvent)
    if (unheard)
      events.push(`${unheard.title}: the opportunity passed without an answer.`)
    delete next.dailyEvent
  }
  next.day += 1
  next.audiencesHeard = []
  // A scene left half-way closes with the day; nothing it chose is undone.
  delete next.audienceBeats
  if (next.talkOpen) {
    // So does a talk, which then counts as heard: its answers already stand.
    next.talksHeard = [...(next.talksHeard ?? []), next.talkOpen.id]
    next.flags.push(`heard:${next.talkOpen.id}`)
    delete next.talkOpen
  }
  const quests: QuestReport[] = []
  const knownNow = [...known]
  for (const active of next.active.filter(
    (item) => item.returnsDay <= next.day,
  )) {
    const before = [...next.flags]
    const report = resolveQuest(next, active, knownNow, events)
    // A quest that uncovers someone's true allegiance reveals it here too.
    report.revealedTraits.push(
      ...allegiancesUnlocked(before, next.flags).filter(
        (id) => !knownNow.includes(id) && !report.revealedTraits.includes(id),
      ),
    )
    knownNow.push(...report.revealedTraits)
    quests.push(report)
  }
  next.active = next.active.filter((item) => item.returnsDay > next.day)
  for (const entry of next.board.filter((item) => item.lastDay < next.day)) {
    const report = expireQuest(next, entry.questId, events)
    if (report) quests.push(report)
  }
  next.board = next.board.filter((item) => item.lastDay >= next.day)
  // From the Day 41 dawn the court is in hiding: the tower falls before the
  // purse is counted, and the host pays instead of the regions.
  const hiding = next.day >= BETRAYAL_DAY
  const lateMap = hiding ? actEnd(next) : []
  const betrayal = hiding ? betray(next, events) : undefined
  const taxes = dailyIncome(next)
  const wages = dailyWages(next)
  next.brass += taxes - wages
  settleDues(next, events)
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
  const map = hiding ? lateMap : actEnd(next)
  const report: DawnReport = {
    day: next.day,
    quests,
    taxes,
    wages,
    loanTaken,
    events,
    ...(map.length ? { map } : {}),
    ...(next.hideout ? { income: 'host' as const } : {}),
    ...(betrayal ? { betrayal } : {}),
  }
  // The dawn's report is filed before the board is posted, so a quest that
  // came home tonight counts as posted (t-041: chores at most twice a run).
  next.reports = [...next.reports, report]
  postDawnQuests(next)
  return { run: next, report }
}

/** Re-post today's seeded template quests after a rewind bumps the branch. */
export const rerollDawn = (run: FortressRun): FortressRun => {
  const next = cloneRun(run)
  next.board = next.board.filter(
    (entry) =>
      !(isTemplateInstance(entry.questId) && entry.postedDay === next.day),
  )
  // Rewinding before a morning decision also rewinds the encounter draw.
  next.chanceHistory = (next.chanceHistory ?? []).filter(
    (id) => id !== next.dailyEvent && id !== next.dailyEventOutcome?.id,
  )
  drawTemplates(next)
  drawChanceEvent(next)
  return next
}
