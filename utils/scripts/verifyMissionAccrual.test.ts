// /utils/scripts/verifyMissionAccrual.test.ts
//
// Regression test for kind-economy/t-010 (the admin-only mission-share
// accrual dashboard). Exercises server/utils/missionAccrual.ts's pure
// calculation core -- no prisma, no database, no Nuxt/H3 runtime -- same
// discipline as utils/scripts/verifyCreatorEarnings.test.ts and
// utils/scripts/verifyRevenueSplit.test.ts.
//
// What this does NOT cover (documented, not silently skipped): the actual
// prisma.revenueSplit.findMany() / prisma.missionRemittance.findMany()/
// .create() calls inside getMissionAccrualData() and
// createMissionRemittance() require a real database connection and are not
// exercised here -- this sandbox has neither a live MariaDB instance nor
// Docker available to start one.
import assert from 'node:assert/strict'

import {
  summarizeMissionAccrual,
  validateMissionRemittanceInput,
  type MissionAccrualRow,
} from '../../server/utils/missionAccrual.js'
import {
  excludeSupersededRows,
  supersededIdsFromCorrections,
} from '../../server/utils/creatorEarnings.js'

function row(
  overrides: Partial<MissionAccrualRow> & { id: number },
): MissionAccrualRow {
  return {
    id: overrides.id,
    createdAt: overrides.createdAt ?? new Date('2026-08-01T00:00:00Z'),
    missionShareCents: overrides.missionShareCents ?? 0,
  }
}

// --- reversal exclusion, reusing creatorEarnings.ts's helpers directly -----
// (the task explicitly calls for reuse, not reimplementation -- this proves
// the reused helpers behave correctly for an UNSCOPED, platform-wide pool,
// not just the per-creator pool verifyCreatorEarnings.test.ts already
// covers.)

{
  const candidateRows = [
    { id: 1, reversedById: null },
    { id: 2, reversedById: null },
    { id: 3, reversedById: 1 }, // corrects row 1
  ]
  const superseded = supersededIdsFromCorrections(candidateRows)
  assert.deepEqual([...superseded].sort(), [1])

  const effective = excludeSupersededRows(candidateRows, superseded)
  assert.deepEqual(
    effective.map((r) => r.id),
    [2, 3],
    'row 1 was corrected by row 3 and must be excluded; 2 and 3 stand',
  )
}

console.log(
  '✅ mission accrual reuses supersededIdsFromCorrections/excludeSupersededRows: reversal exclusion correct',
)

// --- summarizeMissionAccrual: correct sum, by-period grouping --------------

{
  const now = new Date('2026-08-19T12:00:00Z')
  const rows: MissionAccrualRow[] = [
    row({
      id: 1,
      missionShareCents: 100,
      createdAt: new Date('2026-08-18T00:00:00Z'),
    }),
    row({
      id: 2,
      missionShareCents: 250,
      createdAt: new Date('2026-08-18T06:00:00Z'),
    }),
    row({
      id: 3,
      missionShareCents: 30,
      createdAt: new Date('2026-06-01T00:00:00Z'),
    }),
  ]

  const summary = summarizeMissionAccrual(rows, now)

  assert.equal(summary.totalCents, 380, 'total must sum every effective row')
  assert.equal(summary.count, 3)

  assert.equal(
    summary.byPeriod.length,
    2,
    'one bucket for the two recent daily rows (same day, merged), one for the older monthly row',
  )
  const dailyBucket = summary.byPeriod.find((b) => b.granularity === 'day')!
  assert.equal(dailyBucket.key, '2026-08-18')
  assert.equal(
    dailyBucket.totalCents,
    350,
    'same-day rows must merge into one bucket',
  )
  assert.equal(dailyBucket.count, 2)

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
  '✅ summarizeMissionAccrual: correct sum, by-period grouping and sort order',
)

// --- summarizeMissionAccrual: zero-rows case --------------------------------

{
  const summary = summarizeMissionAccrual([], new Date('2026-08-19T00:00:00Z'))
  assert.deepEqual(summary, { totalCents: 0, count: 0, byPeriod: [] })
}

console.log(
  '✅ summarizeMissionAccrual: zero rows gives an honest all-zero summary, not an error',
)

// --- end-to-end: exclusion feeding straight into the summarizer ------------

{
  const now = new Date('2026-08-19T12:00:00Z')
  const candidateRows = [
    {
      id: 1,
      createdAt: new Date('2026-08-18T00:00:00Z'),
      missionShareCents: 100,
      reversedById: null,
    },
    {
      id: 2,
      createdAt: new Date('2026-08-18T00:00:00Z'),
      missionShareCents: 999,
      reversedById: null,
    },
    {
      id: 3,
      createdAt: new Date('2026-08-18T01:00:00Z'),
      missionShareCents: 150,
      reversedById: 2,
    }, // corrects the bad 999-cent row 2
  ]
  const superseded = supersededIdsFromCorrections(candidateRows)
  const effective: MissionAccrualRow[] = excludeSupersededRows(
    candidateRows,
    superseded,
  ).map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    missionShareCents: r.missionShareCents,
  }))

  const summary = summarizeMissionAccrual(effective, now)
  assert.equal(
    summary.totalCents,
    250,
    'the superseded 999-cent row must never contribute -- only its 150-cent correction plus the untouched 100-cent row',
  )
  assert.equal(summary.count, 2)
}

console.log(
  '✅ end-to-end: a corrected row never inflates the accrued total, its correction counts in its place',
)

// --- validateMissionRemittanceInput -----------------------------------------

{
  const clean = validateMissionRemittanceInput({
    amountCents: 5000,
    note: '  Against Malaria Foundation direct donation, receipt #123  ',
    reference: '  RCPT-123  ',
  })
  assert.deepEqual(clean, {
    amountCents: 5000,
    note: 'Against Malaria Foundation direct donation, receipt #123',
    reference: 'RCPT-123',
  })
}

{
  const clean = validateMissionRemittanceInput({
    amountCents: 100,
    note: 'no reference given',
  })
  assert.equal(clean.reference, null)
}

for (const badAmount of [0, -100, 1.5, 'not a number', null, undefined]) {
  assert.throws(
    () =>
      validateMissionRemittanceInput({
        amountCents: badAmount,
        note: 'valid note',
      }),
    /positive integer/,
    `amountCents ${JSON.stringify(badAmount)} must be rejected`,
  )
}

for (const badNote of ['', '   ', null, undefined]) {
  assert.throws(
    () =>
      validateMissionRemittanceInput({
        amountCents: 100,
        note: badNote,
      }),
    /note is required/,
    `note ${JSON.stringify(badNote)} must be rejected`,
  )
}

console.log(
  '✅ validateMissionRemittanceInput: accepts clean input, trims/limits reference, rejects non-positive/non-integer amounts and empty notes',
)

console.log('✅ verifyMissionAccrual: all assertions passed')
