// Prom of Doom player-led missions (t-022, kind_robots#4402): every board
// mission has an authored offer, five distinct results, and each district
// hides a secret that a personally led investigation uncovers in seeded play
// and that pays off on later calls in that district.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { caseThread, type CaseThread } from '../cometAcademy/caseMemory'
import { CITY_SITES } from '../cometAcademy/cityMap'
import { nightCaseMorning } from '../cometAcademy/earlyNightMornings'
import { expandedMissionFor } from '../cometAcademy/expandedNightCases'
import {
  DISTRICT_SECRETS,
  FACTION_LABELS,
  MISSION_OFFERS,
  MISSION_RESULTS,
  UNANSWERED_NAMES,
  URGENCY_LABELS,
  exposedSecretFor,
  missionOfferFor,
  missionResult,
  offerCallback,
  type MissionResult,
} from '../cometAcademy/missionOffers'
import { realNightCase } from '../cometAcademy/nightCases'
import {
  COMPLETE_NIGHT_DECK,
  POWERS,
  STUDENTS,
  assignPlayerCase,
  assignTeam,
  callEmergencyVolunteer,
  chooseEncounter,
  dispatchChance,
  dispatchModifier,
  districtSecretModifier,
  districtSecretWithin,
  emergencyContact,
  encounterFor,
  incidentsFor,
  knownContacts,
  missionOfferCard,
  nextSchoolDay,
  recruitContact,
  recruitableContact,
  resolveDispatch,
  restoreAcademy,
  selectMissionApproach,
  startFullAcademy,
  studentAvailable,
  visitCitySite,
  type AcademyRun,
  type Grade,
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
const THREADS: CaseThread[] = ['academy', 'transit', 'harbor', 'civic']

// ------------------------------------------------- authored offer coverage
assert.equal(COMPLETE_NIGHT_DECK.length, 36)
assert.deepEqual(
  Object.keys(MISSION_OFFERS).sort(),
  COMPLETE_NIGHT_DECK.map((incident) => incident.id).sort(),
  'every board mission, and only board missions, has an offer',
)
const askers = new Set<string>()
const pleas = new Set<string>()
const exposures = new Set<string>()
for (const incident of COMPLETE_NIGHT_DECK) {
  const offer = missionOfferFor(incident.id)!
  assert.equal(offer.caseId, incident.id)
  assert.equal(offer.thread, caseThread(incident.id))
  assert.ok(offer.asker.length > 10, `${incident.id} names who is asking`)
  assert.ok(offer.plea.length > 40, `${incident.id} plea`)
  assert.ok(offer.deadline.startsWith('Before '), `${incident.id} deadline`)
  assert.ok(offer.urgency in URGENCY_LABELS, `${incident.id} urgency`)
  assert.ok(offer.faction in FACTION_LABELS, `${incident.id} faction`)
  assert.ok(offer.interferer.length > 5, `${incident.id} interferer`)
  assert.ok(
    offer.interference.length > 20 && !/[.!?]$/.test(offer.interference),
    `${incident.id} interference reads as a verb phrase`,
  )
  askers.add(offer.asker)
  pleas.add(offer.plea)
  // Only the faction a district secret exposes gets an exposed payoff line.
  const secret = DISTRICT_SECRETS[offer.thread]
  assert.equal(
    Boolean(offer.exposed),
    offer.faction === secret.faction,
    `${incident.id} exposed line matches its faction`,
  )
  if (offer.exposed) {
    assert.ok(offer.exposed.length > 60)
    exposures.add(offer.exposed)
  }
  // Callback IDs are promises; each must resolve to authored content.
  assert.ok(offer.callbacks.includes(`morning:${incident.id}`))
  assert.ok(offer.callbacks.includes(`secret:${offer.thread}`))
  for (const id of offer.callbacks)
    assert.ok(offerCallback(id), `${incident.id} callback ${id} resolves`)
  if (expandedMissionFor(incident.id))
    assert.ok(offer.callbacks.includes(`power:${incident.id}`))
}
assert.equal(askers.size, 36, 'nobody asks twice')
assert.equal(pleas.size, 36, 'no reused pleas')
assert.equal(offerCallback('morning:nowhere'), null)
assert.equal(offerCallback('secret:moon'), null)
const urgencies = new Set(Object.values(MISSION_OFFERS).map((o) => o.urgency))
assert.equal(urgencies.size, 3, 'the board mixes minutes, tonight and dawn')
const factions = new Set(Object.values(MISSION_OFFERS).map((o) => o.faction))
assert.equal(factions.size, 6, 'six factions interfere across the board')
// Every district secret can pay off on several later calls, including
// investigable ones, and its reveal is distinct.
for (const thread of THREADS) {
  const secret = DISTRICT_SECRETS[thread]
  assert.equal(secret.thread, thread)
  assert.ok(secret.reveal.length > 150)
  const exposable = Object.values(MISSION_OFFERS).filter(
    (offer) => offer.thread === thread && offer.exposed,
  )
  assert.ok(exposable.length >= 4, `${thread} has ${exposable.length} payoffs`)
  assert.ok(exposable.some((offer) => expandedMissionFor(offer.caseId)))
}
assert.equal(
  new Set(THREADS.map((thread) => DISTRICT_SECRETS[thread].title)).size,
  4,
)
assert.equal(exposures.size, [...exposures].length)

// --------------------------------------------- five results per mission
assert.deepEqual(MISSION_RESULTS, [
  'honors',
  'pass',
  'partial',
  'failed',
  'refused',
])
assert.equal(
  missionResult({ grade: 'failed', names: UNANSWERED_NAMES }),
  'refused',
)
assert.equal(
  missionResult({ grade: 'failed', names: 'YOU · on patrol' }),
  'failed',
)
const allResultText = new Set<string>()
for (const incident of COMPLETE_NIGHT_DECK) {
  const authored = realNightCase(incident.id)!
  const night: Record<MissionResult, string> = {
    ...authored.consequences,
    refused: authored.refused,
  }
  const mornings: string[] = MISSION_RESULTS.map((result): string =>
    nightCaseMorning(
      incident.id,
      result === 'refused' ? 'failed' : result,
      result === 'refused',
    )!,
  )
  assert.equal(
    new Set(Object.values(night)).size,
    5,
    `${incident.id} five distinct night results`,
  )
  assert.equal(new Set(mornings).size, 5, `${incident.id} five mornings`)
  for (const text of Object.values(night)) allResultText.add(text)
}
assert.equal(allResultText.size, 36 * 5, 'no result prose shared by missions')

/** Each mission, played on the nights a real seeded calendar offers it,
 * resolves to all five results with the matching authored text: refused when
 * nobody goes, and honors/pass/partial/failed across leads, teams and seeds. */
const everyone: StudentId[] = STUDENTS.map((student) => student.id)
const crew = everyone.slice(0, 3)
for (const incident of COMPLETE_NIGHT_DECK) {
  const seen = new Set<MissionResult>()
  for (let seed = 1; seed <= 40 && seen.size < 5; seed++) {
    // Alternate between the field the call needs and every other field.
    const power = seed % 2 ? incident.need : POWERS[seed % POWERS.length]!.id
    const start = startFullAcademy(power, seed)
    const day = Array.from({ length: 26 }, (_, i) => i + 3).find((d) =>
      incidentsFor({ ...start, day: d }).some((c) => c.id === incident.id),
    )
    if (!day) continue
    const night: AcademyRun = {
      ...start,
      day,
      phase: 'dispatch',
      contacts: everyone,
    }
    // The rookie always leads a call; leading another one leaves this call
    // to the team the player sends, or to nobody: an honest refusal.
    const elsewhere = assignPlayerCase(
      night,
      incidentsFor(night).find((c) => c.id !== incident.id)!.id,
    )
    const variants: AcademyRun[] = [
      elsewhere,
      ...[0, 1, 2, 3].map((size) =>
        assignTeam(
          assignPlayerCase(night, incident.id),
          incident.id,
          crew.slice(0, size),
        ),
      ),
      // Each classmate alone: their reaction to this call can sink it.
      ...everyone.map((id) => assignTeam(elsewhere, incident.id, [id])),
    ]
    for (const variant of variants) {
      if (variant.phase !== 'dispatch') continue
      const resolved = resolveDispatch(variant)
      if (resolved === variant) continue
      const report = resolved.reports.find((r) => r.caseId === incident.id)!
      const result = missionResult(report)
      const authored = realNightCase(incident.id)!
      if (result === 'refused') {
        assert.equal(report.text, authored.refused)
        assert.ok(resolved.log.some((line) => line.endsWith('— refused')))
      } else
        assert.ok(
          report.text.startsWith(authored.consequences[result as Grade]),
          `${incident.id} ${result} text`,
        )
      seen.add(result)
    }
  }
  assert.equal(seen.size, 5, `${incident.id} reaches ${[...seen].join('/')}`)
}

// ------------------------------- secret discovery, payoff and save shape
{
  const transit = 'rail-orchestra'
  const start = startFullAcademy('empathy', 7)
  const day = Array.from({ length: 26 }, (_, i) => i + 3).find((d) =>
    incidentsFor({ ...start, day: d }).some((c) => c.id === transit),
  )!
  const night: AcademyRun = { ...start, day, phase: 'dispatch' }
  const led = selectMissionApproach(
    assignPlayerCase(night, transit),
    transit,
    'investigate',
  )
  assert.equal(districtSecretWithin(led, transit), null, 'needs a prior clue')
  assert.equal(missionOfferCard(led, transit)?.secretHint, null)
  const clued = { ...led, missionClues: ['ghost-ticket'] }
  assert.equal(districtSecretWithin(clued, transit), DISTRICT_SECRETS.transit)
  assert.ok(missionOfferCard(clued, transit)?.secretHint)
  // Older two-version campaigns never see offers or secrets.
  assert.equal(missionOfferCard({ ...clued, flowVersion: 2 }, transit), null)
  assert.equal(
    districtSecretWithin({ ...clued, flowVersion: 2 }, transit),
    null,
  )

  const known = {
    ...clued,
    missionClues: ['ghost-ticket', 'borrowed-faces'],
    districtSecrets: [
      { thread: 'transit' as const, day: day - 1, caseId: 'borrowed-faces' },
    ],
  }
  roundTrip(known)
  assert.equal(districtSecretWithin(known, transit), null, 'found only once')
  // rail-orchestra's promoter is private money: the ledger does not expose it.
  assert.equal(exposedSecretFor(known.districtSecrets, day, transit), null)
  assert.equal(districtSecretModifier(known, transit), 0)
  for (const caseId of ['monorail', 'quarry', 'ghost-ticket']) {
    assert.equal(
      exposedSecretFor(known.districtSecrets, day, caseId),
      DISTRICT_SECRETS.transit,
    )
    assert.equal(
      exposedSecretFor(known.districtSecrets, day - 1, caseId),
      null,
      'no payoff on the night it is found',
    )
  }
  assert.equal(
    exposedSecretFor(known.districtSecrets, day, 'flood'),
    null,
    'a transit secret does not expose the harbor',
  )

  // Save guards.
  const reject = (patch: Partial<AcademyRun>) =>
    assert.equal(
      restoreAcademy(JSON.parse(JSON.stringify({ ...known, ...patch }))),
      null,
      JSON.stringify(patch.districtSecrets ?? patch.flowVersion),
    )
  reject({
    districtSecrets: [
      { thread: 'moon' as never, day: 4, caseId: 'ghost-ticket' },
    ],
  })
  reject({
    districtSecrets: [{ thread: 'harbor', day: 4, caseId: 'ghost-ticket' }],
  })
  reject({
    districtSecrets: [{ thread: 'transit', day: 4, caseId: 'rail-heart' }],
  })
  reject({
    districtSecrets: [
      { thread: 'transit', day: day + 2, caseId: 'ghost-ticket' },
    ],
  })
  reject({
    districtSecrets: [
      { thread: 'transit', day: 4, caseId: 'ghost-ticket' },
      { thread: 'transit', day: 5, caseId: 'borrowed-faces' },
    ],
  })
  reject({ flowVersion: 2 })
}

let secretKnownReports = 0
/** A greedy investigator from New Game: lead an investigable call, preferring
 * a district where the casebook already holds a clue, and staff the rest. */
function investigatorNight(run: AcademyRun, investigate: boolean): AcademyRun {
  const site = CITY_SITES.find(
    (entry) => (run.visitedDays?.[entry.id] ?? -7) <= run.day - 7,
  )!.id
  let next = visitCitySite(run, site)
  const recruit = recruitableContact(next)
  if (recruit && knownContacts(next).length < 3)
    next = recruitContact(next, recruit.id)
  else next = chooseEncounter(next, encounterFor(next).options[0]!.id)
  if (emergencyContact(next)) next = callEmergencyVolunteer(next)
  assert.equal(next.phase, 'dispatch')
  const cases = incidentsFor(next)
  const clued = new Set((next.missionClues ?? []).map(caseThread))
  const lead = investigate
    ? (cases.find((c) => districtSecretWithin(next, c.id)) ??
      cases.find(
        (c) => expandedMissionFor(c.id) && !clued.has(caseThread(c.id)),
      ) ??
      cases.find((c) => expandedMissionFor(c.id)) ??
      cases[0]!)
    : cases[0]!
  next = assignPlayerCase(next, lead.id)
  if (investigate && expandedMissionFor(lead.id))
    next = selectMissionApproach(next, lead.id, 'investigate')
  for (const incident of cases) {
    const free = knownContacts(next).find(
      (id) =>
        studentAvailable(next, id) &&
        !next.assignments.some((entry) => entry.students.includes(id)),
    )
    if (free) next = assignTeam(next, incident.id, [free])
  }
  // The odds shown on the board include the secret's +1, exactly.
  for (const incident of cases) {
    const team =
      next.assignments.find((entry) => entry.caseId === incident.id)
        ?.students ?? []
    const bonus = districtSecretModifier(next, incident.id)
    const without = dispatchModifier(
      { ...next, districtSecrets: undefined },
      incident,
      team,
    )
    assert.equal(dispatchModifier(next, incident, team), without + bonus)
    assert.equal(
      Boolean(missionOfferCard(next, incident.id)?.secretKnown),
      bonus === 1,
    )
    if (team.length || next.playerCaseId === incident.id)
      assert.ok(dispatchChance(next, incident.id, team) >= 0)
  }
  const before = new Set((next.districtSecrets ?? []).map((s) => s.thread))
  const resolved = roundTrip(resolveDispatch(next))
  for (const found of resolved.districtSecrets ?? []) {
    if (before.has(found.thread)) continue
    // Found tonight, by the call the player personally investigated.
    assert.equal(found.day, next.day)
    assert.equal(found.caseId, lead.id)
    const report = resolved.reports.find((r) => r.caseId === lead.id)!
    assert.ok(['honors', 'pass'].includes(report.grade))
    assert.ok(report.text.includes(DISTRICT_SECRETS[found.thread].reveal))
  }
  // Payoff prose appears exactly on the calls the +1 applied to.
  for (const report of resolved.reports) {
    const exposed = exposedSecretFor(
      next.districtSecrets,
      next.day,
      report.caseId,
    )
    const answered = missionResult(report) !== 'refused'
    assert.equal(
      report.text.includes('SECRET KNOWN'),
      Boolean(exposed && answered),
      `${report.caseId} payoff line`,
    )
    if (exposed && answered) {
      assert.ok(report.text.includes(missionOfferFor(report.caseId)!.exposed!))
      secretKnownReports++
    }
  }
  return roundTrip(nextSchoolDay(resolved))
}

const discovered = new Map<CaseThread, number>()
let rescueOnlySecrets = 0
for (let seed = 1; seed <= 12; seed++) {
  let run = startFullAcademy('kinetic', seed)
  let rescuer = startFullAcademy('kinetic', seed)
  while (run.phase === 'map' && run.day < 30) {
    const day = run.day
    run = investigatorNight(run, true)
    rescuer = investigatorNight(rescuer, false)
    assert.equal(run.day, day + 1)
    const known = run.districtSecrets ?? []
    for (const entry of known)
      if (!discovered.has(entry.thread)) discovered.set(entry.thread, seed)
  }
  assert.equal(run.phase, 'finale', `seed ${seed} reaches the prom`)
  rescueOnlySecrets += rescuer.districtSecrets?.length ?? 0
}
for (const thread of THREADS)
  assert.ok(discovered.has(thread), `${thread} secret is reachable in play`)
assert.equal(rescueOnlySecrets, 0, 'rescue-only play never uncovers secrets')
assert.ok(secretKnownReports > 0, 'known secrets pay off in night reports')

// One seed, followed night by night: the secret is found, then pays off.
{
  let run = startFullAcademy('kinetic', 3)
  let foundOn: { thread: CaseThread; day: number } | null = null
  let paidOff = 0
  while (run.phase === 'map' && run.day < 30) {
    const day = run.day
    const before = run
    run = investigatorNight(run, true)
    if (!foundOn && run.districtSecrets?.length)
      foundOn = { thread: run.districtSecrets[0]!.thread, day }
    if (foundOn && day > foundOn.day) {
      const dispatch = incidentsFor({ ...before, phase: 'dispatch' })
      paidOff += dispatch.filter(
        (incident) =>
          caseThread(incident.id) === foundOn!.thread &&
          exposedSecretFor(run.districtSecrets, day, incident.id),
      ).length
    }
  }
  assert.ok(foundOn, 'seed 3 uncovers a district secret')
  assert.ok(paidOff > 0, 'and a later call in that district is exposed')
}

// --------------------------------------------------------------- UI hooks
for (const hook of [
  'data-testid="academy-mission-offer"',
  'data-testid="academy-offer-urgency"',
  'data-testid="academy-offer-interference"',
  'data-testid="academy-offer-secret-known"',
  'data-testid="academy-offer-secret-hint"',
  'data-testid="academy-novel-offer"',
  'data-testid="academy-report-result"',
  'missionResult(report)',
  'missionOfferCard(run.value, caseId)',
])
  assert.ok(page.includes(hook), hook)

console.log(
  `Prom of Doom mission offers: 36 authored offers (asker, urgency, faction, interference, resolvable callbacks), five distinct results reached for every mission, 4 district secrets reachable by seeded investigation (first found on seeds ${THREADS.map((t) => discovered.get(t)).join('/')}) with ${secretKnownReports} exposed +1 payoffs and save guards.`,
)
