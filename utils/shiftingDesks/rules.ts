import pack from './orientation.json'
import decksData from './decks.json'

export const SKILLS = [
  'compliance',
  'initiative',
  'discretion',
  'rapport',
  'tinkering',
  'vigilance',
] as const
export type Skill = (typeof SKILLS)[number]

export const METERS = [
  'composure',
  'clearance',
  'suspicion',
  'successors',
  'forms',
] as const
export type Meter = (typeof METERS)[number]
export type Meters = Record<Meter, number>
export type Effects = Partial<Record<Meter, number>>

export const METER_LIMITS: Record<Meter, { min: number; max: number }> = {
  composure: { min: 0, max: 10 },
  clearance: { min: 0, max: 5 },
  suspicion: { min: 0, max: 10 },
  successors: { min: 0, max: 9 },
  forms: { min: 0, max: 9 },
}

export const METER_LABELS: Record<Meter, string> = {
  composure: 'Composure',
  clearance: 'Clearance',
  suspicion: 'Suspicion',
  successors: 'Successors',
  forms: 'Forms',
}

export const HARMFUL_SIGN: Record<Meter, -1 | 1> = {
  composure: -1,
  clearance: -1,
  suspicion: 1,
  successors: -1,
  forms: -1,
}

export const START_METERS: Meters = {
  composure: 6,
  clearance: 1,
  suspicion: 0,
  successors: 5,
  forms: 3,
}

export type Roll = {
  dice_count: number
  die_sides: number
  skill: Skill
  modifier: number
  target: number
}
export type Outcome = {
  text: string
  effects: Effects
  add_flags: string[]
  remove_flags: string[]
  department_outcome?: string
}
export type Requirement = { flag?: string; clearance?: number; forms?: number }
export type Choice = {
  id: string
  label: string
  intent: string
  risk_hint: string
  requires: Requirement | null
  cost: Effects
  roll: Roll | null
  success: Outcome
  failure: Outcome | null
}
export type Encounter = {
  id: string
  location_id: string
  title: string
  flavor_text: string
  polarity: 'good' | 'bad' | 'mixed'
  tags: string[]
  weight: number
  witnessed: boolean
  choices: Choice[]
}
export type Location = {
  location_id: string
  title: string
  description: string
  encounter_ids: string[]
}
export type DepartmentOutcome = { id: string; title: string; summary: string }
export type Boss = {
  id: string
  title: string
  flavor_text: string
  choices: Choice[]
  department_outcomes: DepartmentOutcome[]
}
export type Pack = {
  schemaVersion: number
  source: string
  sourceSha: string
  department: { id: string; title: string; order: number; boss_id: string }
  locations: Location[]
  encounters: Encounter[]
  boss: Boss
}

export const ORIENTATION = pack as Pack

export type FavorKind =
  'force-success' | 'effects' | 'ignore-requirement' | 'bonus'
export type Favor = {
  id: string
  title: string
  text: string
  kind: FavorKind
  effects?: Effects
  amount?: number
}
export type Society = {
  id: string
  title: string
  creed: string
  objectives: Record<string, string[]>
  betrayals: Record<string, string[]>
  objective_text: Record<string, string>
  betrayal_text: Record<string, string>
  favor: Favor
  reward: Effects
}
export type MutationKind =
  'reroll' | 'auto-success' | 'bonus' | 'restore-composure'
export type Mutation = {
  id: string
  title: string
  text: string
  kind: MutationKind
  skills?: Skill[]
  amount?: number
}
export type Decks = {
  schemaVersion: number
  source: string
  sourceRef: string
  societies: Society[]
  mutations: Mutation[]
  jobTitles: Array<{
    id: string
    title: string
    skills: Record<Skill, number>
    perk: string
  }>
}

export const DECKS = decksData as Decks
export const SOCIETIES = DECKS.societies
export const MUTATIONS = DECKS.mutations

export type JobTitle = {
  id: string
  title: string
  tagline: string
  skills: Record<Skill, number>
  perk: string
  perkText: string
}

export const JOB_TITLES: JobTitle[] = [
  {
    id: 'intern',
    title: 'Intern',
    tagline: 'Eager, unpaid and first in line for everything.',
    skills: {
      compliance: 1,
      initiative: 2,
      discretion: 0,
      rapport: 2,
      tinkering: 0,
      vigilance: 1,
    },
    perk: 'Expendable',
    perkText: 'HR keeps one extra Successor on file for you.',
  },
  {
    id: 'temp',
    title: 'Temp',
    tagline: 'Nobody is entirely sure you work here.',
    skills: {
      compliance: 0,
      initiative: 1,
      discretion: 3,
      rapport: 1,
      tinkering: 0,
      vigilance: 1,
    },
    perk: 'Unremarkable',
    perkText: 'Your Successors arrive with a clean file and no Suspicion.',
  },
  {
    id: 'middle-manager',
    title: 'Middle Manager',
    tagline: 'You have a lanyard, a stamp and a quiet despair.',
    skills: {
      compliance: 3,
      initiative: 0,
      discretion: 0,
      rapport: 2,
      tinkering: 0,
      vigilance: 1,
    },
    perk: 'Signing Authority',
    perkText: 'Start with two extra Forms, and one less Composure.',
  },
  {
    id: 'night-janitor',
    title: 'Night Janitor',
    tagline: 'You know where the ducts go. Nobody asks you anything.',
    skills: {
      compliance: 0,
      initiative: 1,
      discretion: 1,
      rapport: 0,
      tinkering: 3,
      vigilance: 1,
    },
    perk: 'Master Keys',
    perkText: 'Start with Clearance 2.',
  },
  {
    id: 'internal-auditor',
    title: 'Internal Auditor',
    tagline: 'Everyone is polite to you. Everyone is afraid of you.',
    skills: {
      compliance: 2,
      initiative: 0,
      discretion: 1,
      rapport: 0,
      tinkering: 0,
      vigilance: 3,
    },
    perk: 'Feared',
    perkText: 'Start with one extra Composure. You have seen worse.',
  },
]

export const DIFFICULTY: Record<number, string> = {
  7: 'Routine',
  9: 'Risky',
  11: 'Dire',
}

export type LogEntry = {
  cardId: string
  cardTitle: string
  choiceId: string
  choiceLabel: string
  dice: number[] | null
  skill: Skill | null
  skillValue: number
  boost: number
  total: number | null
  target: number | null
  success: boolean
  special: 'commendation' | 'incident' | null
  text: string
  effects: Effects
  events: string[]
  employee: string
  aids: string[]
  rerolled: number[] | null
}

export type RunStatus = 'playing' | 'department-complete' | 'eliminated'

export type SocietyStatus = 'active' | 'met' | 'betrayed'

export type RunState = {
  version: 2
  department: string
  societyId: string
  societyStatus: SocietyStatus
  favorUsed: boolean
  mutationId: string
  mutationUsed: boolean
  seed: string
  rng: number
  jobId: string
  skills: Record<Skill, number>
  meters: Meters
  generation: number
  flags: string[]
  deck: string[]
  position: number
  bossAttempts: number
  status: RunStatus
  departmentOutcome: string | null
  log: LogEntry[]
  pending: LogEntry | null
}

export const BOSS_CARD = 'boss'
const SAVE_VERSION = 2

function hashSeed(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function nextRandom(state: number): [number, number] {
  let t = (state + 0x6d2b79f5) >>> 0
  const next = t
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next]
}

function weightedPick(
  ids: string[],
  rng: number,
  exclude: string[] = [],
): [string, number] {
  const pool = ids
    .filter((id) => !exclude.includes(id))
    .map((id) => encounterById(id))
  const total = pool.reduce((sum, e) => sum + e.weight, 0)
  const [r, next] = nextRandom(rng)
  let roll = r * total
  for (const e of pool) {
    roll -= e.weight
    if (roll < 0) return [e.id, next]
  }
  return [pool[pool.length - 1]?.id ?? ids[0] ?? '', next]
}

export function encounterById(id: string): Encounter {
  const found = ORIENTATION.encounters.find((e) => e.id === id)
  if (!found) throw new Error(`Unknown Shifting Desks encounter ${id}`)
  return found
}

export function locationById(id: string): Location | undefined {
  return ORIENTATION.locations.find((l) => l.location_id === id)
}

export function jobById(id: string): JobTitle {
  return JOB_TITLES.find((j) => j.id === id) ?? (JOB_TITLES[0] as JobTitle)
}

export function societyById(id: string): Society {
  return SOCIETIES.find((x) => x.id === id) ?? (SOCIETIES[0] as Society)
}

export function mutationById(id: string): Mutation {
  return MUTATIONS.find((x) => x.id === id) ?? (MUTATIONS[0] as Mutation)
}

function dealDossier(rng: number): [string, string, number] {
  const [a, r1] = nextRandom(rng)
  const [b, r2] = nextRandom(r1)
  const society = SOCIETIES[Math.floor(a * SOCIETIES.length)] as Society
  const mutation = MUTATIONS[Math.floor(b * MUTATIONS.length)] as Mutation
  return [society.id, mutation.id, r2]
}

export function employeeId(generation: number): string {
  return `#4471-${String.fromCharCode(65 + Math.min(generation, 25))}`
}

function clampMeters(m: Meters): Meters {
  const out = { ...m }
  for (const k of METERS) {
    out[k] = Math.max(
      METER_LIMITS[k].min,
      Math.min(METER_LIMITS[k].max, out[k]),
    )
  }
  return out
}

export function newRun(seed: string, jobId: string): RunState {
  const job = jobById(jobId)
  const meters = { ...START_METERS }
  if (job.id === 'intern') meters.successors += 1
  if (job.id === 'middle-manager') {
    meters.forms += 2
    meters.composure -= 1
  }
  if (job.id === 'night-janitor') meters.clearance = 2
  if (job.id === 'internal-auditor') meters.composure += 1
  let rng = hashSeed(seed)
  const deck: string[] = []
  for (const loc of ORIENTATION.locations) {
    const [id, next] = weightedPick(loc.encounter_ids, rng)
    deck.push(id)
    rng = next
  }
  deck.push(BOSS_CARD)
  const [societyId, mutationId, dealt] = dealDossier(rng)
  rng = dealt
  return {
    version: SAVE_VERSION,
    department: ORIENTATION.department.id,
    societyId,
    societyStatus: 'active',
    favorUsed: false,
    mutationId,
    mutationUsed: false,
    seed,
    rng,
    jobId: job.id,
    skills: { ...job.skills },
    meters: clampMeters(meters),
    generation: 0,
    flags: [],
    deck,
    position: 0,
    bossAttempts: 0,
    status: 'playing',
    departmentOutcome: null,
    log: [],
    pending: null,
  }
}

export function currentCardId(state: RunState): string | null {
  return state.deck[state.position] ?? null
}

export function currentCard(
  state: RunState,
):
  { kind: 'encounter'; card: Encounter } | { kind: 'boss'; card: Boss } | null {
  const id = currentCardId(state)
  if (!id) return null
  if (id === BOSS_CARD) return { kind: 'boss', card: ORIENTATION.boss }
  return { kind: 'encounter', card: encounterById(id) }
}

export function requirementLock(
  state: RunState,
  choice: Choice,
): string | null {
  const req = choice.requires
  if (req?.flag && !state.flags.includes(req.flag)) {
    return 'You have not earned this option on this run.'
  }
  if (req?.clearance && state.meters.clearance < req.clearance) {
    return `Requires Clearance ${req.clearance}.`
  }
  return null
}

export function lockReason(
  state: RunState,
  choice: Choice,
  ignoreRequirement = false,
): string | null {
  if (!ignoreRequirement) {
    const locked = requirementLock(state, choice)
    if (locked) return locked
  }
  const req = choice.requires
  const formsNeeded = (req?.forms ?? 0) + Math.max(0, -(choice.cost.forms ?? 0))
  if (formsNeeded > state.meters.forms) {
    return `Requires ${formsNeeded} Form${formsNeeded === 1 ? '' : 's'}.`
  }
  return null
}

export function favorAvailable(state: RunState): boolean {
  return !state.favorUsed && state.societyStatus !== 'betrayed'
}

export function favorAppliesTo(state: RunState, choice: Choice): boolean {
  if (!favorAvailable(state)) return false
  const kind = societyById(state.societyId).favor.kind
  if (kind === 'force-success' || kind === 'bonus') return !!choice.roll
  if (kind === 'ignore-requirement') return !!requirementLock(state, choice)
  return false
}

export function mutationAppliesTo(state: RunState, choice: Choice): boolean {
  if (state.mutationUsed || !choice.roll) return false
  const m = mutationById(state.mutationId)
  if (m.kind === 'reroll') return true
  if (m.kind === 'auto-success' || m.kind === 'bonus') {
    return !m.skills || m.skills.includes(choice.roll.skill)
  }
  return false
}

export function instantAvailable(
  state: RunState,
  which: 'favor' | 'mutation',
): boolean {
  if (state.status !== 'playing' || state.pending) return false
  if (which === 'favor') {
    return (
      favorAvailable(state) &&
      societyById(state.societyId).favor.kind === 'effects'
    )
  }
  return (
    !state.mutationUsed &&
    mutationById(state.mutationId).kind === 'restore-composure'
  )
}

export function isHarmful(effects: Effects): boolean {
  return METERS.some((k) => (effects[k] ?? 0) * HARMFUL_SIGN[k] > 0)
}

function addEffects(a: Effects, b: Effects): Effects {
  const out: Effects = {}
  for (const k of METERS) {
    const v = (a[k] ?? 0) + (b[k] ?? 0)
    if (v) out[k] = v
  }
  return out
}

function rollDie(rng: number, sides: number): [number, number] {
  const [r, next] = nextRandom(rng)
  return [1 + Math.floor(r * sides), next]
}

export type ChooseOptions = {
  spendForm?: boolean
  useFavor?: boolean
  useMutation?: boolean
}

export function choose(
  state: RunState,
  choiceId: string,
  options: ChooseOptions | boolean = {},
): RunState {
  const opts: ChooseOptions =
    typeof options === 'boolean' ? { spendForm: options } : options
  const spendForm = !!opts.spendForm
  if (state.status !== 'playing' || state.pending) return state
  const view = currentCard(state)
  if (!view) return state
  const choice = view.card.choices.find((c) => c.id === choiceId)
  if (!choice) return state
  const society = societyById(state.societyId)
  const mutation = mutationById(state.mutationId)
  const favor = !!opts.useFavor && favorAppliesTo(state, choice)
  const mutate = !!opts.useMutation && mutationAppliesTo(state, choice)
  const ignoreRequirement = favor && society.favor.kind === 'ignore-requirement'
  if (lockReason(state, choice, ignoreRequirement)) return state
  const aids: string[] = []
  let favorUsed = state.favorUsed
  let mutationUsed = state.mutationUsed
  let rerolled: number[] | null = null
  if (ignoreRequirement) {
    favorUsed = true
    aids.push(society.favor.title)
  }

  let rng = state.rng
  let meters: Meters = { ...state.meters }
  let flags = [...state.flags]
  let generation = state.generation
  const events: string[] = []
  const employee = employeeId(generation)

  const formBoost =
    spendForm && choice.roll && meters.forms + (choice.cost.forms ?? 0) >= 1
      ? 2
      : 0
  let boost = formBoost
  if (favor && society.favor.kind === 'bonus') {
    boost += society.favor.amount ?? 0
    favorUsed = true
    aids.push(society.favor.title)
  }
  if (mutate && mutation.kind === 'bonus') {
    boost += mutation.amount ?? 0
    mutationUsed = true
    aids.push(mutation.title)
  }
  let total: number | null = null
  let dice: number[] | null = null
  let special: LogEntry['special'] = null
  let success = true
  const skill = choice.roll?.skill ?? null
  const skillValue = skill ? state.skills[skill] : 0

  if (choice.roll) {
    const [d1, r1] = rollDie(rng, choice.roll.die_sides)
    const [d2, r2] = rollDie(r1, choice.roll.die_sides)
    rng = r2
    dice = [d1, d2]
    total = d1 + d2 + skillValue + choice.roll.modifier + boost
    if (d1 + d2 === 12) special = 'commendation'
    else if (d1 + d2 === 2) special = 'incident'
    success =
      special === 'commendation'
        ? true
        : special === 'incident'
          ? false
          : total >= choice.roll.target
    if (!success && mutate && mutation.kind === 'reroll') {
      const [e1, q1] = rollDie(rng, choice.roll.die_sides)
      const [e2, q2] = rollDie(q1, choice.roll.die_sides)
      rng = q2
      rerolled = dice
      dice = [e1, e2]
      total = e1 + e2 + skillValue + choice.roll.modifier + boost
      special =
        e1 + e2 === 12 ? 'commendation' : e1 + e2 === 2 ? 'incident' : null
      success =
        special === 'commendation'
          ? true
          : special === 'incident'
            ? false
            : total >= choice.roll.target
      mutationUsed = true
      aids.push(mutation.title)
      events.push(
        `${mutation.title}: you saw it go wrong four seconds early and tried again.`,
      )
    }
    if (!success && mutate && mutation.kind === 'auto-success') {
      success = true
      mutationUsed = true
      aids.push(mutation.title)
      events.push(`${mutation.title} carries it, whatever the dice say.`)
    }
    if (!success && favor && society.favor.kind === 'force-success') {
      success = true
      favorUsed = true
      aids.push(society.favor.title)
      events.push(
        `${society.title} quietly fixes it. ${society.favor.title} is spent.`,
      )
    }
  }

  const outcome = success || !choice.failure ? choice.success : choice.failure
  let effects = addEffects(choice.cost, outcome.effects)
  if (formBoost) effects = addEffects(effects, { forms: -1 })
  const mutationSpent = mutationUsed && !state.mutationUsed
  const witnessed = view.kind === 'boss' || view.card.witnessed
  if (mutationSpent && witnessed) {
    effects = addEffects(effects, { suspicion: 2 })
    events.push(`Someone saw that. Using ${mutation.title} in public is noted.`)
  }
  if (special === 'commendation') {
    effects = addEffects(effects, { composure: 1 })
    events.push(
      'Commendation! A natural 12 earns a gold star and a little calm.',
    )
  }
  if (special === 'incident') {
    effects = addEffects(effects, { suspicion: 1 })
    events.push('Incident Report. A natural 2 is filed in triplicate.')
  }

  for (const k of METERS) meters[k] += effects[k] ?? 0
  meters = clampMeters(meters)
  flags = [
    ...flags.filter((f) => !outcome.remove_flags.includes(f)),
    ...outcome.add_flags.filter((f) => !flags.includes(f)),
  ]

  let societyStatus = state.societyStatus
  if (societyStatus === 'active') {
    const betrayals = society.betrayals[state.department] ?? []
    const objectives = society.objectives[state.department] ?? []
    if (betrayals.some((f) => flags.includes(f))) {
      societyStatus = 'betrayed'
      favorUsed = true
      meters.suspicion += 2
      effects = addEffects(effects, { suspicion: 2 })
      events.push(
        `${society.title} has burned you. Someone left an anonymous note about you on PAL's desk.`,
      )
    } else if (objectives.some((f) => flags.includes(f))) {
      societyStatus = 'met'
      for (const k of METERS) meters[k] += society.reward[k] ?? 0
      effects = addEffects(effects, society.reward)
      events.push(
        `${society.title} is pleased. A plain envelope appears in your desk drawer.`,
      )
    }
    meters = clampMeters(meters)
  }

  const successorLost = (effects.successors ?? 0) < 0
  let replaced = successorLost
  if (meters.composure <= 0 && meters.successors > 0) {
    meters.successors -= 1
    replaced = true
    events.push(`${employee} suffered a nervous breakdown and was reassigned.`)
  }
  if (meters.suspicion >= 10 && meters.successors > 0) {
    meters.successors -= 1
    replaced = true
    events.push(`${employee} was invited to a short, friendly conversation.`)
  }
  if (replaced && meters.successors > 0) {
    generation += 1
    meters.composure = START_METERS.composure
    meters.suspicion =
      state.jobId === 'temp' ? 0 : Math.ceil(Math.min(meters.suspicion, 9) / 2)
    events.push(
      `${employeeId(generation)} reports for duty, inherits the desk, the flags and the debts.`,
    )
  }

  let status: RunStatus = state.status
  let departmentOutcome = state.departmentOutcome
  if (meters.successors <= 0) {
    status = 'eliminated'
    departmentOutcome = 'position-eliminated'
    events.push(
      'No Successors remain on file. Your position has been eliminated.',
    )
  }

  const entry: LogEntry = {
    cardId: view.card.id,
    cardTitle: view.card.title,
    choiceId: choice.id,
    choiceLabel: choice.label,
    dice,
    skill,
    skillValue,
    boost,
    total,
    target: choice.roll?.target ?? null,
    success,
    special,
    text: outcome.text,
    effects,
    events,
    employee,
    aids,
    rerolled,
  }

  let deck = state.deck
  let bossAttempts = state.bossAttempts
  if (view.kind === 'boss' && status === 'playing') {
    bossAttempts += 1
    const result = outcome.department_outcome ?? 'reorientation'
    if (result === 'reorientation') {
      const used = deck.filter((id) => id !== BOSS_CARD)
      const all = ORIENTATION.encounters.map((e) => e.id)
      const unused = all.filter((id) => !used.includes(id))
      if (unused.length) {
        const [id, next] = weightedPick(unused, rng)
        rng = next
        deck = [...deck.slice(0, state.position + 1), id, BOSS_CARD]
        events.push(
          'Reorientation: one more Orientation file before the panel will see you again.',
        )
      } else {
        status = 'department-complete'
        departmentOutcome = 'reorientation'
      }
    } else {
      status = 'department-complete'
      departmentOutcome = result
    }
  }

  return {
    ...state,
    rng,
    meters,
    flags,
    generation,
    societyStatus,
    favorUsed,
    mutationUsed,
    deck,
    bossAttempts,
    status,
    departmentOutcome,
    log: [...state.log, entry],
    pending: entry,
  }
}

export function useInstant(
  state: RunState,
  which: 'favor' | 'mutation',
): RunState {
  if (!instantAvailable(state, which)) return state
  const meters: Meters = { ...state.meters }
  let effects: Effects
  let title: string
  let text: string
  if (which === 'favor') {
    const favor = societyById(state.societyId).favor
    effects = favor.effects ?? {}
    for (const k of METERS) meters[k] += effects[k] ?? 0
    title = favor.title
    text = favor.text
  } else {
    const mutation = mutationById(state.mutationId)
    const restored = Math.max(meters.composure, START_METERS.composure)
    effects =
      restored > meters.composure
        ? { composure: restored - meters.composure }
        : {}
    meters.composure = restored
    title = mutation.title
    text = mutation.text
  }
  const entry: LogEntry = {
    cardId: 'dossier',
    cardTitle: 'Sealed envelope',
    choiceId: which,
    choiceLabel: title,
    dice: null,
    skill: null,
    skillValue: 0,
    boost: 0,
    total: null,
    target: null,
    success: true,
    special: null,
    text,
    effects,
    events: [],
    employee: employeeId(state.generation),
    aids: [title],
    rerolled: null,
  }
  return {
    ...state,
    meters: clampMeters(meters),
    favorUsed: which === 'favor' ? true : state.favorUsed,
    mutationUsed: which === 'mutation' ? true : state.mutationUsed,
    log: [...state.log, entry],
  }
}

export function advance(state: RunState): RunState {
  if (!state.pending) return state
  const next = { ...state, pending: null }
  if (state.status === 'playing') next.position = state.position + 1
  return next
}

export function outcomeById(id: string | null): DepartmentOutcome | null {
  if (!id) return null
  if (id === 'position-eliminated') {
    return {
      id,
      title: 'Position Eliminated',
      summary:
        'Every Successor on file has been used. HR thanks you for your service and has already repurposed your desk.',
    }
  }
  return ORIENTATION.boss.department_outcomes.find((o) => o.id === id) ?? null
}

export function upgradeRun(value: unknown): RunState | null {
  if (isRunState(value)) return value
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>
  if (v.version !== 1) return null
  const [societyId, mutationId] = dealDossier(hashSeed(String(v.seed ?? '')))
  const upgraded = {
    ...v,
    version: SAVE_VERSION,
    department: ORIENTATION.department.id,
    societyId,
    societyStatus: 'active',
    favorUsed: false,
    mutationId,
    mutationUsed: false,
    log: Array.isArray(v.log)
      ? v.log.map((e) => ({ aids: [], rerolled: null, ...(e as object) }))
      : [],
    pending: v.pending
      ? { aids: [], rerolled: null, ...(v.pending as object) }
      : null,
  }
  return isRunState(upgraded) ? upgraded : null
}

export function isRunState(value: unknown): value is RunState {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<RunState>
  return (
    v.version === SAVE_VERSION &&
    typeof v.department === 'string' &&
    SOCIETIES.some((x) => x.id === v.societyId) &&
    MUTATIONS.some((x) => x.id === v.mutationId) &&
    (v.societyStatus === 'active' ||
      v.societyStatus === 'met' ||
      v.societyStatus === 'betrayed') &&
    typeof v.favorUsed === 'boolean' &&
    typeof v.mutationUsed === 'boolean' &&
    typeof v.seed === 'string' &&
    typeof v.rng === 'number' &&
    typeof v.position === 'number' &&
    Array.isArray(v.deck) &&
    v.deck.every(
      (id) =>
        id === BOSS_CARD || ORIENTATION.encounters.some((e) => e.id === id),
    ) &&
    Array.isArray(v.flags) &&
    Array.isArray(v.log) &&
    !!v.meters &&
    METERS.every((k) => typeof v.meters?.[k] === 'number') &&
    !!v.skills &&
    SKILLS.every((k) => typeof v.skills?.[k] === 'number') &&
    (v.status === 'playing' ||
      v.status === 'department-complete' ||
      v.status === 'eliminated')
  )
}
