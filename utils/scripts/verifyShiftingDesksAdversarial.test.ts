import assert from 'node:assert/strict'
import { ATTACKS, adversarialReport } from '../shiftingDesks/adversarial'
import {
  DEPARTMENTS,
  ENDINGS,
  JOB_TITLES,
  RISK_PAYOFFS,
  choose,
  endingFor,
  endingLines,
  newRun,
  reviewExhibits,
  riskPayoffFor,
  successorLegacyLines,
} from '../shiftingDesks/rules'

const report = adversarialReport(75)
const again = adversarialReport(75)

assert.deepEqual(
  report,
  again,
  'identical seeds yield identical adversarial traces',
)
assert.equal(report.attacks.length, ATTACKS.length)
assert.equal(
  report.findings.length,
  0,
  JSON.stringify(report.findings.slice(0, 8), null, 2),
)

for (const attack of report.attacks) {
  assert.equal(
    attack.completed + attack.eliminated + attack.stalled,
    attack.runs,
    attack.id + ': every run must end or be explicitly reported stalled',
  )
  assert.equal(attack.stalled, 0, attack.id + ': no path can softlock')
  assert.ok(
    attack.decisions > attack.runs,
    attack.id + ': choices are exercised',
  )
  assert.ok(attack.departmentVisits[DEPARTMENTS[0]!.department.id] === 75)
}

assert.ok(
  report.attacks.some((a) => a.completed > 0),
  'at least one route reaches the Board',
)
assert.ok(
  report.attacks.some(
    (a) => (a.departmentVisits[DEPARTMENTS[4]!.department.id] ?? 0) > 0,
  ),
  'late-game department gets adversarial coverage',
)
assert.ok(JOB_TITLES.length > 1 && ENDINGS.length >= 10)

const rewardIds = new Set<string>()
for (const reward of RISK_PAYOFFS) {
  const key = reward.department + '/' + reward.card + '/' + reward.choice
  assert.ok(!rewardIds.has(key), key + ': reward must be unique')
  rewardIds.add(key)
  const department = DEPARTMENTS.find(
    (d) => d.department.id === reward.department,
  )
  const card = department?.encounters.find((c) => c.id === reward.card)
  const choice = card?.choices.find((c) => c.id === reward.choice)
  assert.ok(choice?.roll, key + ': reward must require a risky roll')
  assert.equal(
    choice?.requires,
    null,
    key + ': advertised rewards must be directly offered',
  )
  assert.deepEqual(reward.effects, { forms: 1 })

  const initial = newRun('risk-payoff-' + key, JOB_TITLES[0]!.id)
  const state = {
    ...initial,
    department: reward.department,
    deck: [reward.card],
    position: 0,
    meters: { ...initial.meters, forms: 3 },
  }
  assert.equal(riskPayoffFor(state, choice!)?.message, reward.message)
  let succeeded = false
  let failed = false
  for (let rng = 1; rng <= 300 && !(succeeded && failed); rng++) {
    const after = choose({ ...state, rng: rng * 7919 }, reward.choice)
    assert.ok(after.pending, key + ': every legal action resolves')
    if (after.pending.success) {
      succeeded = true
      assert.equal(
        after.pending.effects.forms,
        1,
        key + ': earned paperwork only after success',
      )
      assert.ok(after.pending.events.includes(reward.message))
    } else {
      failed = true
      assert.equal(
        after.pending.effects.forms ?? 0,
        0,
        key + ': a failed check cannot claim the reward',
      )
      assert.ok(!after.pending.events.includes(reward.message))
    }
  }
  assert.ok(succeeded && failed, key + ': both outcomes must be tested')
}

const neverOffered = new Set(report.neverOfferedChoices)
const offeredButUnpicked = new Set(report.offeredButUnpickedChoices)
assert.ok(
  report.neverOfferedChoices.every((id) =>
    report.neverPickedChoices.includes(id),
  ),
  'an unavailable choice cannot also have been picked',
)
assert.ok(
  report.offeredButUnpickedChoices.every(
    (id) => report.neverPickedChoices.includes(id) && !neverOffered.has(id),
  ),
  'available-but-declined options exclude locked options',
)
assert.equal(
  neverOffered.size + offeredButUnpicked.size,
  report.neverPickedChoices.length,
  'all unpicked choices are accounted for as gated or offered',
)
for (const attack of report.attacks) {
  for (const [choice, picks] of Object.entries(attack.choicePicks)) {
    assert.ok(
      (attack.choiceOffers[choice] ?? 0) >= picks,
      attack.id + '/' + choice + ': selected choices were offered',
    )
  }
}

const ending = ENDINGS.find((e) => e.kind === 'board')!
const earlier = newRun('successor-legacy', JOB_TITLES[0]!.id)
const personnel = {
  ...earlier,
  status: 'complete' as const,
  department: DEPARTMENTS.at(-1)!.department.id,
  departmentOutcomes: { 'sub-level-zero': ending.trigger.department_outcome! },
  flags: ['drilled-the-union-vent', 'routed-gus-to-pest-control'],
  terminations: [
    {
      employee: '#4471-A',
      cause: 'A short, friendly conversation',
      department: 'records',
    },
    { employee: '#4471-B', cause: 'Nervous breakdown', department: 'wellness' },
  ],
}
assert.equal(endingFor(personnel)?.id, ending.id)
const lines = endingLines(personnel, ending)
assert.ok(lines.some((s) => s.includes('speaking vent')))
assert.ok(lines.some((s) => s.includes('Pest Control')))
assert.ok(lines.some((s) => s.includes('#4471-A')))
assert.ok(lines.some((s) => s.includes('#4471-B')))
assert.equal(successorLegacyLines(earlier).length, 0)
assert.equal(successorLegacyLines(personnel).length, 2)
assert.ok(
  reviewExhibits({
    department: 'records',
    flags: ['drilled-the-union-vent'],
  }).some((text) => text.includes('LOCAL 9')),
  "the Union's risky intervention is remembered at the next review",
)
assert.ok(
  reviewExhibits({
    department: 'toy-division',
    flags: ['gave-beverly-the-scenic-tour'],
  }).some((text) => text.includes('COMPLIANCE TOUR')),
  'the cautious diversion is remembered by Toy Division',
)

console.log(
  'adversarial playtest: ' +
    report.attacks.length * report.runsPerAttack +
    ' seeded runs, ' +
    report.attacks.reduce((n, a) => n + a.decisions, 0) +
    ' decisions, ' +
    report.findings.length +
    ' engine violations, ' +
    report.neverSeenCards.length +
    ' unseen cards, ' +
    report.neverPickedChoices.length +
    ' unpicked choices, ' +
    report.unseenEndings.length +
    ' unseen endings',
)
