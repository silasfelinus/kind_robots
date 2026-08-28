// /utils/scripts/verifyAquariumGenetics.test.ts
//
// Regression + property test for cthulhuquarium/t-029's pure genetics core
// (rollIndividualStats, convergeBreedStats, breedCost,
// qualifiesForBreedingEvolution) in server/utils/aquariumEconomy.ts -- no
// prisma, no database, no Nuxt/H3 runtime, same discipline as
// verifyAquariumEconomy.test.ts.
import assert from 'node:assert/strict'

import {
  BREED_CONVERGENCE_UPSIDE,
  BREED_COST_FACTOR_OF_UNLOCK_COST,
  breedCost,
  convergeBreedStats,
  mergeBestStats,
  qualifiesForBreedingEvolution,
  RARITY_TIERS,
  rollIndividualStats,
  SECRET_EVOLUTION_AVERAGE_STAT_THRESHOLD,
  STAT_BLOCK_KEYS,
  STAT_ROLL_RANGES,
  unlockCost,
  type StatBlock,
  type StatRolls,
} from '../../server/utils/aquariumEconomy.js'

const ZERO_ROLLS: StatRolls = {
  charm: 0,
  empathy: 0,
  grace: 0,
  luck: 0,
  might: 0,
  wits: 0,
}
const MAX_ROLLS: StatRolls = {
  charm: 0.999999,
  empathy: 0.999999,
  grace: 0.999999,
  luck: 0.999999,
  might: 0.999999,
  wits: 0.999999,
}
// --- rollIndividualStats: draws from the species' own per-stat tier range --

const commonSpecies = {
  charm: 'COMMON',
  empathy: 'COMMON',
  grace: 'COMMON',
  luck: 'COMMON',
  might: 'COMMON',
  wits: 'COMMON',
} as const

const mixedTierSpecies = {
  charm: 'COMMON',
  empathy: 'MYTHIC',
  grace: 'COMMON',
  luck: 'COMMON',
  might: 'COMMON',
  wits: 'COMMON',
} as const

assert.deepEqual(rollIndividualStats(commonSpecies, ZERO_ROLLS), {
  charm: STAT_ROLL_RANGES.COMMON.min,
  empathy: STAT_ROLL_RANGES.COMMON.min,
  grace: STAT_ROLL_RANGES.COMMON.min,
  luck: STAT_ROLL_RANGES.COMMON.min,
  might: STAT_ROLL_RANGES.COMMON.min,
  wits: STAT_ROLL_RANGES.COMMON.min,
})
assert.deepEqual(rollIndividualStats(commonSpecies, MAX_ROLLS), {
  charm: STAT_ROLL_RANGES.COMMON.max,
  empathy: STAT_ROLL_RANGES.COMMON.max,
  grace: STAT_ROLL_RANGES.COMMON.max,
  luck: STAT_ROLL_RANGES.COMMON.max,
  might: STAT_ROLL_RANGES.COMMON.max,
  wits: STAT_ROLL_RANGES.COMMON.max,
})

// A COMMON-tier species (by deriveFishRarityTier's "highest wins" spirit)
// can still roll a MYTHIC-range value on the one stat it carries MYTHIC --
// each stat is drawn independently from ITS OWN tier, not the species'
// overall economic tier.
const mixedRoll = rollIndividualStats(mixedTierSpecies, MAX_ROLLS)
assert.equal(mixedRoll.empathy, STAT_ROLL_RANGES.MYTHIC.max)
assert.equal(mixedRoll.charm, STAT_ROLL_RANGES.COMMON.max)
assert.ok(
  mixedRoll.empathy! > mixedRoll.charm!,
  'a MYTHIC-tier stat rolls in a strictly higher range than a COMMON-tier stat on the same individual',
)

console.log(
  '✅ rollIndividualStats: each stat draws linearly from its OWN species-tier range, independent of the other five',
)

// Every tier's range is non-degenerate and ranges are monotonically
// non-decreasing as tier rises -- a balance-pass typo (e.g. RARE.max below
// UNCOMMON.max) would silently make higher tiers worse, so this guards the
// ordering invariant even though the exact numbers are placeholders.
const TIER_ORDER = [
  'COMMON',
  'UNCOMMON',
  'RARE',
  'EPIC',
  'LEGENDARY',
  'MYTHIC',
] as const
for (let i = 0; i < TIER_ORDER.length; i++) {
  const range = STAT_ROLL_RANGES[TIER_ORDER[i]!]
  assert.ok(range.max > range.min, `${TIER_ORDER[i]}: max must exceed min`)
  if (i > 0) {
    const prev = STAT_ROLL_RANGES[TIER_ORDER[i - 1]!]
    assert.ok(
      range.min >= prev.min && range.max >= prev.max,
      `${TIER_ORDER[i]} must roll no lower than ${TIER_ORDER[i - 1]} at either end of its range`,
    )
  }
}

console.log(
  '✅ STAT_ROLL_RANGES: strictly non-empty per tier, monotonically non-decreasing as tier rises',
)

// --- convergeBreedStats: anchors on the higher parent, per stat, never below it --

const lowParent: StatBlock = {
  charm: 10,
  empathy: 10,
  grace: 10,
  luck: 10,
  might: 10,
  wits: 10,
}
const highParent: StatBlock = {
  charm: 50,
  empathy: 5, // deliberately the WEAKER parent for this one stat
  grace: 50,
  luck: 50,
  might: 50,
  wits: 50,
}

const offspringFloor = convergeBreedStats(lowParent, highParent, ZERO_ROLLS)
for (const key of STAT_BLOCK_KEYS) {
  const anchor = Math.max(lowParent[key]!, highParent[key]!)
  assert.equal(
    offspringFloor[key],
    anchor,
    `${key}: a zero roll lands exactly on the better parent's value, never below it`,
  )
}
// empathy: lowParent (10) is the BETTER parent for this one stat even
// though highParent is better everywhere else -- convergence anchors PER
// STAT, not on "the better parent" as a single fish.
assert.equal(
  offspringFloor.empathy,
  10,
  'convergence anchors each stat independently -- the weaker fish overall can still be the better SOURCE for one stat',
)

const offspringCeiling = convergeBreedStats(lowParent, highParent, MAX_ROLLS)
for (const key of STAT_BLOCK_KEYS) {
  const anchor = Math.max(lowParent[key]!, highParent[key]!)
  assert.equal(offspringCeiling[key], anchor + BREED_CONVERGENCE_UPSIDE)
  assert.ok(
    offspringCeiling[key]! >= anchor,
    'convergence never rolls BELOW the better parent -- effort compounds, it never resets',
  )
}

// A null stat on one side (a never-rolled parent, which should not occur in
// practice since every AquariumStock is rolled on creation) loses to the
// other side's real number rather than propagating null.
const nullOnOneSide = convergeBreedStats(
  {
    charm: null,
    empathy: 20,
    grace: null,
    luck: null,
    might: null,
    wits: null,
  },
  {
    charm: 30,
    empathy: null,
    grace: null,
    luck: null,
    might: null,
    wits: null,
  },
  ZERO_ROLLS,
)
assert.equal(nullOnOneSide.charm, 30)
assert.equal(nullOnOneSide.empathy, 20)
assert.equal(
  nullOnOneSide.grace,
  null,
  'both sides null stays null rather than becoming 0',
)

console.log(
  '✅ convergeBreedStats: anchors each stat independently on the better parent, rolls a strictly-upside band above it, null-safe',
)

// --- breedCost: anchored against RARITY_TIERS, same as feedCost ------------

assert.equal(BREED_COST_FACTOR_OF_UNLOCK_COST, 0.5)
assert.equal(
  breedCost('COMMON'),
  Math.round(RARITY_TIERS.COMMON.unlockCost * 0.5),
)
assert.equal(
  breedCost('MYTHIC'),
  Math.round(RARITY_TIERS.MYTHIC.unlockCost * 0.5),
)
// Per-species unlockCost override threads through breedCost exactly like
// feedCost/unlockCost.
assert.equal(breedCost('COMMON', 1000), Math.round(1000 * 0.5))
assert.equal(
  breedCost('COMMON'),
  Math.round(unlockCost('COMMON') * BREED_COST_FACTOR_OF_UNLOCK_COST),
)

console.log(
  '✅ breedCost: 0.5x the species unlock cost, respects a per-species unlockCost override',
)

// --- qualifiesForBreedingEvolution: gated on stats, not on the pairing alone --

const belowThreshold: StatBlock = {
  charm: SECRET_EVOLUTION_AVERAGE_STAT_THRESHOLD - 1,
  empathy: SECRET_EVOLUTION_AVERAGE_STAT_THRESHOLD - 1,
  grace: SECRET_EVOLUTION_AVERAGE_STAT_THRESHOLD - 1,
  luck: SECRET_EVOLUTION_AVERAGE_STAT_THRESHOLD - 1,
  might: SECRET_EVOLUTION_AVERAGE_STAT_THRESHOLD - 1,
  wits: SECRET_EVOLUTION_AVERAGE_STAT_THRESHOLD - 1,
}
assert.equal(qualifiesForBreedingEvolution(belowThreshold), false)

const atThreshold: StatBlock = {
  charm: SECRET_EVOLUTION_AVERAGE_STAT_THRESHOLD,
  empathy: SECRET_EVOLUTION_AVERAGE_STAT_THRESHOLD,
  grace: SECRET_EVOLUTION_AVERAGE_STAT_THRESHOLD,
  luck: SECRET_EVOLUTION_AVERAGE_STAT_THRESHOLD,
  might: SECRET_EVOLUTION_AVERAGE_STAT_THRESHOLD,
  wits: SECRET_EVOLUTION_AVERAGE_STAT_THRESHOLD,
}
assert.equal(qualifiesForBreedingEvolution(atThreshold), true)

// A high average with one weak stat can still average above the bar --
// documents the current "average" rule explicitly, since a future balance
// pass may prefer a strict per-stat minimum instead (see the function's own
// doc comment).
const highAverageOneWeakStat: StatBlock = {
  charm: 100,
  empathy: 100,
  grace: 100,
  luck: 100,
  might: 100,
  wits: 10, // average = 510/6 = 85, exactly at SECRET_EVOLUTION_AVERAGE_STAT_THRESHOLD
}
assert.equal(qualifiesForBreedingEvolution(highAverageOneWeakStat), true)

// Any unrolled (null) stat fails the check outright rather than treating
// null as 0 and averaging around it.
assert.equal(
  qualifiesForBreedingEvolution({ ...atThreshold, wits: null }),
  false,
  'a null stat never partially qualifies -- every stat must actually be rolled',
)

console.log(
  '✅ qualifiesForBreedingEvolution: average-of-six gate at the configured threshold, null stats never qualify',
)

// --- mergeBestStats still holds under a real rolled/converged StatBlock ---
// (regression guard: t-029 is the first real caller passing non-null
// observed stats through this t-031 function.)

const observed: StatBlock = { ...atThreshold, luck: 40 }
const merged = mergeBestStats(belowThreshold, observed)
for (const key of STAT_BLOCK_KEYS) {
  assert.equal(
    merged[key],
    Math.max(belowThreshold[key]!, observed[key]!),
    `${key}: mergeBestStats still takes the max under real rolled data`,
  )
}

console.log(
  '✅ mergeBestStats: correct under real rolled/converged StatBlock input, not just placeholder nulls',
)

console.log('✅ verifyAquariumGenetics: all assertions passed')
