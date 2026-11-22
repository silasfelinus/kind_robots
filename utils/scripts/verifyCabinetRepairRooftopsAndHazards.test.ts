import assert from 'node:assert/strict'
import {
  ROOFTOP_KINDS,
  rooftopForTower,
} from '../arcade/repairRampage/rooftops'
import { repairHazardForCity } from '../arcade/repairRampage/hazards'
import { REPAIR_TOWNS } from '../arcade/repairRampage/towns'

const roofs = new Set<string>()
const hazards = new Set<string>()
for (let city = 1; city <= 25; city++) {
  const town = REPAIR_TOWNS[city - 1]!
  for (let tower = 0; tower < town.towerCount; tower++) {
    const kind = rooftopForTower(city, tower)
    assert.equal(kind, rooftopForTower(city, tower))
    roofs.add(kind)
  }
  for (let sequence = 0; sequence < 12; sequence++) {
    const hazard = repairHazardForCity(city, sequence, town.towerCount)
    assert.deepEqual(
      hazard,
      repairHazardForCity(city, sequence, town.towerCount),
    )
    if (!hazard) continue
    hazards.add(hazard.kind)
    assert.ok(town.threats.includes(hazard.kind))
    assert.ok(hazard.tower >= 0 && hazard.tower < town.towerCount)
    assert.ok(hazard.col >= 0 && hazard.col < 3)
    assert.ok(hazard.row >= 0 && hazard.row < town.maxRows)
    assert.ok(hazard.ticks >= 60)
  }
}
assert.deepEqual([...roofs].sort(), [...ROOFTOP_KINDS].sort())
assert.deepEqual([...hazards].sort(), [
  'gull-flock',
  'gust',
  'paparazzi-blimp',
  'pigeon',
])
assert.equal(repairHazardForCity(1, 0, 0), null)
console.log('Repair Rampage: five powered rooftops and four seeded hazards')
