// /utils/scripts/verifyAquariumCollect.test.ts
//
// Pure-math test for the click-for-coins loop (cthulhuquarium/t-080: every
// fed fish drops coins) and the coin upgrade track
// (server/utils/aquariumCollect.ts). No prisma, no database -- same
// discipline as verifyAquariumEconomy.test.ts.
import assert from 'node:assert/strict'

import {
  coinAllowance,
  coinDropSeconds,
  coinRatePerSecond,
  coinValueForTier,
  COIN_BANK_SECONDS,
  COIN_DROP_SECONDS_PER_FISH,
  COIN_MAX_CLAIM_PER_REQUEST,
  COIN_VALUE_BY_TIER,
  COIN_VISIBLE_SECONDS,
  discountedFeedCost,
  DROP_SPEED_MAX_LEVEL,
  FOOD_MAX_LEVEL,
  isKnownUpgradeTrack,
  UPGRADE_CATALOG,
  UPGRADE_TRACKS,
  upgradeCost,
} from '../../server/utils/aquariumCollect.js'
import {
  feedCost,
  fishSlotsCap,
  STARTING_COINS,
  STARTING_FISH_SLOTS,
  TANK_EXPANSIONS,
} from '../../server/utils/aquariumEconomy.js'

const now = new Date('2026-10-10T12:00:00.000Z')
const secondsAgo = (seconds: number) => new Date(now.getTime() - seconds * 1000)

// --- drop cadence -----------------------------------------------------------

assert.equal(coinDropSeconds(0), COIN_DROP_SECONDS_PER_FISH)
assert.equal(
  coinDropSeconds(DROP_SPEED_MAX_LEVEL),
  COIN_DROP_SECONDS_PER_FISH / 2,
)
assert.equal(
  coinDropSeconds(99),
  coinDropSeconds(DROP_SPEED_MAX_LEVEL),
  'levels past max clamp',
)
assert.equal(coinDropSeconds(-3), COIN_DROP_SECONDS_PER_FISH)
for (let level = 1; level <= DROP_SPEED_MAX_LEVEL; level++) {
  assert.ok(coinDropSeconds(level) < coinDropSeconds(level - 1))
}
console.log('✅ coinDropSeconds: faster per drop-speed level, clamped')

// --- coin value and tank drop rate ------------------------------------------

assert.deepEqual(
  { ...COIN_VALUE_BY_TIER },
  { COMMON: 3, UNCOMMON: 8, RARE: 20, EPIC: 50, LEGENDARY: 125, MYTHIC: 300 },
  'economy.yaml fun_loop.coin_value_by_tier',
)
assert.equal(coinValueForTier('RARE'), 20)
assert.equal(coinValueForTier('MYTHIC'), 300)

const common = { rarity: 'COMMON' as const, hunger: 100 }
const rare = { rarity: 'RARE' as const, hunger: 100 }

assert.equal(coinRatePerSecond([], 0), 0)
assert.equal(coinRatePerSecond([common], 0), 3 / 15)
assert.equal(
  coinRatePerSecond([common, common, common], 0),
  3 * coinRatePerSecond([common], 0),
  'every fish adds its own drops -- more fish, more coins',
)
assert.ok(
  Math.abs(coinRatePerSecond([common, rare], 0) - (3 + 20) / 15) < 1e-12,
)
assert.equal(
  coinRatePerSecond([{ ...rare, hunger: 0 }], 0),
  0,
  'a starving fish drops nothing',
)
assert.equal(
  coinRatePerSecond([{ ...rare, hunger: 1 }], 0),
  20 / 15,
  'any food at all and it drops full-value coins',
)
assert.equal(
  coinRatePerSecond([common], DROP_SPEED_MAX_LEVEL),
  2 * coinRatePerSecond([common], 0),
)
console.log(
  '✅ coinRatePerSecond: per fish, by rarity, starving fish drop nothing',
)

// --- allowance: the server never credits more than the clock owed ----------

const oneCommon = coinRatePerSecond([common], 0)

{
  // The one-fish case that motivated COIN_BANK_SECONDS: a single coin still
  // on screen 12 s after it dropped is paid in full.
  const result = coinAllowance({
    anchorAt: secondsAgo(COIN_DROP_SECONDS_PER_FISH),
    now,
    ratePerSecond: oneCommon,
    claimed: 3,
  })
  assert.equal(result.credited, 3, 'one fish, one coin, paid in full')
}

{
  const result = coinAllowance({
    anchorAt: secondsAgo(COIN_DROP_SECONDS_PER_FISH),
    now,
    ratePerSecond: oneCommon,
    claimed: 500,
  })
  assert.equal(result.available, 3)
  assert.equal(
    result.credited,
    3,
    'an inflated claim is capped at what accrued',
  )
  assert.equal(
    result.newAnchorAt.getTime(),
    now.getTime(),
    'anchor advances exactly the time it took to accrue the credit',
  )
}

{
  // A full bank (COIN_BANK_SECONDS x 0.2 = 5.4) holds 5 whole coins.
  const result = coinAllowance({
    anchorAt: secondsAgo(COIN_BANK_SECONDS),
    now,
    ratePerSecond: oneCommon,
    claimed: 3,
  })
  assert.equal(result.available, 5)
  assert.equal(result.credited, 3)
  const again = coinAllowance({
    anchorAt: result.newAnchorAt,
    now,
    ratePerSecond: oneCommon,
    claimed: 500,
  })
  assert.equal(again.credited, 2, 'unclaimed value stays claimable')
  const drained = coinAllowance({
    anchorAt: again.newAnchorAt,
    now,
    ratePerSecond: oneCommon,
    claimed: 500,
  })
  assert.equal(drained.credited, 0, 'a drained bank pays nothing')
}

{
  const result = coinAllowance({
    anchorAt: secondsAgo(60 * 60 * 24),
    now,
    ratePerSecond: oneCommon,
    claimed: 10_000,
  })
  assert.equal(
    result.available,
    Math.floor(oneCommon * COIN_BANK_SECONDS),
    'a day away banks only COIN_BANK_SECONDS of drops',
  )
  assert.ok(COIN_BANK_SECONDS >= COIN_VISIBLE_SECONDS)
}

{
  const result = coinAllowance({
    anchorAt: null,
    now,
    ratePerSecond: oneCommon,
    claimed: 3,
  })
  assert.equal(result.credited, 3, 'never-collected = full bank')
}

{
  const result = coinAllowance({
    anchorAt: new Date(now.getTime() + 60_000),
    now,
    ratePerSecond: oneCommon,
    claimed: 3,
  })
  assert.equal(result.credited, 0, 'a future anchor (clock skew) pays nothing')
  assert.ok(result.newAnchorAt.getTime() <= now.getTime())
}

{
  const result = coinAllowance({
    anchorAt: secondsAgo(60),
    now,
    ratePerSecond: 0,
    claimed: 3,
  })
  assert.equal(result.credited, 0, 'a tank of starving fish pays nothing')
  assert.equal(result.newAnchorAt.getTime(), now.getTime())
}

for (const bad of [Number.NaN, -4, 0, Number.POSITIVE_INFINITY]) {
  const result = coinAllowance({
    anchorAt: null,
    now,
    ratePerSecond: oneCommon,
    claimed: bad,
  })
  assert.equal(result.credited, 0, `claimed=${bad} credits nothing`)
}

{
  // Chunking can't beat one big request.
  const rate = coinRatePerSecond([common, rare, rare], 0)
  const start = secondsAgo(COIN_BANK_SECONDS)
  const whole = coinAllowance({
    anchorAt: start,
    now,
    ratePerSecond: rate,
    claimed: COIN_MAX_CLAIM_PER_REQUEST,
  }).credited
  let anchor: Date | null = start
  let total = 0
  for (let i = 0; i < 200; i++) {
    const step = coinAllowance({
      anchorAt: anchor,
      now,
      ratePerSecond: rate,
      claimed: 3,
    })
    total += step.credited
    anchor = step.newAnchorAt
  }
  assert.ok(total <= whole, `chunked ${total} <= whole ${whole}`)
  assert.ok(total >= whole - 3, 'and loses at most one chunk to flooring')
}
console.log('✅ coinAllowance: capped by elapsed value, bank window and claim')

// --- the opening minute (LOOP.md pace target) -------------------------------

assert.equal(STARTING_COINS, 40)
{
  const secondsToSecondFish = (50 - STARTING_COINS) / oneCommon
  assert.ok(
    secondsToSecondFish <= 60,
    `second COMMON within a minute of clicking (${secondsToSecondFish}s)`,
  )
}
console.log(
  '✅ opening: 40 coins + one COMMON reaches a second fish inside a minute',
)

// --- feeding is a cheap click -----------------------------------------------

assert.equal(feedCost('COMMON'), 1)
assert.equal(feedCost('RARE'), 15)
assert.equal(feedCost('MYTHIC'), 1000)
console.log('✅ feedCost: 2% of unlock cost, at least 1')

// --- upgrades ---------------------------------------------------------------

assert.deepEqual([...UPGRADE_TRACKS].sort(), ['dropSpeed', 'food', 'room'])
assert.ok(isKnownUpgradeTrack('food'))
assert.ok(isKnownUpgradeTrack('dropSpeed'))
assert.ok(isKnownUpgradeTrack('room'), 't-081: room is bought with coins')
assert.ok(!isKnownUpgradeTrack('slots'))
assert.ok(!isKnownUpgradeTrack('toString'), 'prototype keys are not tracks')
assert.ok(!isKnownUpgradeTrack(3))

for (const track of UPGRADE_TRACKS) {
  const config = UPGRADE_CATALOG[track]
  assert.equal(upgradeCost(track, 0), config.baseCost)
  let previous = 0
  for (let level = 0; level < config.maxLevel; level++) {
    const cost = upgradeCost(track, level)
    assert.ok(cost !== null && cost > previous, `${track} price escalates`)
    previous = cost ?? 0
  }
  assert.equal(upgradeCost(track, config.maxLevel), null, `${track} maxes out`)
}
assert.deepEqual(
  [0, 1, 2].map((level) => upgradeCost('food', level)),
  [150, 375, 938],
)
assert.deepEqual(
  [0, 1, 2, 3].map((level) => upgradeCost('dropSpeed', level)),
  [100, 220, 484, 1065],
)
assert.deepEqual(
  Array.from({ length: TANK_EXPANSIONS.length + 1 }, (_, level) =>
    upgradeCost('room', level),
  ),
  [400, 1200, 3000, 7500, 18000, 40000, 90000, null],
  'room prices are economy.yaml fun_loop.tank_expansions, then maxed',
)

assert.equal(discountedFeedCost(10, 0), 10)
assert.equal(discountedFeedCost(10, 1), 9)
assert.equal(discountedFeedCost(10, FOOD_MAX_LEVEL), 6)
assert.equal(discountedFeedCost(10, 99), 6, 'levels past max clamp')
assert.equal(discountedFeedCost(1, FOOD_MAX_LEVEL), 1, 'never free')
assert.equal(discountedFeedCost(feedCost('MYTHIC'), FOOD_MAX_LEVEL), 550)
console.log(
  '✅ upgrades: room, drop speed and food; escalating prices, clamped effects',
)

// --- fish room (t-081): counted in fish, bought with coins -------------------

assert.equal(STARTING_FISH_SLOTS, 12)
assert.equal(fishSlotsCap(0, []), 12)
assert.equal(fishSlotsCap(1, []), 16)
assert.equal(
  fishSlotsCap(TANK_EXPANSIONS.length, []),
  40,
  'LOOP.md: 40 fish at the top',
)
assert.equal(fishSlotsCap(99, []), 40, 'expansions past the table clamp')
assert.equal(fishSlotsCap(-2, []), 12)
assert.equal(fishSlotsCap(Number.NaN, []), 12)
assert.equal(
  fishSlotsCap(0, ['extra_species_slot']),
  13,
  'the extra_species_slot set piece still adds its slot',
)
assert.equal(fishSlotsCap(0, ['swim_speed']), 12)
console.log('✅ fishSlotsCap: 12 to start, +4 per expansion, 40 at the top')

console.log('✅ verifyAquariumCollect: all assertions passed')
