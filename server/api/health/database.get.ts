// /server/api/health/database.get.ts
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { defineEventHandler, setResponseHeader } from 'h3'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import {
  compareMigrations,
  hasMigrationDrift,
  type AppliedMigrationRow,
} from '~/server/utils/migrationDrift'

function migrationsOnDisk(): string[] {
  const directory = join(process.cwd(), 'prisma', 'migrations')
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

export default defineEventHandler(async (event) => {
  const startedAt = Date.now()
  setResponseHeader(event, 'Cache-Control', 'no-store')

  try {
    await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`

    const applied = await prisma.$queryRaw<AppliedMigrationRow[]>`
      SELECT migration_name, finished_at, rolled_back_at
      FROM _prisma_migrations
    `
    const report = compareMigrations(migrationsOnDisk(), applied)

    if (hasMigrationDrift(report)) {
      event.node.res.statusCode = 503
      return {
        success: false,
        message: 'Database is reachable but the schema is not current for this build.',
        data: {
          latencyMs: Date.now() - startedAt,
          pendingMigrations: report.pending.length,
          failedMigrations: report.failed.length,
          schemaCurrent: false,
        },
        statusCode: 503,
      }
    }

    event.node.res.statusCode = 200
    return {
      success: true,
      message: 'Database is reachable and the schema is current for this build.',
      data: {
        latencyMs: Date.now() - startedAt,
        schemaCurrent: true,
        databaseAheadMigrations: report.ahead.length,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    errorHandler(error)
    event.node.res.statusCode = 503

    return {
      success: false,
      message: 'Database or migration state is unavailable.',
      data: { latencyMs: Date.now() - startedAt, schemaCurrent: false },
      statusCode: 503,
    }
  }
})
