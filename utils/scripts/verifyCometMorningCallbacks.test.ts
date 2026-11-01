import assert from 'node:assert/strict'
import { EARLY_NIGHT_MORNINGS, nightCaseMorning } from '../cometAcademy/earlyNightMornings'
import { EXPANDED_MISSIONS } from '../cometAcademy/expandedNightCases'
import { REAL_NIGHT_CASES, realNightCase } from '../cometAcademy/nightCases'
import {
  COMPLETE_NIGHT_DECK,
  nextSchoolDay,
  startFullAcademy,
  type DispatchReport,
  type Grade,
} from '../cometAcademy/rules'

const grades: Grade[] = ['honors', 'pass', 'partial', 'failed']
const earlyIds = Object.keys(REAL_NIGHT_CASES)
assert.equal(earlyIds.length, 12)
assert.deepEqual(Object.keys(EARLY_NIGHT_MORNINGS).sort(), [...earlyIds].sort())
assert.equal(EXPANDED_MISSIONS.length, 24)
assert.equal(COMPLETE_NIGHT_DECK.length, 36)
assert.equal(new Set(COMPLETE_NIGHT_DECK.map((c) => c.id)).size, 36)

for (const id of earlyIds) {
  assert.ok(realNightCase(id)?.briefing, id)
  const texts = new Set<string>()
  for (const grade of grades) {
    const text = nightCaseMorning(id, grade, false)
    assert.ok(text && text.length > 75, id + ': ' + grade)
    texts.add(text!)
  }
  const refused = nightCaseMorning(id, 'failed', true)
  assert.ok(refused && refused.length > 75)
  texts.add(refused!)
  assert.equal(texts.size, 5, id + ': all five morning callbacks distinct')
}
for (const mission of EXPANDED_MISSIONS) {
  assert.equal(
    nightCaseMorning(mission.incident.id, 'partial', false),
    mission.morning ?? null,
    mission.incident.id + ': existing late-mission callback preserved',
  )
}
assert.equal(nightCaseMorning('not-a-case', 'failed', true), null)

const caseId = 'monorail'
const report = (grade: Grade, names: string): DispatchReport => ({
  caseId,
  title: 'Brake failure',
  names,
  grade,
  text: 'Original dispatch report stays in the campaign ledger.',
})
const base = startFullAcademy('kinetic', 118)
const result = (grade: Grade, names: string) =>
  nextSchoolDay({
    ...base,
    day: 7,
    phase: 'debrief',
    reports: [report(grade, names)],
  })
const rescue = result('honors', 'YOU · first response')
assert.equal(rescue.phase, 'map')
assert.equal(rescue.day, 8)
assert.ok(rescue.scene.includes(EARLY_NIGHT_MORNINGS.monorail!.honors))
assert.equal(rescue.reports.length, 0, 'next day clears the past dispatch board')
const failure = result('failed', 'YOU · first response')
assert.ok(failure.scene.includes(EARLY_NIGHT_MORNINGS.monorail!.failed))
const refusal = result('failed', 'No team dispatched')
assert.ok(refusal.scene.includes(EARLY_NIGHT_MORNINGS.monorail!.refused))
assert.ok(!refusal.scene.includes(EARLY_NIGHT_MORNINGS.monorail!.failed))
const twoCalls = nextSchoolDay({
  ...base,
  day: 7,
  phase: 'debrief',
  reports: [
    report('partial', 'No team dispatched'),
    { ...report('pass', 'YOU · response'), caseId: 'museum' },
  ],
})
assert.ok(
  twoCalls.scene.includes(EARLY_NIGHT_MORNINGS.museum!.pass),
  'personally led call takes precedence over the unanswered neighbor',
)
assert.deepEqual(base.reports, [], 'the original game state is not mutated')

console.log('Prom of Doom: 36 cases, twelve five-way morning callbacks and debrief-to-school continuity verified.')
