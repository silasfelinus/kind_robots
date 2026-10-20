// Deterministic V6 balance baseline using the real saved-run reducer.
// Run: npx tsx utils/scripts/shiftingLandsV6BalanceReport.ts [seedsPerPolicy]
import assert from 'node:assert/strict'
import {
  activeV6Card,
  choiceLock,
  type V6Choice,
} from '../shiftingLands/deckV6'
import {
  newJourneyLedgerV6,
  stepJourneyLedgerV6,
  type JourneyLedgerV6,
} from '../shiftingLands/saveLedgerV6'
import { canChooseTrial, trialForLand } from '../shiftingLands/authoredBosses'
import { JOURNEY_WORLD, reachableLocations } from '../shiftingLands/journey'

type Policy = 'kind' | 'safe' | 'greedy' | 'ruthless' | 'random'
const POLICIES: Policy[] = ['kind', 'safe', 'greedy', 'ruthless', 'random']
const LANDS = JOURNEY_WORLD.lands.map((land) => land.id)
const SKILLS: Record<string, number> = {
  steel: 3,
  awareness: 2,
  wits: 2,
  bearing: 2,
  resolve: 2,
  insight: 2,
}
type Counts = Record<string, number>
type Samples = Record<string, number[]>
type Summary = {
  policy: Policy
  runs: number
  completed: number
  fallen: number
  stalled: number
  reached: Counts
  gates: Counts
  cleared: Counts
  deaths: Counts
  deathCauses: Counts
  trialEvidence: Counts
  gateSeen: Counts
  gateOpen: Counts
  gateChosen: Counts
  hpAtEntry: Samples
  foodAtEntry: Samples
  hpAtGate: Samples
  foodAtGate: Samples
  hpAtEnd: number[]
  foodAtEnd: number[]
}
const counters = (): Counts => Object.fromEntries(LANDS.map((id) => [id, 0]))
const samples = (): Samples => Object.fromEntries(LANDS.map((id) => [id, []]))
const inc = (items: Counts, key: string) => {
  items[key] = (items[key] ?? 0) + 1
}
const mean = (items: number[]) =>
  items.length
    ? (items.reduce((sum, value) => sum + value, 0) / items.length).toFixed(2)
    : 'n/a'
const percent = (value: number, total: number) =>
  total ? ((100 * value) / total).toFixed(1) + '%' : 'n/a'
function fresh(policy: Policy, runs: number): Summary {
  return {
    policy,
    runs,
    completed: 0,
    fallen: 0,
    stalled: 0,
    reached: counters(),
    gates: counters(),
    cleared: counters(),
    deaths: counters(),
    deathCauses: {},
    trialEvidence: counters(),
    gateSeen: counters(),
    gateOpen: counters(),
    gateChosen: counters(),
    hpAtEntry: samples(),
    foodAtEntry: samples(),
    hpAtGate: samples(),
    foodAtGate: samples(),
    hpAtEnd: [],
    foodAtEnd: [],
  }
}
function odds(choice: V6Choice): number {
  if (!choice.roll) return 1
  const bonus = SKILLS[choice.roll.skill]! + choice.roll.modifier
  let passed = 0
  for (let a = 1; a <= 6; a++)
    for (let b = 1; b <= 6; b++)
      if (a + b + bonus >= choice.roll.target) passed++
  return passed / 36
}
function expected(
  choice: V6Choice,
  attribute: 'hp_delta' | 'provisions_delta',
): number {
  const chance = odds(choice)
  return (
    chance * choice.success[attribute] +
    (1 - chance) * (choice.failure?.[attribute] ?? 0)
  )
}
function mark(choice: V6Choice, kind: string): number {
  const chance = odds(choice)
  const good = (choice.success.marks as Counts | undefined)?.[kind] ?? 0
  const bad = (choice.failure?.marks as Counts | undefined)?.[kind] ?? 0
  return chance * good + (1 - chance) * bad
}
const pickRandom = (seed: number, step: number, length: number) =>
  ((Math.imul(seed ^ (step + 1), 1664525) + 1013904223) >>> 0) % length
function selectChoice(
  choices: V6Choice[],
  policy: Policy,
  seed: number,
  turn: number,
): V6Choice {
  assert.ok(choices.length, 'at least one choice remains open')
  if (policy === 'random')
    return choices[pickRandom(seed, turn, choices.length)]!
  const score = (choice: V6Choice) => {
    const hp = expected(choice, 'hp_delta') + (choice.cost?.hp ?? 0)
    const food =
      expected(choice, 'provisions_delta') + (choice.cost?.provisions ?? 0)
    const mercy = mark(choice, 'mercy')
    const honest = mark(choice, 'honesty')
    const cunning = mark(choice, 'cunning')
    const ruthless = mark(choice, 'ruthlessness')
    if (policy === 'kind')
      return mercy * 7 + honest * 3 - ruthless * 7 + hp * 1.5 + food * 0.6
    if (policy === 'safe') return hp * 7 + food * 1.3 + odds(choice) * 2
    if (policy === 'greedy') return food * 7 + hp * 1.4 + cunning
    return ruthless * 8 + cunning * 2 + food * 1.8 - mercy * 5 + hp
  }
  return [...choices].sort((a, b) => score(b) - score(a))[0]!
}
function selectTrial(
  choices: { id: string; target: number; cost: number }[],
  policy: Policy,
  seed: number,
  turn: number,
): string {
  assert.ok(choices.length, 'the trial has an available approach')
  if (policy === 'random')
    return choices[pickRandom(seed, turn, choices.length)]!.id
  if (policy === 'kind')
    return (
      choices.find((item) => item.id === 'evidence') ??
      choices.find((item) => item.id === 'parley') ??
      choices[0]!
    ).id
  if (policy === 'ruthless' || policy === 'greedy')
    return (choices.find((item) => item.id === 'confront') ?? choices[0]!).id
  const difficulty = (choice: { id: string; target: number; cost: number }) =>
    choice.target - (choice.id === 'confront' ? 3 : 2) + choice.cost * 0.75
  return [...choices].sort((a, b) => difficulty(a) - difficulty(b))[0]!.id
}
function run(seed: number, policy: Policy, report: Summary) {
  let ledger: JourneyLedgerV6 = newJourneyLedgerV6(seed)
  const seenLands = new Set<string>()
  const seenGates = new Set<string>()
  const seenRoutes = new Set<string>()
  const openRoutes = new Set<string>()
  const chosenRoutes = new Set<string>()
  let stalled = false
  for (let step = 0; step < 120; step++) {
    const state = ledger.current
    const journey = state.journey
    if (journey.phase === 'fallen' || journey.phase === 'complete') break
    const land = JOURNEY_WORLD.lands[journey.landIndex]!
    if (!seenLands.has(land.id)) {
      seenLands.add(land.id)
      inc(report.reached, land.id)
      report.hpAtEntry[land.id]!.push(journey.hp)
      report.foodAtEntry[land.id]!.push(journey.provisions)
    }
    let next: JourneyLedgerV6
    if (journey.phase === 'boss') {
      const trial = trialForLand(land.id)!
      const possible = trial.choices.filter((item) =>
        canChooseTrial(item, state.flags, journey.provisions),
      )
      if (!seenGates.has(land.id)) {
        seenGates.add(land.id)
        inc(report.gates, land.id)
        report.hpAtGate[land.id]!.push(journey.hp)
        report.foodAtGate[land.id]!.push(journey.provisions)
        if (possible.some((item) => item.id === 'evidence'))
          inc(report.trialEvidence, land.id)
      }
      if (!possible.length) {
        stalled = true
        break
      }
      const choiceId = selectTrial(possible, policy, seed, step)
      next = stepJourneyLedgerV6(ledger, { type: 'TRIAL', choiceId })
      if (next.current.journey.phase === 'fallen')
        inc(report.deathCauses, 'trial:' + land.id)
      if (
        next.current.journey.landIndex !== journey.landIndex ||
        next.current.journey.phase === 'complete'
      )
        inc(report.cleared, land.id)
    } else if (journey.active === null) {
      const open = reachableLocations(journey).filter(
        (id) => !journey.resolved.some((entry) => entry.locationId === id),
      )
      if (!open.length) {
        stalled = true
        break
      }
      next = stepJourneyLedgerV6(ledger, {
        type: 'TRAVEL',
        locationId: open[0]!,
      })
    } else {
      const card = activeV6Card(state)
      assert.ok(card, 'drawn V6 card must exist')
      const open = card.choices.filter((choice) => {
        if (choice.requires?.anyFlags.length) {
          const key = card.id + '/' + choice.id
          if (!seenRoutes.has(key)) {
            seenRoutes.add(key)
            inc(report.gateSeen, land.id)
          }
          if (!choiceLock(state, choice) && !openRoutes.has(key)) {
            openRoutes.add(key)
            inc(report.gateOpen, land.id)
          }
        }
        return !choiceLock(state, choice)
      })
      if (!open.length) {
        stalled = true
        break
      }
      const chosen = selectChoice(open, policy, seed, step)
      if (chosen.requires?.anyFlags.length) {
        const key = card.id + '/' + chosen.id
        if (!chosenRoutes.has(key)) {
          chosenRoutes.add(key)
          inc(report.gateChosen, land.id)
        }
      }
      next = stepJourneyLedgerV6(ledger, {
        type: 'CHOOSE',
        choiceId: chosen.id,
      })
      if (next.current.journey.phase === 'fallen')
        inc(report.deathCauses, 'card:' + card.id + '/' + chosen.id)
    }
    if (next === ledger) {
      stalled = true
      break
    }
    ledger = next
  }
  const last = ledger.current.journey
  if (last.phase === 'complete') {
    report.completed++
    report.hpAtEnd.push(last.hp)
    report.foodAtEnd.push(last.provisions)
  } else if (last.phase === 'fallen') {
    report.fallen++
    inc(report.deaths, LANDS[last.landIndex]!)
  } else {
    assert.ok(stalled, 'hit simulation step cap; increase the cap explicitly')
    report.stalled++
  }
}
export function balanceReportV6(perPolicy = 400): Summary[] {
  assert.ok(
    Number.isSafeInteger(perPolicy) && perPolicy >= 1 && perPolicy <= 5000,
    'count must be an integer between 1 and 5000',
  )
  return POLICIES.map((policy) => {
    const report = fresh(policy, perPolicy)
    for (let seed = 1; seed <= perPolicy; seed++) run(seed, policy, report)
    assert.equal(
      report.completed + report.fallen + report.stalled,
      perPolicy,
      'classify every run',
    )
    for (const land of LANDS) {
      assert.ok(
        report.cleared[land]! <= report.gates[land]! &&
          report.gates[land]! <= report.reached[land]!,
        'land gate progression is monotonic',
      )
      assert.ok(report.trialEvidence[land]! <= report.gates[land]!)
    }
    return report
  })
}
function table(head: string[], rows: string[][]) {
  return [
    '| ' + head.join(' | ') + ' |',
    '|' + head.map((_, index) => (index ? '---:' : '---')).join('|') + '|',
    ...rows.map((row) => '| ' + row.join(' | ') + ' |'),
  ].join('\n')
}
export function printBalanceV6(all: Summary[]): string {
  const runs = all[0]!.runs
  const out: string[] = [
    '# Shifting Lands V6 seeded balance report',
    '',
    '**' +
      runs +
      ' seeds per policy; ' +
      runs * all.length +
      ' real-reducer journeys.** Deterministic heuristics, not human or optimal play: ' +
      'kind values mercy/honesty, safe values health and odds, greedy values food, ' +
      'ruthless values ruthlessness, random chooses an eligible option.',
    '',
    '## Survival',
    '',
    table(
      ['Policy', 'Complete', 'Fallen', 'Stalled', 'Finish HP', 'Finish food'],
      all.map((r) => [
        r.policy,
        percent(r.completed, runs),
        percent(r.fallen, runs),
        String(r.stalled),
        mean(r.hpAtEnd),
        mean(r.foodAtEnd),
      ]),
    ),
    '',
    '## Reached / trial gate / cleared, percentage of all runs',
    '',
    table(
      ['Policy and stage', ...LANDS],
      all.flatMap((r) =>
        [
          ['entered', r.reached],
          ['trial', r.gates],
          ['cleared', r.cleared],
        ].map(([name, counts]) => [
          r.policy + ' ' + name,
          ...LANDS.map((id) => percent((counts as Counts)[id] ?? 0, runs)),
        ]),
      ),
    ),
    '',
    '## Deaths by land (runs)',
    '',
    table(
      ['Policy', ...LANDS],
      all.map((r) => [
        r.policy,
        ...LANDS.map((id) => String(r.deaths[id] ?? 0)),
      ]),
    ),
    '',
    '## Evidence-gated trial route open / reached trials',
    '',
    table(
      ['Policy', ...LANDS],
      all.map((r) => [
        r.policy,
        ...LANDS.map((id) =>
          percent(r.trialEvidence[id] ?? 0, r.gates[id] ?? 0),
        ),
      ]),
    ),
    '',
    '## Deed-gated encounter options (opportunities)',
    '',
    table(
      ['Policy', 'Shown', 'Open', 'Selected', 'Open / shown'],
      all.map((r) => {
        const shown = Object.values(r.gateSeen).reduce((a, b) => a + b, 0)
        const open = Object.values(r.gateOpen).reduce((a, b) => a + b, 0)
        const picked = Object.values(r.gateChosen).reduce((a, b) => a + b, 0)
        return [
          r.policy,
          String(shown),
          String(open),
          String(picked),
          percent(open, shown),
        ]
      }),
    ),
    '',
    '## At each land entry (mean health / food among arrivals)',
    '',
    table(
      ['Policy', ...LANDS],
      all.map((r) => [
        r.policy,
        ...LANDS.map(
          (id) => mean(r.hpAtEntry[id]!) + ' / ' + mean(r.foodAtEntry[id]!),
        ),
      ]),
    ),
    '',
    '## At each trial gate (mean health / food among arrivals)',
    '',
    table(
      ['Policy', ...LANDS],
      all.map((r) => [
        r.policy,
        ...LANDS.map(
          (id) => mean(r.hpAtGate[id]!) + ' / ' + mean(r.foodAtGate[id]!),
        ),
      ]),
    ),
    '',
    '## Top death causes',
    '',
    table(
      ['Policy', 'Card/choice or trial'],
      all.map((r) => [
        r.policy,
        Object.entries(r.deathCauses)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([key, value]) => key + ' (' + value + ')')
          .join('; ') || 'none',
      ]),
    ),
    '',
    '**Method notes:** All effects and 2d6 rolls come from the live V6 ' +
      'reducer. Repeated trial attempts are included. Arrival resource averages ' +
      'condition on actually reaching that land. The same seed set is used for ' +
      'each policy. Changing target numbers, costs or flags requires an explicit ' +
      'V6 schema/version and replay-compatibility plan.',
  ]
  return out.join('\n')
}
if (process.argv[1]?.includes('shiftingLandsV6BalanceReport')) {
  const runs = process.argv[2] === undefined ? 400 : Number(process.argv[2])
  const reports = balanceReportV6(runs)
  console.log('BEGIN SHIFTING V6 BALANCE REPORT')
  console.log(printBalanceV6(reports))
  console.log('END SHIFTING V6 BALANCE REPORT')
}
