// /server/utils/missionAccrual.ts
//
// kind-economy/t-010: admin-only mission-share accrual dashboard. Mirrors
// server/utils/creatorEarnings.ts's split of pure logic vs. DB access, and
// reuses that file's supersededIdsFromCorrections/excludeSupersededRows
// reversal-exclusion helpers directly rather than reimplementing them --
// they are not scoped to one creator and work identically here, since
// mission-share accrual is a platform-wide sum, not a per-user one. See
// ../api/economy/mission-accrual.get.ts and .post.ts for the two routes
// that call the database-touching half of this file.
//
// SCOPE (explicitly out of this task): this file computes what the
// PLATFORM has accrued as mission share (RevenueSplit.missionShareCents)
// and logs what Silas has manually REMITTED to the fundraiser -- it does
// not move money, does not touch Stripe, and does not integrate with
// againstmalaria.com. The ~$840 raised there to date never touched this
// app's books at all and is intentionally NOT part of any total computed
// here -- see the frontend page for where that figure is surfaced,
// clearly separated, as a static/config value.
//
// REMITTANCE LEDGER (judgment call -- not explicitly speced in the task
// note, added because "how much has been remitted" and "outstanding
// balance owed" are uncomputable without one, and grepping this repo
// turned up no prior mechanism anywhere for recording that a remittance
// happened): MissionRemittance rows are a manual, append-only log of real
// money Silas already sent OUTSIDE this app. They are never edited or
// deleted -- correcting a bad entry means logging a new row, same
// append-only discipline as RevenueSplit and ManaTransaction, just with no
// reversedById pointer, since there is no "wrong" remittance to supersede,
// only a ledger of what actually left the door.
import prisma from './prisma'
import {
  bucketKeyForDate,
  excludeSupersededRows,
  supersededIdsFromCorrections,
} from './creatorEarnings'

// ---------------------------------------------------------------------------
// Pure types + logic -- no prisma, no database, unit-testable in isolation
// (see utils/scripts/verifyMissionAccrual.test.ts), same discipline as
// server/utils/creatorEarnings.ts and server/utils/revenueSplit.ts.
// ---------------------------------------------------------------------------

export type MissionAccrualRow = {
  id: number
  createdAt: Date
  missionShareCents: number
}

export type MissionAccrualPeriodBucket = {
  key: string
  granularity: 'day' | 'month'
  totalCents: number
  count: number
}

export type MissionAccrualSummary = {
  totalCents: number
  count: number
  byPeriod: MissionAccrualPeriodBucket[]
}

/**
 * Pure summarizer: takes the already-effective (reversal-excluded)
 * RevenueSplit rows for the WHOLE platform and produces the total/by-period
 * shape the admin dashboard renders. `now` is injectable so the 30-day
 * daily/monthly bucketing boundary (bucketKeyForDate, reused from
 * creatorEarnings.ts) is deterministic under test.
 */
export function summarizeMissionAccrual(
  rows: MissionAccrualRow[],
  now: Date = new Date(),
): MissionAccrualSummary {
  let totalCents = 0
  let count = 0

  const periodMap = new Map<string, MissionAccrualPeriodBucket>()

  for (const row of rows) {
    totalCents += row.missionShareCents
    count += 1

    const { key, granularity } = bucketKeyForDate(row.createdAt, now)
    let bucket = periodMap.get(key)
    if (!bucket) {
      bucket = { key, granularity, totalCents: 0, count: 0 }
      periodMap.set(key, bucket)
    }
    bucket.totalCents += row.missionShareCents
    bucket.count += 1
  }

  const byPeriod = [...periodMap.values()].sort((a, b) =>
    a.key < b.key ? 1 : a.key > b.key ? -1 : 0,
  )

  return { totalCents, count, byPeriod }
}

// ---------------------------------------------------------------------------
// Reconciliation check -- pure, unit-testable (kind-economy/t-016)
//
// Because every remittance is meant to bring the running outstanding
// balance back to exactly zero (there is no per-period bucketing on
// MissionRemittance rows -- see the runbook at
// conductor/projects/kind-economy/docs/mission-remittance-runbook.md), the
// two failure modes the task asks for collapse onto the sign of
// outstandingCents immediately after a remittance is logged:
//   outstanding == 0  -> reconciled: this remittance covered exactly what
//                        had accrued, no more, no less.
//   outstanding  > 0  -> under-remitted: the remittance was smaller than
//                        what had accrued -- the "a third of what you pay
//                        buys nets" promise is broken for the shortfall.
//   outstanding  < 0  -> over-remitted: the remittance exceeded what had
//                        accrued -- most likely a duplicate/double
//                        remittance for a period already covered, or a
//                        typo'd amount. The money is gone twice from
//                        Silas's perspective even though the ledger still
//                        balances honestly (it just balances negative).
// ---------------------------------------------------------------------------

export type MissionRemittanceReconciliation =
  | { status: 'reconciled' }
  | { status: 'under-remitted'; shortfallCents: number }
  | { status: 'over-remitted'; overageCents: number }

export function checkMissionRemittanceReconciliation(
  outstandingCents: number,
): MissionRemittanceReconciliation {
  if (outstandingCents === 0) return { status: 'reconciled' }
  if (outstandingCents > 0) {
    return { status: 'under-remitted', shortfallCents: outstandingCents }
  }
  return { status: 'over-remitted', overageCents: -outstandingCents }
}

// ---------------------------------------------------------------------------
// Remittance validation -- pure, unit-testable
// ---------------------------------------------------------------------------

export type MissionRemittanceInput = {
  amountCents: number
  note: string
  reference: string | null
}

const MAX_NOTE_LENGTH = 2000
const MAX_REFERENCE_LENGTH = 255

/**
 * Validate a proposed remittance-log entry. Throws a plain Error (the POST
 * route turns that into a 400) rather than returning a result object --
 * matches this repo's other simple-body-validation routes (e.g.
 * server/api/users/[id]/restrict.post.ts's createError-on-bad-input shape,
 * just deferred one layer so this stays DB-free and unit-testable).
 */
export function validateMissionRemittanceInput(input: {
  amountCents: unknown
  note: unknown
  reference?: unknown
}): MissionRemittanceInput {
  const amountCents = Number(input.amountCents)
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error('amountCents must be a positive integer number of cents.')
  }

  const note = typeof input.note === 'string' ? input.note.trim() : ''
  if (!note) {
    throw new Error('note is required.')
  }

  const referenceRaw = input.reference
  const reference =
    typeof referenceRaw === 'string' && referenceRaw.trim()
      ? referenceRaw.trim().slice(0, MAX_REFERENCE_LENGTH)
      : null

  return {
    amountCents,
    note: note.slice(0, MAX_NOTE_LENGTH),
    reference,
  }
}

// ---------------------------------------------------------------------------
// Database-touching half. Not covered by the pure unit test (no live
// database in the verification sandbox) -- see the PR description for what
// was and was not exercised.
// ---------------------------------------------------------------------------

export type MissionRemittanceRow = {
  id: number
  createdAt: Date
  amountCents: number
  remittedById: number
  remittedByUsername: string | null
  note: string
  reference: string | null
}

export type MissionAccrualData = {
  accrual: MissionAccrualSummary
  remittances: MissionRemittanceRow[]
  remittedTotalCents: number
  outstandingCents: number
  reconciliation: MissionRemittanceReconciliation
}

/**
 * The one entry point server/api/economy/mission-accrual.get.ts calls.
 * Fetches every RevenueSplit row platform-wide, excludes any a later
 * correction has superseded, sums mission-share cents, and pairs that with
 * the remittance ledger to compute outstanding = accrued - remitted.
 *
 * Unlike getCreatorEarnings, there is no "candidate rows for one user" +
 * "unscoped corrections lookup" split -- accrual here is ALREADY
 * platform-wide, so a single query supplies both the rows to sum and the
 * pool corrections are looked up against.
 */
export async function getMissionAccrualData(
  now: Date = new Date(),
): Promise<MissionAccrualData> {
  const allRows = await prisma.revenueSplit.findMany({
    select: {
      id: true,
      createdAt: true,
      missionShareCents: true,
      reversedById: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const supersededIds = supersededIdsFromCorrections(allRows)
  const effectiveRows: MissionAccrualRow[] = excludeSupersededRows(
    allRows,
    supersededIds,
  ).map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    missionShareCents: row.missionShareCents,
  }))

  const accrual = summarizeMissionAccrual(effectiveRows, now)

  const remittanceRows = await prisma.missionRemittance.findMany({
    select: {
      id: true,
      createdAt: true,
      amountCents: true,
      remittedById: true,
      note: true,
      reference: true,
      RemittedBy: { select: { username: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const remittances: MissionRemittanceRow[] = remittanceRows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    amountCents: row.amountCents,
    remittedById: row.remittedById,
    remittedByUsername: row.RemittedBy?.username ?? null,
    note: row.note,
    reference: row.reference,
  }))

  const remittedTotalCents = remittances.reduce(
    (sum, row) => sum + row.amountCents,
    0,
  )
  const outstandingCents = accrual.totalCents - remittedTotalCents

  return {
    accrual,
    remittances,
    remittedTotalCents,
    outstandingCents,
    reconciliation: checkMissionRemittanceReconciliation(outstandingCents),
  }
}

/**
 * The one entry point server/api/economy/mission-accrual.post.ts calls.
 * Validates and writes a single append-only MissionRemittance row recording
 * that `remittedById` (the calling admin) already sent real money to the
 * fundraiser outside this app. Never edits or deletes an existing row.
 */
export async function createMissionRemittance(
  input: { amountCents: unknown; note: unknown; reference?: unknown },
  remittedById: number,
): Promise<MissionRemittanceRow> {
  const clean = validateMissionRemittanceInput(input)

  const row = await prisma.missionRemittance.create({
    data: {
      amountCents: clean.amountCents,
      note: clean.note,
      reference: clean.reference,
      remittedById,
    },
    select: {
      id: true,
      createdAt: true,
      amountCents: true,
      remittedById: true,
      note: true,
      reference: true,
      RemittedBy: { select: { username: true } },
    },
  })

  return {
    id: row.id,
    createdAt: row.createdAt,
    amountCents: row.amountCents,
    remittedById: row.remittedById,
    remittedByUsername: row.RemittedBy?.username ?? null,
    note: row.note,
    reference: row.reference,
  }
}
