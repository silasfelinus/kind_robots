// /server/utils/creatorEarnings.ts
//
// kind-economy/t-009: read-only creator earnings view. Turns a creator's
// RevenueSplit rows (t-008's immutable ledger) into a total, a by-object
// breakdown, a by-period breakdown, and the raw interactions behind them.
// No payout action lives here or anywhere else -- t-014 (design the payout
// mechanism) and t-015 (GATE: enable real creator payouts) are both still
// open, so there is nothing to withdraw yet. See ../api/economy/creator-
// earnings.get.ts for the one route that calls the database-touching half
// of this file.
//
// SELF-ATTRIBUTION (judgment call, kind-economy/t-021 still undecided):
// isSelfAttribution rows are real ledger rows and are included in `rows`
// and in each object's `rows` list, always labeled, but they are NEVER
// folded into any of the "prominent" totals (summary.totalCents, a period
// bucket's totalCents, or an object group's totalCents) -- those are the
// numbers a page puts in large type, and this task's instruction is to
// pick the conservative reading until t-021 settles the policy. Every
// self-attributed cent is still visible and still summed, just in the
// separate selfAttributedTotalCents/selfAttributedCents fields, so nothing
// is hidden -- it is just not implied to be definitely-payable yet.
//
// REVERSAL EXCLUSION: RevenueSplit rows are immutable (see the model doc in
// prisma/schema.prisma) -- a correction is a NEW row whose OWN reversedById
// points at the id of the row it corrects. There was no prior application
// code anywhere in this repo that reads reversedById (grepped clean at the
// time this was written -- t-008 only added the column), so this is the
// first concrete implementation of the exclusion, not a mirror of an
// existing one: a row is "effective" (counted) unless some OTHER row's
// reversedById names it, in which case the correction row supersedes it and
// is counted in its place. That lookup is intentionally NOT scoped to one
// creator -- a correction could in principle reassign creatorUserId to
// someone else -- so supersededIdsFromCorrections must be computed against
// every row that names one of the candidate ids, not just this creator's
// own rows.
import prisma from './prisma'
import type { ManaAttributionSource } from '~/prisma/generated/prisma/client'

// ---------------------------------------------------------------------------
// Pure types + logic -- no prisma, no database, unit-testable in isolation
// (see utils/scripts/verifyCreatorEarnings.test.ts), same discipline as
// server/utils/revenueSplit.ts and server/utils/manaAttribution.ts.
// ---------------------------------------------------------------------------

export type CreatorEarningsRow = {
  id: number
  createdAt: Date
  creatorShareCents: number
  isSelfAttribution: boolean
  sourceType: string | null
  sourceId: number | null
}

export type CreatorEarningsObjectGroup = {
  key: string
  sourceType: string | null
  sourceId: number | null
  totalCents: number
  selfAttributedCents: number
  count: number
  rows: CreatorEarningsRow[]
}

export type CreatorEarningsPeriodBucket = {
  key: string
  granularity: 'day' | 'month'
  totalCents: number
  selfAttributedCents: number
  count: number
}

export type CreatorEarningsSummary = {
  totalCents: number
  selfAttributedTotalCents: number
  interactionCount: number
  selfAttributedCount: number
  byObject: CreatorEarningsObjectGroup[]
  byPeriod: CreatorEarningsPeriodBucket[]
}

/**
 * Given the ids that some OTHER row's reversedById names, return the set of
 * ids that are therefore superseded (a correction exists for them). Not
 * scoped to any one creator -- pass every row in the relevant candidate
 * pool's correction lookup, not just one creator's own rows.
 */
export function supersededIdsFromCorrections(
  corrections: Array<{ reversedById: number | null }>,
): Set<number> {
  const ids = new Set<number>()
  for (const correction of corrections) {
    if (correction.reversedById != null) ids.add(correction.reversedById)
  }
  return ids
}

/** Drop any row whose id has been superseded by a later correction row. */
export function excludeSupersededRows<T extends { id: number }>(
  rows: T[],
  supersededIds: ReadonlySet<number>,
): T[] {
  return rows.filter((row) => !supersededIds.has(row.id))
}

const DAY_MS = 24 * 60 * 60 * 1000
const RECENT_WINDOW_DAYS = 30

/**
 * PERIOD BUCKETING POLICY (documented judgment call -- no prior convention
 * existed in this codebase to mirror; the other "stats" routes here bucket
 * by a pre-stored year/month column, not a derived timestamp window). Daily
 * buckets for the last 30 days, monthly buckets before that -- recent
 * activity is where a creator wants day-level resolution, older activity
 * only needs a coarser rollup.
 */
export function bucketKeyForDate(
  date: Date,
  now: Date,
): { key: string; granularity: 'day' | 'month' } {
  const cutoff = new Date(now.getTime() - RECENT_WINDOW_DAYS * DAY_MS)
  if (date.getTime() >= cutoff.getTime()) {
    return { key: date.toISOString().slice(0, 10), granularity: 'day' }
  }
  return { key: date.toISOString().slice(0, 7), granularity: 'month' }
}

function objectGroupKey(
  sourceType: string | null,
  sourceId: number | null,
): string {
  return `${sourceType ?? 'UNKNOWN'}:${sourceId ?? 'none'}`
}

/**
 * Pure summarizer: takes the already-effective (reversal-excluded) rows for
 * one creator and produces the total/by-object/by-period shape a page
 * renders. `now` is injectable so the 30-day window is deterministic under
 * test.
 */
export function summarizeCreatorEarnings(
  rows: CreatorEarningsRow[],
  now: Date = new Date(),
): CreatorEarningsSummary {
  const sorted = [...rows].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  )

  let totalCents = 0
  let selfAttributedTotalCents = 0
  let interactionCount = 0
  let selfAttributedCount = 0

  const objectMap = new Map<string, CreatorEarningsObjectGroup>()
  const periodMap = new Map<string, CreatorEarningsPeriodBucket>()

  for (const row of sorted) {
    const objKey = objectGroupKey(row.sourceType, row.sourceId)
    let objGroup = objectMap.get(objKey)
    if (!objGroup) {
      objGroup = {
        key: objKey,
        sourceType: row.sourceType,
        sourceId: row.sourceId,
        totalCents: 0,
        selfAttributedCents: 0,
        count: 0,
        rows: [],
      }
      objectMap.set(objKey, objGroup)
    }
    objGroup.rows.push(row)

    const { key: periodKey, granularity } = bucketKeyForDate(row.createdAt, now)
    let periodGroup = periodMap.get(periodKey)
    if (!periodGroup) {
      periodGroup = {
        key: periodKey,
        granularity,
        totalCents: 0,
        selfAttributedCents: 0,
        count: 0,
      }
      periodMap.set(periodKey, periodGroup)
    }

    if (row.isSelfAttribution) {
      selfAttributedTotalCents += row.creatorShareCents
      selfAttributedCount += 1
      objGroup.selfAttributedCents += row.creatorShareCents
      periodGroup.selfAttributedCents += row.creatorShareCents
    } else {
      totalCents += row.creatorShareCents
      interactionCount += 1
      objGroup.totalCents += row.creatorShareCents
      objGroup.count += 1
      periodGroup.totalCents += row.creatorShareCents
      periodGroup.count += 1
    }
  }

  const byObject = [...objectMap.values()].sort(
    (a, b) => b.totalCents - a.totalCents,
  )
  const byPeriod = [...periodMap.values()].sort((a, b) =>
    a.key < b.key ? 1 : a.key > b.key ? -1 : 0,
  )

  return {
    totalCents,
    selfAttributedTotalCents,
    interactionCount,
    selfAttributedCount,
    byObject,
    byPeriod,
  }
}

// ---------------------------------------------------------------------------
// Database-touching half. Not covered by the pure unit test (no live
// database in the verification sandbox) -- see the PR description for what
// was and was not exercised.
// ---------------------------------------------------------------------------

export type CreatorEarningsObjectGroupWithTitle = CreatorEarningsObjectGroup & {
  title: string
}

export type CreatorEarningsData = {
  summary: Omit<CreatorEarningsSummary, 'byObject'> & {
    byObject: CreatorEarningsObjectGroupWithTitle[]
  }
  rows: CreatorEarningsRow[]
}

// One title lookup per ManaAttributionSource value, mirroring the shape of
// manaAttribution.ts's OWNER_LOOKUP but resolving a display title instead of
// an owning user id. Kept here rather than added to manaAttribution.ts since
// that module's contract is specifically "resolve the owner", not "resolve a
// title" -- a second concern, not a special case of the first.
const TITLE_LOOKUP: Record<
  ManaAttributionSource,
  (id: number) => Promise<string | null>
> = {
  BOT: async (id) =>
    (await prisma.bot.findUnique({ where: { id }, select: { name: true } }))
      ?.name ?? null,
  CHARACTER: async (id) =>
    (
      await prisma.character.findUnique({
        where: { id },
        select: { name: true },
      })
    )?.name ?? null,
  FACET: async (id) =>
    (
      await prisma.facet.findUnique({
        where: { id },
        select: { title: true },
      })
    )?.title ?? null,
  SCENARIO: async (id) =>
    (
      await prisma.scenario.findUnique({
        where: { id },
        select: { title: true },
      })
    )?.title ?? null,
  PITCH: async (id) =>
    (
      await prisma.pitchSheet.findUnique({
        where: { id },
        select: { title: true },
      })
    )?.title ?? null,
  ART: async (id) => {
    const row = await prisma.artImage.findUnique({
      where: { id },
      select: { fileName: true, promptString: true },
    })
    if (!row) return null
    if (row.fileName) return row.fileName
    if (row.promptString) return row.promptString.slice(0, 60)
    return null
  },
  PACK: async (id) =>
    (await prisma.pack.findUnique({ where: { id }, select: { title: true } }))
      ?.title ?? null,
  REWARD: async (id) =>
    (await prisma.reward.findUnique({ where: { id }, select: { name: true } }))
      ?.name ?? null,
  DREAM: async (id) =>
    (await prisma.dream.findUnique({ where: { id }, select: { title: true } }))
      ?.title ?? null,
}

/**
 * Resolve a human-readable title for a (sourceType, sourceId) pair. Never
 * throws -- a lookup failure or a deleted object degrades to a labeled
 * fallback string, same "enrich, never gate" discipline as
 * resolveManaAttribution in manaAttribution.ts.
 */
export async function resolveObjectTitle(
  sourceType: string | null,
  sourceId: number | null,
): Promise<string> {
  if (!sourceType || sourceId == null) return 'Unknown source'

  const lookup = TITLE_LOOKUP[sourceType as ManaAttributionSource]
  if (!lookup) return `${sourceType} #${sourceId}`

  try {
    const title = await lookup(sourceId)
    return title || `${sourceType} #${sourceId} (deleted)`
  } catch (error) {
    console.warn(
      '[creatorEarnings] failed to resolve object title',
      sourceType,
      sourceId,
      error,
    )
    return `${sourceType} #${sourceId}`
  }
}

/**
 * The one entry point server/api/economy/creator-earnings.get.ts calls.
 * Fetches this creator's RevenueSplit rows, excludes any that a later
 * correction has superseded, summarizes them, and resolves a display title
 * for every distinct object. A creator with no rows gets an honest,
 * all-zero summary and empty arrays -- never an error.
 */
export async function getCreatorEarnings(
  creatorUserId: number,
  now: Date = new Date(),
): Promise<CreatorEarningsData> {
  const candidateRows = await prisma.revenueSplit.findMany({
    where: { creatorUserId },
    select: {
      id: true,
      createdAt: true,
      creatorShareCents: true,
      isSelfAttribution: true,
      reversedById: true,
      ManaTransaction: { select: { sourceType: true, sourceId: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (candidateRows.length === 0) {
    const emptySummary = summarizeCreatorEarnings([], now)
    return { summary: { ...emptySummary, byObject: [] }, rows: [] }
  }

  // Deliberately unscoped by creatorUserId -- see the file-level comment on
  // why a correction naming one of these ids could in principle belong to
  // anyone.
  const corrections = await prisma.revenueSplit.findMany({
    where: { reversedById: { in: candidateRows.map((row) => row.id) } },
    select: { reversedById: true },
  })
  const supersededIds = supersededIdsFromCorrections(corrections)

  const effectiveRows: CreatorEarningsRow[] = excludeSupersededRows(
    candidateRows,
    supersededIds,
  ).map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    creatorShareCents: row.creatorShareCents,
    isSelfAttribution: row.isSelfAttribution,
    sourceType: row.ManaTransaction?.sourceType ?? null,
    sourceId: row.ManaTransaction?.sourceId ?? null,
  }))

  const summary = summarizeCreatorEarnings(effectiveRows, now)

  const byObjectWithTitles = await Promise.all(
    summary.byObject.map(async (group) => ({
      ...group,
      title: await resolveObjectTitle(group.sourceType, group.sourceId),
    })),
  )

  return {
    summary: { ...summary, byObject: byObjectWithTitles },
    rows: effectiveRows,
  }
}
