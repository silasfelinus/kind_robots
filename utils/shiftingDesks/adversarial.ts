import {
  type Choice,
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
  isRunState,
  lockReason,
  mutationAppliesTo,
  newRun,
  nextRandom,
  upgradeRun,
  useInstant,
} from './rules'
import { POLICIES } from './balance'

export type Finding = {
  kind: string
  attack: string
  seed: string
  department: string
  card: string
  step: number
  trace: string[]
  detail: string
}

export type AttackResult = {
  id: string
  runs: number
  completed: number
  eliminated: number
  stalled: number
  decisions: number
  terminations: number
  departmentVisits: Record<string, number>
  cardVisits: Record<string, number>
  choicePicks: Record<string, number>
  endings: Record<string, number>
  causes: Record<string, number>
}

export type AdversarialReport = {
  runsPerAttack: number
  attacks: AttackResult[]
  findings: Finding[]
  neverSeenCards: string[]
  neverPickedChoices: string[]
  unseenEndings: string[]
}

type Attack = {
  id: string
  score: (choice: Choice, state: RunState) => number
  spendForms: boolean
  usePowers: boolean
}

const negative = (n: number | undefined) => Math.max(0, -(n ?? 0))
const damage = (c: Choice) =>
  negative(c.cost.composure) +
  negative(c.cost.clearance) * 2 +
  negative(c.cost.successors) * 7 +
  negative(c.cost.forms) +
  Math.max(0, c.cost.suspicion ?? 0) * 2 +
  negative(c.success.effects.successors) * 7 +
  negative(c.success.effects.composure) +
  Math.max(0, c.success.effects.suspicion ?? 0) * 2
const risk = (c: Choice) =>
  c.roll ? c.roll.target - c.roll.dice_count - (c.roll.modifier ?? 0) : -4
const grades = (c: Choice) =>
  Object.values(c.success.grades ?? {}).reduce((sum, n) => sum + n, 0)
const flags = (c: Choice) =>
  c.success.add_flags.length + (c.failure?.add_flags.length ?? 0)

export const ATTACKS: Attack[] = [
  ...POLICIES.map((p) => ({
    id: p.id,
    score: p.score,
    spendForms: true,
    usePowers: true,
  })),
  {
    id: 'resource-hoarder',
    score: (c) => -9 * negative(c.cost.forms) - damage(c) - risk(c),
    spendForms: false,
    usePowers: false,
  },
  {
    id: 'last-successor',
    score: (c) =>
      -15 * (negative(c.cost.successors) +
        negative(c.success.effects.successors)) - damage(c),
    spendForms: true,
    usePowers: true,
  },
  {
    id: 'chaos-agent',
    score: (c) => 5 * risk(c) + damage(c),
    spendForms: false,
    usePowers: false,
  },
  {
    id: 'flag-collector',
    score: (c) => 7 * flags(c) + grades(c) - damage(c),
    spendForms: true,
    usePowers: true,
  },
  {
    id: 'power-user',
    score: (c) => 3 * risk(c) + grades(c),
    spendForms: true,
    usePowers: true,
  },
]

const bump = (rec: Record<string, number>, k: string, by = 1) => {
  rec[k] = (rec[k] ?? 0) + by
}

const fresh = (id: string, runs: number): AttackResult => ({
  id,
  runs,
  completed: 0,
  eliminated: 0,
  stalled: 0,
  decisions: 0,
  terminations: 0,
  departmentVisits: {},
  cardVisits: {},
  choicePicks: {},
  endings: {},
  causes: {},
})

const same = (a: RunState, b: RunState) =>
  JSON.stringify(a) === JSON.stringify(b)

export function adversarialReport(runsPerAttack = 100): AdversarialReport {
  if (!Number.isInteger(runsPerAttack) || runsPerAttack < 1)
    throw new Error('runsPerAttack must be a positive integer')

  const attacks: AttackResult[] = []
  const findings: Finding[] = []
  for (const attack of ATTACKS) {
    const result = fresh(attack.id, runsPerAttack)
    for (let i = 0; i < runsPerAttack; i++) {
      const seed = 'adversarial-' + attack.id + '-' + i
      const jobId = JOB_TITLES[i % JOB_TITLES.length]!.id
      let run = newRun(seed, jobId)
      let pickerRng = run.rng
      let lastDepartment = ''
      const trace: string[] = []
      const fail = (kind: string, step: number, detail: string) => {
        if (findings.length >= 100) return
        findings.push({
          kind,
          attack: attack.id,
          seed,
          department: run.department,
          card: currentCard(run)?.card.id ?? '(none)',
          step,
          trace: trace.slice(-8),
          detail,
        })
      }
      let step = 0
      for (; step < 120; step++) {
        if (run.department !== lastDepartment) {
          bump(result.departmentVisits, run.department)
          lastDepartment = run.department
        }
        if (run.status === 'complete' || run.status === 'eliminated')
          break
        if (run.pending) {
          fail('pending-not-advanced', step, 'A pending outcome survived the preceding step')
          break
        }
        if (run.status === 'department-complete') {
          const next = descend(run)
          if (same(next, run)) {
            fail('descent-stalled', step, 'Department complete but descend made no progress')
            break
          }
          run = next
          continue
        }
        const view = currentCard(run)
        if (!view) {
          fail('missing-card', step, 'Playing state has no current card')
          break
        }
        const open = view.card.choices.filter((c) => !lockReason(run, c))
        if (!open.length) {
          fail('choice-deadlock', step, 'All choices locked: ' +
            view.card.choices.map((c) => c.id + '=' + lockReason(run, c)).join('; '))
          break
        }

        if (step % 3 === 0) {
          if (!same(choose(run, '__invalid-choice__'), run))
            fail('illegal-choice-accepted', step, 'Unknown action changed state')
          if (!same(descend(run), run))
            fail('early-descent', step, 'Descended before review completion')
          const locked = view.card.choices.find((c) => lockReason(run, c))
          if (locked && !same(choose(run, locked.id), run))
            fail('locked-choice-accepted', step, 'Locked action changed state: ' + locked.id)
        }

        const scored = open.map((c) => ({ c, value: attack.score(c, run) }))
        const best = Math.max(...scored.map((s) => s.value))
        const top = scored.filter((s) => s.value === best)
        const [random, nextRng] = nextRandom(pickerRng)
        pickerRng = nextRng
        const selected = top[Math.floor(random * top.length)]!.c
        const previousTerminations = run.terminations.length
        const next = choose(run, selected.id, {
          spendForm: attack.spendForms && !!selected.roll,
          useFavor: attack.usePowers && favorAppliesTo(run, selected),
          useMutation: attack.usePowers && mutationAppliesTo(run, selected),
        })
        trace.push(run.department + '/' + view.card.id + '/' + selected.id)
        bump(result.cardVisits, view.card.id)
        bump(result.choicePicks, view.card.id + '/' + selected.id)
        result.decisions++
        if (same(run, next)) {
          fail('legal-choice-rejected', step, 'Unlocked choice made no progress: ' + selected.id)
          break
        }
        if (!next.pending) {
          fail('outcome-missing', step, 'Legal choice produced no pending resolution')
          break
        }
        if (!same(choose(next, selected.id), next))
          fail('double-submit', step, 'Repeated click while outcome pending changed state')

        if (step % 3 === 0) {
          const reloaded = upgradeRun(JSON.parse(JSON.stringify(next)))
          if (!reloaded || !same(reloaded, next))
            fail('save-roundtrip', step, 'JSON reload lost or changed active state')
          if (!isRunState(next))
            fail('invalid-state', step, 'Reducer generated a state rejected by its validator')
        }
        for (const meter of METERS) {
          const value = next.meters[meter]
          const limit = METER_LIMITS[meter]
          if (!Number.isFinite(value) || value < limit.min || value > limit.max)
            fail('meter-out-of-range', step, meter + '=' + value)
        }
        const newDeaths = next.terminations.slice(previousTerminations)
        result.terminations += newDeaths.length
        for (const death of newDeaths) bump(result.causes, death.cause)
        run = advance(next)
        if (run.pending)
          fail('pending-after-advance', step, 'Advance did not dismiss resolution')
        if (instantAvailable(run, 'mutation') && attack.usePowers &&
            run.meters.composure <= 3)
          run = useInstant(run, 'mutation')
        if (instantAvailable(run, 'favor') && attack.usePowers &&
            run.meters.successors <= 2)
          run = useInstant(run, 'favor')
      }
      if (step === 120) {
        fail('step-limit', step, 'Run did not terminate within 120 turns')
      }
      if (run.status === 'complete') result.completed++
      else if (run.status === 'eliminated') result.eliminated++
      else result.stalled++
      const ending = endingFor(run)
      if (ending) bump(result.endings, ending.id)
      else if (run.status === 'complete' || run.status === 'eliminated')
        fail('ending-missing', step, 'Terminal run has no ending card')
    }
    attacks.push(result)
  }

  const picked = new Set(attacks.flatMap((p) => Object.keys(p.choicePicks)))
  const seen = new Set(attacks.flatMap((p) => Object.keys(p.cardVisits)))
  const endingSet = new Set(attacks.flatMap((p) => Object.keys(p.endings)))
  const allCards = DEPARTMENTS.flatMap((d) => [...d.encounters, d.boss])
  return {
    runsPerAttack,
    attacks,
    findings,
    neverSeenCards: allCards.map((c) => c.id).filter((id) => !seen.has(id)),
    neverPickedChoices: allCards.flatMap((c) =>
      c.choices.map((choice) => c.id + '/' + choice.id)).filter((id) => !picked.has(id)),
    unseenEndings: ENDINGS.map((e) => e.id).filter((id) => !endingSet.has(id)),
  }
}
