// /server/utils/migrationDrift.ts
//
// Does the database this process is talking to actually have the schema this
// build expects?
//
// CI can prove migration machinery exists, but cannot prove Alexandria actually
// ran a production migration because CI deliberately has no production database
// credential. The production answer is the migration-aware Unraid deploy path in
// scripts/deploy-unraid.sh, normally scheduled by Unraid User Scripts.
//
// This module remains framework-free so the comparison can be tested against real
// inputs without a database.

/** One row of Prisma's own `_prisma_migrations` bookkeeping table. */
export type AppliedMigrationRow = {
  migration_name: string
  finished_at?: Date | string | null
  rolled_back_at?: Date | string | null
}

export type MigrationDriftReport = {
  /** On disk in this build, not successfully applied to the database. */
  pending: string[]
  /** Recorded without any successful completion. */
  failed: string[]
  /** Applied to the database but absent from this build. */
  ahead: string[]
}

const SQUASH_MIGRATION = '00000000000000_squashed'

function isApplied(row: AppliedMigrationRow): boolean {
  const finished = row.finished_at
  const rolledBack = row.rolled_back_at
  if (finished === null || finished === undefined) return false
  if (rolledBack !== null && rolledBack !== undefined) return false
  return true
}

export function compareMigrations(
  onDisk: readonly string[],
  applied: readonly AppliedMigrationRow[],
): MigrationDriftReport {
  const appliedNames = new Set<string>()
  const failedAttemptNames = new Set<string>()

  for (const row of applied) {
    const name = (row?.migration_name || '').trim()
    if (!name) continue
    if (isApplied(row)) {
      appliedNames.add(name)
    } else {
      failedAttemptNames.add(name)
    }
  }

  const failed = [...failedAttemptNames]
    .filter((name) => !appliedNames.has(name))
    .sort()

  const diskNames = onDisk.map((name) => name.trim()).filter(Boolean)
  const diskSet = new Set(diskNames)

  let ahead = [...appliedNames].filter((name) => !diskSet.has(name))

  if (diskSet.has(SQUASH_MIGRATION) && appliedNames.has(SQUASH_MIGRATION)) {
    const firstPostSquash = diskNames
      .filter((name) => name !== SQUASH_MIGRATION)
      .sort()[0]

    if (firstPostSquash) {
      ahead = ahead.filter((name) => name >= firstPostSquash)
    }
  }

  return {
    pending: diskNames.filter((name) => !appliedNames.has(name)).sort(),
    failed,
    ahead: ahead.sort(),
  }
}

export function hasMigrationDrift(report: MigrationDriftReport): boolean {
  return report.pending.length > 0 || report.failed.length > 0
}

export function describeMigrationDrift(report: MigrationDriftReport): string {
  const parts: string[] = []

  if (report.pending.length) {
    parts.push(
      `${report.pending.length} migration(s) in this build have NOT been ` +
        `applied to the database: ${report.pending.join(', ')}. Queries ` +
        'touching their columns will fail at runtime.',
    )
  }

  if (report.failed.length) {
    parts.push(
      `${report.failed.length} migration(s) are recorded without any ` +
        `successful completion: ${report.failed.join(', ')}.`,
    )
  }

  if (report.ahead.length) {
    parts.push(
      `The database has ${report.ahead.length} migration(s) this build does ` +
        `not carry: ${report.ahead.join(', ')} -- it is running older code ` +
        'than the schema.',
    )
  }

  parts.push(
    'On Alexandria run: cd /mnt/user/appdata/kind_robots && ' +
      'bash scripts/deploy-unraid.sh. That guarded path runs ' +
      'scripts/prisma-migrate-deploy.mjs before replacing the container; see ' +
      'docs/runbooks/migration-credential-boundary.md and ' +
      'docs/runbooks/unraid-auto-deploy.md.',
  )

  return parts.join(' ')
}
