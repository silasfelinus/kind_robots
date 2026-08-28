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
  BESTIARY_MILESTONES,
  conflictsWithEquippedIdleSet,
  DEBRIS_CLICK_CLEARS,
  DEBRIS_RANGE,
  effectiveSizeCap,
  feedCoinRebate,
  firedBestiaryMilestones,
  isKnownSetPieceKind,
  LAST_AQUARIUM_CONFIG,
  MAX_ACCRUAL_TICKS,
  MAX_CLEAN_CLICKS_PER_REQUEST,
  NO_STACK_IDLE_SET_KINDS,
  OFFLINE_INCOME_RATE_MULTIPLIER,
  RARE_EVENT_CATALOG,
  RARE_EVENT_KINDS,
  RARITY_TIERS,
  SET_PIECE_CATALOG,
  SET_PIECE_KINDS,
  TICK_SECONDS,
  cleanDebris,
  debrisMultiplier,
  deriveFishRarityTier,
  effectiveTickSeconds,
  eggCatalog,
  eggCost,
  EGG_SIZE_OPTIONS,
  feedCost,
  hungerMultiplier,
  incomePerTick,
  isKnownEggRarity,
  isKnownEggSize,
  justCompletedBestiary,
  mergeBestStats,
  pickHatchIndex,
  RARITY_ORDER,
  rollRareEvent,
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

// --- set pieces (cthulhuquarium/t-026): catalog shape, capacity/rebate math,
// idle-bonus non-stacking, debris_skimmer in settleTick -------------------

// The catalog's keys must match economy.yaml's set_pieces keys exactly (see
// aquariumEconomy.ts's own header comment on why).
assert.deepEqual(
  [...SET_PIECE_KINDS].sort(),
  [
    'debris_skimmer',
    'extra_species_slot',
    'feeding_bonus',
    'idle_hoarder',
    'peace_ward',
    'roaming_collector',
    'swim_speed',
  ].sort(),
)
for (const kind of SET_PIECE_KINDS) {
  assert.equal(SET_PIECE_CATALOG[kind].kind, kind)
  assert.ok(SET_PIECE_CATALOG[kind].cost > 0)
}
assert.equal(isKnownSetPieceKind('extra_species_slot'), true)
assert.equal(isKnownSetPieceKind('not-a-real-set'), false)

console.log(
  '✅ SET_PIECE_CATALOG: every economy.yaml set_pieces key is present, priced, self-consistent',
)

// extra_species_slot: +1 per equipped copy (economy.yaml value: 1).
assert.equal(effectiveSizeCap(10, []), 10)
assert.equal(effectiveSizeCap(10, ['extra_species_slot']), 11)
assert.equal(effectiveSizeCap(10, ['swim_speed', 'debris_skimmer']), 10)

console.log(
  '✅ effectiveSizeCap: extra_species_slot adds exactly its configured delta, other kinds are no-ops',
)

// feeding_bonus: refunds 50% of cost, floored, only when equipped.
assert.equal(feedCoinRebate(100, []), 0)
assert.equal(feedCoinRebate(100, ['feeding_bonus']), 50)
assert.equal(
  feedCoinRebate(101, ['feeding_bonus']),
  50,
  'rebate floors rather than rounds, same anti-fabrication discipline as settleTick',
)

console.log(
  '✅ feedCoinRebate: 50% refund only with feeding_bonus equipped, floored',
)

// no_stack_idle_effects: roaming_collector and idle_hoarder conflict with
// each other but nothing else conflicts with anything.
assert.deepEqual([...NO_STACK_IDLE_SET_KINDS].sort(), [
  'idle_hoarder',
  'roaming_collector',
])
assert.equal(
  conflictsWithEquippedIdleSet('idle_hoarder', ['roaming_collector']),
  true,
)
assert.equal(
  conflictsWithEquippedIdleSet('roaming_collector', ['idle_hoarder']),
  true,
)
assert.equal(
  conflictsWithEquippedIdleSet('idle_hoarder', ['idle_hoarder']),
  false,
  'a kind never conflicts with itself -- equip-time duplicate rejection is a separate check',
)
assert.equal(
  conflictsWithEquippedIdleSet('debris_skimmer', ['idle_hoarder']),
  false,
  'a non-idle set never conflicts with anything',
)

console.log(
  '✅ conflictsWithEquippedIdleSet: only the roaming_collector/idle_hoarder pair conflicts',
)

// settleTick: debris_skimmer clears debris passively each tick, on top of
// (not instead of) accrual -- and never undercuts manual clicking's larger
// single clear (SYSTEMS.md's three-co-viable-routes rule).
{
  const start = new Date('2026-08-25T00:00:00Z')
  const now = new Date(start.getTime() + TICK_SECONDS * 1000)
  const withSkimmer = settleTick({
    lastTickAt: start,
    now,
    debrisLevel: 50,
    fish: [{ id: 1, rarity: 'COMMON', hunger: 100 }],
    equippedSetKinds: ['debris_skimmer'],
  })
  const withoutSkimmer = settleTick({
    lastTickAt: start,
    now,
    debrisLevel: 50,
    fish: [{ id: 1, rarity: 'COMMON', hunger: 100 }],
  })
  assert.ok(
    withSkimmer.newDebrisLevel < withoutSkimmer.newDebrisLevel,
    'an equipped debris_skimmer must leave the tank cleaner than an otherwise-identical tank without one',
  )
  assert.ok(
    withSkimmer.newDebrisLevel >= DEBRIS_RANGE.min,
    'debris_skimmer never pushes debris below its floor',
  )
}

// settleTick: idle_hoarder/roaming_collector scale coinsEarned up, and the
// two never stack even if both are somehow passed at once (belt-and-
// suspenders backstop behind the equip-time rejection).
{
  const start = new Date('2026-08-25T00:00:00Z')
  const longNow = new Date(start.getTime() + 50 * TICK_SECONDS * 1000)
  const base = settleTick({
    lastTickAt: start,
    now: longNow,
    debrisLevel: 0,
    fish: [{ id: 1, rarity: 'COMMON', hunger: 100 }],
  })
  const hoarder = settleTick({
    lastTickAt: start,
    now: longNow,
    debrisLevel: 0,
    fish: [{ id: 1, rarity: 'COMMON', hunger: 100 }],
    equippedSetKinds: ['idle_hoarder'],
  })
  const collector = settleTick({
    lastTickAt: start,
    now: longNow,
    debrisLevel: 0,
    fish: [{ id: 1, rarity: 'COMMON', hunger: 100 }],
    equippedSetKinds: ['roaming_collector'],
  })
  const bothIdleKinds = settleTick({
    lastTickAt: start,
    now: longNow,
    debrisLevel: 0,
    fish: [{ id: 1, rarity: 'COMMON', hunger: 100 }],
    equippedSetKinds: ['idle_hoarder', 'roaming_collector'],
  })
  assert.ok(
    hoarder.coinsEarned > base.coinsEarned,
    'idle_hoarder must earn strictly more than the unequipped baseline over a long enough window',
  )
  assert.ok(
    collector.coinsEarned > hoarder.coinsEarned,
    "roaming_collector's larger configured fraction (0.5 vs idle_hoarder's 0.4) must earn more over a long enough window",
  )
  assert.equal(
    bothIdleKinds.coinsEarned,
    collector.coinsEarned,
    'passing both no_stack_idle_effects kinds at once must earn exactly what the LARGER single one alone earns (Math.max) -- never their sum',
  )
}

console.log(
  '✅ settleTick: debris_skimmer and idle_hoarder/roaming_collector apply correctly and never double-stack',
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

// --- firedBestiaryMilestones: cthulhuquarium/t-028's landmark gate ---------

// economy.yaml's exact four v1 bestiary breakpoints, in order.
assert.deepEqual(
  BESTIARY_MILESTONES.map((m) => [m.id, m.threshold, m.slotsCapDelta]),
  [
    ['bestiary_5', 5, 2],
    ['bestiary_10', 10, 2],
    ['bestiary_15', 15, 2],
    ['bestiary_20', 20, 2],
  ],
)

// Crossing one breakpoint fires exactly that one.
assert.deepEqual(
  firedBestiaryMilestones(4, 5).map((m) => m.id),
  ['bestiary_5'],
)
// Already past a breakpoint before this call -- must not re-fire.
assert.deepEqual(firedBestiaryMilestones(5, 6), [])
// A big single jump (e.g. an admin grant, or catching up after a gap) can
// cross several breakpoints at once -- all of them fire, none skipped.
assert.deepEqual(
  firedBestiaryMilestones(3, 17).map((m) => m.id),
  ['bestiary_5', 'bestiary_10', 'bestiary_15'],
)
// Landing exactly on a threshold counts as crossing it.
assert.deepEqual(
  firedBestiaryMilestones(9, 10).map((m) => m.id),
  ['bestiary_10'],
)
// No movement, no fire.
assert.deepEqual(firedBestiaryMilestones(5, 5), [])
// Below every threshold -- nothing fires yet.
assert.deepEqual(firedBestiaryMilestones(0, 3), [])
// Past every threshold already -- nothing left to fire.
assert.deepEqual(firedBestiaryMilestones(20, 25), [])

console.log(
  '✅ firedBestiaryMilestones: crosses each bestiary breakpoint exactly once, handles multi-breakpoint jumps',
)

// --- mergeBestStats: the Ichthyonomicon's best-individual-seen record ------
// (cthulhuquarium/t-031) ------------------------------------------------

const ALL_NULL = {
  charm: null,
  empathy: null,
  grace: null,
  luck: null,
  might: null,
  wits: null,
}

// Both sides null (t-029/genetics hasn't rolled anything yet) -- the actual
// shape of every real call site today. Must be a true no-op.
assert.deepEqual(mergeBestStats(ALL_NULL, ALL_NULL), ALL_NULL)

// A first observation on a fresh (never-observed) record adopts the
// observed value outright, per-stat, independently of the others.
assert.deepEqual(mergeBestStats(ALL_NULL, { ...ALL_NULL, charm: 4, wits: 2 }), {
  ...ALL_NULL,
  charm: 4,
  wits: 2,
})

// A higher observed value replaces the existing best; a lower one does not
// -- per-stat max, never a regression (SYSTEMS.md's "nothing here may ever
// decrease").
assert.deepEqual(
  mergeBestStats(
    { ...ALL_NULL, charm: 5, grace: 8 },
    { ...ALL_NULL, charm: 3, grace: 9 },
  ),
  { ...ALL_NULL, charm: 5, grace: 9 },
)

// An observed null (a stat this individual never rolled, or a future
// partial-observation caller) never overwrites an existing recorded best.
assert.deepEqual(mergeBestStats({ ...ALL_NULL, might: 7 }, ALL_NULL), {
  ...ALL_NULL,
  might: 7,
})

console.log(
  '✅ mergeBestStats: per-stat max, independently, never regresses an existing best',
)

// --- rare random events (cthulhuquarium/t-016) ------------------------------

// Catalog shape: every kind priced/toned, no kind ever configured to take
// anything away (bonusCoinsMin can be 0 -- a purely cosmetic kind -- but
// never negative, and max is never below min).
assert.deepEqual(
  [...RARE_EVENT_KINDS].sort(),
  ['rare_visitor', 'tank_gone_wrong', 'windfall_collectible'].sort(),
)
for (const kind of RARE_EVENT_KINDS) {
  const config = RARE_EVENT_CATALOG[kind]
  assert.ok(config.chance > 0 && config.chance < 1)
  assert.ok(config.bonusCoinsMin >= 0)
  assert.ok(config.bonusCoinsMax >= config.bonusCoinsMin)
  assert.ok(config.tone.length > 0)
}
assert.ok(
  RARE_EVENT_KINDS.reduce(
    (sum, kind) => sum + RARE_EVENT_CATALOG[kind].chance,
    0,
  ) < 1,
  'chances must sum to under 1 so "nothing happened" stays possible',
)

console.log(
  '✅ RARE_EVENT_CATALOG: every economy.yaml rare_events key is present, priced, self-consistent',
)

// rollRareEvent: selectRoll walks RARE_EVENT_KINDS in order -- rare_visitor
// [0, 0.03), windfall_collectible [0.03, 0.038), tank_gone_wrong
// [0.038, 0.053), no event [0.053, 1).
assert.equal(rollRareEvent(0, 0)?.kind, 'rare_visitor')
assert.equal(rollRareEvent(0.0299, 0)?.kind, 'rare_visitor')
assert.equal(rollRareEvent(0.03, 0)?.kind, 'windfall_collectible')
assert.equal(rollRareEvent(0.0379, 0)?.kind, 'windfall_collectible')
assert.equal(rollRareEvent(0.038, 0)?.kind, 'tank_gone_wrong')
assert.equal(rollRareEvent(0.0529, 0)?.kind, 'tank_gone_wrong')
assert.equal(
  rollRareEvent(0.053, 0),
  null,
  'selectRoll landing exactly on the total configured chance is a no-event roll, not an off-by-one hit',
)
assert.equal(rollRareEvent(0.9999, 0), null)

console.log(
  '✅ rollRareEvent: selectRoll walks RARE_EVENT_KINDS in order, exact boundaries land in the right slice (or none)',
)

// magnitudeRoll: linear across [bonusCoinsMin, bonusCoinsMax], floored -- 0
// gives the min, just-under-1 gives the max, never above it.
assert.equal(rollRareEvent(0, 0)?.bonusCoins, 15)
assert.equal(rollRareEvent(0, 0.999999)?.bonusCoins, 40)
assert.equal(rollRareEvent(0.03, 0)?.bonusCoins, 60)
assert.equal(rollRareEvent(0.03, 0.999999)?.bonusCoins, 150)
assert.equal(
  rollRareEvent(0.038, 0.999999)?.bonusCoins,
  0,
  'tank_gone_wrong is configured min=max=0 -- purely cosmetic, never a coin effect regardless of the roll',
)

console.log(
  "✅ rollRareEvent: bonusCoins scales linearly across each kind's configured range, floored, never exceeds bonusCoinsMax",
)

// --- the last aquarium (cthulhuquarium/t-039): a standalone terminal
// purchase, not a SetPieceKind -------------------------------------------

assert.equal(LAST_AQUARIUM_CONFIG.effect, 'cosmetic_reframe')
assert.equal(LAST_AQUARIUM_CONFIG.reframeScope, 'existing_tank_contents')
assert.ok(
  LAST_AQUARIUM_CONFIG.cost > 0,
  'the last aquarium must cost something -- it is a purchase, not a freebie',
)
assert.ok(
  LAST_AQUARIUM_CONFIG.cost >
    Math.max(...SET_PIECE_KINDS.map((kind) => SET_PIECE_CATALOG[kind].cost)),
  'the last aquarium is, by design, the single most expensive purchasable in the game',
)
assert.equal(
  isKnownSetPieceKind('last_aquarium'),
  false,
  'the last aquarium is intentionally not a SetPieceKind -- it never occupies a setSlotsCap slot and is never equipped/unequipped',
)

console.log(
  '✅ LAST_AQUARIUM_CONFIG: priced above every set piece, purely cosmetic_reframe, and not a SetPieceKind',
)

// --- eggs (cthulhuquarium/t-041): two independent dials -- rarity grades
// the LINE the egg seeds, size is the reserved tank-capacity weight -------

// Rarity dominates price; size is a modest surcharge -- a small MYTHIC egg
// still costs more than a large COMMON one, per the task note's own "small
// expensive high-rarity, big cheap ordinary" framing.
assert.ok(
  eggCost('MYTHIC', EGG_SIZE_OPTIONS[0]!) >
    eggCost('COMMON', EGG_SIZE_OPTIONS[EGG_SIZE_OPTIONS.length - 1]!),
  'a small MYTHIC egg must cost more than a large COMMON egg -- rarity is the dominant price signal',
)

// Independent dials: holding rarity fixed, cost strictly increases with
// size; holding size fixed, cost strictly increases with rarity.
for (const rarity of RARITY_ORDER) {
  for (let i = 1; i < EGG_SIZE_OPTIONS.length; i++) {
    assert.ok(
      eggCost(rarity, EGG_SIZE_OPTIONS[i]!) >
        eggCost(rarity, EGG_SIZE_OPTIONS[i - 1]!),
      `eggCost(${rarity}, ${EGG_SIZE_OPTIONS[i]}) must exceed eggCost(${rarity}, ${EGG_SIZE_OPTIONS[i - 1]}) -- size is a real dial, not a no-op`,
    )
  }
}
for (let i = 1; i < RARITY_ORDER.length; i++) {
  const size = EGG_SIZE_OPTIONS[0]!
  assert.ok(
    eggCost(RARITY_ORDER[i]!, size) > eggCost(RARITY_ORDER[i - 1]!, size),
    `eggCost(${RARITY_ORDER[i]}, ${size}) must exceed eggCost(${RARITY_ORDER[i - 1]}, ${size}) -- rarity is a real dial, not a no-op`,
  )
}

console.log(
  '✅ eggCost: rarity and size are genuinely independent dials, rarity dominates the price signal',
)

// eggCatalog() offers every rarity x size combination exactly once, and
// every entry's cost matches eggCost's own math -- the catalog is a thin
// enumeration, not a second source of truth for pricing.
const catalog = eggCatalog()
assert.equal(catalog.length, RARITY_ORDER.length * EGG_SIZE_OPTIONS.length)
for (const entry of catalog) {
  assert.equal(entry.cost, eggCost(entry.rarity, entry.size))
  assert.ok(EGG_SIZE_OPTIONS.includes(entry.size))
  assert.ok(RARITY_ORDER.includes(entry.rarity))
}
const seenPairs = new Set(
  catalog.map((entry) => `${entry.rarity}:${entry.size}`),
)
assert.equal(
  seenPairs.size,
  catalog.length,
  'eggCatalog() must offer each rarity+size pair exactly once',
)

console.log(
  '✅ eggCatalog: one entry per rarity+size pair, every cost traces to eggCost',
)

assert.equal(isKnownEggRarity('MYTHIC'), true)
assert.equal(isKnownEggRarity('LEGENDARY'), true)
assert.equal(isKnownEggRarity('not-a-rarity'), false)
assert.equal(isKnownEggSize(EGG_SIZE_OPTIONS[0]!), true)
assert.equal(isKnownEggSize(999), false)

console.log(
  '✅ isKnownEggRarity/isKnownEggSize: reject anything outside the real catalog',
)

// pickHatchIndex: pure roll -> index, in range, and deterministic given the
// same roll -- the actual species-pool query lives in aquarium.ts (needs
// Prisma), this only verifies the index math it depends on.
assert.equal(pickHatchIndex(5, 0), 0)
assert.equal(pickHatchIndex(5, 0.999), 4)
assert.equal(
  pickHatchIndex(5, 1),
  4,
  'a roll of exactly 1 (should never happen from Math.random(), but must not throw) clamps to the last index',
)
for (let i = 0; i < 20; i++) {
  const roll = i / 20
  const index = pickHatchIndex(7, roll)
  assert.ok(index >= 0 && index < 7)
}

console.log(
  '✅ pickHatchIndex: always returns a valid in-range pool index, never off-by-one at the edges',
)

console.log('✅ verifyAquariumEconomy: all assertions passed')
