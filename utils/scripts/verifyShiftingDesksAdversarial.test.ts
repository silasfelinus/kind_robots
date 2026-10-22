import assert from 'node:assert/strict'
import { ATTACKS, adversarialReport } from '../shiftingDesks/adversarial'
import { DEPARTMENTS, ENDINGS, JOB_TITLES } from '../shiftingDesks/rules'

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
