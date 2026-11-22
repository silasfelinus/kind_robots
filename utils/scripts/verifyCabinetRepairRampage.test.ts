import assert from 'node:assert/strict'
import { REPAIR_TOWNS, repairTownForCity } from '../arcade/repairRampage/towns'

assert.equal(REPAIR_TOWNS.length, 25)
assert.equal(new Set(REPAIR_TOWNS.map((town) => town.id)).size, 25)
assert.equal(new Set(REPAIR_TOWNS.map((town) => town.name)).size, 25)
assert.equal(new Set(REPAIR_TOWNS.map((town) => town.region)).size, 5)

for (const [index, town] of REPAIR_TOWNS.entries()) {
  assert.equal(repairTownForCity(index + 1), town)
  assert.ok(town.towerCount >= 2 && town.towerCount <= 4)
  assert.ok(town.maxRows >= 4 && town.maxRows <= 11)
  assert.ok(town.damage > 0 && town.damage < 1)
  assert.ok(town.threats.includes('news-drone'))
  assert.ok(town.objective === 'repair' || town.objective === 'rescue' || town.objective === 'relight')
}

assert.equal(repairTownForCity(26), REPAIR_TOWNS[0])
assert.equal(repairTownForCity(0), REPAIR_TOWNS[0])
console.log('Repair Rampage authored town catalog: 25 towns across five regions')
