import assert from 'node:assert/strict'
import {
  DAY_FOUR_BRIEFINGS,
  DAY_FOUR_INCIDENTS,
  KOMODO_DAY_FOUR_HINT,
} from '../emperorOfDust/dayFour'
import { DAY_THREE_INCIDENTS } from '../emperorOfDust/dayThree'
import { DAY_TWO_INCIDENTS } from '../emperorOfDust/dayTwo'
import { DAY_ONE_INCIDENTS } from '../emperorOfDust/dayOne'
import { regionForIncident } from '../emperorOfDust/map'

assert.equal(DAY_FOUR_INCIDENTS.length, 3)
const ids = [
  ...DAY_ONE_INCIDENTS,
  ...DAY_TWO_INCIDENTS,
  ...DAY_THREE_INCIDENTS,
  ...DAY_FOUR_INCIDENTS,
].map((i) => i.id)
assert.equal(new Set(ids).size, ids.length, 'incident ids are unique')
for (const incident of DAY_FOUR_INCIDENTS) {
  assert.equal(incident.day, 4)
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
assert.equal(DAY_FOUR_BRIEFINGS.length, 3)
assert.equal(DAY_FOUR_BRIEFINGS.filter((r) => r.truth).length, 2)
assert.ok(KOMODO_DAY_FOUR_HINT.length > 0)

console.log('Emperor of Dust Day 4 incident and briefing contracts passed')
