// /utils/scripts/verifyAquariumCollect.test.ts
//
// Pure-math test for cthulhuquarium/t-071's click-for-coins collectibles and
// coin upgrade track (server/utils/aquariumCollect.ts). No prisma, no
// database -- same discipline as verifyAquariumEconomy.test.ts.
import assert from 'node:assert/strict'

import {
  activeToIdleIncomeRatio,
  collectAllowance,
  collectCoins,
  COLLECT_BASE_SPAWN_SECONDS,
  COLLECT_MAX_BANKED,
  COLLECT_MAX_PER_REQUEST,
  COLLECT_MIN_COINS_PER_SCALE,
  collectSpawnSeconds,
  coinsPerScale,
  discountedFeedCost,
  DROP_SPEED_MAX_LEVEL,
  FOOD_MAX_LEVEL,
  isKnownUpgradeTrack,
  tankProductionPerTick,
  UPGRADE_CATALOG,
  UPGRADE_TRACKS,
  upgradeCost,
} from '../../server/utils/aquariumCollect.js'
import { feedCost } from '../../server/utils/aquariumEconomy.js'

const now = new Date('2026-09-30T12:00:00.000Z')
const secondsAgo = (seconds: number) => new Date(now.getTime() - seconds * 1000)

// --- spawn cadence ----------------------------------------------------------

assert.equal(collectSpawnSeconds(0), COLLECT_BASE_SPAWN_SECONDS)
assert.equal(
  collectSpawnSeconds(DROP_SPEED_MAX_LEVEL),
  COLLECT_BASE_SPAWN_SECONDS / 2,
)
assert.equal(
  collectSpawnSeconds(99),
  collectSpawnSeconds(DROP_SPEED_MAX_LEVEL),
  'levels past max clamp',
)
assert.equal(collectSpawnSeconds(-3), COLLECT_BASE_SPAWN_SECONDS)
for (let level = 1; level <= DROP_SPEED_MAX_LEVEL; level++) {
  assert.ok(collectSpawnSeconds(level) < collectSpawnSeconds(level - 1))
}
console.log('✅ collectSpawnSeconds: faster per drop-speed level, clamped')

// --- allowance: the server never credits more than the clock owed ----------

{
  const result = collectAllowance({
    anchorAt: secondsAgo(COLLECT_BASE_SPAWN_SECONDS * 3 + 1),
    now,
    dropSpeedLevel: 0,
    requested: 50,
  })
  assert.equal(result.available, 3)
  assert.equal(result.credited, 3, 'inflated count is capped at what spawned')
  assert.equal(
    result.newAnchorAt.getTime(),
    secondsAgo(1).getTime(),
    'anchor advances exactly credited spawns, keeping the partial remainder',
  )
}

{
  const result = collectAllowance({
    anchorAt: secondsAgo(COLLECT_BASE_SPAWN_SECONDS * 3),
    now,
    dropSpeedLevel: 0,
    requested: 1,
  })
  assert.equal(result.credited, 1)
  const again = collectAllowance({
    anchorAt: result.newAnchorAt,
    now,
    dropSpeedLevel: 0,
    requested: 50,
  })
  assert.equal(again.credited, 2, 'uncollected scales stay claimable')
  const drained = collectAllowance({
    anchorAt: again.newAnchorAt,
    now,
    dropSpeedLevel: 0,
    requested: 50,
  })
  assert.equal(drained.credited, 0, 'a drained bank pays nothing')
}

{
  const result = collectAllowance({
    anchorAt: secondsAgo(COLLECT_BASE_SPAWN_SECONDS - 1),
    now,
    dropSpeedLevel: 0,
    requested: 5,
  })
  assert.equal(result.credited, 0, 'nothing before the first spawn')
}

{
  const result = collectAllowance({
    anchorAt: secondsAgo(60 * 60 * 24),
    now,
    dropSpeedLevel: 0,
    requested: 100,
  })
  assert.equal(result.available, COLLECT_MAX_BANKED, 'a day away banks the cap')
  assert.equal(
    result.credited,
    Math.min(COLLECT_MAX_BANKED, COLLECT_MAX_PER_REQUEST),
  )
  assert.equal(
    result.newAnchorAt.getTime(),
    now.getTime() -
      (COLLECT_MAX_BANKED - result.credited) *
        COLLECT_BASE_SPAWN_SECONDS *
        1000,
    'excess time past the bank cap is forfeited',
  )
}

{
  const result = collectAllowance({
    anchorAt: null,
    now,
    dropSpeedLevel: 0,
    requested: 3,
  })
  assert.equal(
    result.available,
    COLLECT_MAX_BANKED,
    'never-collected = full bank',
  )
  assert.equal(result.credited, 3)
}

{
  const result = collectAllowance({
    anchorAt: new Date(now.getTime() + 60_000),
    now,
    dropSpeedLevel: 0,
    requested: 3,
  })
  assert.equal(result.credited, 0, 'a future anchor (clock skew) pays nothing')
  assert.ok(result.newAnchorAt.getTime() <= now.getTime())
}

for (const bad of [Number.NaN, -4, 0, Number.POSITIVE_INFINITY]) {
  const result = collectAllowance({
    anchorAt: null,
    now,
    dropSpeedLevel: 0,
    requested: bad,
  })
  assert.equal(result.credited, 0, `requested=${bad} credits nothing`)
}

{
  // Chunking can't beat one big request: 8 one-scale calls == one 8-scale call.
  let anchor: Date | null = secondsAgo(
    COLLECT_BASE_SPAWN_SECONDS * COLLECT_MAX_BANKED,
  )
  let total = 0
  for (let i = 0; i < 20; i++) {
    const step = collectAllowance({
      anchorAt: anchor,
      now,
      dropSpeedLevel: 0,
      requested: 1,
    })
    total += step.credited
    anchor = step.newAnchorAt
  }
  assert.equal(total, COLLECT_MAX_BANKED)
}

{
  const fast = collectAllowance({
    anchorAt: secondsAgo(COLLECT_BASE_SPAWN_SECONDS * 2),
    now,
    dropSpeedLevel: DROP_SPEED_MAX_LEVEL,
    requested: 50,
  })
  assert.equal(fast.credited, 4, 'max drop speed spawns twice as often')
}
console.log(
  '✅ collectAllowance: capped by elapsed time, bank, and per-call max',
)

// --- value ------------------------------------------------------------------

const common = { id: 1, rarity: 'COMMON' as const, hunger: 100 }
const rare = { id: 2, rarity: 'RARE' as const, hunger: 100 }

assert.equal(tankProductionPerTick([], 0), 0)
assert.equal(tankProductionPerTick([common], 0), 1)
assert.equal(tankProductionPerTick([common, rare], 0), 9)
assert.equal(
  tankProductionPerTick([rare], 90),
  8 * 0.25,
  'filthy tank throttles',
)
assert.equal(tankProductionPerTick([{ ...rare, hunger: 0 }], 0), 0)

assert.equal(coinsPerScale(0), 0, 'a tank producing nothing sheds nothing')
assert.equal(
  coinsPerScale(1),
  COLLECT_MIN_COINS_PER_SCALE,
  'floor for a starter',
)
assert.equal(coinsPerScale(40), 10)
assert.equal(collectCoins(0, 40), 0)
assert.equal(collectCoins(3, 40), 30)
assert.equal(collectCoins(3, 5), 3, 'floor(3 * 1.25)')
assert.equal(collectCoins(5, 0), 0)
console.log('✅ collect value: quarter-tick per scale, floor 1 while producing')

// --- active play beats idle without trivialising it -------------------------

assert.equal(
  activeToIdleIncomeRatio(0),
  3,
  'matches ECONOMY.md 3.0x active/idle',
)
assert.equal(activeToIdleIncomeRatio(DROP_SPEED_MAX_LEVEL), 5)
console.log('✅ active/idle ratio: 3x at base, 5x fully upgraded')

// --- upgrades ---------------------------------------------------------------

assert.deepEqual([...UPGRADE_TRACKS].sort(), ['dropSpeed', 'food'])
assert.ok(!UPGRADE_TRACKS.includes('slots' as never), 'no coin-bought capacity')
assert.ok(isKnownUpgradeTrack('food'))
assert.ok(isKnownUpgradeTrack('dropSpeed'))
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

assert.equal(discountedFeedCost(10, 0), 10)
assert.equal(discountedFeedCost(10, 1), 9)
assert.equal(discountedFeedCost(10, FOOD_MAX_LEVEL), 6)
assert.equal(discountedFeedCost(10, 99), 6, 'levels past max clamp')
assert.equal(discountedFeedCost(1, FOOD_MAX_LEVEL), 1, 'never free')
assert.equal(discountedFeedCost(feedCost('MYTHIC'), FOOD_MAX_LEVEL), 5500)
console.log(
  '✅ upgrades: food + drop speed only, escalating prices, clamped effects',
)

console.log('✅ verifyAquariumCollect: all assertions passed')
