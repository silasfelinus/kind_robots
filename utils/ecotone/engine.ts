import {
  ARCHETYPES,
  COMPANIONS,
  ENCOUNTERS,
  LENSES,
  type Check,
  type CompanionId,
  type Effects,
  type EncounterCard,
  type EndingLine,
  type EventId,
  type Fate,
  type LeadId,
  type LensId,
  type Outcome,
  type SkillId,
  type Skills,
} from './content'
import { outcomeArtKey, type OutcomeResult } from './artSlots'
import {
  BEATS,
  EVENTS,
  EVENT_CHOICE,
  FORK_SIZE,
  ROUTES,
  type RouteStep,
} from './story'
import type { GatedEncounter } from './questExpansion'
import { FUTURES, SIGNATURES, LENS_CODAS } from './story'
import {
  NEW_SIGNATURES,
  FUTURE_BOOKENDS,
  NEW_LENS_CODAS,
} from './finaleExpansion'
import { applyCardEdit, type CardEdit } from '../playbook/edits'

Object.assign(SIGNATURES, NEW_SIGNATURES)
Object.assign(LENS_CODAS, NEW_LENS_CODAS)
for (const lead of Object.keys(FUTURE_BOOKENDS) as EndingLine[]) {
  for (const fate of ['hope', 'dark'] as Fate[]) {
    const [first, last] = FUTURE_BOOKENDS[lead][fate]
    const paragraphs = FUTURES[lead][fate]
    if (paragraphs[0] !== first) paragraphs.unshift(first)
    if (paragraphs[paragraphs.length - 1] !== last) paragraphs.push(last)
  }
}

export const ECOTONE_SAVE_VERSION = 4
export const MAX_METER = 8

export type Phase = 'event' | 'beat' | 'fork' | 'crossroads' | 'end'

export type Roll = {
  dice: [number, number]
  bonus: number
  parts: { label: string; value: number }[]
  total: number
  target: number
  success: boolean
  natural: 'snake-eyes' | 'boxcars' | null
}

export type LogEntry = {
  step: number
  day: number
  source: string
  title: string
  choice: string
  roll: Roll | null
  text: string
  effects: Effects
  /** The outcome's picture (artSlots.ts), for a story choice. */
  art?: string
}

export type FollowEntry = {
  day: number
  from: CompanionId | null
  to: CompanionId | null
  choice: string
}

export type RunState = {
  version: number
  seed: number
  archetype: string
  skills: Skills
  phase: Phase
  rolls: number
  event: EventId | null
  /** Index into ROUTES[event]. */
  step: number
  day: number
  /** The companion the opening area led you toward, met or not. */
  prospect: CompanionId | null
  openingState: LensId | null
  currentState: LensId | null
  clarity: number
  activeLead: CompanionId | null
  meetingOrder: CompanionId[]
  followHistory: FollowEntry[]
  newcomerOrder: CompanionId[]
  /** The beat or encounter card being played. */
  card: string | null
  /** Face-up white-rabbit cards on offer at a fork. */
  offered: string[]
  played: string[]
  nerve: number
  goodwill: number
  weird: number
  /** Animal-first choices made this run; the Wild Way counts them. */
  wild: number
  evidence: string[]
  flags: string[]
  log: LogEntry[]
  pending: { entry: LogEntry; nextStep: number } | null
  ending: string | null
}

export const ALL_CARDS: EncounterCard[] = [...BEATS, ...ENCOUNTERS]

// Playbook Manager edits an admin marked live (conductor weird-humboldt t-033).
// They rewrite text and may add choices; card ids and authored mechanics stay.
let liveCards: Record<string, EncounterCard> = {}

export function setLiveEdits(edits: Record<string, CardEdit>): void {
  liveCards = {}
  for (const card of ALL_CARDS) {
    const edit = edits[card.id]
    if (edit) liveCards[card.id] = applyCardEdit(card, edit)
  }
}

export function findCard(id: string | null | undefined): EncounterCard | null {
  if (id && liveCards[id]) return liveCards[id]
  return ALL_CARDS.find((card) => card.id === id) ?? null
}

export const LEAD_BONUS: Record<CompanionId, SkillId> = {
  mara: 'wits',
  kit: 'burly',
  juniper: 'psyche',
  cedar: 'lore',
}

function hashSeed(seed: number, salt: number): number {
  let h = (seed ^ 0x9e3779b9) >>> 0
  h = Math.imul(h ^ (salt + 0x7f4a7c15), 0x85ebca6b) >>> 0
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0
  return (h ^ (h >>> 16)) >>> 0
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function rollDice(seed: number, index: number): [number, number] {
  const next = mulberry32(hashSeed(seed, index))
  return [1 + Math.floor(next() * 6), 1 + Math.floor(next() * 6)]
}

export function chanceToSucceed(need: number): number {
  if (need <= 2) return 35 / 36
  if (need > 12) return 1 / 36
  let hits = 0
  for (let a = 1; a <= 6; a += 1)
    for (let b = 1; b <= 6; b += 1) if (a + b >= need) hits += 1
  return Math.min(35, Math.max(1, hits)) / 36
}

export function checkParts(
  state: RunState,
  check: Check,
): { label: string; value: number }[] {
  const skillName = {
    rizz: 'Rizz',
    burly: 'Burly',
    wits: 'Wits',
    lore: 'Local Lore',
    psyche: 'Psyche',
  }[check.skill]
  const parts = [{ label: skillName, value: state.skills[check.skill] ?? 0 }]
  if (state.clarity >= 3 && check.skill === 'wits')
    parts.push({ label: 'Clear head', value: 1 })
  if (state.clarity <= 1 && check.skill === 'psyche')
    parts.push({ label: 'Wide open', value: 1 })
  if (state.clarity <= 1 && check.skill === 'wits')
    parts.push({ label: 'Swimmy', value: -1 })
  if (state.activeLead && LEAD_BONUS[state.activeLead] === check.skill) {
    const lead = COMPANIONS.find((c) => c.id === state.activeLead)
    parts.push({ label: `${lead?.name ?? 'Guide'} helps`, value: 1 })
  }
  if (state.nerve <= 1) parts.push({ label: 'Rattled', value: -1 })
  return parts
}

export function checkBonus(state: RunState, check: Check): number {
  return checkParts(state, check).reduce((sum, part) => sum + part.value, 0)
}

function resolveCheck(state: RunState, check: Check): Roll {
  const dice = rollDice(state.seed, state.rolls)
  const parts = checkParts(state, check)
  const bonus = parts.reduce((sum, part) => sum + part.value, 0)
  const natural =
    dice[0] + dice[1] === 2
      ? 'snake-eyes'
      : dice[0] + dice[1] === 12
        ? 'boxcars'
        : null
  const total = dice[0] + dice[1] + bonus
  const success =
    natural === 'boxcars'
      ? true
      : natural === 'snake-eyes'
        ? false
        : total >= check.target
  return { dice, bonus, parts, total, target: check.target, success, natural }
}

function clamp(value: number): number {
  return Math.max(0, Math.min(MAX_METER, value))
}

function applyEffects(state: RunState, effects: Effects): RunState {
  return {
    ...state,
    nerve: clamp(state.nerve + (effects.nerve ?? 0)),
    goodwill: Math.max(0, state.goodwill + (effects.goodwill ?? 0)),
    weird: clamp(state.weird + (effects.weird ?? 0)),
    evidence:
      effects.evidence && !state.evidence.includes(effects.evidence)
        ? [...state.evidence, effects.evidence]
        : state.evidence,
    flags:
      effects.flag && !state.flags.includes(effects.flag)
        ? [...state.flags, effects.flag]
        : state.flags,
  }
}

export function seededShuffle<T>(items: T[], seed: number): T[] {
  const next = mulberry32(hashSeed(seed, 0x51ed))
  const out = [...items]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1))
    ;[out[i], out[j]] = [out[j] as T, out[i] as T]
  }
  return out
}

function companionName(id: CompanionId | null | undefined): string {
  return COMPANIONS.find((c) => c.id === id)?.name ?? 'your guide'
}

/** Fills {companion} with the companion the beat is about: the prospect, else the lead. */
export function fillText(text: string, state: RunState): string {
  return text.replaceAll(
    '{companion}',
    companionName(state.prospect ?? state.activeLead),
  )
}

export function variantKey(
  card: EncounterCard,
  state: RunState,
): LeadId | null {
  if (card.variantBy === 'prospect') return state.prospect
  if (card.variantBy === 'lead') return state.activeLead ?? 'alone'
  return null
}

export function cardBody(card: EncounterCard, state: RunState): string[] {
  const key = variantKey(card, state)
  return (key ? card.variants?.[key] : undefined) ?? card.body
}

export function cardAsides(card: EncounterCard, state: RunState): string[] {
  const asides: string[] = []
  const presence = card.presence
  if (presence) {
    asides.push(
      state.activeLead === presence.companion
        ? presence.lead
        : state.meetingOrder.includes(presence.companion)
          ? presence.met
          : presence.unmet,
    )
  }
  const lead = state.activeLead
  for (const [flag, lines] of Object.entries(card.flagLines ?? {})) {
    if (!state.flags.includes(flag)) continue
    if (lines.all) asides.push(lines.all)
    const own = lines[lead ?? 'alone']
    if (own) asides.push(own)
  }
  if (!lead) {
    if (card.aloneLine) asides.push(card.aloneLine)
    return asides
  }
  const line = lead !== presence?.companion ? card.leadLines?.[lead] : undefined
  if (line) asides.push(line)
  return asides
}

export function routeFor(state: RunState): RouteStep[] {
  return state.event ? ROUTES[state.event] : []
}

export function currentStep(state: RunState): RouteStep | null {
  return routeFor(state)[state.step] ?? null
}

export function drawFork(state: RunState, index: number): string[] {
  const step = routeFor(state)[index]
  if (!step || step.kind !== 'fork') return []
  const eligible: GatedEncounter[] = ENCOUNTERS
  const open = eligible.filter(
    (card) =>
      !state.played.includes(card.id) &&
      (!card.requiresLead || card.requiresLead === state.activeLead) &&
      (!card.requiresLens || card.requiresLens === state.openingState),
  )
  const decks = step.pools.map((pool, n) => {
    const ids = open.filter((c) => c.chapter === pool).map((c) => c.id)
    return seededShuffle(ids, hashSeed(state.seed, index * 131 + n))
  })
  const picked: string[] = []
  while (picked.length < FORK_SIZE && decks.some((deck) => deck.length)) {
    for (const deck of decks) {
      const next = deck.shift()
      if (next) picked.push(next)
      if (picked.length >= FORK_SIZE) break
    }
  }
  // Interleave distinct geographic pools so a large chapter cannot starve another.
  // Every fork remains a seeded, saveable decision with at least two real cards.
  if (picked.length < 2) {
    const rest = open.map((c) => c.id).filter((id) => !picked.includes(id))
    picked.push(...seededShuffle(rest, hashSeed(state.seed, index * 977)))
  }
  return picked.slice(0, FORK_SIZE)
}

export function crossroadsNewcomer(state: RunState): CompanionId | null {
  return (
    state.newcomerOrder.find((id) => !state.meetingOrder.includes(id)) ?? null
  )
}

export type Ending = {
  id: string
  lead: EndingLine
  lens: LensId
  fate: Fate
  score: number
  target: number
  parts: { label: string; value: number }[]
}

export function futureParts(
  state: RunState,
): { label: string; value: number }[] {
  return [
    { label: 'Goodwill', value: state.goodwill },
    { label: 'Evidence', value: state.evidence.length },
    {
      label: state.nerve >= 5 ? 'Steady nerve' : 'Frayed nerve',
      value: state.nerve >= 5 ? 1 : state.nerve <= 1 ? -1 : 0,
    },
  ]
}

export function computeEnding(state: RunState): Ending {
  const event = EVENTS.find((e) => e.id === state.event)
  const lens: LensId = state.openingState ?? 'sober'
  // Finishing alone on the quiet route is the Wild Way: it turns on whether you kept choosing the
  // animals, not on stats. Fall short and it is the hermit's bittersweet ending.
  if (!state.activeLead && event?.wildTarget) {
    const target = event.wildTarget
    const parts = [{ label: 'Animal-first choices', value: state.wild }]
    const fate: Fate = state.wild >= target ? 'hope' : 'dark'
    return {
      id: `ecotopia.${lens}.${fate}`,
      lead: 'ecotopia',
      lens,
      fate,
      score: state.wild,
      target,
      parts,
    }
  }
  const lead: LeadId = state.activeLead ?? 'alone'
  const parts = futureParts(state)
  const score = parts.reduce((sum, part) => sum + part.value, 0)
  const target = event?.futureTarget ?? 6
  const fate: Fate = score >= target ? 'hope' : 'dark'
  return {
    id: `${lead}.${lens}.${fate}`,
    lead,
    lens,
    fate,
    score,
    target,
    parts,
  }
}

export function createRun(seed: number, archetypeId: string): RunState {
  const archetype =
    ARCHETYPES.find((a) => a.id === archetypeId) ??
    (ARCHETYPES[0] as (typeof ARCHETYPES)[number])
  return {
    version: ECOTONE_SAVE_VERSION,
    seed: seed >>> 0,
    archetype: archetype.id,
    skills: { ...archetype.skills },
    phase: 'event',
    rolls: 0,
    event: null,
    step: 0,
    day: 1,
    prospect: null,
    openingState: null,
    currentState: null,
    clarity: 3,
    activeLead: null,
    meetingOrder: [],
    followHistory: [],
    newcomerOrder: [],
    card: null,
    offered: [],
    played: [],
    nerve: 5,
    goodwill: 0,
    weird: 0,
    wild: 0,
    evidence: [],
    flags: [],
    log: [],
    pending: null,
    ending: null,
  }
}

/** The county chapter the run is standing in, for the map. */
export function currentChapter(state: RunState): number {
  const card = findCard(state.card)
  if (card) return card.chapter
  const step = currentStep(state)
  if (step?.kind === 'fork') return step.pools[0] ?? 1
  if (state.phase === 'crossroads') return 3
  const last = findCard(state.played[state.played.length - 1])
  return last?.chapter ?? 1
}

export function dayName(state: RunState): string {
  const event = EVENTS.find((e) => e.id === state.event)
  return event?.days[state.day - 1] ?? `Day ${state.day}`
}

function record(
  state: RunState,
  entry: Omit<LogEntry, 'step' | 'day'>,
  nextStep: number,
): RunState {
  const full: LogEntry = {
    ...entry,
    step: state.log.length + 1,
    day: state.day,
  }
  return {
    ...state,
    log: [...state.log, full],
    pending: { entry: full, nextStep },
  }
}

/** Walks the route from `index`, skipping forks with nothing left and crossroads with nobody left to meet. */
export function enterStep(state: RunState, index: number): RunState {
  const route = routeFor(state)
  for (let i = index; i < route.length; i += 1) {
    const step = route[i] as RouteStep
    const base = { ...state, step: i, day: step.day, card: null, offered: [] }
    if (step.kind === 'beat') {
      if (step.ifProspect && !base.prospect) continue
      return { ...base, phase: 'beat', card: step.id }
    }
    if (step.kind === 'fork') {
      const offered = drawFork(base, i)
      if (offered.length) return { ...base, phase: 'fork', offered }
      continue
    }
    if (step.kind === 'crossroads') {
      // A loner who met nobody at the opening still gets a seeded newcomer here.
      const seeded = base.newcomerOrder.length
        ? base
        : {
            ...base,
            newcomerOrder: seededShuffle(
              COMPANIONS.map((c) => c.id).filter(
                (id) => !base.meetingOrder.includes(id),
              ),
              base.seed,
            ),
          }
      if (crossroadsNewcomer(seeded)) return { ...seeded, phase: 'crossroads' }
      continue
    }
    const ended: RunState = { ...base, phase: 'end' }
    return { ...ended, ending: computeEnding(ended).id }
  }
  const ended: RunState = { ...state, phase: 'end', card: null, offered: [] }
  return { ...ended, ending: computeEnding(ended).id }
}

export function chooseEvent(state: RunState, eventId: EventId): RunState {
  const event = EVENTS.find((e) => e.id === eventId)
  if (state.phase !== 'event' || state.pending || !event) return state
  return record(
    { ...state, event: event.id },
    {
      source: 'EVENT',
      title: EVENT_CHOICE.title,
      choice: event.name,
      roll: null,
      text: event.pick,
      effects: {},
    },
    0,
  )
}

export function chooseFork(state: RunState, cardId: string): RunState {
  if (state.phase !== 'fork' || state.pending) return state
  if (!state.offered.includes(cardId)) return state
  return {
    ...state,
    phase: 'beat',
    card: cardId,
    offered: [],
    played: [...state.played, cardId],
  }
}

function meet(state: RunState, accept: boolean): RunState {
  const prospect = state.prospect
  if (!prospect) return state
  const others = COMPANIONS.map((c) => c.id).filter((id) => id !== prospect)
  return {
    ...state,
    activeLead: accept ? prospect : null,
    meetingOrder: state.meetingOrder.includes(prospect)
      ? state.meetingOrder
      : [...state.meetingOrder, prospect],
    newcomerOrder: seededShuffle(others, state.seed),
    followHistory: [
      ...state.followHistory,
      {
        day: state.day,
        from: null,
        to: accept ? prospect : null,
        choice: accept ? 'travel-together' : 'go-alone',
      },
    ],
    flags: [
      ...state.flags,
      accept ? `${prospect}_first_guide` : 'started_alone',
    ],
  }
}

export function chooseBeat(state: RunState, choiceId: string): RunState {
  if (state.phase !== 'beat' || state.pending) return state
  const card = findCard(state.card)
  const choice = card?.choices.find((c) => c.id === choiceId)
  if (!card || !choice || choice.locked) return state
  let next: RunState = state
  if (choice.lens) {
    const lens = LENSES.find((l) => l.id === choice.lens)
    if (!lens?.open) return state
    next = {
      ...next,
      openingState: next.openingState ?? lens.id,
      currentState: lens.id,
      clarity: lens.clarity,
    }
  }
  let roll: Roll | null = null
  let outcome: Outcome = choice.success
  let result: OutcomeResult = 'success'
  if (choice.check) {
    roll = resolveCheck(next, choice.check)
    if (!roll.success && choice.failure) {
      outcome = choice.failure
      result = 'failure'
    }
    next = { ...next, rolls: next.rolls + 1 }
  }
  if (choice.prospect) next = { ...next, prospect: choice.prospect }
  if (choice.wild) next = { ...next, wild: next.wild + 1 }
  if (choice.meet !== undefined) next = meet(next, choice.meet)
  next = applyEffects(next, outcome.effects)
  if (!next.played.includes(card.id))
    next = { ...next, played: [...next.played, card.id] }
  return record(
    next,
    {
      source: card.id,
      title: card.title,
      choice: fillText(choice.label, state),
      roll,
      text: fillText(outcome.text, next),
      effects: outcome.effects,
      art: outcomeArtKey(card.id, choice.id, result),
    },
    state.step + 1,
  )
}

export function chooseCrossroads(state: RunState, follow: boolean): RunState {
  const newcomer = crossroadsNewcomer(state)
  if (state.phase !== 'crossroads' || state.pending || !newcomer) return state
  const companion = COMPANIONS.find((c) => c.id === newcomer)
  const previous = COMPANIONS.find((c) => c.id === state.activeLead)
  const name = companion?.name ?? 'the newcomer'
  const met: RunState = {
    ...state,
    meetingOrder: [...state.meetingOrder, newcomer],
  }
  const next: RunState = follow
    ? {
        ...met,
        activeLead: newcomer,
        followHistory: [
          ...met.followHistory,
          {
            day: state.day,
            from: state.activeLead,
            to: newcomer,
            choice: 'follow',
          },
        ],
        flags: [...met.flags, `followed_${newcomer}`],
      }
    : { ...met, flags: [...met.flags, `stayed_at_${newcomer}`] }
  const choice = follow
    ? `Follow ${name}`
    : previous
      ? `Stay with ${previous.name}`
      : 'Keep going alone'
  const text = follow
    ? previous
      ? `${previous.name} nods, a little stung, and heads off after their own piece of the mystery. ${name} is already walking.`
      : `${name} grins like they knew you would. You have a guide now.`
    : `${name} takes it in stride and goes their own way. Their trail and yours will cross again before this is over.`
  return record(
    next,
    {
      source: 'CROSSROADS',
      title: `Crossroads: ${name}`,
      choice,
      roll: null,
      text,
      effects: {},
    },
    state.step + 1,
  )
}

export function advance(state: RunState): RunState {
  if (!state.pending) return state
  return enterStep({ ...state, pending: null }, state.pending.nextStep)
}

function isCompanion(value: unknown): value is CompanionId {
  return COMPANIONS.some((c) => c.id === value)
}

function isCardList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((id) => Boolean(findCard(id)))
}

export function restoreRun(raw: unknown): RunState | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Partial<RunState>
  if (s.version !== ECOTONE_SAVE_VERSION) return null
  if (typeof s.seed !== 'number' || typeof s.archetype !== 'string') return null
  if (!ARCHETYPES.some((a) => a.id === s.archetype)) return null
  if (!['event', 'beat', 'fork', 'crossroads', 'end'].includes(String(s.phase)))
    return null
  if (s.event !== null && !EVENTS.some((e) => e.id === s.event)) return null
  if (s.phase !== 'event' && !s.event) return null
  if (typeof s.step !== 'number' || s.step < 0) return null
  if (s.event && s.step > ROUTES[s.event].length) return null
  if (s.card !== null && !findCard(s.card)) return null
  if (s.phase === 'beat' && !s.card) return null
  if (!isCardList(s.offered) || !isCardList(s.played)) return null
  if (s.prospect !== null && !isCompanion(s.prospect)) return null
  if (!Array.isArray(s.meetingOrder) || !s.meetingOrder.every(isCompanion))
    return null
  if (!Array.isArray(s.newcomerOrder) || !s.newcomerOrder.every(isCompanion))
    return null
  if (s.activeLead !== null && !isCompanion(s.activeLead)) return null
  if (
    !Array.isArray(s.log) ||
    !Array.isArray(s.evidence) ||
    !Array.isArray(s.flags) ||
    !Array.isArray(s.followHistory)
  )
    return null
  if (!s.skills || typeof s.skills !== 'object') return null
  if (typeof s.wild !== 'number') return null
  return s as RunState
}
