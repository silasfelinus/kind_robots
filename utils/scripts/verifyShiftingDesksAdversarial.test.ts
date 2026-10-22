import assert from 'node:assert/strict'
import { ATTACKS, adversarialReport } from '../shiftingDesks/adversarial'
import {
  DEPARTMENTS,
  ENDINGS,
  JOB_TITLES,
  endingFor,
  endingLines,
  newRun,
  reviewExhibits,
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

const neverOffered = new Set(report.neverOfferedChoices)
const offeredButUnpicked = new Set(report.offeredButUnpickedChoices)
assert.ok(
  report.neverOfferedChoices.every((id) => report.neverPickedChoices.includes(id)),
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
    { employee: '#4471-A', cause: 'A short, friendly conversation', department: 'records' },
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
  reviewExhibits({ department: 'records', flags: ['drilled-the-union-vent'] })
    .some((text) => text.includes('LOCAL 9')),
  'the Union's risky intervention is remembered at the next review',
)
assert.ok(
  reviewExhibits({ department: 'toy-division', flags: ['gave-beverly-the-scenic-tour'] })
    .some((text) => text.includes('COMPLIANCE TOUR')),
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
