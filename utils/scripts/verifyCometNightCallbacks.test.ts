// Prom of Doom night patrol (t-004): followers rushed back from the infirmary
// need a healthy partner, and the 24 expanded cases acknowledge the
// protagonist's own field when they lead the call.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  EXPANDED_MISSIONS,
  expandedMissionFor,
} from '../cometAcademy/expandedNightCases'
import { EXPANDED_POWER_CALLBACKS } from '../cometAcademy/expandedPowerCallbacks'
import {
  POWERS,
  assignPlayerCase,
  assignTeam,
  chooseNovelNight,
  dispatchChance,
  dispatchModifier,
  incidentsFor,
  nextSchoolDay,
  playerPowerCallback,
  recoveringFollower,
  resolveDispatch,
  restoreAcademy,
  rosterConflictPenalty,
  rosterConflicts,
  startFullAcademy,
  studentAvailable,
  tendInfirmary,
  type AcademyRun,
  type Grade,
  type PowerId,
  type StudentId,
} from '../cometAcademy/rules'

const page = readFileSync(
  new URL('../../pages/play/comet-city-academy.vue', import.meta.url),
  'utf8',
)
const roundTrip = (run: AcademyRun) => {
  const saved = JSON.parse(JSON.stringify(run))
  assert.deepEqual(restoreAcademy(saved), saved, `save day ${run.day}`)
  return run
}
const rank: Record<Grade, number> = {
  failed: 0,
  partial: 1,
  pass: 2,
  honors: 3,
}

// ------------------------------------------- injury-driven roster conflicts
const DAY = 16
const contacts: StudentId[] = ['mina', 'sol', 'imani']
/** Mina was hurt on night 15 and is still benched on day 16, unless treated. */
function hurtMorning(seed: number): AcademyRun {
  return {
    ...startFullAcademy('kinetic', seed),
    day: DAY,
    phase: 'map',
    contacts,
    injuries: { mina: DAY + 1 },
  }
}
const stripTreatment = (run: AcademyRun): AcademyRun => ({
  ...run,
  log: run.log.filter((line) => !line.includes('Infirmary treatment')),
})

{
  const morning = hurtMorning(4401)
  assert.equal(studentAvailable(morning, 'mina'), false, 'still injured')
  assert.equal(recoveringFollower(morning, 'mina'), false)
  const treated = tendInfirmary(morning, 'mina')
  assert.equal(treated.phase, 'dispatch')
  assert.equal(treated.injuries?.mina, DAY, 'infirmary rule unchanged')
  assert.ok(studentAvailable(treated, 'mina'))
  assert.ok(recoveringFollower(treated, 'mina'))
  assert.equal(recoveringFollower(treated, 'sol'), false)
  assert.ok(treated.scene.includes('healthy partner'))
  roundTrip(treated)
  // A follower who rested the full night out is whole again.
  const rested = {
    ...morning,
    phase: 'dispatch' as const,
    injuries: { mina: DAY },
  }
  assert.ok(studentAvailable(rested, 'mina'))
  assert.equal(recoveringFollower(rested, 'mina'), false)
  // Earlier campaigns never see the rule.
  assert.equal(
    recoveringFollower({ ...treated, flowVersion: 2 }, 'mina'),
    false,
  )

  const cases = incidentsFor(treated)
  assert.ok(cases.length >= 2, 'a mid-month night offers several calls')
  const [lead, other] = [cases[0]!, cases[1]!]
  const night = assignPlayerCase(treated, lead.id)
  const healthy = stripTreatment(night)

  // Alone: goes anyway at a stated -1, reflected in the shown odds.
  const solo = rosterConflicts(night, other.id, ['mina'])
  assert.equal(solo.length, 1)
  assert.equal(solo[0]!.partner, null)
  assert.ok(solo[0]!.card.includes('-1 to this call'))
  assert.equal(rosterConflictPenalty(night, other.id, ['mina']), 1)
  assert.equal(
    dispatchModifier(night, other, ['mina']),
    dispatchModifier(healthy, other, ['mina']) - 1,
  )
  assert.ok(
    dispatchChance(night, other.id, ['mina']) <=
      dispatchChance(healthy, other.id, ['mina']),
  )
  // A healthy partner covers them at no cost.
  const paired = rosterConflicts(night, other.id, ['mina', 'sol'])
  assert.equal(paired[0]!.partner, 'Sol Navarro')
  assert.ok(paired[0]!.card.includes('no penalty'))
  assert.equal(
    dispatchModifier(night, other, ['mina', 'sol']),
    dispatchModifier(healthy, other, ['mina', 'sol']),
  )
  // So does the protagonist personally leading the call.
  const withYou = rosterConflicts(night, lead.id, ['mina'])
  assert.equal(withYou[0]!.partner, 'you')
  assert.equal(
    dispatchModifier(night, lead, ['mina']),
    dispatchModifier(healthy, lead, ['mina']),
  )
  assert.deepEqual(rosterConflicts(night, other.id, ['sol']), [])
  assert.deepEqual(rosterConflicts(healthy, other.id, ['mina']), [])

  // The night report names the conflict either way.
  const sent = assignTeam(night, other.id, ['mina'])
  assert.deepEqual(sent.assignments, [{ caseId: other.id, students: ['mina'] }])
  const done = resolveDispatch(sent)
  assert.equal(done.phase, 'debrief')
  const report = done.reports.find((entry) => entry.caseId === other.id)!
  assert.ok(report.text.includes(solo[0]!.report), report.text)
  roundTrip(done)
  const covered = resolveDispatch(assignTeam(night, other.id, ['mina', 'sol']))
  assert.ok(
    covered.reports
      .find((entry) => entry.caseId === other.id)!
      .text.includes('RECOVERING: Sol Navarro covered Mina Quill'),
  )
  // Injuries still follow the existing rules, and the conflict ends at dawn.
  const minaAfter = done.injuries?.mina ?? 0
  assert.ok(minaAfter === DAY || minaAfter === DAY + 2)
  const tomorrow = nextSchoolDay(done)
  assert.equal(recoveringFollower(tomorrow, 'mina'), false)
  assert.equal(studentAvailable(tomorrow, 'mina'), minaAfter <= DAY + 1)
}

// Seeded: going out alone is never better and sometimes visibly worse.
{
  let worse = 0
  let pinned: { seed: number; treated: Grade; rested: Grade } | null = null
  for (let seed = 1; seed <= 120; seed++) {
    const treated = tendInfirmary(hurtMorning(seed), 'mina')
    const cases = incidentsFor(treated)
    if (cases.length < 2) continue
    const night = assignTeam(
      assignPlayerCase(treated, cases[0]!.id),
      cases[1]!.id,
      ['mina'],
    )
    const gradeOf = (run: AcademyRun) =>
      resolveDispatch(run).reports.find((r) => r.caseId === cases[1]!.id)!.grade
    const a = gradeOf(night)
    const b = gradeOf(stripTreatment(night))
    assert.ok(rank[a] <= rank[b], `seed ${seed}: ${a} vs ${b}`)
    if (rank[a] < rank[b]) {
      worse++
      pinned ??= { seed, treated: a, rested: b }
    }
  }
  assert.ok(worse >= 5, `${worse} seeds where a lone return costs a grade`)
  assert.deepEqual(pinned, { seed: 2, treated: 'failed', rested: 'partial' })
}

// Visual-novel nights: healthy contacts fill solo calls first, and the
// rushed-back follower joins the player instead of going out alone.
{
  const novel: AcademyRun = {
    ...startFullAcademy('kinetic', 5150, undefined, undefined, 'student', {
      tacticalMissions: false,
      nightPatrols: false,
    }),
    day: DAY,
    phase: 'map',
    contacts: ['mina', 'sol'],
    injuries: { mina: DAY + 1 },
  }
  const treated = tendInfirmary(novel, 'mina')
  const cases = incidentsFor(treated)
  const chosen = chooseNovelNight(treated, cases[0]!.id, 'rescue')
  const solo = chosen.assignments.find((a) => a.caseId !== cases[0]!.id)
  assert.deepEqual(solo?.students, ['sol'])
  if (cases.length === 2)
    assert.deepEqual(
      chosen.assignments.find((a) => a.caseId === cases[0]!.id)?.students,
      ['mina'],
    )
  const untreated = chooseNovelNight(
    stripTreatment(treated),
    cases[0]!.id,
    'rescue',
  )
  assert.deepEqual(
    untreated.assignments.find((a) => a.caseId !== cases[0]!.id)?.students,
    ['mina'],
    'contact order is unchanged when nobody was rushed back',
  )
}

// ------------------------------------------------- unique-power callbacks
const powers = POWERS.map((power) => power.id)
assert.deepEqual(
  Object.keys(EXPANDED_POWER_CALLBACKS).sort(),
  EXPANDED_MISSIONS.map((mission) => mission.incident.id).sort(),
)
const perPower = Object.fromEntries(powers.map((p) => [p, 0])) as Record<
  PowerId,
  number
>
const lines = new Set<string>()
for (const mission of EXPANDED_MISSIONS) {
  const table = EXPANDED_POWER_CALLBACKS[mission.incident.id]!
  const fields = Object.keys(table) as PowerId[]
  assert.equal(fields.length, 2, mission.incident.id)
  assert.ok(fields.includes(mission.incident.need), 'the needed field speaks')
  for (const field of fields) {
    const line = table[field]!
    assert.ok(line.length > 60 && line.length < 200, `${field}: ${line}`)
    assert.ok(!/\b(honors|failed|succeed|success)\b/i.test(line), line)
    assert.notEqual(line, mission.secret)
    lines.add(line)
    perPower[field]++
  }
}
assert.equal(lines.size, 48, 'no callback is reused')
assert.deepEqual(
  Object.values(perPower),
  powers.map(() => 8),
  'every field hears from eight cases',
)

{
  const run: AcademyRun = {
    ...startFullAcademy('kinetic', 2026),
    day: 20,
    phase: 'dispatch',
  }
  const expanded = [...EXPANDED_MISSIONS].find((m) =>
    incidentsFor(run).some((incident) => incident.id === m.incident.id),
  )
  assert.ok(expanded, 'a late night offers an expanded case')
  const id = expanded!.incident.id
  const need = expanded!.incident.need
  const other = (Object.keys(EXPANDED_POWER_CALLBACKS[id]!) as PowerId[]).find(
    (field) => field !== need,
  )!
  const silent = powers.find(
    (field) => !(field in EXPANDED_POWER_CALLBACKS[id]!),
  )!
  assert.equal(playerPowerCallback({ ...run, power: need }, id), null)
  const led = assignPlayerCase({ ...run, power: need }, id)
  const matched = playerPowerCallback(led, id)!
  assert.ok(matched.matched && matched.odds.includes('+2'))
  assert.equal(matched.line, EXPANDED_POWER_CALLBACKS[id]![need])
  const offField = playerPowerCallback({ ...led, power: other }, id)!
  assert.ok(!offField.matched && offField.odds.includes('+1'))
  assert.equal(playerPowerCallback({ ...led, power: silent }, id), null)
  assert.equal(playerPowerCallback({ ...led, flowVersion: 2 }, id), null)
  // The stated bonus is exactly what the roll uses; flavor changes nothing.
  const incident = expandedMissionFor(id)!.incident
  assert.equal(
    dispatchModifier(led, incident, []) -
      dispatchModifier({ ...led, power: other }, incident, []),
    1,
  )
  assert.equal(
    dispatchModifier({ ...led, power: other }, incident, []),
    dispatchModifier({ ...led, power: silent }, incident, []),
  )
  const report = resolveDispatch(led).reports.find((r) => r.caseId === id)!
  assert.ok(
    report.text.includes(`YOUR POWER · ${matched.stat.toUpperCase()}: `),
  )
  assert.ok(report.text.includes(matched.line))
  const quiet = resolveDispatch({ ...led, power: silent }).reports.find(
    (r) => r.caseId === id,
  )!
  assert.ok(!quiet.text.includes('YOUR POWER'))
}

assert.ok(page.includes('data-testid="academy-power-callback"'))
assert.ok(page.includes('data-testid="academy-roster-conflict"'))
assert.ok(page.includes('RECOVERING · NEEDS A PARTNER'))

console.log(
  'Prom of Doom night calls: infirmary returns need a healthy partner (seeded -1 when alone, covered by you or a teammate), 48 power callbacks across 24 cases with truthful odds.',
)
