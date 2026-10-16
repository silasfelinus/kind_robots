// Seeded balance simulation (conductor shifting-desks t-019). Policy bots with
// fixed temperaments play thousands of seeded runs through the real engine so
// the report shows what each play style costs, and the tests can hold the line:
// no style wins clean, and every ending stays reachable.
import {
  type Choice,
  type Grade,
  type Meter,
  type RunState,
  DEPARTMENTS,
  ENDINGS,
  JOB_TITLES,
  METERS,
  METER_LIMITS,
  advance,
  choose,
  currentCard,
  descend,
  endingFor,
  favorAppliesTo,
  instantAvailable,
  lockReason,
  mutationAppliesTo,
  newRun,
  nextRandom,
  useInstant,
} from './rules'

export type Policy = {
  id: string
  title: string
  summary: string
  // Higher scores win; ties break on the run's seeded dice.
  score: (choice: Choice, state: RunState) => number
}

function grade(choice: Choice, g: Grade): number {
  return choice.success.grades?.[g] ?? 0
}

function riskiness(choice: Choice): number {
  if (!choice.roll) return 0
  return choice.roll.target - choice.roll.dice_count
}

function harm(choice: Choice): number {
  let total = 0
  for (const outcome of [choice.cost, choice.success.effects]) {
    total += (outcome.composure ?? 0) < 0 ? -(outcome.composure ?? 0) : 0
    total += Math.max(0, outcome.suspicion ?? 0)
    total += (outcome.successors ?? 0) < 0 ? -3 * (outcome.successors ?? 0) : 0
  }
  return total
}

export const POLICIES: Policy[] = [
  {
    id: 'complier',
    title: 'The Complier',
    summary: 'Does whatever the memo says and grades high on obedience.',
    score: (c) => 4 * grade(c, 'obedience') - grade(c, 'spite'),
  },
  {
    id: 'rebel',
    title: 'The Rebel',
    summary: 'Takes the spiteful option whenever one is on the card.',
    score: (c) => 4 * grade(c, 'spite') - grade(c, 'obedience'),
  },
  {
    id: 'coward',
    title: 'The Coward',
    summary: 'Avoids dice, costs and attention, in that order.',
    score: (c) => -3 * riskiness(c) - 2 * harm(c) - (c.roll ? 2 : 0),
  },
  {
    id: 'saint',
    title: 'The Saint',
    summary: 'Helps whoever is in the room, whatever it costs.',
    score: (c) => 4 * grade(c, 'empathy'),
  },
  {
    id: 'schemer',
    title: 'The Schemer',
    summary: 'Finds the clever angle, the loophole and the duct.',
    score: (c) => 4 * grade(c, 'ingenuity'),
  },
]

export type MeterHit = `${Meter}:${'min' | 'max'}`

export type PolicyReport = {
  policy: string
  runs: number
  completed: number
  eliminated: number
  successorDeaths: Record<string, number>
  deathCauses: Record<string, number>
  endings: Record<string, number>
  meterHits: Record<string, number>
  picks: Record<string, Record<string, number>>
}

export type BalanceReport = {
  runsPerPolicy: number
  departments: string[]
  policies: PolicyReport[]
  random: PolicyReport
  dominantChoices: Array<{ card: string; choice: string }>
  unpickedChoices: Array<{ card: string; choice: string }>
}

function bump(record: Record<string, number>, key: string, by = 1): void {
  record[key] = (record[key] ?? 0) + by
}

export function emptyReport(policy: string, runs: number): PolicyReport {
  return {
    policy,
    runs,
    completed: 0,
    eliminated: 0,
    successorDeaths: Object.fromEntries(
      DEPARTMENTS.map((d) => [d.department.id, 0]),
    ),
    deathCauses: {},
    endings: Object.fromEntries(ENDINGS.map((e) => [e.id, 0])),
    meterHits: {},
    picks: {},
  }
}

// One seeded run. `pick` sees the open choices and the run's own dice.
export function playRun(
  seed: string,
  jobId: string,
  pick: (open: Choice[], state: RunState, r: number) => Choice,
  report: PolicyReport,
): RunState {
  let run = newRun(seed, jobId)
  let rng = 1
  for (const ch of seed) rng = (rng * 31 + ch.charCodeAt(0)) >>> 0
  let guard = 0
  while (
    (run.status === 'playing' || run.status === 'department-complete') &&
    guard++ < 120
  ) {
    if (run.status === 'department-complete') {
      run = descend(run)
      continue
    }
    const view = currentCard(run)
    if (!view) break
    const open = view.card.choices.filter((c) => !lockReason(run, c))
    const [r, next] = nextRandom(rng)
    rng = next
    const choice = pick(open, run, r)
    const cardPicks = (report.picks[view.card.id] ??= {})
    bump(cardPicks, choice.id)
    const before = run.terminations.length
    run = choose(run, choice.id, {
      spendForm: !!choice.roll && run.meters.forms > 2,
      useFavor: favorAppliesTo(run, choice),
      useMutation: mutationAppliesTo(run, choice),
    })
    for (const t of run.terminations.slice(before)) {
      bump(report.successorDeaths, t.department)
      bump(report.deathCauses, t.cause)
    }
    const effects = run.pending?.effects ?? {}
    for (const k of METERS) {
      const delta = effects[k] ?? 0
      if (delta < 0 && run.meters[k] === METER_LIMITS[k].min)
        bump(report.meterHits, `${k}:min`)
      if (delta > 0 && run.meters[k] === METER_LIMITS[k].max)
        bump(report.meterHits, `${k}:max`)
    }
    for (const e of run.pending?.events ?? []) {
      if (e.includes('nervous breakdown'))
        bump(report.meterHits, 'composure:min')
      if (e.includes('short, friendly conversation'))
        bump(report.meterHits, 'suspicion:max')
    }
    if (instantAvailable(run, 'mutation') && run.meters.composure <= 2)
      run = useInstant(run, 'mutation')
    run = advance(run)
  }
  if (run.status === 'complete') report.completed++
  if (run.status === 'eliminated') report.eliminated++
  const ending = endingFor(run)
  if (ending) bump(report.endings, ending.id)
  return run
}

export function policyPicker(policy: Policy) {
  return (open: Choice[], state: RunState, r: number): Choice => {
    const scored = open.map((c) => ({ c, s: policy.score(c, state) }))
    const best = Math.max(...scored.map((x) => x.s))
    const top = scored.filter((x) => x.s === best).map((x) => x.c)
    return top[Math.floor(r * top.length)]!
  }
}

export function randomPicker(open: Choice[], _state: RunState, r: number) {
  return open[Math.floor(r * open.length)]!
}

export function simulatePolicy(
  id: string,
  pick: (open: Choice[], state: RunState, r: number) => Choice,
  runs: number,
): PolicyReport {
  const report = emptyReport(id, runs)
  for (let i = 0; i < runs; i++) {
    const job = JOB_TITLES[i % JOB_TITLES.length]!.id
    playRun(`balance-${id}-${i}`, job, pick, report)
  }
  return report
}

function topPick(picks: Record<string, number> | undefined): string | null {
  if (!picks) return null
  const entries = Object.entries(picks).sort((a, b) => b[1] - a[1])
  return entries[0]?.[0] ?? null
}

export function balanceReport(runsPerPolicy = 2000): BalanceReport {
  const policies = POLICIES.map((p) =>
    simulatePolicy(p.id, policyPicker(p), runsPerPolicy),
  )
  const random = simulatePolicy('random', randomPicker, runsPerPolicy)
  const dominantChoices: BalanceReport['dominantChoices'] = []
  const unpickedChoices: BalanceReport['unpickedChoices'] = []
  for (const d of DEPARTMENTS) {
    for (const card of [...d.encounters, d.boss]) {
      // Dominant: every temperament, from Complier to Rebel, makes the same call.
      const tops = policies.map((p) => topPick(p.picks[card.id]))
      if (tops.every((t) => t && t === tops[0]))
        dominantChoices.push({ card: card.id, choice: tops[0]! })
      for (const choice of card.choices) {
        const everPicked = [...policies, random].some(
          (p) => (p.picks[card.id]?.[choice.id] ?? 0) > 0,
        )
        if (!everPicked)
          unpickedChoices.push({ card: card.id, choice: choice.id })
      }
    }
  }
  return {
    runsPerPolicy,
    departments: DEPARTMENTS.map((d) => d.department.id),
    policies,
    random,
    dominantChoices,
    unpickedChoices,
  }
}
