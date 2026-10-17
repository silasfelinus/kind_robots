import assert from 'node:assert/strict'
import {
  DAY_TWO_BRIEFINGS,
  DAY_TWO_INCIDENTS,
  KOMODO_DAY_TWO_HINT,
} from '../emperorOfDust/dayTwo'
import { DAY_ONE_INCIDENTS } from '../emperorOfDust/dayOne'
import { dispatchFollowers, timeAt } from '../emperorOfDust/engine'
import { regionForIncident } from '../emperorOfDust/map'
import { advanceWithDeadlines } from '../emperorOfDust/clock'
import { startEmperorCampaign } from '../emperorOfDust/progression'

assert.equal(DAY_TWO_INCIDENTS.length, 3)
const ids = [...DAY_ONE_INCIDENTS, ...DAY_TWO_INCIDENTS].map((i) => i.id)
assert.equal(new Set(ids).size, ids.length, 'incident ids are unique')
for (const incident of DAY_TWO_INCIDENTS) {
  assert.equal(incident.day, 2)
  assert.equal(regionForIncident(incident).id, incident.destinationId)
  assert.ok(incident.opensAtHour < incident.deadlineHour)
  assert.ok(incident.deadlineHour <= 20)
  assert.ok(incident.hordeMinimum <= incident.hordeMaximum)
  assert.ok(incident.choices.length >= 2)
  assert.equal(
    new Set(incident.choices.map((c) => c.id)).size,
    incident.choices.length,
  )
  assert.ok(incident.choices.every((c) => c.injuryDaysOnFailure !== undefined))
}
assert.equal(DAY_TWO_BRIEFINGS.length, 3)
assert.equal(DAY_TWO_BRIEFINGS.filter((r) => r.truth).length, 2)
assert.ok(KOMODO_DAY_TWO_HINT.length > 0)

const campaign = advanceWithDeadlines(
  startEmperorCampaign(2202),
  timeAt(2, 7),
  DAY_ONE_INCIDENTS,
)
const cart = DAY_TWO_INCIDENTS[0]!
const sent = dispatchFollowers(
  campaign,
  cart,
  ['F002'],
  cart.hordeMinimum,
  cart.choices[0]!.id,
)
assert.equal(sent.dispatches.length, 1)
const missed = advanceWithDeadlines(campaign, timeAt(3, 7), DAY_TWO_INCIDENTS)
assert.equal(missed.ignoredIncidentIds.length, 6)

console.log('Emperor of Dust Day 2 incident and briefing contracts passed')
