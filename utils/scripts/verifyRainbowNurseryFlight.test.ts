import assert from 'node:assert/strict'
import {
  NURSERY,
  NURSERY_FLIGHT,
  NURSERY_FLIGHT_SECTIONS,
  NURSERY_WAVES,
  nurseryDetourFor,
  nurseryFlightCheckpointValid,
  nurseryFlightPhase,
  nurserySpawns,
} from '../arcade/games/rainbowLanternNursery'

assert.equal(NURSERY_FLIGHT.id, 'X1')
assert.equal(NURSERY_WAVES.length, 20)
assert.equal(NURSERY_FLIGHT_SECTIONS.length, 6)
assert.equal(NURSERY_FLIGHT_SECTIONS[0]!.from, NURSERY.openingEnds)
assert.equal(
  NURSERY_FLIGHT_SECTIONS.at(-1)!.to,
  NURSERY_FLIGHT.end,
)
for (let i = 1; i < NURSERY_FLIGHT_SECTIONS.length; i++)
  assert.equal(
    NURSERY_FLIGHT_SECTIONS[i]!.from,
    NURSERY_FLIGHT_SECTIONS[i - 1]!.to,
  )
for (const seats of [1, 2, 3, 4]) {
  const low = Array.from({ length: seats }, () => 170)
  assert.equal(nurseryDetourFor(low, true, true), true)
  assert.equal(nurseryDetourFor(low, false, true), false)
  assert.equal(nurseryDetourFor(low, true, false), false)
  assert.equal(
    nurseryDetourFor(Array.from({ length: seats }, () => 80), true, true),
    false,
  )
}
assert.equal(nurseryDetourFor([180, 70], true, true), true)
assert.equal(nurseryDetourFor([70, 180], true, true), false)
assert.equal(nurseryDetourFor([180, 70, 70, 180], true, true), true)
assert.equal(nurseryDetourFor([70, 180, 180, 70], true, true), false)
assert.equal(nurseryDetourFor([], true, true), false)
assert.equal(nurseryDetourFor([Number.NaN], true, true), false)

assert.equal(nurseryFlightPhase(0), 'opening')
assert.equal(nurseryFlightPhase(240), 'waves')
assert.equal(nurseryFlightPhase(3600), 'guardian')
assert.equal(nurseryFlightPhase(4380), 'exit')
assert.equal(nurseryFlightPhase(5100), 'done')
for (const entry of NURSERY_WAVES)
  assert.ok(nurserySpawns(entry.at).length > 0)

const checkpoint = {
  nurseryStartedAt: 200,
  nurseryFrame: 1920,
  rescuedNemi: true,
  trenchRoute: 'safe' as const,
  routeSettled: true,
}
assert.equal(nurseryFlightCheckpointValid(3, 2120, checkpoint), true)
for (const invalid of [
  { ...checkpoint, rescuedNemi: false },
  { ...checkpoint, routeSettled: false },
  { ...checkpoint, trenchRoute: null },
  { ...checkpoint, nurseryFrame: 1900 },
  { ...checkpoint, nurseryFrame: -1 },
  { ...checkpoint, nurseryStartedAt: 0 },
]) assert.equal(nurseryFlightCheckpointValid(3, 2120, invalid), false)
assert.equal(nurseryFlightCheckpointValid(2, 2120, checkpoint), false)
assert.equal(nurseryFlightCheckpointValid(3, 2121, checkpoint), false)
assert.equal(
  nurseryFlightCheckpointValid(3, 200, { ...checkpoint, nurseryFrame: 0 }),
  true,
)
console.log('X1 Nursery: 20 waves, six contiguous sections, co-op vote, exact checkpoint proof passed')
