// /server/plugins/01-migration-drift-check.ts
//
// Say at boot whether this build's migrations are actually in the database.
// See server/utils/migrationDrift.ts for why CI cannot answer this and why the
// Alexandria deploy path makes it a live hazard rather than a hypothetical.
//
// WARNS, NEVER BLOCKS. Refusing to serve on pending migrations would convert a
// partial outage (the routes touching new columns) into a total one, and would
// do it during exactly the window where someone is mid-deploy and least wants
// the site to disappear. Every failure path here -- no prisma/ directory, no
// `_prisma_migrations` table on a fresh database, a database that is simply
// down -- is swallowed after a note. A diagnostic that can take the site down
// is worse than the error it diagnoses.
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import prisma from '../utils/prisma'
import {
  compareMigrations,
  describeMigrationDrift,
  hasMigrationDrift,
  type AppliedMigrationRow,
} from '../utils/migrationDrift'

// The runtime image carries prisma/ at /app -- utils/scripts/verifyMigrateOnDeploy.ts
// is the contract that keeps it there, since an image-slimming pass would
// otherwise drop it and silently disable both this check and migrate-on-deploy.
function migrationsOnDisk(): string[] {
  const directory = join(process.cwd(), 'prisma', 'migrations')
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

async function appliedMigrations(): Promise<AppliedMigrationRow[]> {
  // A plain read of Prisma's own bookkeeping table. This stays in the ordinary
  // application lane on purpose: it needs to know what was migrated, never to
  // migrate anything, so it must not want the elevated credential that
  // docs/runbooks/migration-credential-boundary.md keeps out of this process.
  return prisma.$queryRaw<AppliedMigrationRow[]>`
    SELECT migration_name, finished_at, rolled_back_at
    FROM _prisma_migrations
  `
}

export default defineNitroPlugin(() => {
  // Detached from boot: nothing downstream waits on this, and a slow or
  // unreachable database must delay serving no more than it already does.
  void (async () => {
    let onDisk: string[]
    try {
      onDisk = migrationsOnDisk()
    } catch (error) {
      console.warn(
        '[migration-drift] could not read prisma/migrations; skipping the ' +
          'check. The runtime image is supposed to carry it -- see ' +
          'utils/scripts/verifyMigrateOnDeploy.ts.',
        error,
      )
      return
    }

    if (!onDisk.length) return

    let applied: AppliedMigrationRow[]
    try {
      applied = await appliedMigrations()
    } catch (error) {
      // A fresh database has no _prisma_migrations table yet, and a database
      // that is down is already being reported by everything else. Neither is
      // this check's business to escalate.
      console.warn(
        '[migration-drift] could not read _prisma_migrations; skipping the ' +
          'check (fresh database, or the database is unreachable).',
        error,
      )
      return
    }

    const report = compareMigrations(onDisk, applied)

    if (hasMigrationDrift(report)) {
      console.error('[migration-drift]', describeMigrationDrift(report))
      return
    }

    if (report.ahead.length) {
      console.warn('[migration-drift]', describeMigrationDrift(report))
    }
  })()
})
