import {
  ARCHETYPES,
  COMPANIONS,
  ENCOUNTERS,
  LENSES,
  PROLOGUE_OUTCOMES,
  type Check,
  type CompanionId,
  type Effects,
  type EncounterCard,
  type LensId,
  type Outcome,
  type SkillId,
  type Skills,
} from './content'

export const ECOTONE_SAVE_VERSION = 2
export const MAX_METER = 8
export const CROSSROADS_CHAPTER = 3
export const CHAPTER_DRAWS: Record<number, number> = { 1: 2, 2: 2, 3: 2 }

export type Phase = 'prologue' | 'intro' | 'encounter' | 'crossroads' | 'end'

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
  chapter: number
  source: string
  title: string
  choice: string
  roll: Roll | null
  text: string
  effects: Effects
}

export type FollowEntry = {
  chapter: number
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
  openingState: LensId | null
  currentState: LensId | null
  clarity: number
  introCompanion: CompanionId | null
  activeLead: CompanionId | null
  meetingOrder: CompanionId[]
  followHistory: FollowEntry[]
  newcomerOrder: CompanionId[]
  deck: string[]
  encounterIndex: number
  nerve: number
  goodwill: number
  weird: number
  evidence: string[]
  flags: string[]
  log: LogEntry[]
  pending: { entry: LogEntry; next: Phase } | null
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

export function buildDeck(seed: number): string[] {
  return Object.entries(CHAPTER_DRAWS)
    .map(([chapter, count]) => [Number(chapter), count] as const)
    .sort((a, b) => a[0] - b[0])
    .flatMap(([chapter, count]) =>
      seededShuffle(
        ENCOUNTERS.filter((card) => card.chapter === chapter).map(
          (card) => card.id,
        ),
        hashSeed(seed, chapter * 7919),
      ).slice(0, count),
    )
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
  const line =
    lead && lead !== presence?.companion ? card.leadLines?.[lead] : undefined
  if (line) asides.push(line)
  return asides
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
    phase: 'prologue',
    rolls: 0,
    openingState: null,
    currentState: null,
    clarity: 3,
    introCompanion: null,
    activeLead: null,
    meetingOrder: [],
    followHistory: [],
    newcomerOrder: [],
    deck: buildDeck(seed >>> 0),
    encounterIndex: 0,
    nerve: 5,
    goodwill: 0,
    weird: 0,
    evidence: [],
    flags: [],
    log: [],
    pending: null,
  }
}

export function currentChapter(state: RunState): number {
  if (state.phase === 'prologue' || state.phase === 'intro') return 1
  const card = ENCOUNTERS.find((c) => c.id === state.deck[state.encounterIndex])
  if (state.phase === 'end') {
    const last = state.deck[state.deck.length - 1]
    return ENCOUNTERS.find((c) => c.id === last)?.chapter ?? 1
  }
  return card?.chapter ?? 1
}

function record(
  state: RunState,
  entry: Omit<LogEntry, 'step' | 'chapter'>,
  next: Phase,
): RunState {
  const full: LogEntry = {
    ...entry,
    step: state.log.length + 1,
    chapter: currentChapter(state),
  }
  return { ...state, log: [...state.log, full], pending: { entry: full, next } }
}

export function chooseLens(state: RunState, lensId: LensId): RunState {
  const lens = LENSES.find((l) => l.id === lensId)
  if (state.phase !== 'prologue' || state.pending || !lens?.open || !lens.check)
    return state
  const outcomes = PROLOGUE_OUTCOMES[lensId as keyof typeof PROLOGUE_OUTCOMES]
  if (!outcomes) return state
  const lensed: RunState = {
    ...state,
    openingState: lens.id,
    currentState: lens.id,
    clarity: lens.clarity,
    introCompanion: lens.companion,
    meetingOrder: lens.companion ? [lens.companion] : [],
  }
  const roll = resolveCheck(lensed, lens.check)
  const outcome = roll.success ? outcomes.success : outcomes.failure
  const remaining = COMPANIONS.map((c) => c.id).filter(
    (id) => id !== lens.companion,
  )
  const withEffects = applyEffects(
    {
      ...lensed,
      rolls: state.rolls + 1,
      newcomerOrder: seededShuffle(remaining, state.seed),
    },
    outcome.effects,
  )
  return record(
    withEffects,
    {
      source: 'PROLOGUE',
      title: 'The Woman Who Knows the Trail',
      choice: `${lens.label}: ${lens.offer}`,
      roll,
      text: outcome.text,
      effects: outcome.effects,
    },
    'intro',
  )
}

export function chooseIntro(state: RunState, accept: boolean): RunState {
  if (state.phase !== 'intro' || state.pending || !state.introCompanion)
    return state
  const companion = COMPANIONS.find((c) => c.id === state.introCompanion)
  const name = companion?.name ?? 'your guide'
  const next: RunState = {
    ...state,
    activeLead: accept ? state.introCompanion : null,
    followHistory: [
      ...state.followHistory,
      {
        chapter: 1,
        from: null,
        to: accept ? state.introCompanion : null,
        choice: accept ? 'travel-together' : 'go-alone',
      },
    ],
    flags: [
      ...state.flags,
      accept ? `${state.introCompanion}_first_guide` : 'started_alone',
    ],
  }
  return record(
    next,
    {
      source: 'MEETING',
      title: `Meeting ${name}`,
      choice: accept ? `Travel with ${name}` : 'Go it alone for now',
      roll: null,
      text: accept
        ? `${name} shoulders a bag and falls into step beside you. The weekend has a guide.`
        : `${name} shrugs, unoffended, and goes after the mystery on their own. You will cross paths again.`,
      effects: {},
    },
    'encounter',
  )
}

export function chooseEncounter(state: RunState, choiceId: string): RunState {
  if (state.phase !== 'encounter' || state.pending) return state
  const card = ENCOUNTERS.find((c) => c.id === state.deck[state.encounterIndex])
  const choice = card?.choices.find((c) => c.id === choiceId)
  if (!card || !choice) return state
  let roll: Roll | null = null
  let outcome: Outcome = choice.success
  let rolled = state
  if (choice.check) {
    roll = resolveCheck(state, choice.check)
    outcome = roll.success ? choice.success : (choice.failure ?? choice.success)
    rolled = { ...state, rolls: state.rolls + 1 }
  }
  const index = state.encounterIndex + 1
  const upcoming = ENCOUNTERS.find((c) => c.id === state.deck[index])
  const next: Phase =
    index >= state.deck.length
      ? 'end'
      : (upcoming?.chapter ?? 0) >= CROSSROADS_CHAPTER &&
          state.meetingOrder.length < 2
        ? 'crossroads'
        : 'encounter'
  const withEffects = applyEffects(rolled, outcome.effects)
  return record(
    withEffects,
    {
      source: card.id,
      title: card.title,
      choice: choice.label,
      roll,
      text: outcome.text,
      effects: outcome.effects,
    },
    next,
  )
}

export function crossroadsNewcomer(state: RunState): CompanionId | null {
  return (
    state.newcomerOrder.find((id) => !state.meetingOrder.includes(id)) ?? null
  )
}

export function chooseCrossroads(state: RunState, follow: boolean): RunState {
  const newcomer = crossroadsNewcomer(state)
  if (state.phase !== 'crossroads' || state.pending || !newcomer) return state
  const companion = COMPANIONS.find((c) => c.id === newcomer)
  const previous = COMPANIONS.find((c) => c.id === state.activeLead)
  const name = companion?.name ?? 'the newcomer'
  const chapter = currentChapter(state)
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
          { chapter, from: state.activeLead, to: newcomer, choice: 'follow' },
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
    : `${name} takes it in stride and goes their own way. Their trail and yours will cross again before the weekend is out.`
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
    'encounter',
  )
}

export function advance(state: RunState): RunState {
  if (!state.pending) return state
  const next = state.pending.next
  const leavingEncounter =
    state.phase === 'encounter' &&
    (next === 'encounter' || next === 'crossroads' || next === 'end')
  return {
    ...state,
    phase: next,
    encounterIndex: leavingEncounter
      ? state.encounterIndex + 1
      : state.encounterIndex,
    pending: null,
  }
}

function isCompanion(value: unknown): value is CompanionId {
  return COMPANIONS.some((c) => c.id === value)
}

export function restoreRun(raw: unknown): RunState | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Partial<RunState>
  if (s.version !== ECOTONE_SAVE_VERSION) return null
  if (typeof s.seed !== 'number' || typeof s.archetype !== 'string') return null
  if (!ARCHETYPES.some((a) => a.id === s.archetype)) return null
  if (
    !['prologue', 'intro', 'encounter', 'crossroads', 'end'].includes(
      String(s.phase),
    )
  )
    return null
  if (
    !Array.isArray(s.deck) ||
    s.deck.some((id) => !ENCOUNTERS.some((c) => c.id === id))
  )
    return null
  if (typeof s.encounterIndex !== 'number' || s.encounterIndex < 0) return null
  if (s.encounterIndex > s.deck.length) return null
  if (!Array.isArray(s.meetingOrder) || !s.meetingOrder.every(isCompanion))
    return null
  if (!Array.isArray(s.newcomerOrder) || !s.newcomerOrder.every(isCompanion))
    return null
  if (s.activeLead !== null && !isCompanion(s.activeLead)) return null
  if (
    !Array.isArray(s.log) ||
    !Array.isArray(s.evidence) ||
    !Array.isArray(s.flags)
  )
    return null
  if (!s.skills || typeof s.skills !== 'object') return null
  return s as RunState
}
