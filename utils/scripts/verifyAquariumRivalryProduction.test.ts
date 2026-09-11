import assert from 'node:assert/strict'

import { applyRivalryToProduction } from '../../server/utils/aquariumRivalryProduction.js'

const predatorPrey = applyRivalryToProduction([
  { id: 1, slug: 'hunter', dietRole: 'predator', production: 10 },
  { id: 2, slug: 'grazer', dietRole: 'prey', production: 20 },
])

assert.equal(predatorPrey.rivalry.active, true)
assert.equal(predatorPrey.productionByFishId.get(1), 7)
assert.equal(predatorPrey.productionByFishId.get(2), 14)
assert.equal(predatorPrey.totalProduction, 21)

const peaceful = applyRivalryToProduction([
  { id: 1, slug: 'hunter', dietRole: 'predator', production: 10 },
  { id: 2, slug: 'grazer', dietRole: 'prey', production: 20 },
], true)

assert.equal(peaceful.rivalry.active, false)
assert.equal(peaceful.productionByFishId.get(1), 10)
assert.equal(peaceful.productionByFishId.get(2), 20)
assert.equal(peaceful.totalProduction, 30)

const strongestRule = applyRivalryToProduction([
  { id: 1, slug: 'same', dietRole: 'predator', rivals: ['same'], production: 100 },
  { id: 2, slug: 'same', dietRole: 'prey', production: 100 },
])

assert.equal(strongestRule.rivalry.pairs[0]?.multiplierEach, 0.6)
assert.equal(strongestRule.totalProduction, 120)

console.log('✅ rivalry production composition applies strongest penalties and Peace Ward suppression')
