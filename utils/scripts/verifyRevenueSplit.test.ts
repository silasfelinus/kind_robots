// /utils/scripts/verifyRevenueSplit.test.ts
//
// Regression + property test for kind-economy/t-008 (the immutable
// RevenueSplit ledger). Exercises server/utils/revenueSplit.ts's pure
// calculation core -- no prisma, no database, no Nuxt/H3 runtime -- same
// discipline as utils/scripts/verifyManaResourceSplit.test.ts.
//
// What this does NOT cover (documented, not silently skipped, same
// discipline as the mana-resource-split/mana-attribution tests): the actual
// prisma.revenueSplit.create() write inside server/utils/manaGate.ts's
// commit() closure requires a real database connection and is not
// exercised here -- this sandbox has neither a live MariaDB instance nor
// Docker available to start one.
import assert from 'node:assert/strict'

import {
  computePaymentProcessingFeeCents,
  computeRevenueSplit,
  REVENUE_SPLIT_RATIO,
  tokensToGrossCents,
  usdToCents,
  ASSUMED_PAYMENT_PROCESSING_FEE_RATE,
} from '../../server/utils/revenueSplit.js'

// Deterministic pseudo-random generator (mulberry32) -- no test-run
// flakiness, same pattern as utils/scripts/verifyPitchDetectorAccuracy.test.ts.
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

// --- fixed-ratio sanity ----------------------------------------------------

assert.deepEqual(
  REVENUE_SPLIT_RATIO,
  { platform: 1, mission: 1, creator: 1 },
  'the split ratio should be equal thirds unless a documented policy change edits the single constant',
)

// --- computeRevenueSplit: exact, evenly-divisible split ---------------------

{
  const result = computeRevenueSplit({
    grossCents: 300,
    paymentProcessingFeeCents: 0,
    providerCostCents: 0,
  })
  assert.deepEqual(result, {
    platformShareCents: 100,
    missionShareCents: 100,
    creatorShareCents: 100,
    roundingRemainderCents: 0,
  })
}

// --- computeRevenueSplit: fee + provider cost come off the top (net, not
// gross) before the three-way split, per Silas's 2026-08-19 basis decision ---

{
  const result = computeRevenueSplit({
    grossCents: 100,
    paymentProcessingFeeCents: 0,
    providerCostCents: 10,
  })
  // netCents = 90, split 30/30/30 -- confirms the split operates on NET, not
  // the full 100 cents of gross.
  assert.deepEqual(result, {
    platformShareCents: 30,
    missionShareCents: 30,
    creatorShareCents: 30,
    roundingRemainderCents: 0,
  })
}

// --- computeRevenueSplit: rounding leftover folds into the platform share ---

{
  // netCents = 100: 100/3 = 33.33 -> floors of 33/33/33 leave 1 cent over.
  const result = computeRevenueSplit({
    grossCents: 100,
    paymentProcessingFeeCents: 0,
    providerCostCents: 0,
  })
  assert.equal(
    result.platformShareCents,
    34,
    'the 1-cent rounding leftover should fold into the platform share, not mission or creator',
  )
  assert.equal(result.missionShareCents, 33)
  assert.equal(result.creatorShareCents, 33)
  assert.equal(
    result.roundingRemainderCents,
    0,
    'roundingRemainderCents is 0 once the leftover has been folded into platformShareCents -- it is not double-counted',
  )
  assert.equal(
    result.platformShareCents +
      result.missionShareCents +
      result.creatorShareCents,
    100,
  )
}

{
  // netCents = 101: floors of 33/33/33 leave 2 cents over (the maximum
  // possible leftover for equal thirds).
  const result = computeRevenueSplit({
    grossCents: 101,
    paymentProcessingFeeCents: 0,
    providerCostCents: 0,
  })
  assert.equal(result.platformShareCents, 35)
  assert.equal(result.missionShareCents, 33)
  assert.equal(result.creatorShareCents, 33)
}

// --- computeRevenueSplit: negative/zero net -> zero shares, no negative
// creator share, shortfall recorded honestly ---------------------------------

{
  // Costs exactly consume gross: net = 0.
  const result = computeRevenueSplit({
    grossCents: 50,
    paymentProcessingFeeCents: 0,
    providerCostCents: 50,
  })
  assert.deepEqual(result, {
    platformShareCents: 0,
    missionShareCents: 0,
    creatorShareCents: 0,
    roundingRemainderCents: 0,
  })
}

{
  // Costs exceed gross: net is negative. Every share must be 0 -- NEVER a
  // negative creator share -- and the shortfall must be recorded, not
  // dropped.
  const result = computeRevenueSplit({
    grossCents: 50,
    paymentProcessingFeeCents: 5,
    providerCostCents: 60,
  })
  assert.deepEqual(result, {
    platformShareCents: 0,
    missionShareCents: 0,
    creatorShareCents: 0,
    roundingRemainderCents: -15,
  })
}

// --- computeRevenueSplit: gross = 0 --------------------------------------

{
  const result = computeRevenueSplit({
    grossCents: 0,
    paymentProcessingFeeCents: 0,
    providerCostCents: 0,
  })
  assert.deepEqual(result, {
    platformShareCents: 0,
    missionShareCents: 0,
    creatorShareCents: 0,
    roundingRemainderCents: 0,
  })
}

// --- computeRevenueSplit: rejects float input (integer cents only, never
// floats -- the task's explicit accounting requirement) ---------------------

assert.throws(
  () =>
    computeRevenueSplit({
      grossCents: 100.5,
      paymentProcessingFeeCents: 0,
      providerCostCents: 0,
    }),
  /must be an integer/,
  'a fractional-cent grossCents must throw, never silently truncate',
)

assert.throws(
  () =>
    computeRevenueSplit({
      grossCents: -1,
      paymentProcessingFeeCents: 0,
      providerCostCents: 0,
    }),
  /must not be negative/,
)

console.log(
  '✅ computeRevenueSplit: net-of-costs split, rounding-to-platform, and negative/zero-net shortfall handling all correct',
)

// --- PROPERTY TEST: for a wide range of random (grossCents, fee, cost)
// combinations, the full accounting invariant holds EXACTLY, and no share is
// ever negative. --------------------------------------------------------

const rand = mulberry32(20260819)
const ITERATIONS = 20_000

// Edge cases the random sweep might not hit reliably on its own.
const EDGE_CASES: Array<{
  grossCents: number
  paymentProcessingFeeCents: number
  providerCostCents: number
}> = [
  { grossCents: 0, paymentProcessingFeeCents: 0, providerCostCents: 0 },
  { grossCents: 1, paymentProcessingFeeCents: 0, providerCostCents: 0 },
  { grossCents: 1, paymentProcessingFeeCents: 0, providerCostCents: 1 },
  { grossCents: 1, paymentProcessingFeeCents: 1, providerCostCents: 1 },
  { grossCents: 2, paymentProcessingFeeCents: 1, providerCostCents: 2 }, // fee+cost > gross
  { grossCents: 3, paymentProcessingFeeCents: 0, providerCostCents: 0 }, // divides evenly
  { grossCents: 100, paymentProcessingFeeCents: 0, providerCostCents: 0 },
  {
    grossCents: 1_000_000_00,
    paymentProcessingFeeCents: 29_000_00,
    providerCostCents: 5_000_00,
  }, // very large gross ($1,000,000)
  {
    grossCents: 1_000_000_00,
    paymentProcessingFeeCents: 0,
    providerCostCents: 0,
  },
]

function checkInvariant(input: {
  grossCents: number
  paymentProcessingFeeCents: number
  providerCostCents: number
}) {
  const result = computeRevenueSplit(input)

  assert.ok(
    result.platformShareCents >= 0,
    `platformShareCents must never be negative (input: ${JSON.stringify(input)})`,
  )
  assert.ok(
    result.missionShareCents >= 0,
    `missionShareCents must never be negative (input: ${JSON.stringify(input)})`,
  )
  assert.ok(
    result.creatorShareCents >= 0,
    `creatorShareCents must never be negative (input: ${JSON.stringify(input)})`,
  )

  const total =
    result.platformShareCents +
    result.missionShareCents +
    result.creatorShareCents +
    input.paymentProcessingFeeCents +
    input.providerCostCents +
    result.roundingRemainderCents

  assert.equal(
    total,
    input.grossCents,
    `platform + mission + creator + fee + providerCost + roundingRemainder must equal grossCents EXACTLY (input: ${JSON.stringify(input)}, result: ${JSON.stringify(result)})`,
  )
}

for (const edgeCase of EDGE_CASES) {
  checkInvariant(edgeCase)
}

for (let i = 0; i < ITERATIONS; i++) {
  // grossCents: 0 .. ~$10,000, weighted toward small values (typical
  // generation spends are a few cents) with an occasional large outlier.
  const grossCents = Math.floor(rand() * (rand() < 0.02 ? 100_000_00 : 5_000))
  // fee and providerCost are each independently allowed to range from 0 up
  // to somewhat more than gross, so "costs exceed gross" is exercised
  // routinely, not just at the hand-picked edge cases above.
  const paymentProcessingFeeCents = Math.floor(rand() * (grossCents + 200))
  const providerCostCents = Math.floor(rand() * (grossCents + 200))

  checkInvariant({ grossCents, paymentProcessingFeeCents, providerCostCents })
}

console.log(
  `✅ computeRevenueSplit property test: invariant held across ${EDGE_CASES.length} edge cases + ${ITERATIONS} random combinations -- no negative share, exact accounting every time`,
)

// --- tokensToGrossCents ----------------------------------------------------

assert.equal(tokensToGrossCents(0), 0)
assert.equal(
  tokensToGrossCents(1),
  0,
  '1 token unit = 0.1 cent, rounds down to 0 gross cents -- documented as intentional',
)
assert.equal(
  tokensToGrossCents(5),
  1,
  '5 token units = 0.5 cent, rounds half-up to 1 cent',
)
assert.equal(
  tokensToGrossCents(20),
  2,
  '20 token units ($0.02 at the peg) = exactly 2 cents',
)
assert.equal(tokensToGrossCents(1000), 100, '1000 token units = $1 = 100 cents')
assert.throws(
  () => tokensToGrossCents(-1),
  /non-negative integer/,
  'a negative token amount should throw, never silently produce negative cents',
)
assert.throws(() => tokensToGrossCents(1.5), /non-negative integer/)

console.log('✅ tokensToGrossCents: peg conversion and rounding correct')

// --- usdToCents --------------------------------------------------------

assert.equal(usdToCents(1), 100)
assert.equal(
  usdToCents(0.005),
  1,
  'half-cent rounds up to 1 cent (round-half-up)',
)
assert.equal(usdToCents(0), 0)
assert.equal(
  usdToCents(null),
  0,
  'a missing costUsd (never reconciled, or omitted by an entry point) must degrade to 0 cents, not NaN or a thrown error',
)
assert.equal(usdToCents(undefined), 0)
assert.equal(
  usdToCents(-5),
  0,
  'a negative USD amount should never produce negative cents',
)
assert.equal(usdToCents(NaN), 0)

console.log(
  '✅ usdToCents: USD-to-cents conversion and null/undefined/invalid fallback correct',
)

// --- payment-processing fee policy -----------------------------------------

assert.equal(
  ASSUMED_PAYMENT_PROCESSING_FEE_RATE,
  0,
  'documented policy: the processing fee is treated as already absorbed at token-purchase time, so the per-spend assumed rate defaults to 0 -- see revenueSplit.ts',
)
assert.equal(computePaymentProcessingFeeCents(12345), 0)

console.log(
  '✅ payment-processing fee policy: ASSUMED_PAYMENT_PROCESSING_FEE_RATE = 0 (fee absorbed at purchase time), computePaymentProcessingFeeCents always returns 0 under the current policy',
)

console.log('✅ verifyRevenueSplit: all assertions passed')
