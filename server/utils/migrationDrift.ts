// /server/utils/migrationDrift.ts
//
// Does the database this process is talking to actually have the schema this
// build expects?
//
// Nothing in CI can answer that. Every migration check in .github/workflows is
// structural -- verifyMigrateOnDeploy.ts asserts the runtime image carries
// prisma/ and scripts/ and that compose's one-shot service runs the wrapper;
// verifyMigrationCredentialBoundary.mjs asserts the elevated credential stays
// out of the app lane. None of them connect to a production database, by
// design: CI has no credential for one. They prove the machinery for migrating
// is intact, never that a migration was run.
//
// On Alexandria that gap is not theoretical. docker-compose.yml gates the app
// behind a `migrate` service (`condition: service_completed_successfully`), but
// docs/runbooks/migration-credential-boundary.md is explicit that the gate
// "only fires on `docker compose up`, which is not how this host deploys" --
// there it is pull + Force Update, with the migration as a separate manual
// step. Code and schema therefore ship independently, and doing only the first
// is silent until a query touches a column that isn't there.
//
// 2026-08-19: PR #1956 added `User.tokens`, `User.earnedTokens` and
// `ManaTransaction.resource` (migration 20260819120000_split_mana_tokens_resource,
// merged 01:11). The container was updated; the migration was not run. First
// symptom was a raw Prisma error in a user-facing response:
//
//   The column `User.tokens` does not exist in the current database.
//
// This module turns that into one line at boot naming the pending migration.
// It is framework-free (no Prisma import, no Nitro, no fs) so the comparison
// can be tested against real inputs without a database.

/** One row of Prisma's own `_prisma_migrations` bookkeeping table. */
export type AppliedMigrationRow = {
  migration_name: string
  // Set when the migration ran to completion. Null means it started and did
  // not finish -- Prisma leaves the row behind as the record of that.
  finished_at?: Date | string | null
  rolled_back_at?: Date | string | null
}

export type MigrationDriftReport = {
  /**
   * On disk in this build, not successfully applied to the database. This is
   * the dangerous direction: the code expects columns the database lacks.
   */
  pending: string[]
  /**
   * Recorded in `_prisma_migrations` but never finished, or rolled back. A
   * subset of the same problem with a different remedy -- see
   * scripts/repair-known-prisma-migrations.mjs, which the deploy wrapper runs.
   */
  failed: string[]
  /**
   * Applied to the database but absent from this build. Harmless to queries
   * (the columns exist, this code just doesn't use them) but it means the
   * running image is older than the schema -- worth knowing during a rollback.
   */
  ahead: string[]
}

function isApplied(row: AppliedMigrationRow): boolean {
  const finished = row.finished_at
  const rolledBack = row.rolled_back_at
  if (finished === null || finished === undefined) return false
  if (rolledBack !== null && rolledBack !== undefined) return false
  return true
}

/**
 * Compare the migrations this build carries against what the database records.
 *
 * `onDisk` is the directory names under prisma/migrations, which sort
 * chronologically by their timestamp prefix; the report preserves that order so
 * the first pending entry is the oldest thing missing.
 */
export function compareMigrations(
  onDisk: readonly string[],
  applied: readonly AppliedMigrationRow[],
): MigrationDriftReport {
  const appliedNames = new Set<string>()
  const failed: string[] = []

  for (const row of applied) {
    const name = (row?.migration_name || '').trim()
    if (!name) continue
    if (isApplied(row)) {
      appliedNames.add(name)
    } else if (!failed.includes(name)) {
      failed.push(name)
    }
  }

  const diskNames = onDisk.map((name) => name.trim()).filter(Boolean)
  const diskSet = new Set(diskNames)

  return {
    pending: diskNames.filter((name) => !appliedNames.has(name)).sort(),
    failed: failed.sort(),
    ahead: [...appliedNames].filter((name) => !diskSet.has(name)).sort(),
  }
}

export function hasMigrationDrift(report: MigrationDriftReport): boolean {
  return report.pending.length > 0 || report.failed.length > 0
}

/**
 * The boot log line. Written here rather than in the plugin so its wording is
 * covered by the same test as the comparison -- a check nobody can act on is
 * the failure mode this whole module exists to prevent, and "drift detected"
 * with no migration name and no command is exactly that.
 */
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
      `${report.failed.length} migration(s) are recorded as started but not ` +
        `finished (or were rolled back): ${report.failed.join(', ')}.`,
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
    'Apply with: docker run --rm --network cafepurr --env-file <app .env> ' +
      "-e MIGRATION_DATABASE_URL='<kindrobot_migrate URL>' " +
      '<the image you are serving> node scripts/prisma-migrate-deploy.mjs ' +
      '(see docs/runbooks/migration-credential-boundary.md).',
  )

  return parts.join(' ')
}
