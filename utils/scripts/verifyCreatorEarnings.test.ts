// /utils/scripts/verifyCreatorEarnings.test.ts
//
// Regression test for kind-economy/t-009 (the read-only creator earnings
// view). Exercises server/utils/creatorEarnings.ts's pure calculation core
// -- no prisma, no database, no Nuxt/H3 runtime -- same discipline as
// utils/scripts/verifyRevenueSplit.test.ts and
// utils/scripts/verifyManaAttribution.test.ts.
//
// What this does NOT cover (documented, not silently skipped): the actual
// prisma.revenueSplit.findMany() calls inside getCreatorEarnings() and the
// TITLE_LOOKUP prisma queries inside resolveObjectTitle() require a real
// database connection and are not exercised here -- this sandbox has
// neither a live MariaDB instance nor Docker available to start one.
import assert from 'node:assert/strict'

import {
  bucketKeyForDate,
  excludeSupersededRows,
  summarizeCreatorEarnings,
  supersededIdsFromCorrections,
  type CreatorEarningsRow,
} from '../../server/utils/creatorEarnings.js'

function row(
  overrides: Partial<CreatorEarningsRow> & { id: number },
): CreatorEarningsRow {
  return {
    id: overrides.id,
    createdAt: overrides.createdAt ?? new Date('2026-08-01T00:00:00Z'),
    creatorShareCents: overrides.creatorShareCents ?? 0,
    isSelfAttribution: overrides.isSelfAttribution ?? false,
    sourceType: overrides.sourceType ?? 'BOT',
    sourceId: overrides.sourceId ?? 1,
  }
}

// --- supersededIdsFromCorrections / excludeSupersededRows -----------------

{
  const supersededIds = supersededIdsFromCorrections([
    { reversedById: 1 },
    { reversedById: null },
    { reversedById: 3 },
  ])
  assert.deepEqual([...supersededIds].sort(), [1, 3])
}

{
  // A row whose id is named by another row's reversedById is dropped; the
  // correction row itself (a normal row with its own id) is kept.
  const rows = [{ id: 1 }, { id: 2 }, { id: 3 }]
  const superseded = supersededIdsFromCorrections([{ reversedById: 2 }])
  const effective = excludeSupersededRows(rows, superseded)
  assert.deepEqual(
    effective.map((r) => r.id),
    [1, 3],
    'row 2 was corrected (some row named it via reversedById) and must be excluded; 1 and 3 were never corrected',
  )
}

{
  // No corrections at all -- everything stays.
  const rows = [{ id: 1 }, { id: 2 }]
  const effective = excludeSupersededRows(
    rows,
    supersededIdsFromCorrections([]),
  )
  assert.deepEqual(
    effective.map((r) => r.id),
    [1, 2],
  )
}

console.log(
  '✅ supersededIdsFromCorrections / excludeSupersededRows: reversal exclusion correct',
)

// --- bucketKeyForDate -------------------------------------------------------

{
  const now = new Date('2026-08-19T12:00:00Z')

  const today = bucketKeyForDate(new Date('2026-08-19T01:00:00Z'), now)
  assert.deepEqual(today, { key: '2026-08-19', granularity: 'day' })

  const twentyNineDaysAgo = bucketKeyForDate(
    new Date('2026-07-21T12:00:00Z'),
    now,
  )
  assert.equal(
    twentyNineDaysAgo.granularity,
    'day',
    'within the 30-day window should still be a daily bucket',
  )

  const thirtyOneDaysAgo = bucketKeyForDate(
    new Date('2026-07-19T00:00:00Z'),
    now,
  )
  assert.deepEqual(thirtyOneDaysAgo, { key: '2026-07', granularity: 'month' })
}

console.log(
  '✅ bucketKeyForDate: last-30-days daily / older monthly boundary correct',
)

// --- summarizeCreatorEarnings: totals, self-attribution exclusion ----------

{
  const now = new Date('2026-08-19T12:00:00Z')
  const rows: CreatorEarningsRow[] = [
    row({
      id: 1,
      creatorShareCents: 100,
      isSelfAttribution: false,
      sourceType: 'BOT',
      sourceId: 1,
      createdAt: new Date('2026-08-18T00:00:00Z'),
    }),
    row({
      id: 2,
      creatorShareCents: 50,
      isSelfAttribution: true,
      sourceType: 'BOT',
      sourceId: 1,
      createdAt: new Date('2026-08-18T00:00:00Z'),
    }),
    row({
      id: 3,
      creatorShareCents: 30,
      isSelfAttribution: false,
      sourceType: 'CHARACTER',
      sourceId: 2,
      createdAt: new Date('2026-06-01T00:00:00Z'),
    }),
  ]

  const summary = summarizeCreatorEarnings(rows, now)

  assert.equal(
    summary.totalCents,
    130,
    'the prominent total must be non-self rows only (100 + 30), never including the 50-cent self-attributed row',
  )
  assert.equal(summary.selfAttributedTotalCents, 50)
  assert.equal(summary.interactionCount, 2)
  assert.equal(summary.selfAttributedCount, 1)

  assert.equal(summary.byObject.length, 2)
  const botGroup = summary.byObject.find((g) => g.key === 'BOT:1')!
  assert.equal(
    botGroup.totalCents,
    100,
    'the BOT object group total must exclude its own self-attributed row',
  )
  assert.equal(botGroup.selfAttributedCents, 50)
  assert.equal(
    botGroup.rows.length,
    2,
    'the raw interaction list for an object must include the self-attributed row too, just not counted into the prominent total',
  )

  const characterGroup = summary.byObject.find((g) => g.key === 'CHARACTER:2')!
  assert.equal(characterGroup.totalCents, 30)

  // byObject sorted descending by prominent total.
  assert.deepEqual(
    summary.byObject.map((g) => g.key),
    ['BOT:1', 'CHARACTER:2'],
  )

  assert.equal(
    summary.byPeriod.length,
    2,
    'one bucket for the recent daily row, one for the older monthly row',
  )
  const dailyBucket = summary.byPeriod.find((b) => b.granularity === 'day')!
  assert.equal(dailyBucket.key, '2026-08-18')
  assert.equal(dailyBucket.totalCents, 100)
  assert.equal(dailyBucket.selfAttributedCents, 50)
  const monthlyBucket = summary.byPeriod.find((b) => b.granularity === 'month')!
  assert.equal(monthlyBucket.key, '2026-06')
  assert.equal(monthlyBucket.totalCents, 30)

  // byPeriod sorted descending (most recent first).
  assert.deepEqual(
    summary.byPeriod.map((b) => b.key),
    ['2026-08-18', '2026-06'],
  )
}

console.log(
  '✅ summarizeCreatorEarnings: totals, self-attribution exclusion from prominent totals, by-object and by-period grouping all correct',
)

// --- summarizeCreatorEarnings: zero-earnings creator ------------------------

{
  const summary = summarizeCreatorEarnings([], new Date('2026-08-19T00:00:00Z'))
  assert.deepEqual(summary, {
    totalCents: 0,
    selfAttributedTotalCents: 0,
    interactionCount: 0,
    selfAttributedCount: 0,
    byObject: [],
    byPeriod: [],
  })
}

console.log(
  '✅ summarizeCreatorEarnings: a creator with no rows gets an honest all-zero summary, not an error',
)

console.log('✅ verifyCreatorEarnings: all assertions passed')
