// /utils/scripts/verifyAquariumShop.test.ts
//
// Regression + property test for cthulhuquarium/t-030's pure shop core
// (releasePrice, rotateShopStock, todaysShopDateKey) in
// server/utils/aquariumEconomy.ts -- no prisma, no database, no Nuxt/H3
// runtime, same discipline as verifyAquariumEconomy.test.ts.
import assert from 'node:assert/strict'

import {
  RARITY_TIERS,
  RELEASE_REFUND_FACTOR,
  releasePrice,
  rotateShopStock,
  SHOP_ROTATION_SIZE,
  todaysShopDateKey,
} from '../../server/utils/aquariumEconomy.js'

// --- releasePrice: a flat half of the unlock cost (t-082, LOOP.md) ----------

assert.equal(RELEASE_REFUND_FACTOR, 0.5)
assert.equal(releasePrice(RARITY_TIERS.COMMON.unlockCost), 25)
assert.equal(releasePrice(RARITY_TIERS.RARE.unlockCost), 375)
assert.equal(releasePrice(RARITY_TIERS.MYTHIC.unlockCost), 25000)
assert.equal(releasePrice(51), 25, 'floored, never rounded up')
assert.equal(releasePrice(0), 0, 'a free starter releases for nothing')
assert.equal(releasePrice(-10), 0)
assert.equal(releasePrice(Number.NaN), 0)
for (const tier of Object.values(RARITY_TIERS)) {
  assert.ok(
    releasePrice(tier.unlockCost) < tier.unlockCost || tier.unlockCost === 0,
    'releasing always costs something -- trading up is never free money',
  )
}

console.log(
  '✅ releasePrice: flat half of unlock cost, floored, never negative',
)

// --- todaysShopDateKey: UTC calendar day, YYYY-MM-DD -----------------------

assert.equal(
  todaysShopDateKey(new Date('2026-08-28T23:59:59.999Z')),
  '2026-08-28',
)
assert.equal(
  todaysShopDateKey(new Date('2026-01-01T00:00:00.000Z')),
  '2026-01-01',
)

console.log('✅ todaysShopDateKey: UTC calendar day, YYYY-MM-DD')

// --- rotateShopStock: deterministic, size-bounded, a real permutation ------

const eligible = Array.from({ length: 40 }, (_, index) => index + 1)

const rotationA = rotateShopStock(eligible, 7, '2026-08-28')
const rotationB = rotateShopStock(eligible, 7, '2026-08-28')
assert.deepEqual(
  rotationA,
  rotationB,
  'same (userId, dateKey) always produces the same slate',
)

const rotationNextDay = rotateShopStock(eligible, 7, '2026-08-29')
assert.notDeepEqual(
  rotationA,
  rotationNextDay,
  'a different dateKey produces a different slate (in practice, for a large enough pool)',
)

const rotationOtherUser = rotateShopStock(eligible, 8, '2026-08-28')
assert.notDeepEqual(
  rotationA,
  rotationOtherUser,
  'a different userId produces a different slate on the same day',
)

assert.equal(rotationA.length, SHOP_ROTATION_SIZE)
assert.equal(
  new Set(rotationA).size,
  rotationA.length,
  'no duplicate ids in one slate',
)
for (const id of rotationA) {
  assert.ok(
    eligible.includes(id),
    'every id in the slate came from the eligible pool',
  )
}

// A pool smaller than the rotation window returns everything, unshrunk --
// rotation only ever narrows a pool bigger than the window, never an
// already-small one (early game should never see FEWER unlockable species
// than actually exist).
const smallPool = [101, 102, 103]
const smallRotation = rotateShopStock(smallPool, 7, '2026-08-28')
assert.equal(smallRotation.length, smallPool.length)
assert.deepEqual(
  [...smallRotation].sort((a, b) => a - b),
  [...smallPool].sort((a, b) => a - b),
)

// An empty pool is a no-op, not a crash.
assert.deepEqual(rotateShopStock([], 7, '2026-08-28'), [])

console.log(
  '✅ rotateShopStock: deterministic per (userId, dateKey), size-bounded, a real subset with no duplicates, never shrinks a pool smaller than the window',
)

console.log('✅ verifyAquariumShop: all assertions passed')
