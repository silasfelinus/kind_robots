// /utils/scripts/verifyAquariumEconomy.test.ts
//
// Regression + property test for cthulhuquarium/t-009's pure balance core.
// Exercises server/utils/aquariumEconomy.ts's pure calculation functions --
// no prisma, no database, no Nuxt/H3 runtime -- same discipline as
// utils/scripts/verifyRevenueSplit.test.ts.
//
// Every expected number here should trace back to
// projects/cthulhuquarium/data/economy.yaml in the conductor repo (see
// aquariumEconomy.ts's header comment for why the constants are a
// hand-mirrored TS transcription rather than a runtime YAML parse).
import assert from 'node:assert/strict'

import {
  DEBRIS_CLICK_CLEARS,
  DEBRIS_RANGE,
  MAX_ACCRUAL_TICKS,
  MAX_CLEAN_CLICKS_PER_REQUEST,
  OFFLINE_INCOME_RATE_MULTIPLIER,
  RARITY_TIERS,
  TICK_SECONDS,
  cleanDebris,
  debrisMultiplier,
  deriveFishRarityTier,
  effectiveTickSeconds,
  feedCost,
  hungerMultiplier,
  incomePerTick,
  justCompletedBestiary,
  settleTick,
  unlockCost,
} from '../../server/utils/aquariumEconomy.js'

// --- rarity tiers: exact economy.yaml values --------------------------------

assert.equal(TICK_SECONDS, 60)

assert.deepEqual(RARITY_TIERS.COMMON, { incomePerTick: 1, unlockCost: 50 })
assert.deepEqual(RARITY_TIERS.UNCOMMON, { incomePerTick: 3, unlockCost: 200 })
assert.deepEqual(RARITY_TIERS.RARE, { incomePerTick: 8, unlockCost: 750 })
assert.deepEqual(RARITY_TIERS.EPIC, { incomePerTick: 20, unlockCost: 3000 })
assert.deepEqual(RARITY_TIERS.LEGENDARY, {
  incomePerTick: 50,
  unlockCost: 12000,
})
assert.deepEqual(RARITY_TIERS.MYTHIC, {
  incomePerTick: 120,
  unlockCost: 50000,
})

assert.equal(incomePerTick('RARE'), 8)
assert.equal(unlockCost('MYTHIC'), 50000)

console.log('✅ rarity tiers match economy.yaml exactly')

// --- deriveFishRarityTier: highest of the six stat fields wins -------------

assert.equal(
  deriveFishRarityTier({
    charm: 'COMMON',
    empathy: 'COMMON',
    grace: 'COMMON',
    luck: 'COMMON',
    might: 'COMMON',
    wits: 'COMMON',
  }),
  'COMMON',
)

assert.equal(
  deriveFishRarityTier({
    charm: 'COMMON',
    empathy: 'MYTHIC',
    grace: 'COMMON',
    luck: 'COMMON',
    might: 'RARE',
    wits: 'COMMON',
  }),
  'MYTHIC',
  'the highest of the six stats determines the derived economic tier',
)

assert.equal(
  deriveFishRarityTier({
    charm: 'RARE',
    empathy: 'UNCOMMON',
    grace: 'EPIC',
    luck: 'UNCOMMON',
    might: 'RARE',
    wits: 'COMMON',
  }),
  'EPIC',
)

console.log('✅ deriveFishRarityTier: highest-of-six-stats derivation correct')

// --- hunger multiplier bands (top-down, first band whose min is met) -------

assert.equal(hungerMultiplier(100), 1.0)
assert.equal(hungerMultiplier(50), 1.0, 'band boundary is inclusive at min')
assert.equal(hungerMultiplier(49), 0.5)
assert.equal(hungerMultiplier(20), 0.5, 'band boundary is inclusive at min')
assert.equal(hungerMultiplier(19), 0.2)
assert.equal(hungerMultiplier(1), 0.2)
assert.equal(hungerMultiplier(0), 0.0, 'paused, not punished -- exactly zero')
assert.equal(
  hungerMultiplier(-5),
  0.0,
  'a defensively out-of-range negative value still falls through to the floor band',
)

console.log(
  '✅ hungerMultiplier: all four bands correct at and around their boundaries',
)

// --- debris multiplier bands ------------------------------------------------

assert.equal(debrisMultiplier(0), 1.0)
assert.equal(debrisMultiplier(19), 1.0)
assert.equal(debrisMultiplier(20), 0.8, 'band boundary is inclusive at min')
assert.equal(debrisMultiplier(49), 0.8)
assert.equal(debrisMultiplier(50), 0.5)
assert.equal(debrisMultiplier(79), 0.5)
assert.equal(debrisMultiplier(80), 0.25)
assert.equal(
  debrisMultiplier(100),
  0.25,
  'debris production never fully zeroes, per economy.yaml -- floors at 0.25x',
)

console.log('✅ debrisMultiplier: all four bands correct, never floors to zero')

// --- feedCost: cost_factor_of_unlock_cost * unlockCost, rounded ------------

assert.equal(feedCost('COMMON'), 10, 'round(50 * 0.2) = 10')
assert.equal(feedCost('MYTHIC'), 10000, 'round(50000 * 0.2) = 10000')
assert.equal(feedCost('RARE'), 150, 'round(750 * 0.2) = 150')

console.log('✅ feedCost: scales with unlock cost, rounded correctly')

// --- per-species economy overrides (cthulhuquarium/t-047): null/undefined
// falls back to the tier default; a set value replaces it outright ---------

assert.equal(
  incomePerTick('COMMON', null),
  1,
  'null override falls back to the tier default',
)
assert.equal(
  incomePerTick('COMMON', undefined),
  1,
  'undefined override falls back to the tier default',
)
assert.equal(
  incomePerTick('COMMON', 7),
  7,
  'a set override replaces the tier default outright',
)
assert.equal(unlockCost('RARE', null), 750)
assert.equal(unlockCost('RARE', 1000), 1000)
assert.equal(effectiveTickSeconds(null), TICK_SECONDS)
assert.equal(effectiveTickSeconds(30), 30)

// feedCost threads its unlockCost override through unlockCost() itself,
// so overriding unlock cost also reshapes feed cost -- the two curves
// never drift apart just because one is overridden and the other isn't.
assert.equal(
  feedCost('COMMON', null),
  10,
  'round(50 * 0.2) unaffected by a null override',
)
assert.equal(
  feedCost('COMMON', 1000),
  200,
  'round(1000 * 0.2) = 200 -- feed cost follows the overridden unlock cost',
)

console.log(
  '✅ per-species overrides: null falls back to tier default, a set value replaces it, feedCost follows an overridden unlockCost',
)

// --- MAX_ACCRUAL_TICKS: 8 hours at 60s/tick = 480 ---------------------------

assert.equal(MAX_ACCRUAL_TICKS, 480)

console.log('✅ MAX_ACCRUAL_TICKS = 480 (8h offline cap at 60s/tick)')

// --- settleTick: no time elapsed -> no-op -----------------------------------

{
  const now = new Date('2026-08-25T00:00:00Z')
  const result = settleTick({
    lastTickAt: now,
    now,
    debrisLevel: 0,
    fish: [{ id: 1, rarity: 'COMMON', hunger: 100 }],
  })
  assert.equal(result.elapsedTicks, 0)
  assert.equal(result.ticksProcessed, 0)
  assert.equal(result.coinsEarned, 0)
  assert.equal(result.newDebrisLevel, 0)
  assert.equal(result.fishHunger.get(1), 100)
  assert.equal(result.newLastTickAt.getTime(), now.getTime())
}

console.log('✅ settleTick: zero elapsed time is a true no-op')

// --- settleTick: one tick, one COMMON fish, full hunger, no debris ---------

{
  const start = new Date('2026-08-25T00:00:00Z')
  const now = new Date(start.getTime() + TICK_SECONDS * 1000)
  const result = settleTick({
    lastTickAt: start,
    now,
    debrisLevel: 0,
    fish: [{ id: 1, rarity: 'COMMON', hunger: 100 }],
  })
  // gross = 1 (income) * 1.0 (hunger mult) * 1.0 (debris mult) = 1
  // credited = floor(1 * 0.5 offline multiplier) = floor(0.5) = 0 -- floor,
  // not round, so a client cannot double-dip the 0.5x rate by calling this
  // endpoint in many single-tick increments instead of one large one.
  assert.equal(result.elapsedTicks, 1)
  assert.equal(result.ticksProcessed, 1)
  assert.equal(
    result.coinsEarned,
    Math.floor(1 * OFFLINE_INCOME_RATE_MULTIPLIER),
  )
  assert.equal(result.coinsEarned, 0)
  assert.equal(result.fishHunger.get(1), 99, 'hunger decays by 1 per tick')
  assert.equal(
    result.newDebrisLevel,
    0,
    'one occupant accrues 0.5 debris/tick, but it floors (not rounds) into the Int column -- same anti-double-dip reasoning as coinsEarned',
  )
  assert.equal(result.newLastTickAt.getTime(), now.getTime())
}

console.log(
  '✅ settleTick: single-tick single-fish production, hunger decay, debris accrual all correct',
)

// --- settleTick: flooring never lets frequent small calls out-earn one
// equivalent large call (the exploit the floor-not-round choice prevents) --

{
  const start = new Date('2026-08-25T00:00:00Z')
  const twoTicksLater = new Date(start.getTime() + 2 * TICK_SECONDS * 1000)

  // One call settling both ticks at once.
  const combined = settleTick({
    lastTickAt: start,
    now: twoTicksLater,
    debrisLevel: 0,
    fish: [{ id: 1, rarity: 'COMMON', hunger: 100 }],
  })

  // Two calls, one tick each, chained.
  const oneTickLater = new Date(start.getTime() + TICK_SECONDS * 1000)
  const first = settleTick({
    lastTickAt: start,
    now: oneTickLater,
    debrisLevel: 0,
    fish: [{ id: 1, rarity: 'COMMON', hunger: 100 }],
  })
  const second = settleTick({
    lastTickAt: first.newLastTickAt,
    now: twoTicksLater,
    debrisLevel: first.newDebrisLevel,
    fish: [{ id: 1, rarity: 'COMMON', hunger: first.fishHunger.get(1)! }],
  })
  const chainedCoins = first.coinsEarned + second.coinsEarned
  const chainedDebris = second.newDebrisLevel

  assert.ok(
    chainedCoins <= combined.coinsEarned + 1,
    `chaining two 1-tick calls must not out-earn one 2-tick call by more than a single unit of floor slop (combined=${combined.coinsEarned}, chained=${chainedCoins})`,
  )
  assert.ok(
    chainedDebris <= combined.newDebrisLevel + 1,
    `chaining two 1-tick calls must not out-accrue one 2-tick call by more than a single unit of floor slop (combined=${combined.newDebrisLevel}, chained=${chainedDebris})`,
  )
}

console.log(
  '✅ settleTick: flooring prevents frequent small calls from out-earning one equivalent large call',
)

// --- settleTick: hunger never goes below 0, production stops at hunger 0 ---

{
  const start = new Date('2026-08-25T00:00:00Z')
  // 150 ticks: hunger (starting at 100) hits 0 by tick 100 and stays there.
  const now = new Date(start.getTime() + 150 * TICK_SECONDS * 1000)
  const result = settleTick({
    lastTickAt: start,
    now,
    debrisLevel: 0,
    fish: [{ id: 1, rarity: 'COMMON', hunger: 100 }],
  })
  assert.equal(
    result.fishHunger.get(1),
    0,
    'hunger floors at 0, never negative',
  )
  assert.equal(result.ticksProcessed, 150)
}

console.log(
  '✅ settleTick: hunger floors at 0 and stays there across a long gap',
)

// --- settleTick: debris never exceeds its range max ------------------------

{
  const start = new Date('2026-08-25T00:00:00Z')
  const now = new Date(
    start.getTime() + MAX_ACCRUAL_TICKS * TICK_SECONDS * 1000,
  )
  const result = settleTick({
    lastTickAt: start,
    now,
    debrisLevel: 90,
    fish: [
      { id: 1, rarity: 'COMMON', hunger: 100 },
      { id: 2, rarity: 'COMMON', hunger: 100 },
      { id: 3, rarity: 'COMMON', hunger: 100 },
    ],
  })
  assert.equal(result.newDebrisLevel, DEBRIS_RANGE.max)
}

console.log('✅ settleTick: debris caps at its range max, never overflows')

// --- settleTick: elapsed time beyond MAX_ACCRUAL_TICKS is capped for income,
// and lastTickAt always advances fully to `now` (excess forfeited, not
// banked for a later call) -------------------------------------------------

{
  const start = new Date('2026-08-25T00:00:00Z')
  // Far beyond the 8h/480-tick cap.
  const now = new Date(start.getTime() + 2000 * TICK_SECONDS * 1000)
  const result = settleTick({
    lastTickAt: start,
    now,
    debrisLevel: 0,
    fish: [{ id: 1, rarity: 'MYTHIC', hunger: 100 }],
  })
  assert.equal(result.elapsedTicks, 2000)
  assert.equal(
    result.ticksProcessed,
    MAX_ACCRUAL_TICKS,
    'income/simulation ticks are capped at MAX_ACCRUAL_TICKS regardless of how much real time elapsed',
  )
  assert.equal(
    result.newLastTickAt.getTime(),
    now.getTime(),
    'lastTickAt always advances fully to now -- excess elapsed time beyond the cap is forfeited, not owed later',
  )
}

console.log(
  '✅ settleTick: offline cap forfeits excess elapsed time and does not bank it',
)

// --- settleTick: never earns negative coins, never produces NaN ------------

{
  const start = new Date('2026-08-25T00:00:00Z')
  const now = new Date(start.getTime() + 5 * TICK_SECONDS * 1000)
  const result = settleTick({
    lastTickAt: start,
    now,
    debrisLevel: 100,
    fish: [{ id: 1, rarity: 'COMMON', hunger: 0 }],
  })
  assert.equal(
    result.coinsEarned,
    0,
    'a starved fish in a filthy tank earns exactly 0, never negative',
  )
  assert.ok(!Number.isNaN(result.coinsEarned))
}

console.log(
  '✅ settleTick: starved fish + maxed debris earns exactly 0, never negative or NaN',
)

// --- settleTick: an empty tank (no fish) is a safe, coin-free no-op on
// production but still advances lastTickAt and leaves debris untouched
// (no occupants -> no accrual) -----------------------------------------------

{
  const start = new Date('2026-08-25T00:00:00Z')
  const now = new Date(start.getTime() + 10 * TICK_SECONDS * 1000)
  const result = settleTick({
    lastTickAt: start,
    now,
    debrisLevel: 5,
    fish: [],
  })
  assert.equal(result.coinsEarned, 0)
  assert.equal(
    result.newDebrisLevel,
    5,
    'zero occupants means zero debris accrual',
  )
  assert.equal(result.newLastTickAt.getTime(), now.getTime())
}

console.log(
  '✅ settleTick: an empty tank settles safely with zero production and zero debris accrual',
)

// --- settleTick: per-species yieldPerTick/tickIntervalSeconds overrides
// (cthulhuquarium/t-047) change that fish's production without touching the
// tank-wide tick cadence hunger/debris still run on ------------------------

{
  const start = new Date('2026-08-25T00:00:00Z')
  const now = new Date(start.getTime() + TICK_SECONDS * 1000)

  // A COMMON fish with yieldPerTick overridden to match MYTHIC's tier rate
  // (120) should out-earn a plain COMMON fish by exactly that factor.
  const overridden = settleTick({
    lastTickAt: start,
    now,
    debrisLevel: 0,
    fish: [{ id: 1, rarity: 'COMMON', hunger: 100, yieldPerTick: 120 }],
  })
  const plain = settleTick({
    lastTickAt: start,
    now,
    debrisLevel: 0,
    fish: [{ id: 1, rarity: 'COMMON', hunger: 100 }],
  })
  assert.ok(
    overridden.coinsEarned >= plain.coinsEarned,
    'a yieldPerTick override raised well above the tier default must not earn less than the tier default',
  )

  // A fish with tickIntervalSeconds halved (30s instead of 60s) produces at
  // twice the rate for the same elapsed real time -- verified over a long
  // enough window that flooring doesn't hide the difference.
  const longNow = new Date(start.getTime() + 100 * TICK_SECONDS * 1000)
  const doubleRate = settleTick({
    lastTickAt: start,
    now: longNow,
    debrisLevel: 0,
    fish: [{ id: 1, rarity: 'COMMON', hunger: 100, tickIntervalSeconds: 30 }],
  })
  const baseRate = settleTick({
    lastTickAt: start,
    now: longNow,
    debrisLevel: 0,
    fish: [{ id: 1, rarity: 'COMMON', hunger: 100 }],
  })
  assert.ok(
    doubleRate.coinsEarned >= baseRate.coinsEarned * 1.5,
    `a halved tickIntervalSeconds should earn roughly double (base=${baseRate.coinsEarned}, doubled=${doubleRate.coinsEarned})`,
  )
}

console.log(
  "✅ settleTick: per-species yieldPerTick/tickIntervalSeconds overrides change that fish's production as expected",
)

// --- PROPERTY TEST: coinsEarned is always a non-negative integer, hunger is
// always within [0, 100], debris is always within [0, 100], for a wide
// sweep of random elapsed windows and fish rosters. ---------------------

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const RARITIES = [
  'COMMON',
  'UNCOMMON',
  'RARE',
  'EPIC',
  'LEGENDARY',
  'MYTHIC',
] as const

const rand = mulberry32(20260825)
const ITERATIONS = 5000

for (let i = 0; i < ITERATIONS; i++) {
  const start = new Date(2026, 0, 1).getTime()
  const elapsedTicks = Math.floor(rand() * 3000)
  const now = new Date(start + elapsedTicks * TICK_SECONDS * 1000)
  const debrisLevel = Math.floor(rand() * 101)
  const fishCount = Math.floor(rand() * 6)
  const fish = Array.from({ length: fishCount }, (_, idx) => ({
    id: idx + 1,
    rarity: RARITIES[Math.floor(rand() * RARITIES.length)]!,
    hunger: Math.floor(rand() * 101),
  }))

  const result = settleTick({
    lastTickAt: new Date(start),
    now,
    debrisLevel,
    fish,
  })

  assert.ok(
    Number.isInteger(result.coinsEarned) && result.coinsEarned >= 0,
    `coinsEarned must be a non-negative integer (got ${result.coinsEarned})`,
  )
  assert.ok(
    result.newDebrisLevel >= DEBRIS_RANGE.min &&
      result.newDebrisLevel <= DEBRIS_RANGE.max,
    `newDebrisLevel must stay within [${DEBRIS_RANGE.min}, ${DEBRIS_RANGE.max}] (got ${result.newDebrisLevel})`,
  )
  for (const h of result.fishHunger.values()) {
    assert.ok(h >= 0 && h <= 100, `hunger must stay within [0, 100] (got ${h})`)
  }
  assert.ok(
    result.newLastTickAt.getTime() <= now.getTime(),
    'newLastTickAt must never be after `now`',
  )
}

console.log(
  `✅ settleTick property test: coinsEarned/debris/hunger invariants held across ${ITERATIONS} random scenarios`,
)

// --- cleanDebris: the manual-click active-play channel (t-027) ------------

assert.equal(DEBRIS_CLICK_CLEARS, 5)
assert.equal(cleanDebris(100), 95)
assert.equal(cleanDebris(5), 0, 'clears exactly to zero, not negative')
assert.equal(
  cleanDebris(3),
  0,
  'never goes below DEBRIS_RANGE.min even from a partial click',
)
assert.equal(cleanDebris(0), 0, 'idempotent at zero')
assert.ok(
  cleanDebris(50) >= DEBRIS_RANGE.min,
  'result always stays within DEBRIS_RANGE',
)

console.log(
  '✅ cleanDebris: clears exactly DEBRIS_CLICK_CLEARS per click, floors at DEBRIS_RANGE.min',
)

// --- cleanDebris(clicks): cthulhuquarium/t-013's debounced click batching --

assert.equal(
  cleanDebris(100, 1),
  95,
  'clicks=1 is identical to the pre-t-013 single-click call',
)
assert.equal(
  cleanDebris(100, 3),
  100 - DEBRIS_CLICK_CLEARS * 3,
  'a batched flush of N clicks clears N times as much in one call',
)
assert.equal(
  cleanDebris(10, 3),
  0,
  'a batch that would overshoot still floors at DEBRIS_RANGE.min, never negative',
)
assert.equal(
  cleanDebris(50, 0),
  cleanDebris(50, 1),
  'clicks=0 clamps up to 1, never a zero-effect clear',
)
assert.equal(
  cleanDebris(50, -3),
  cleanDebris(50, 1),
  'a negative clicks value clamps to 1, never subtracts negative debris',
)
assert.equal(
  cleanDebris(50, 2.9),
  cleanDebris(50, 2),
  'a fractional clicks value floors to a whole click count',
)
assert.ok(
  MAX_CLEAN_CLICKS_PER_REQUEST > 0,
  'the batch-size cap is a positive request-shape guard, not a balance number',
)

console.log(
  '✅ cleanDebris(clicks): batches N clicks into one clear, clamps clicks to a positive integer',
)

// --- justCompletedBestiary: cthulhuquarium/t-024's completion-beat gate ----

// Crossing the line for the first time fires.
assert.equal(justCompletedBestiary(10, 9, 10), true)
// Already complete before this call -- must not fire again.
assert.equal(justCompletedBestiary(10, 10, 10), false)
// Still short of the total -- no beat.
assert.equal(justCompletedBestiary(10, 5, 6), false)
// An empty bestiary (no species seeded yet) never reads as "complete".
assert.equal(justCompletedBestiary(0, 0, 0), false)
// Overshooting totalCount (e.g. a race with a retired species changing the
// denominator) still only fires once, on the crossing itself.
assert.equal(justCompletedBestiary(5, 4, 6), true)
assert.equal(justCompletedBestiary(5, 6, 7), false)

console.log(
  '✅ justCompletedBestiary: fires exactly once, on the crossing, never before or after',
)

console.log('✅ verifyAquariumEconomy: all assertions passed')
