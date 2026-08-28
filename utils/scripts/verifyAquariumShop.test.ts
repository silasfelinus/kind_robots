// /utils/scripts/verifyAquariumShop.test.ts
//
// Regression + property test for cthulhuquarium/t-030's pure shop core
// (sellPrice, rotateShopStock, todaysShopDateKey) in
// server/utils/aquariumEconomy.ts -- no prisma, no database, no Nuxt/H3
// runtime, same discipline as verifyAquariumGenetics.test.ts.
import assert from 'node:assert/strict'

import {
  RARITY_TIERS,
  rotateShopStock,
  SECRET_EVOLUTION_AVERAGE_STAT_THRESHOLD,
  SELL_PRICE_BREAKEVEN_FRACTION,
  SELL_PRICE_BREAKEVEN_STAT_AVERAGE,
  SELL_PRICE_CEILING_FRACTION,
  SELL_PRICE_FLOOR_FRACTION,
  sellPrice,
  SHOP_ROTATION_SIZE,
  todaysShopDateKey,
  type StatBlock,
} from '../../server/utils/aquariumEconomy.js'

// --- sellPrice: floor/breakeven/ceiling curve, anchored on unlockCost ------

const BASE_COST = RARITY_TIERS.RARE.unlockCost

function uniformStats(value: number | null): StatBlock {
  return {
    charm: value,
    empathy: value,
    grace: value,
    luck: value,
    might: value,
    wits: value,
  }
}

assert.equal(SELL_PRICE_BREAKEVEN_STAT_AVERAGE, SECRET_EVOLUTION_AVERAGE_STAT_THRESHOLD)

// A worst-possible roll sells at the floor fraction -- a loss, never zero.
assert.equal(
  sellPrice(BASE_COST, uniformStats(0)),
  Math.round(BASE_COST * SELL_PRICE_FLOOR_FRACTION),
)
assert.ok(
  sellPrice(BASE_COST, uniformStats(0)) < BASE_COST,
  'a worst-possible roll always sells at a loss',
)

// Exactly the breeding-evolution stat-average bar sells at exactly base
// price -- selling a fish that good is meant to feel like the same payoff a
// secret evolution does, not an unrelated number.
assert.equal(SELL_PRICE_BREAKEVEN_FRACTION, 1)
assert.equal(
  sellPrice(BASE_COST, uniformStats(SECRET_EVOLUTION_AVERAGE_STAT_THRESHOLD)),
  BASE_COST,
)

// A perfect roll sells above base price -- "a well-bred individual...
// worth more" (Silas, 2026-08-24).
assert.equal(
  sellPrice(BASE_COST, uniformStats(100)),
  Math.round(BASE_COST * SELL_PRICE_CEILING_FRACTION),
)
assert.ok(
  sellPrice(BASE_COST, uniformStats(100)) > BASE_COST,
  'a perfect roll always sells for a profit',
)

// Monotonic: a strictly better roll never sells for less.
let previous = -Infinity
for (let average = 0; average <= 100; average += 5) {
  const price = sellPrice(BASE_COST, uniformStats(average))
  assert.ok(
    price >= previous,
    `sellPrice must be monotonically non-decreasing in stat average (broke at ${average})`,
  )
  previous = price
}

// A fully-unrolled (all-null) fish -- should not happen in practice since
// every AquariumStock is rolled on creation -- still returns a real, total
// price rather than throwing or returning NaN.
const unrolledPrice = sellPrice(BASE_COST, uniformStats(null))
assert.ok(
  Number.isFinite(unrolledPrice) && unrolledPrice >= 1,
  'an all-null StatBlock still produces a finite, positive sale price',
)

// Never below 1 coin even at a tiny base cost.
assert.ok(sellPrice(1, uniformStats(0)) >= 1)

console.log(
  '✅ sellPrice: floor fraction at 0, exactly base price at the breeding-evolution bar, ceiling fraction at 100, monotonic, null-safe',
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
assert.equal(new Set(rotationA).size, rotationA.length, 'no duplicate ids in one slate')
for (const id of rotationA) {
  assert.ok(eligible.includes(id), 'every id in the slate came from the eligible pool')
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
