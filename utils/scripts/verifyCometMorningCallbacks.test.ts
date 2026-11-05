import assert from 'node:assert/strict'
import {
  EARLY_NIGHT_MORNINGS,
  nightCaseMorning,
} from '../cometAcademy/earlyNightMornings'
import { EXPANDED_MISSIONS } from '../cometAcademy/expandedNightCases'
import { EXPANDED_NIGHT_MORNINGS } from '../cometAcademy/expandedNightMornings'
import {
  DISTRICT_WITNESSES,
  caseThread,
  caseTrustModifier,
  type CaseMemory,
} from '../cometAcademy/caseMemory'
import { REAL_NIGHT_CASES, realNightCase } from '../cometAcademy/nightCases'
import {
  COMPLETE_NIGHT_DECK,
  assignPlayerCase,
  dispatchModifier,
  districtMemory,
  incidentsFor,
  nextSchoolDay,
  selectMissionApproach,
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
    assert.ok(text && text.length > 60, id + ': ' + grade)
    texts.add(text!)
  }
  const refused = nightCaseMorning(id, 'failed', true)
  assert.ok(refused && refused.length > 60)
  texts.add(refused!)
  assert.equal(texts.size, 5, id + ': all five morning callbacks distinct')
}
assert.deepEqual(
  Object.keys(EXPANDED_NIGHT_MORNINGS).sort(),
  EXPANDED_MISSIONS.map((mission) => mission.incident.id).sort(),
  'every expanded case has its own morning table',
)
const allMornings = new Set<string>()
for (const id of earlyIds)
  for (const text of Object.values(EARLY_NIGHT_MORNINGS[id]!))
    allMornings.add(text)
for (const mission of EXPANDED_MISSIONS) {
  const id = mission.incident.id
  const nightText = [mission.refused, ...Object.values(mission.consequences)]
  const texts = new Set<string>()
  for (const grade of grades) {
    const text = nightCaseMorning(id, grade, false)
    assert.ok(text && text.length > 60, id + ': ' + grade)
    assert.ok(
      !nightText.includes(text!),
      id + ': morning is not a night replay',
    )
    texts.add(text!)
  }
  const refused = nightCaseMorning(id, 'failed', true)
  assert.ok(refused && refused.length > 60, id + ': refused')
  assert.ok(!nightText.includes(refused!))
  texts.add(refused!)
  assert.equal(texts.size, 5, id + ': all five morning callbacks distinct')
  for (const text of texts) {
    assert.ok(!allMornings.has(text), id + ': morning text reused elsewhere')
    allMornings.add(text)
  }
}
assert.equal(allMornings.size, 36 * 5)
// Regression: the old single callback praised the inspector even after a
// refusal or a failed rescue.
const ceremony = 'recognition ceremony'
assert.ok(
  nightCaseMorning('shadow-inspector', 'pass', false)!.includes(ceremony),
)
assert.ok(
  !nightCaseMorning('shadow-inspector', 'failed', false)!.includes(ceremony),
)
assert.ok(
  !nightCaseMorning('shadow-inspector', 'failed', true)!.includes(ceremony),
)
assert.ok(
  !nightCaseMorning('cloud-zoo', 'failed', true)!.includes('peacefully'),
)
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
assert.equal(
  rescue.reports.length,
  0,
  'next day clears the past dispatch board',
)
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
assert.ok(
  refusal.scene.endsWith('recorded as unanswered.'),
  'an unanswered call is not reported as a failed attempt',
)
assert.ok(failure.scene.endsWith('recorded as failed.'))

const expandedNight = (grade: Grade, names: string) =>
  nextSchoolDay({
    ...base,
    day: 18,
    phase: 'debrief',
    reports: [
      {
        caseId: 'shadow-inspector',
        title: "The Ticket Inspector's Shadow",
        names,
        grade,
        text: 'Ledger entry.',
      },
    ],
  })
for (const grade of grades)
  assert.ok(
    expandedNight(grade, 'YOU · response').scene.includes(
      EXPANDED_NIGHT_MORNINGS['shadow-inspector']![grade],
    ),
    'expanded morning follows the recorded ' + grade,
  )
const expandedRefusal = expandedNight('failed', 'No team dispatched')
assert.ok(
  expandedRefusal.scene.includes(
    EXPANDED_NIGHT_MORNINGS['shadow-inspector']!.refused,
  ),
)
assert.ok(!expandedRefusal.scene.includes(ceremony))

// District memory: the dispatch card names the district's last call and
// states exactly the trust change a personal investigation receives.
const threads = ['academy', 'transit', 'harbor', 'civic'] as const
const outcomes = ['honors', 'pass', 'partial', 'failed', 'refused'] as const
const witnessLines = new Set<string>()
for (const thread of threads)
  for (const outcome of outcomes) {
    const line = DISTRICT_WITNESSES[thread][outcome]
    assert.ok(line.includes('{case}') && line.length > 50, thread + outcome)
    witnessLines.add(line)
  }
assert.equal(witnessLines.size, 20)

const campaign = startFullAcademy('spatial', 31)
assert.equal(campaign.flowVersion, 3)
const harborDay = 12
const harborCall = { ...campaign, day: harborDay, phase: 'dispatch' as const }
assert.equal(districtMemory(harborCall, 'cloud-zoo'), null, 'no history yet')
const remembered = (memory: CaseMemory[]) => ({
  ...harborCall,
  caseHistory: memory,
})
const honored = remembered([
  { day: 9, caseId: 'flood', grade: 'honors', unanswered: false },
  { day: 10, caseId: 'pearl-pact', grade: 'pass', unanswered: false },
])
const honoredLine = districtMemory(honored, 'cloud-zoo')!
assert.ok(honoredLine.startsWith('Night 10: '))
assert.ok(honoredLine.includes("The Pearl Diver's Bargain"))
assert.ok(
  honoredLine.includes(
    DISTRICT_WITNESSES.harbor.pass.replace(
      '{case}',
      "The Pearl Diver's Bargain",
    ),
  ),
)
assert.equal(caseTrustModifier(honored.caseHistory, harborDay, 'cloud-zoo'), 2)
assert.ok(honoredLine.endsWith('gains +2 from district trust.'))
const ignored = remembered([
  { day: 11, caseId: 'ferris', grade: 'failed', unanswered: true },
])
const ignoredLine = districtMemory(ignored, 'cloud-zoo')!
assert.ok(ignoredLine.includes('went unanswered'))
assert.ok(ignoredLine.endsWith('costs 2 from district distrust.'))
const mixed = remembered([
  { day: 10, caseId: 'flood', grade: 'failed', unanswered: false },
  { day: 11, caseId: 'pearl-pact', grade: 'pass', unanswered: false },
])
assert.equal(caseTrustModifier(mixed.caseHistory, harborDay, 'cloud-zoo'), 0)
assert.ok(!/odds|trust\.|distrust\./.test(districtMemory(mixed, 'cloud-zoo')!))
assert.equal(
  districtMemory(remembered(ignored.caseHistory), 'shadow-court'),
  null,
  'harbor memories never leak into civic calls',
)
assert.equal(
  districtMemory({ ...ignored, day: 17 }, 'cloud-zoo'),
  null,
  'memories outside the five-night window fade',
)
assert.equal(
  districtMemory(
    remembered([
      { day: 11, caseId: 'cloud-zoo', grade: 'honors', unanswered: false },
    ]),
    'cloud-zoo',
  ),
  null,
  'a case does not remember itself',
)
assert.equal(
  districtMemory({ ...ignored, flowVersion: 2 }, 'cloud-zoo'),
  null,
  'older campaign flows are unchanged',
)
// The stated trust really is what a personal investigation adds.
let pairs = 0
for (const later of COMPLETE_NIGHT_DECK)
  for (const earlier of COMPLETE_NIGHT_DECK) {
    if (later.id === earlier.id) continue
    const line = districtMemory(
      remembered([
        { day: 11, caseId: earlier.id, grade: 'partial', unanswered: false },
      ]),
      later.id,
    )
    if (caseThread(later.id) !== caseThread(earlier.id)) {
      assert.equal(line, null)
      continue
    }
    pairs += 1
    assert.ok(line && line.includes(earlier.title), later.id + earlier.id)
    assert.ok(!line.includes('{case}') && !line.includes('the last call'))
  }
assert.ok(pairs > 250, 'every same-district pair produces a named memory')
assert.ok(
  !/trust\.|distrust\./.test(
    districtMemory(
      remembered([
        { day: 11, caseId: 'ferris', grade: 'honors', unanswered: false },
      ]),
      'flood',
    )!,
  ),
  'no investigation odds are promised on calls that cannot be investigated',
)
const ledCall = incidentsFor(harborCall).find((entry) =>
  EXPANDED_MISSIONS.some((mission) => mission.incident.id === entry.id),
)!
assert.ok(ledCall, 'day 12 offers an investigable expanded case')
const ledThread = caseThread(ledCall.id)!
const neighbor = COMPLETE_NIGHT_DECK.find(
  (entry) => entry.id !== ledCall.id && caseThread(entry.id) === ledThread,
)!
for (const [memory, expected] of [
  [{ grade: 'honors', unanswered: false }, 'gains +2'],
  [{ grade: 'failed', unanswered: true }, 'costs 2'],
] as const) {
  const history: CaseMemory[] = [{ day: 11, caseId: neighbor.id, ...memory }]
  const led = selectMissionApproach(
    assignPlayerCase(remembered(history), ledCall.id),
    ledCall.id,
    'investigate',
  )
  assert.equal(led.missionApproach, 'investigate')
  const line = districtMemory(led, ledCall.id)!
  assert.ok(line.includes(neighbor.title) && line.includes(expected), line)
  const blank = { ...led, caseHistory: [] }
  assert.equal(
    dispatchModifier(led, ledCall, []) - dispatchModifier(blank, ledCall, []),
    caseTrustModifier(history, harborDay, ledCall.id),
    'the odds stated on the card are the odds applied',
  )
}

console.log(
  'Prom of Doom: 36 cases x five morning callbacks, 20 district memories with truthful odds, and debrief-to-school continuity verified.',
)
