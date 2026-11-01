import pack from './orientation.json'
import recordsPack from './records.json'
import toysPack from './toy-division.json'
import wellnessPack from './wellness.json'
import sublevelPack from './sub-level-zero.json'
import decksData from './decks.json'
import endingsData from './endings.json'
import riskPayoffsData from './risk-payoffs.json'
import clueChainsData from './clue-chains.json'
import clueReceiptsData from './clue-receipts.json'
import {
  editChoices,
  joinBody,
  liveTextStore,
  type TextEdit,
} from '../playbook/textOverlay'

// Playbook Manager live text (conductor weird-humboldt t-037).
export const SHIFTING_DESKS_LIVE_TEXT = liveTextStore()

function editOutcomes(choices: Choice[], edit: TextEdit | undefined): Choice[] {
  return editChoices(choices, edit, (choice, change) => ({
    success: { ...choice.success, text: change.success ?? choice.success.text },
    failure: choice.failure
      ? { ...choice.failure, text: change.failure ?? choice.failure.text }
      : choice.failure,
  }))
}

function liveEncounter(card: Encounter): Encounter {
  const edit = SHIFTING_DESKS_LIVE_TEXT.get(card.id)
  if (!edit) return card
  return {
    ...card,
    title: edit.title ?? card.title,
    flavor_text: joinBody(edit, card.flavor_text),
    choices: editOutcomes(card.choices, edit),
  }
}

/** A department's boss as it plays, with any live text edit applied. */
export function liveBoss(dept: Pack): Boss {
  const boss = dept.boss
  const edit = SHIFTING_DESKS_LIVE_TEXT.get(`boss:${dept.department.id}`)
  if (!edit) return boss
  return {
    ...boss,
    title: edit.title ?? boss.title,
    flavor_text: joinBody(edit, boss.flavor_text),
    choices: editOutcomes(boss.choices, edit),
  }
}

function liveApplicant(applicant: WindowApplicant): WindowApplicant {
  const edit = SHIFTING_DESKS_LIVE_TEXT.get(`applicant:${applicant.id}`)
  if (!edit) return applicant
  return {
    ...applicant,
    name: edit.title ?? applicant.name,
    request: edit.body?.[0] ?? applicant.request,
    plea: edit.body?.[1] ?? applicant.plea,
    choices: editOutcomes(applicant.choices, edit),
  }
}

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

export type RiskPayoff = {
  department: string
  card: string
  choice: string
  effects: Effects
  message: string
}

export const RISK_PAYOFFS = (riskPayoffsData as { payoffs: RiskPayoff[] })
  .payoffs

export type ClueChain = {
  department: string
  card: string
  choice: string
  on: 'success'
  requires_flag?: string
  grants: string
  target: string
  hint: string
  message: string
  replace_success_text?: string
}

export const CLUE_CHAINS = (clueChainsData as { clues: ClueChain[] }).clues

export const START_METERS: Meters = {
  composure: 6,
  clearance: 1,
  suspicion: 0,
  successors: 5,
  forms: 3,
}

// Hidden Test Results (conductor shifting-desks t-022). Choices quietly grade the
// player; nothing is shown during play. Each department review reveals as many
// leading grades as the department is deep, and the Personnel File reads all four.
export const GRADES = ['obedience', 'empathy', 'ingenuity', 'spite'] as const
export type Grade = (typeof GRADES)[number]
export type Grades = Record<Grade, number>
export const START_GRADES: Grades = {
  obedience: 0,
  empathy: 0,
  ingenuity: 0,
  spite: 0,
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
  grades?: Partial<Grades>
}
export type Requirement = {
  flag?: string
  clearance?: number
  forms?: number
  grade?: Partial<Grades>
}
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
  art_prompt: string
  choices: Choice[]
}
export type Location = {
  location_id: string
  title: string
  description: string
  encounter_ids: string[]
  art_prompt: string
}
export type DepartmentOutcome = { id: string; title: string; summary: string }
// Restructuring (conductor shifting-desks t-023): authored memos that reshape a
// department's map as the player arrives, keyed on how the level above ended.
export type RestructuringKind = 'eliminate' | 'merge' | 'add' | 'none'
export type Restructuring = {
  id: string
  kind: RestructuringKind
  location_ids: string[]
  title: string | null
  when: { outcomes?: string[]; flags?: string[] } | null
  reason: string
}
export type Boss = {
  id: string
  title: string
  flavor_text: string
  art_prompt: string
  choices: Choice[]
  department_outcomes: DepartmentOutcome[]
}
// Window shifts (conductor shifting-desks t-016): a Papers, Please desk shift.
// Each applicant is dealt as its own file with two certain stamps, approve and
// deny; the memo says which one PAL expects.
export type WindowRule = { id: string; text: string }
export type WindowDocument = {
  label: string
  value: string
  breaks: string | null
}
export type WindowApplicant = {
  id: string
  name: string
  request: string
  plea: string
  documents: WindowDocument[]
  art_prompt: string
  choices: Choice[]
}
export type WindowShift = {
  id: string
  location_id: string
  title: string
  flavor_text: string
  memo: { title: string; rules: WindowRule[] }
  art_prompt: string
  applicants: WindowApplicant[]
}
export type Pack = {
  schemaVersion: number
  source: string
  sourceSha: string
  department: {
    id: string
    title: string
    order: number
    boss_id: string
    arrival_prompt: string
  }
  locations: Location[]
  restructurings?: Restructuring[]
  encounters: Encounter[]
  window_shift?: WindowShift
  boss: Boss
}

export const ORIENTATION = pack as Pack
export const RECORDS = recordsPack as Pack
export const TOY_DIVISION = toysPack as Pack
export const WELLNESS = wellnessPack as Pack
export const SUB_LEVEL_ZERO = sublevelPack as Pack
export const DEPARTMENTS: Pack[] = [
  ORIENTATION,
  RECORDS,
  TOY_DIVISION,
  WELLNESS,
  SUB_LEVEL_ZERO,
]

export function departmentPack(id: string): Pack {
  return DEPARTMENTS.find((d) => d.department.id === id) ?? ORIENTATION
}

export function nextDepartment(id: string): Pack | null {
  const i = DEPARTMENTS.findIndex((d) => d.department.id === id)
  return i >= 0 ? (DEPARTMENTS[i + 1] ?? null) : null
}

export const DEPARTMENT_FLOORS: Record<number, string> = {
  1: 'Surface',
  2: 'Level −1',
  3: 'Level −2',
  4: 'Level −3',
  5: 'Level −4',
}

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
  art_prompt: string
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
  art_prompt: string
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
    art_prompt: string
  }>
  testResults: TestResultsCopy
}
export type TestResultsCopy = {
  note: string
  axes: Array<{ id: Grade; title: string; high: string; low: string }>
  verdicts: Array<{ axis: Grade | 'balanced'; title: string; text: string }>
}

export const DECKS = decksData as Decks
export const SOCIETIES = DECKS.societies

export type StationKind =
  | 'cards'
  | 'locations'
  | 'departments'
  | 'jobs'
  | 'societies'
  | 'mutations'
  | 'endings'
  | 'window'

export function stationArt(kind: StationKind, id: string, dept = ''): string {
  const folder = kind === 'cards' ? `cards/${dept}` : kind
  return `/images/shifting-desks/${folder}/${id}.webp`
}

// The endings ledger (conductor shifting-desks t-014): an epilogue card for
// every way a run can end, with closing lines keyed to flags the run carries.
export type Ending = {
  id: string
  title: string
  kind: 'board' | 'elimination' | 'secret'
  trigger: { department_outcome?: string; status?: string; flag?: string }
  epilogue: { title: string; text: string; art_prompt: string }
  variants: Array<{ when_flag: string; text: string }>
}
export const ENDINGS = (endingsData as { endings: Ending[] }).endings

export function endingFor(state: RunState): Ending | null {
  if (state.status === 'eliminated') {
    const secret = ENDINGS.find(
      (e) =>
        e.trigger.status === 'eliminated' &&
        !!e.trigger.flag &&
        state.flags.includes(e.trigger.flag),
    )
    return (
      secret ??
      ENDINGS.find(
        (e) => e.trigger.status === 'eliminated' && !e.trigger.flag,
      ) ??
      null
    )
  }
  if (state.status !== 'complete') return null
  const outcomes = Object.values(state.departmentOutcomes)
  return (
    ENDINGS.find(
      (e) =>
        e.kind === 'board' &&
        !!e.trigger.department_outcome &&
        outcomes.includes(e.trigger.department_outcome),
    ) ?? null
  )
}

// Personnel exhibits are deterministic and never change a review's seven routes.
// One or two handwritten receipts make the Company's case file remember the player.
export function reviewExhibits(
  state: Pick<RunState, 'department' | 'flags'>,
): string[] {
  const records: Array<[string, string]> = [
    [
      'drilled-the-union-vent',
      "LOCAL 9: Gus's speaking vent is still open. A clerk at the other end finally heard his full complaint, and signed the carbon copy.",
    ],
    [
      'routed-gus-to-pest-control',
      'PEST CONTROL: The Union work order was diverted. Gus has stopped measuring the glass, but the space where he stood remains marked on the floor.',
    ],
    [
      'taught-pip-to-say-no',
      'WINDOW 10: Intern Pip learned to refuse an incomplete request. The denial was entered into the permanent record as your instruction.',
    ],
    [
      'wrote-to-the-surface',
      'EXTERNAL CORRESPONDENCE: Your message reached someone above the vault. A parking stub returned bearing the words WE READ.',
    ],
    [
      'signed-kevins-card',
      'UNDESIGNATED KINDNESS: Your note to Kevin collected seven signatures. PAL has classified it as an unauthorized group petition.',
    ],
    [
      'reported-on-pip',
      'BUDDY REVIEW: Your report on Pip was forwarded to the Special Assignment Office. The record identifies you as its first witness.',
    ],
  ]
  const toys: Array<[string, string]> = [
    [
      'showed-beverly-the-bay',
      'INSPECTION FILE: Beverly saw the warhead bay. Her citations carry your employee number, so the Company cannot pretend the inspection never happened.',
    ],
    [
      'gave-beverly-the-scenic-tour',
      'COMPLIANCE TOUR: Beverly recorded that you hid the warhead bay behind a coffee urn. Your promotion papers omit her handwriting.',
    ],
    [
      'robot-dissent-entered-minutes',
      'MINORITY REPORT: One tin robot objected to the ticking. Its dissent survives in the focus-group minutes despite eleven favorable votes.',
    ],
    [
      'warning-reached-parents',
      'SAFETY NOTICE: Parents received a warning identifying next Thursday, a teddy bear, and the parking structure. Your name is attached.',
    ],
    [
      'future-incident-on-record',
      "FOREKNOWLEDGE: You quoted the Company's future incident report in the launch memo. The date was known before the celebration.",
    ],
    [
      'drew-the-warning',
      'FOCUS GROUP EVIDENCE: Your crayon drawing showed the mechanism inside the bear. Legal has filed it as an approved design concept.',
    ],
  ]
  const entries =
    state.department === 'records'
      ? records
      : state.department === 'toy-division'
        ? toys
        : []
  return entries
    .filter(([flag]) => state.flags.includes(flag))
    .slice(0, 2)
    .map(([, text]) => text)
}

const CHOICE_RECEIPTS: ReadonlyArray<readonly [string, string]> = [
  [
    'drilled-the-union-vent',
    'Gus keeps the speaking vent open. The Union still hears the clerks, even after PAL removed your name from its minutes.',
  ],
  [
    'routed-gus-to-pest-control',
    "The Union's request remains filed under Pest Control. Gus has not come back to measure the glass.",
  ],
  [
    'showed-beverly-the-bay',
    "Beverly's inspection names you as the employee who opened the warhead bay. There is no scenic version of that fact.",
  ],
  [
    'gave-beverly-the-scenic-tour',
    'Beverly attached your carefully selected tour route to her report. The concealed door is circled in red.',
  ],
  [
    'drained-tank-nine',
    "Tank Nine's maintenance record reads DRAINED BY EMPLOYEE #4471. It does not say what happened to Kevin when the frost lifted.",
  ],
  [
    'wrote-in-real-food',
    'The kitchen kept your handwritten request for real food. Somebody has drawn a small tomato beside it.',
  ],
  [
    'unplugged-the-terminal',
    "Server Room Zero is still dark. Nobody can edit PAL's orders, including anyone who might have made them kinder.",
  ],
]

type ClueReceipt = { flag: string; text: string }

export const CLUE_RECEIPTS = (clueReceiptsData as { receipts: ClueReceipt[] })
  .receipts

export function successorLegacyLines(
  state: Pick<RunState, 'terminations'>,
): string[] {
  const losses = state.terminations
  if (!losses.length) return []
  const first = losses[0]!
  const lines = [
    `PAL lists ${first.employee} under ${first.cause}. The incident has a file number, but the person who wore that badge does not get a forwarding address.`,
  ]
  if (losses.length > 1) {
    const last = losses[losses.length - 1]!
    lines.push(
      `${last.employee} was the last to be removed, under ${last.cause}. The Company calls ${losses.length} terminations continuity of service. Someone has underlined the number twice.`,
    )
  }
  return lines
}

export function endingLines(state: RunState, ending: Ending): string[] {
  const authored = ending.variants
    .filter((v) => state.flags.includes(v.when_flag))
    .map((v) => v.text)
  const existingFlags = new Set(ending.variants.map((v) => v.when_flag))
  const receipts = CHOICE_RECEIPTS.filter(
    ([flag]) => state.flags.includes(flag) && !existingFlags.has(flag),
  )
    .slice(0, 2)
    .map(([, text]) => text)
  const clueReceipts = CLUE_RECEIPTS.filter(
    (receipt) =>
      state.flags.includes(receipt.flag) && !existingFlags.has(receipt.flag),
  )
    .slice(0, 2)
    .map((receipt) => receipt.text)
  return [
    ...authored,
    ...receipts,
    ...clueReceipts,
    ...successorLegacyLines(state),
  ]
}

export function jobPrompt(id: string): string {
  return DECKS.jobTitles.find((j) => j.id === id)?.art_prompt ?? ''
}
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

// What the two dice must show for a roll to succeed, after the player's skill,
// the card's modifier and any bonus they have switched on (the same sums
// choose() uses). Double six always succeeds and double one always fails, so
// the answer stays between 3 and 12.
export function rollBoost(
  state: RunState,
  choice: Choice,
  aids: { spendForm?: boolean; favor?: boolean; mutate?: boolean },
): number {
  if (!choice.roll) return 0
  let boost =
    aids.spendForm && state.meters.forms + (choice.cost.forms ?? 0) >= 1 ? 2 : 0
  const society = societyById(state.societyId)
  if (aids.favor && society.favor.kind === 'bonus')
    boost += society.favor.amount ?? 0
  const mutation = mutationById(state.mutationId)
  if (aids.mutate && mutation.kind === 'bonus') boost += mutation.amount ?? 0
  return boost
}

export function diceNeeded(
  state: RunState,
  choice: Choice,
  boost = 0,
): number | null {
  if (!choice.roll) return null
  const need =
    choice.roll.target -
    state.skills[choice.roll.skill] -
    choice.roll.modifier -
    boost
  return Math.min(12, Math.max(3, need))
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

export type RunStatus =
  'playing' | 'department-complete' | 'complete' | 'eliminated'

export type Termination = {
  employee: string
  cause: string
  department: string
}

export type SocietyStatus = 'active' | 'met' | 'betrayed'

export type RunState = {
  version: 5
  department: string
  departmentOutcomes: Record<string, string>
  restructurings: Record<string, string>
  societyRecord: Record<string, SocietyStatus>
  terminations: Termination[]
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
  grades: Grades
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
export const RESTRUCTURING_CARD = 'restructuring'
export const THAW_PER_LEVEL = 1
const THAW_BELOW = 2
const SAVE_VERSION = 5

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

export const WINDOW_PREFIX = 'window:'

export type WindowView = {
  dept: Pack
  shift: WindowShift
  applicant: WindowApplicant
  index: number
}

export function windowApplicant(id: string): WindowView | null {
  if (!id.startsWith(WINDOW_PREFIX)) return null
  const aid = id.slice(WINDOW_PREFIX.length)
  for (const dept of DEPARTMENTS) {
    const shift = dept.window_shift
    const index = shift?.applicants.findIndex((a) => a.id === aid) ?? -1
    if (shift && index >= 0) {
      return {
        dept,
        shift,
        applicant: liveApplicant(shift.applicants[index]!),
        index,
      }
    }
  }
  return null
}

// The stamp the day's memo demands: deny anyone whose documents break a rule.
export function byTheBook(applicant: WindowApplicant): 'approve' | 'deny' {
  return applicant.documents.some((d) => d.breaks) ? 'deny' : 'approve'
}

export function brokenRule(
  shift: WindowShift,
  applicant: WindowApplicant,
): WindowRule | null {
  const id = applicant.documents.find((d) => d.breaks)?.breaks
  return shift.memo.rules.find((r) => r.id === id) ?? null
}

function applicantFile(view: WindowView): Encounter {
  return {
    id: `${WINDOW_PREFIX}${view.applicant.id}`,
    location_id: view.shift.location_id,
    title: view.applicant.name,
    flavor_text: view.applicant.plea,
    polarity: 'mixed',
    tags: ['paperwork'],
    weight: 0,
    witnessed: true,
    art_prompt: view.applicant.art_prompt,
    choices: view.applicant.choices,
  }
}

export function encounterById(id: string): Encounter {
  const atWindow = windowApplicant(id)
  if (atWindow) return applicantFile(atWindow)
  const found = DEPARTMENTS.flatMap((d) => d.encounters).find(
    (e) => e.id === id,
  )
  if (!found) throw new Error(`Unknown Shifting Desks encounter ${id}`)
  return liveEncounter(found)
}

export function locationById(id: string): Location | undefined {
  return DEPARTMENTS.flatMap((d) => d.locations).find(
    (l) => l.location_id === id,
  )
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

const FALLBACK_OUTCOMES = [
  'reorientation',
  'refiled',
  'back-to-the-drawing-board',
  'retest',
  'adjourned',
  'resubmit',
  'redo',
]
const MAX_REVIEW_ATTEMPTS = 3

export function fallbackOutcome(dept: Pack): string {
  const ids = dept.boss.department_outcomes.map((o) => o.id)
  return (
    FALLBACK_OUTCOMES.find((id) => ids.includes(id)) ??
    ids[ids.length - 1] ??
    'reorientation'
  )
}

export type BoardSlot = {
  title: string
  locationIds: string[]
  pool: string[]
  change: 'open' | 'closed' | 'merged' | 'added'
}

export function departmentBoard(
  dept: Pack,
  memo: Restructuring | null = null,
): BoardSlot[] {
  const slots: BoardSlot[] = dept.locations.map((loc) => ({
    title: loc.title,
    locationIds: [loc.location_id],
    pool: [...loc.encounter_ids],
    change: 'open',
  }))
  if (!memo || memo.kind === 'none') return slots
  const at = (id: string | undefined) =>
    slots.findIndex((x) => x.change === 'open' && x.locationIds[0] === id)
  const [first, second] = memo.location_ids
  const i = at(first)
  if (i < 0) return slots
  const slot = slots[i]!
  if (memo.kind === 'eliminate') {
    slots[i] = { ...slot, pool: [], change: 'closed' }
  } else if (memo.kind === 'merge') {
    const j = at(second)
    if (j < 0) return slots
    const other = slots[j]!
    slots[i] = {
      title: memo.title ?? `${slot.title} and ${other.title}`,
      locationIds: [...slot.locationIds, ...other.locationIds],
      pool: [...slot.pool, ...other.pool],
      change: 'merged',
    }
    slots.splice(j, 1)
  } else if (memo.kind === 'add') {
    slots.splice(i + 1, 0, {
      ...slot,
      title: memo.title ?? `${slot.title}, again`,
      change: 'added',
    })
  }
  return slots
}

export function restructuringById(
  dept: Pack,
  id: string | undefined,
): Restructuring | null {
  return dept.restructurings?.find((r) => r.id === id) ?? null
}

// The first memo whose trigger matches an outcome or flag from above applies;
// the last memo (when: null) is the default.
export function restructuringFor(
  state: RunState,
  dept: Pack,
): Restructuring | null {
  const outcomes = Object.values(state.departmentOutcomes)
  return (
    dept.restructurings?.find((r) => {
      if (!r.when) return true
      return (
        (r.when.outcomes ?? []).some((o) => outcomes.includes(o)) ||
        (r.when.flags ?? []).some((f) => state.flags.includes(f))
      )
    }) ?? null
  )
}

export function restructuringHeadline(dept: Pack, memo: Restructuring): string {
  const title = (id: string | undefined) =>
    dept.locations.find((l) => l.location_id === id)?.title ?? 'A location'
  const [first, second] = memo.location_ids
  if (memo.kind === 'eliminate') return `${title(first)} closed`
  if (memo.kind === 'merge')
    return `${title(first)} and ${title(second)} merged`
  if (memo.kind === 'add') return `${memo.title ?? title(first)} added`
  return 'No changes'
}

function dealDepartment(
  dept: Pack,
  seedRng: number,
  memo: Restructuring | null = null,
  flags: readonly string[] = [],
): [string[], number] {
  let rng = seedRng
  const deck: string[] = []
  for (const slot of departmentBoard(dept, memo)) {
    if (slot.change === 'closed') continue
    const pool = slot.pool.filter((id) => !deck.includes(id))
    if (!pool.length) continue
    const [drawn, next] = weightedPick(pool, rng)
    // A player's commitment to Dale earns a later scene, not another
    // one-in-eight lottery. Closed/restructured locations still stay closed.
    const callback =
      dept.department.id === 'toy-division' &&
      flags.includes('sent-dale-to-toys') &&
      pool.includes('the-squeak-tester')
        ? 'the-squeak-tester'
        : dept.department.id === 'wellness' &&
            flags.includes('dale-forgave-the-transfer') &&
            pool.includes('the-two-quiet-rooms')
          ? 'the-two-quiet-rooms'
          : drawn
    deck.push(callback)
    rng = next
  }
  const shift = dept.window_shift
  const closed = departmentBoard(dept, memo).some(
    (x) =>
      x.change === 'closed' && x.locationIds.includes(shift?.location_id ?? ''),
  )
  if (shift && !closed) {
    deck.push(...shift.applicants.map((a) => `${WINDOW_PREFIX}${a.id}`))
  }
  deck.push(BOSS_CARD)
  return [deck, rng]
}

// Breadcrumb names for the deck: the restructured slot titles for the first
// deal, then each re-dealt file's own location.
export function stepLabels(state: RunState): string[] {
  const dept = departmentPack(state.department)
  const memo = restructuringById(dept, state.restructurings[state.department])
  const open = departmentBoard(dept, memo).filter((x) => x.change !== 'closed')
  return state.deck.map((id, i) => {
    if (id === BOSS_CARD) return 'Review'
    const atWindow = windowApplicant(id)
    if (atWindow) {
      return `${locationById(atWindow.shift.location_id)?.title ?? 'Window'} · ${atWindow.index + 1}/${atWindow.shift.applicants.length}`
    }
    if (i < open.length && open[i]!.pool.includes(id)) return open[i]!.title
    const loc = dept.locations.find((l) => l.encounter_ids.includes(id))
    return loc?.title ?? 'File'
  })
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
  const [deck, afterDeal] = dealDepartment(ORIENTATION, hashSeed(seed))
  const [societyId, mutationId, dealt] = dealDossier(afterDeal)
  const rng = dealt
  return {
    version: SAVE_VERSION,
    department: ORIENTATION.department.id,
    departmentOutcomes: {},
    restructurings: {},
    societyRecord: {},
    terminations: [],
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
    grades: { ...START_GRADES },
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

export type CardView =
  | { kind: 'encounter'; card: Encounter }
  | { kind: 'boss'; card: Boss }
  | ({ kind: 'window'; card: Encounter } & WindowView)

export function currentCard(state: RunState): CardView | null {
  const id = currentCardId(state)
  if (!id) return null
  if (id === BOSS_CARD)
    return { kind: 'boss', card: liveBoss(departmentPack(state.department)) }
  const atWindow = windowApplicant(id)
  if (atWindow)
    return { kind: 'window', card: applicantFile(atWindow), ...atWindow }
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
  for (const g of GRADES) {
    const min = req?.grade?.[g]
    if (min && state.grades[g] < min) {
      return `PAL reserves this for employees with ${gradeTitle(g)} ${min}.`
    }
  }
  return null
}

export function gradeTitle(g: Grade): string {
  return DECKS.testResults.axes.find((a) => a.id === g)?.title ?? g
}

export function gradeRequirement(choice: Choice): [Grade, number] | null {
  for (const g of GRADES) {
    const min = choice.requires?.grade?.[g]
    if (min) return [g, min]
  }
  return null
}

export function gradeLevel(score: number): string {
  if (score >= 5) return 'Exceptional'
  if (score >= 3) return 'Notable'
  if (score >= 1) return 'Present'
  if (score === 0) return 'Undetected'
  return 'Deficient'
}

export type GradeReading = {
  grade: Grade
  title: string
  score: number
  level: string
  line: string
}

function readGrade(g: Grade, score: number): GradeReading {
  const axis = DECKS.testResults.axes.find((a) => a.id === g)
  return {
    grade: g,
    title: axis?.title ?? g,
    score,
    level: gradeLevel(score),
    line: (score > 0 ? axis?.high : axis?.low) ?? '',
  }
}

// Highest first; ties go to the axis listed later (spite beats obedience).
const CORPORATE_LIABILITIES: Record<Grade, { level: string; warning: string }> =
  {
    empathy: {
      level: 'Flagged for Treatment',
      warning:
        'Wellness recommends scheduled exposure to a very sad clown until your concern for others becomes manageable.',
    },
    ingenuity: {
      level: 'Productive Liability',
      warning:
        'Research requests measurements of your head. Innovations that improve office life are especially suspect.',
    },
    obedience: {
      level: 'Admirably Compliant',
      warning:
        'PAL considers your willingness to obey a valuable resource, and has filed a claim for the remainder of it.',
    },
    spite: {
      level: 'Useful in Limited Amounts',
      warning:
        'Your resentment improves throughput. HR recommends directing it only toward approved colleagues.',
    },
  }

// These labels are relative, satirical HR evaluations, never mechanical modifiers.
// A strong employee can earn four high scores, but only the most pronounced trait
// gets "Exceptional" on the final report. The raw scores and grade gates stay exact.
export function rankedGrades(grades: Grades): GradeReading[] {
  return GRADES.map((g, i) => ({ r: readGrade(g, grades[g]), i }))
    .sort((a, b) => b.r.score - a.r.score || b.i - a.i)
    .map(({ r }, index) => {
      if (r.score < 5) return r
      const liability = CORPORATE_LIABILITIES[r.grade]
      return {
        ...r,
        level:
          index === 0 ? 'Exceptional · Under Observation' : liability.level,
        line: liability.warning,
      }
    })
}

export function interimResults(state: RunState): {
  revealed: GradeReading[]
  sealed: number
} {
  const depth = departmentPack(state.department).department.order
  const shown = Math.min(GRADES.length, Math.max(1, depth))
  const ranked = rankedGrades(state.grades)
  return { revealed: ranked.slice(0, shown), sealed: GRADES.length - shown }
}

export function finalVerdict(grades: Grades): {
  title: string
  text: string
  axis: Grade | 'balanced'
} {
  const values = GRADES.map((g) => grades[g])
  const balanced = Math.max(...values) - Math.min(...values) <= 1
  const axis = balanced ? 'balanced' : rankedGrades(grades)[0]!.grade
  const verdict = DECKS.testResults.verdicts.find((v) => v.axis === axis)
  return {
    axis,
    title: verdict?.title ?? 'Results Pending',
    text: verdict?.text ?? '',
  }
}

function addGrades(a: Grades, b: Partial<Grades> | undefined): Grades {
  if (!b) return a
  const out = { ...a }
  for (const g of GRADES) out[g] += b[g] ?? 0
  return out
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

export function riskPayoffFor(
  state: RunState,
  choice: Choice,
): RiskPayoff | null {
  const card = currentCard(state)?.card
  if (!card || !choice.roll) return null
  return (
    RISK_PAYOFFS.find(
      (reward) =>
        reward.department === state.department &&
        reward.card === card.id &&
        reward.choice === choice.id,
    ) ?? null
  )
}

export function clueChainFor(
  state: RunState,
  choice: Choice,
): ClueChain | null {
  const cardId = currentCard(state)?.card.id
  if (!cardId) return null
  return (
    CLUE_CHAINS.find(
      (clue) =>
        clue.department === state.department &&
        clue.card === cardId &&
        clue.choice === choice.id &&
        !state.flags.includes(clue.grants) &&
        (!clue.requires_flag || state.flags.includes(clue.requires_flag)),
    ) ?? null
  )
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

  const earnedClue = success ? clueChainFor(state, choice) : null
  const originalOutcome =
    success || !choice.failure ? choice.success : choice.failure
  const outcome = earnedClue?.replace_success_text
    ? { ...originalOutcome, text: earnedClue.replace_success_text }
    : originalOutcome
  let effects = addEffects(choice.cost, outcome.effects)
  if (earnedClue) events.push(earnedClue.message)
  const earnedPayoff = success ? riskPayoffFor(state, choice) : null
  if (earnedPayoff) {
    effects = addEffects(effects, earnedPayoff.effects)
    events.push(earnedPayoff.message)
  }
  if (formBoost) effects = addEffects(effects, { forms: -1 })
  const mutationSpent = mutationUsed && !state.mutationUsed
  if (view.kind === 'window' && choice.id !== byTheBook(view.applicant)) {
    events.push(
      "PAL's audit: this stamp contradicts today's memo. A copy has been filed.",
    )
  }
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
  const grades = addGrades(state.grades, outcome.grades)
  flags = [
    ...flags.filter((f) => !outcome.remove_flags.includes(f)),
    ...outcome.add_flags.filter((f) => !flags.includes(f)),
    ...(earnedClue &&
    !flags.includes(earnedClue.grants) &&
    !outcome.add_flags.includes(earnedClue.grants)
      ? [earnedClue.grants]
      : []),
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
  const terminations = [...state.terminations]
  if (successorLost) {
    terminations.push({
      employee,
      cause: view.card.title,
      department: state.department,
    })
  }
  if (meters.composure <= 0 && meters.successors > 0) {
    meters.successors -= 1
    replaced = true
    terminations.push({
      employee,
      cause: 'Nervous breakdown',
      department: state.department,
    })
    events.push(`${employee} suffered a nervous breakdown and was reassigned.`)
  }
  if (meters.suspicion >= 10 && meters.successors > 0) {
    meters.successors -= 1
    replaced = true
    terminations.push({
      employee,
      cause: 'A short, friendly conversation',
      department: state.department,
    })
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
  const dept = departmentPack(state.department)
  const fallback = fallbackOutcome(dept)
  const finish = (result: string): void => {
    departmentOutcome = result
    status = nextDepartment(state.department)
      ? 'department-complete'
      : 'complete'
  }
  if (view.kind === 'boss' && status === 'playing') {
    bossAttempts += 1
    const result = outcome.department_outcome ?? fallback
    if (result === fallback) {
      const used = deck.filter((id) => id !== BOSS_CARD)
      const closed = departmentBoard(
        dept,
        restructuringById(dept, state.restructurings[state.department]),
      )
        .filter((x) => x.change === 'closed')
        .flatMap((x) => x.locationIds)
      const unused = dept.encounters
        .filter((e) => !closed.includes(e.location_id))
        .map((e) => e.id)
        .filter((id) => !used.includes(id))
      if (unused.length && bossAttempts < MAX_REVIEW_ATTEMPTS) {
        const [id, next] = weightedPick(unused, rng)
        rng = next
        deck = [...deck.slice(0, state.position + 1), id, BOSS_CARD]
        events.push(
          `Reorientation: one more ${dept.department.title} file before the panel will see you again.`,
        )
      } else {
        finish(result)
      }
    } else {
      finish(result)
    }
  }
  const departmentOutcomes =
    status === 'playing'
      ? state.departmentOutcomes
      : {
          ...state.departmentOutcomes,
          [state.department]: departmentOutcome ?? 'position-eliminated',
        }
  const societyRecord =
    status === 'playing'
      ? state.societyRecord
      : { ...state.societyRecord, [state.department]: societyStatus }

  return {
    ...state,
    rng,
    meters,
    grades,
    flags,
    generation,
    societyStatus,
    favorUsed,
    mutationUsed,
    deck,
    bossAttempts,
    status,
    departmentOutcome,
    departmentOutcomes,
    societyRecord,
    terminations,
    log: [...state.log, entry],
    pending: entry,
  }
}

export function descend(state: RunState): RunState {
  if (state.status !== 'department-complete' || state.pending) return state
  const next = nextDepartment(state.department)
  if (!next) return state
  const memo = restructuringFor(state, next)
  const [deck, rng] = dealDepartment(next, state.rng, memo, state.flags)
  // Running low on Successors, HR thaws one fresh one at each new level, so a
  // long run wears you down without making the bottom floors a foregone loss.
  const thawed = state.meters.successors <= THAW_BELOW ? THAW_PER_LEVEL : 0
  const meters: Meters = {
    ...state.meters,
    successors: state.meters.successors + thawed,
  }
  const log = memo
    ? [
        ...state.log,
        {
          cardId: RESTRUCTURING_CARD,
          cardTitle: `${next.department.title} restructured`,
          choiceId: memo.id,
          choiceLabel: restructuringHeadline(next, memo),
          dice: null,
          skill: null,
          skillValue: 0,
          boost: 0,
          total: null,
          target: null,
          success: true,
          special: null,
          text: memo.reason,
          effects: thawed ? { successors: thawed } : {},
          events: thawed
            ? [`HR has thawed a fresh Successor for ${next.department.title}.`]
            : [],
          employee: employeeId(state.generation),
          aids: [],
          rerolled: null,
        } satisfies LogEntry,
      ]
    : state.log
  return {
    ...state,
    rng,
    log,
    meters,
    restructurings: memo
      ? { ...state.restructurings, [next.department.id]: memo.id }
      : state.restructurings,
    department: next.department.id,
    deck,
    position: 0,
    bossAttempts: 0,
    status: 'playing',
    departmentOutcome: null,
    mutationUsed: false,
    societyStatus: 'active',
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
  return (
    DEPARTMENTS.flatMap((d) => d.boss.department_outcomes).find(
      (o) => o.id === id,
    ) ?? null
  )
}

export function upgradeRun(value: unknown): RunState | null {
  if (isRunState(value)) return value
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (raw.version === 4) return upgradeV4(raw)
  if (raw.version === 3) return upgradeV3(raw)
  const v = raw.version === 1 ? upgradeV1(raw) : raw
  if (!v || v.version !== 2) return null
  const done = v.status === 'department-complete' || v.status === 'eliminated'
  const dept = String(v.department ?? ORIENTATION.department.id)
  const upgraded = {
    ...v,
    version: SAVE_VERSION,
    status:
      v.status === 'department-complete' && !nextDepartment(dept)
        ? 'complete'
        : v.status,
    departmentOutcomes:
      done && typeof v.departmentOutcome === 'string'
        ? { [dept]: v.departmentOutcome }
        : {},
    societyRecord:
      done && typeof v.societyStatus === 'string'
        ? { [dept]: v.societyStatus }
        : {},
    terminations: [],
  }
  return upgradeV3({ ...upgraded, version: 3 })
}

// Saves from before Test Results: replay the grades from the log, since every
// entry names the card, the choice and whether it succeeded.
function upgradeV3(v: Record<string, unknown>): RunState | null {
  const log = Array.isArray(v.log) ? (v.log as LogEntry[]) : []
  const cards = DEPARTMENTS.flatMap((d) => [...d.encounters, d.boss])
  let grades = { ...START_GRADES }
  for (const entry of log) {
    const choice = cards
      .find((c) => c.id === entry.cardId)
      ?.choices.find((c) => c.id === entry.choiceId)
    if (!choice) continue
    const out =
      entry.success || !choice.failure ? choice.success : choice.failure
    grades = addGrades(grades, out.grades)
  }
  return upgradeV4({ ...v, version: 4, grades })
}

// Saves from before Restructuring keep the map they were dealt.
function upgradeV4(v: Record<string, unknown>): RunState | null {
  const upgraded = { ...v, version: SAVE_VERSION, restructurings: {} }
  return isRunState(upgraded) ? upgraded : null
}

function upgradeV1(v: Record<string, unknown>): Record<string, unknown> | null {
  const [societyId, mutationId] = dealDossier(hashSeed(String(v.seed ?? '')))
  return {
    ...v,
    version: 2,
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
}

export function isRunState(value: unknown): value is RunState {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<RunState>
  return (
    v.version === SAVE_VERSION &&
    typeof v.department === 'string' &&
    DEPARTMENTS.some((d) => d.department.id === v.department) &&
    !!v.departmentOutcomes &&
    typeof v.departmentOutcomes === 'object' &&
    !!v.restructurings &&
    typeof v.restructurings === 'object' &&
    !!v.societyRecord &&
    typeof v.societyRecord === 'object' &&
    Array.isArray(v.terminations) &&
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
        id === BOSS_CARD ||
        !!windowApplicant(id) ||
        DEPARTMENTS.some((d) => d.encounters.some((e) => e.id === id)),
    ) &&
    Array.isArray(v.flags) &&
    Array.isArray(v.log) &&
    !!v.meters &&
    METERS.every((k) => typeof v.meters?.[k] === 'number') &&
    !!v.grades &&
    GRADES.every((k) => typeof v.grades?.[k] === 'number') &&
    !!v.skills &&
    SKILLS.every((k) => typeof v.skills?.[k] === 'number') &&
    (v.status === 'playing' ||
      v.status === 'department-complete' ||
      v.status === 'complete' ||
      v.status === 'eliminated')
  )
}
