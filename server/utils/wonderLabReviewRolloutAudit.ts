// /server/utils/wonderLabReviewRolloutAudit.ts
import prisma from '@/server/utils/prisma'

const REQUIRED_MIGRATIONS = [
  '20260719031500_reaction_first_party_author_expand',
  '20260719033500_review_draft_storage_expand',
] as const

export type WonderLabReviewRolloutCheck = {
  key: string
  label: string
  ok: boolean
  value: number | string | boolean | null
  detail: string
}

export type WonderLabReviewRolloutAudit = {
  ready: boolean
  checkedAt: string
  databaseName: string | null
  checks: WonderLabReviewRolloutCheck[]
  metrics: {
    humanComponentReviews: number
    firstPartyComponentReviews: number
    proposedDrafts: number
    approvedDrafts: number
    rejectedDrafts: number
    failedDrafts: number
    publishedDrafts: number
    supersededDrafts: number
    duplicateFirstPartyReviews: number
    unsafeFirstPartyReviews: number
    publishedDraftMismatches: number
  }
}

type DatabaseRow = { databaseName: string | null }
type CountRow = { count: bigint | number | null }
type MigrationRow = {
  migrationName: string
  applied: bigint | number | boolean
  unfinished: bigint | number
}
type ColumnRow = { columnName: string }
type TableRow = { tableName: string }
type DraftStatusRow = { status: string; count: bigint | number }

function count(value: bigint | number | null | undefined): number {
  return Number(value || 0)
}

function check(
  key: string,
  label: string,
  ok: boolean,
  value: WonderLabReviewRolloutCheck['value'],
  detail: string,
): WonderLabReviewRolloutCheck {
  return { key, label, ok, value, detail }
}

async function databaseName(): Promise<string | null> {
  const rows = await prisma.$queryRaw<DatabaseRow[]>`
    SELECT DATABASE() AS databaseName
  `
  return rows[0]?.databaseName ?? null
}

async function tableNames(database: string): Promise<Set<string>> {
  const rows = await prisma.$queryRaw<TableRow[]>`
    SELECT TABLE_NAME AS tableName
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = ${database}
      AND TABLE_NAME IN ('Reaction', 'ReviewDraft', '_prisma_migrations')
  `
  return new Set(rows.map((row) => row.tableName))
}

async function reactionAuthorColumns(database: string): Promise<Set<string>> {
  const rows = await prisma.$queryRaw<ColumnRow[]>`
    SELECT COLUMN_NAME AS columnName
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = ${database}
      AND TABLE_NAME = 'Reaction'
      AND COLUMN_NAME IN ('authorBotId', 'authorCharacterId')
  `
  return new Set(rows.map((row) => row.columnName))
}

async function migrationState(): Promise<Map<string, MigrationRow>> {
  const rows = await prisma.$queryRaw<MigrationRow[]>`
    SELECT
      migration_name AS migrationName,
      MAX(finished_at IS NOT NULL AND rolled_back_at IS NULL) AS applied,
      SUM(finished_at IS NULL AND rolled_back_at IS NULL) AS unfinished
    FROM _prisma_migrations
    WHERE migration_name IN (
      '20260719031500_reaction_first_party_author_expand',
      '20260719033500_review_draft_storage_expand'
    )
    GROUP BY migration_name
  `
  return new Map(rows.map((row) => [row.migrationName, row]))
}

async function scalarCount(sql: 'human' | 'firstParty' | 'duplicates' | 'unsafe') {
  let rows: CountRow[]
  switch (sql) {
    case 'human':
      rows = await prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*) AS count
        FROM Reaction
        WHERE reactionCategory = 'COMPONENT'
          AND authorBotId IS NULL
          AND authorCharacterId IS NULL
      `
      break
    case 'firstParty':
      rows = await prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*) AS count
        FROM Reaction
        WHERE reactionCategory = 'COMPONENT'
          AND (
            (authorBotId IS NOT NULL AND authorCharacterId IS NULL)
            OR (authorBotId IS NULL AND authorCharacterId IS NOT NULL)
          )
      `
      break
    case 'duplicates':
      rows = await prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*) AS count
        FROM (
          SELECT componentId, authorBotId, authorCharacterId
          FROM Reaction
          WHERE reactionCategory = 'COMPONENT'
            AND componentId IS NOT NULL
            AND (authorBotId IS NOT NULL OR authorCharacterId IS NOT NULL)
          GROUP BY componentId, authorBotId, authorCharacterId
          HAVING COUNT(*) > 1
        ) duplicateGroups
      `
      break
    case 'unsafe':
      rows = await prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*) AS count
        FROM Reaction r
        LEFT JOIN Bot b ON b.id = r.authorBotId
        LEFT JOIN \`Character\` c ON c.id = r.authorCharacterId
        WHERE
          (r.authorBotId IS NOT NULL AND r.authorCharacterId IS NOT NULL)
          OR (r.authorBotId IS NOT NULL AND b.id IS NULL)
          OR (r.authorCharacterId IS NOT NULL AND c.id IS NULL)
      `
      break
  }
  return count(rows[0]?.count)
}

async function draftMetrics(): Promise<{
  statuses: Map<string, number>
  mismatches: number
}> {
  const [statusRows, mismatchRows] = await Promise.all([
    prisma.$queryRaw<DraftStatusRow[]>`
      SELECT status, COUNT(*) AS count
      FROM ReviewDraft
      GROUP BY status
    `,
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*) AS count
      FROM ReviewDraft rd
      LEFT JOIN Reaction r ON r.id = rd.publishedReactionId
      WHERE rd.status = 'PUBLISHED'
        AND (
          rd.publishedReactionId IS NULL
          OR r.id IS NULL
          OR r.reactionCategory != 'COMPONENT'
          OR r.componentId != rd.componentId
          OR NOT (r.authorBotId <=> rd.authorBotId)
          OR NOT (r.authorCharacterId <=> rd.authorCharacterId)
        )
    `,
  ])

  return {
    statuses: new Map(statusRows.map((row) => [row.status, count(row.count)])),
    mismatches: count(mismatchRows[0]?.count),
  }
}

export async function auditWonderLabReviewRollout(): Promise<WonderLabReviewRolloutAudit> {
  const database = await databaseName()
  const checks: WonderLabReviewRolloutCheck[] = []
  const emptyMetrics: WonderLabReviewRolloutAudit['metrics'] = {
    humanComponentReviews: 0,
    firstPartyComponentReviews: 0,
    proposedDrafts: 0,
    approvedDrafts: 0,
    rejectedDrafts: 0,
    failedDrafts: 0,
    publishedDrafts: 0,
    supersededDrafts: 0,
    duplicateFirstPartyReviews: 0,
    unsafeFirstPartyReviews: 0,
    publishedDraftMismatches: 0,
  }

  if (!database) {
    checks.push(
      check(
        'database',
        'Active database selected',
        false,
        null,
        'No active database name was returned.',
      ),
    )
    return {
      ready: false,
      checkedAt: new Date().toISOString(),
      databaseName: null,
      checks,
      metrics: emptyMetrics,
    }
  }

  checks.push(
    check('database', 'Active database selected', true, database, database),
  )

  const tables = await tableNames(database)
  const migrationTableReady = tables.has('_prisma_migrations')
  const reactionReady = tables.has('Reaction')
  const reviewDraftReady = tables.has('ReviewDraft')
  checks.push(
    check(
      'reaction-table',
      'Reaction table available',
      reactionReady,
      reactionReady,
      reactionReady ? 'Reaction is queryable.' : 'Reaction table is missing.',
    ),
    check(
      'review-draft-table',
      'ReviewDraft table available',
      reviewDraftReady,
      reviewDraftReady,
      reviewDraftReady
        ? 'Durable editorial drafts are available.'
        : 'ReviewDraft migration has not completed.',
    ),
  )

  let migrations = new Map<string, MigrationRow>()
  if (migrationTableReady) migrations = await migrationState()
  for (const migrationName of REQUIRED_MIGRATIONS) {
    const state = migrations.get(migrationName)
    const applied = Boolean(state?.applied) && count(state?.unfinished) === 0
    checks.push(
      check(
        `migration:${migrationName}`,
        migrationName,
        applied,
        applied,
        applied
          ? 'Applied with no unfinished record.'
          : 'Missing, failed, or still unfinished.',
      ),
    )
  }

  if (reactionReady) {
    const columns = await reactionAuthorColumns(database)
    const authorColumnsReady =
      columns.has('authorBotId') && columns.has('authorCharacterId')
    checks.push(
      check(
        'reaction-author-columns',
        'Reaction author identity columns',
        authorColumnsReady,
        columns.size,
        authorColumnsReady
          ? 'Both first-party author columns are present.'
          : 'One or both first-party author columns are missing.',
      ),
    )
  }

  if (!reactionReady || !reviewDraftReady) {
    return {
      ready: false,
      checkedAt: new Date().toISOString(),
      databaseName: database,
      checks,
      metrics: emptyMetrics,
    }
  }

  const [humanReviews, firstPartyReviews, duplicates, unsafe, drafts] =
    await Promise.all([
      scalarCount('human'),
      scalarCount('firstParty'),
      scalarCount('duplicates'),
      scalarCount('unsafe'),
      draftMetrics(),
    ])

  const metrics: WonderLabReviewRolloutAudit['metrics'] = {
    humanComponentReviews: humanReviews,
    firstPartyComponentReviews: firstPartyReviews,
    proposedDrafts: drafts.statuses.get('PROPOSED') || 0,
    approvedDrafts: drafts.statuses.get('APPROVED') || 0,
    rejectedDrafts: drafts.statuses.get('REJECTED') || 0,
    failedDrafts: drafts.statuses.get('FAILED') || 0,
    publishedDrafts: drafts.statuses.get('PUBLISHED') || 0,
    supersededDrafts: drafts.statuses.get('SUPERSEDED') || 0,
    duplicateFirstPartyReviews: duplicates,
    unsafeFirstPartyReviews: unsafe,
    publishedDraftMismatches: drafts.mismatches,
  }

  checks.push(
    check(
      'duplicate-first-party-reviews',
      'Duplicate first-party review groups',
      duplicates === 0,
      duplicates,
      duplicates === 0
        ? 'No Component/reviewer pair has multiple first-party Reactions.'
        : 'Run reconciliation before publishing more reviews.',
    ),
    check(
      'unsafe-first-party-reviews',
      'Unsafe first-party author rows',
      unsafe === 0,
      unsafe,
      unsafe === 0
        ? 'No dual-author or orphan first-party Reaction rows found.'
        : 'Author identity data needs manual repair.',
    ),
    check(
      'published-draft-links',
      'Published draft/Reaction links',
      drafts.mismatches === 0,
      drafts.mismatches,
      drafts.mismatches === 0
        ? 'Every published draft points to the matching authored Component Reaction.'
        : 'Published draft links are inconsistent.',
    ),
  )

  return {
    ready: checks.every((entry) => entry.ok),
    checkedAt: new Date().toISOString(),
    databaseName: database,
    checks,
    metrics,
  }
}
