import assert from 'node:assert/strict'
import { DAY_ONE_BRIEFINGS, DAY_ONE_INCIDENTS } from '../emperorOfDust/dayOne'
import { availableFollowers, availableHorde, dispatchFollowers, timeAt } from '../emperorOfDust/engine'
import { IMPERIAL_REGIONS, pathFromTower, regionForIncident, TOWER } from '../emperorOfDust/map'
import { advancePilotClock } from '../emperorOfDust/pilot'
import { startEmperorCampaign } from '../emperorOfDust/progression'
import { decodeEmperorSave, encodeEmperorSave } from '../emperorOfDust/save'

assert.deepEqual(TOWER, { x: 50, y: 9 })
assert.equal(IMPERIAL_REGIONS.length, 6)
assert.equal(new Set(IMPERIAL_REGIONS.map((region) => region.id)).size, 6)
assert.ok(IMPERIAL_REGIONS.every((region) =>
  region.x > 0 && region.x < 100 &&
  region.y > TOWER.y && region.y < 95 &&
  region.outwardHours >= 1 && region.outwardHours <= 5 &&
  pathFromTower(region).startsWith('M 50 9 L '),
), 'all regions have distinct radial routes from top-center tower')
assert.equal(DAY_ONE_INCIDENTS.length, 3)
assert.equal(new Set(DAY_ONE_INCIDENTS.map((incident) => incident.id)).size, 3)
for (const incident of DAY_ONE_INCIDENTS) {
  const region = regionForIncident(incident)
  assert.equal(incident.outwardHours, region.outwardHours)
  assert.equal(incident.day, 1)
  assert.ok(incident.opensAtHour < incident.deadlineHour)
  assert.ok(incident.choices.length >= 2)
  assert.ok(incident.choices.every((choice) => choice.injuryDaysOnFailure !== undefined))
}
assert.equal(DAY_ONE_BRIEFINGS.length, 3)
assert.equal(DAY_ONE_BRIEFINGS.filter((report) => report.truth).length, 2)
assert.equal(DAY_ONE_BRIEFINGS.filter((report) => !report.truth).length, 1)

const state = startEmperorCampaign(1201)
assert.equal(state.hour, 7)
const aqueduct = DAY_ONE_INCIDENTS[0]!
const advanceAtDeadline = advancePilotClock(state, timeAt(1, aqueduct.deadlineHour))
assert.deepEqual(advanceAtDeadline.ignoredIncidentIds, [], 'deadline hour is still open')
const missed = advancePilotClock(advanceAtDeadline, timeAt(1, aqueduct.deadlineHour) + 1)
assert.deepEqual(missed.ignoredIncidentIds, [aqueduct.id])
assert.equal(missed.popularity, state.popularity + (aqueduct.neglected.popularity ?? 0))
assert.equal(missed.prosperity, state.prosperity + (aqueduct.neglected.prosperity ?? 0))

const missedAll = advancePilotClock(state, timeAt(2, 7))
assert.equal(missedAll.ignoredIncidentIds.length, 3)
assert.deepEqual(
  advancePilotClock(missedAll, timeAt(3, 7)).ignoredIncidentIds,
  missedAll.ignoredIncidentIds,
  'next mornings do not penalize ignored incidents twice',
)

const sent = dispatchFollowers(
  state,
  aqueduct,
  ['F002'],
  aqueduct.hordeMinimum,
  aqueduct.choices[0]!.id,
)
assert.equal(availableHorde(sent), 60 - aqueduct.hordeMinimum)
assert.equal(availableFollowers(sent).length, 4)
const afterDay = advancePilotClock(sent, timeAt(2, 7))
assert.equal(afterDay.dispatches[0]?.outcome?.choiceId, 'repair')
assert.equal(afterDay.dispatches[0]?.returnsAt, 13)
assert.equal(afterDay.ignoredIncidentIds.length, 2, 'sent mission is not neglected')
assert.equal(afterDay.horde - availableHorde(afterDay), 0, 'returned troops are available')
assert.deepEqual(
  decodeEmperorSave(encodeEmperorSave(afterDay)),
  JSON.parse(JSON.stringify(afterDay)),
  'save round-trip preserves JSON campaign state',
)

const stepped = advancePilotClock(
  advancePilotClock(sent, timeAt(1, 15)),
  timeAt(2, 7),
)
assert.deepEqual(stepped, afterDay, 'large and incremental clock jumps resolve identically')
assert.throws(() => regionForIncident({ ...aqueduct, outwardHours: 5 }), /invalid map route/)
console.log('Emperor of Dust radial map, Day 1 briefing and clock contracts passed')
