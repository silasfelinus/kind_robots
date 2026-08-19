// /utils/scripts/verifyManaAttribution.test.ts
//
// Regression test for kind-economy/t-007 (attribute each chargeable
// generation to the creator whose object seeded it). Exercises the
// DB-free paths of server/utils/manaAttribution.ts's resolveManaAttribution()
// -- no source, and an unresolvable/unknown source type -- both of which
// return without ever touching prisma, plus the registry inventory and the
// brainstorm modelType -> ManaAttributionSource mapping.
//
// What this does NOT cover (documented, not silently skipped, same
// discipline as utils/scripts/verifyManaResourceSplit.test.ts): the actual
// OWNER_LOOKUP database queries and the resulting isSelfAttribution
// computation require a real database connection and are not exercised
// here -- this sandbox has neither a live MariaDB instance nor Docker
// available to start one.
//
// server/utils/manaAttribution.ts imports server/utils/prisma.ts, which
// throws synchronously if DATABASE_URL is unset. No prisma query actually
// runs in this file (PrismaClient connects lazily, and every path exercised
// here returns before reaching OWNER_LOOKUP), so a syntactically valid dummy
// value is enough -- same pattern as
// utils/scripts/verifyOwnershipNullability.test.ts.
import assert from 'node:assert/strict'

process.env.DATABASE_URL ??= 'mysql://user:pass@127.0.0.1:3306/kindrobots'

const { resolveManaAttribution, MANA_ATTRIBUTION_SOURCE_TYPES } =
  await import('../../server/utils/manaAttribution.js')
const { BRAINSTORM_SOURCE_ATTRIBUTION_TYPE } =
  await import('../../server/utils/brainstorm/brainstormSourceContext.js')

// --- resolveManaAttribution: no source -----------------------------------

for (const noSource of [null, undefined] as const) {
  const result = await resolveManaAttribution(noSource, 42)
  assert.deepEqual(
    result,
    { source: null, creatorUserId: null, isSelfAttribution: false },
    `no source (${String(noSource)}) should resolve to no attribution, no DB call`,
  )
}

// --- resolveManaAttribution: unknown/unregistered source type ------------
// (constructed via `as never` to simulate a type this registry doesn't --
// or doesn't yet -- know how to resolve; TypeScript itself is what stops a
// real caller from passing an invalid ManaAttributionSource.)

{
  const unknownSource = { type: 'NOT_A_REAL_TYPE' as never, id: 1 }
  const result = await resolveManaAttribution(unknownSource, 42)
  assert.deepEqual(
    result,
    { source: unknownSource, creatorUserId: null, isSelfAttribution: false },
    'an unregistered source type should degrade to no attribution rather than throw',
  )
}

// --- registry inventory ---------------------------------------------------
// Regression guard on the enum inventory itself (prisma/schema.prisma's
// ManaAttributionSource) -- the design brief's "Scenario, Bot, Character,
// Facet, Pitch, art/Media, packs" plus Reward and Dream (both are also
// plain-userId-owned and already resolvable brainstorm source refs).

const EXPECTED_SOURCE_TYPES = [
  'BOT',
  'CHARACTER',
  'FACET',
  'SCENARIO',
  'PITCH',
  'ART',
  'PACK',
  'REWARD',
  'DREAM',
].sort()

assert.deepEqual(
  [...MANA_ATTRIBUTION_SOURCE_TYPES].sort(),
  EXPECTED_SOURCE_TYPES,
  'OWNER_LOOKUP registry should cover exactly the documented seedable object types',
)

// --- brainstorm source -> attribution type mapping ------------------------

assert.equal(BRAINSTORM_SOURCE_ATTRIBUTION_TYPE.character, 'CHARACTER')
assert.equal(BRAINSTORM_SOURCE_ATTRIBUTION_TYPE.scenario, 'SCENARIO')
assert.equal(BRAINSTORM_SOURCE_ATTRIBUTION_TYPE.dream, 'DREAM')
assert.equal(
  BRAINSTORM_SOURCE_ATTRIBUTION_TYPE.unknownmodeltype,
  undefined,
  'an unmapped brainstorm modelType should not silently resolve to some attribution type',
)

console.log(
  '[verifyManaAttribution] OK -- no-source/unknown-source fallbacks, registry inventory, and brainstorm mapping all check out',
)
