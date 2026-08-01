// /scripts/run_facet_catalog_maintenance.ts
//
// Serializes the complete production Facet catalog mutation sequence with a
// MariaDB named lock. Vercel production deployments can overlap, but canonical
// seeding, merge cleanup, taxonomy curation, and ArtJob creation must behave as
// one ordered catalog operation rather than several interleaved writers.

import 'dotenv/config'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mariadb, { type PoolConnection } from 'mariadb'
import { buildDatabaseConfig } from '../server/utils/databaseAdapterConfig'

const LOCK_NAME = 'kind-robots:facet-catalog-maintenance'
const LOCK_WAIT_SECONDS = 900
const LOCK_PING_INTERVAL_MS = 20_000
const binExtension = process.platform === 'win32' ? '.cmd' : ''
const tsxBinary = path.resolve(`node_modules/.bin/tsx${binExtension}`)
const runCanonicalSeed = process.argv.includes('--seed')
const reasonArgument = process.argv.find((argument) =>
  argument.startsWith('--reason='),
)
const seedReason =
  reasonArgument?.slice('--reason='.length) || 'unspecified policy'

type Step = {
  script: string
  args?: string[]
  label: string
}

const steps: Step[] = [
  ...(runCanonicalSeed
    ? [
        {
          script: 'utils/scripts/runFacetCatalogSeed.ts',
          args: ['--apply'],
          label: `Seeding canonical Facet catalog and Character assignments (${seedReason})`,
        },
      ]
    : []),
  {
    script: 'utils/scripts/mergeRewardFacetDuplicateLinks.ts',
    args: ['--apply'],
    label: 'Preserving Reward Facets across canonical merges',
  },
  {
    script: 'utils/scripts/mergeCanonicalFacetDuplicates.ts',
    args: ['--apply'],
    label: 'Merging legacy duplicate Facets into canonical records',
  },
  {
    script: 'utils/scripts/curateFacetCatalog.ts',
    args: ['--apply'],
    label: 'Applying durable Facet curation batches',
  },
  {
    script: 'utils/scripts/curateFacetHouseGenres.ts',
    args: ['--apply'],
    label: 'Curating art-backed house genres and related genre families',
  },
  {
    script: 'utils/scripts/curateFacetCulturalGenres.ts',
    args: ['--apply'],
    label: 'Refining cultural genre labels and distinct speculative traditions',
  },
  {
    script: 'utils/scripts/mergeFacetPersonalitySynonyms.ts',
    args: ['--apply'],
    label: 'Merging exact Personality Facet synonyms',
  },
  {
    script: 'utils/scripts/curateFacetTaxonomyLeaks.ts',
    args: ['--apply'],
    label: 'Repairing Facet taxonomy leaks and low-value random controls',
  },
  {
    script: 'utils/scripts/curateFacetGenreLeaks.ts',
    args: ['--apply'],
    label: 'Repairing subject themes and remaining genre hybrids',
  },
  {
    script: 'utils/scripts/applyFacetCatalogDirectives.ts',
    args: ['--apply'],
    label:
      'Applying final Facet catalog directives and deleting historical shells',
  },
  {
    script: 'utils/scripts/cleanupRetiredFacetShells.ts',
    args: ['--apply'],
    label: 'Migrating and deleting all retired Facet shells',
  },
  {
    script: 'utils/scripts/auditFacetCatalogOddities.ts',
    args: ['--top=60'],
    label: 'Auditing the complete Facet catalog for remaining oddities',
  },
  {
    script: 'scripts/generate_facet_art.ts',
    args: ['--write'],
    label:
      'Queueing missing primary Facet artwork after the full catalog audit',
  },
]

async function runStep(step: Step): Promise<void> {
  console.log(`[facet-maintenance] ${step.label}`)
  await new Promise<void>((resolve, reject) => {
    const child = spawn(tsxBinary, [step.script, ...(step.args ?? [])], {
      env: process.env,
      stdio: 'inherit',
    })

    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(
        new Error(
          `${step.label} exited with ${
            signal ? `signal ${signal}` : `code ${code ?? 'unknown'}`
          }`,
        ),
      )
    })
  })
}

function acquiredValue(rows: unknown): number {
  if (!Array.isArray(rows) || !rows.length) return 0
  const row = rows[0]
  if (!row || typeof row !== 'object') return 0
  const raw = (row as Record<string, unknown>).acquired
  return Number(raw)
}

async function acquireLock(connection: PoolConnection): Promise<void> {
  console.log(
    `[facet-maintenance] Acquiring database lock ${LOCK_NAME} with ${LOCK_WAIT_SECONDS}s maximum wait.`,
  )
  const rows = await connection.query('SELECT GET_LOCK(?, ?) AS acquired', [
    LOCK_NAME,
    LOCK_WAIT_SECONDS,
  ])
  if (acquiredValue(rows) !== 1) {
    throw new Error(
      `Could not acquire Facet catalog maintenance lock ${LOCK_NAME}.`,
    )
  }
  console.log(`[facet-maintenance] Acquired database lock ${LOCK_NAME}.`)
}

async function releaseLock(connection: PoolConnection): Promise<void> {
  const rows = await connection.query('SELECT RELEASE_LOCK(?) AS released', [
    LOCK_NAME,
  ])
  const first = Array.isArray(rows) ? rows[0] : undefined
  const released =
    first && typeof first === 'object'
      ? Number((first as Record<string, unknown>).released)
      : 0
  console.log(
    `[facet-maintenance] Released database lock ${LOCK_NAME}: ${released === 1 ? 'yes' : 'connection already released'}.`,
  )
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is missing')

  const config = buildDatabaseConfig(databaseUrl)
  // buildDatabaseConfig() is typed against @prisma/adapter-mariadb's own
  // nested copy of the `mariadb` package, which TS treats as structurally
  // distinct from the top-level `mariadb` import used here for raw
  // GET_LOCK/RELEASE_LOCK queries — same shape at runtime, different types.
  const pool = mariadb.createPool(
    config as unknown as Parameters<typeof mariadb.createPool>[0],
  )
  let connection: PoolConnection | undefined
  let keepAlive: NodeJS.Timeout | undefined
  let lockAcquired = false
  let lockSessionLost = false

  try {
    connection = await pool.getConnection()
    await acquireLock(connection)
    lockAcquired = true

    /*
     * The keepalive only reports; it deliberately never aborts the run. But it
     * used to keep firing every 20s against an already-dead socket for the rest
     * of a ~45 minute run, logging the same fatal error ~130 times and burying
     * the step output that actually explains the failure. Stop after the first
     * loss and record it, so teardown can skip a RELEASE_LOCK that cannot work.
     * (A dead session releases its named lock automatically, so there is nothing
     * to clean up on the server side.)
     */
    keepAlive = setInterval(() => {
      void connection?.ping().catch((error: unknown) => {
        if (lockSessionLost) return
        lockSessionLost = true
        if (keepAlive) clearInterval(keepAlive)
        console.error(
          '[facet-maintenance] Lost the database session holding the catalog lock.',
          error,
        )
        console.error(
          '[facet-maintenance] Continuing without the lock. Remaining steps still run; concurrent maintenance is no longer excluded.',
        )
      })
    }, LOCK_PING_INTERVAL_MS)

    if (!runCanonicalSeed) {
      console.log(
        `[facet-maintenance] Skipping unchanged canonical seed: ${seedReason}`,
      )
    }

    for (const step of steps) await runStep(step)
  } finally {
    if (keepAlive) clearInterval(keepAlive)
    if (connection && lockAcquired && !lockSessionLost) {
      try {
        await releaseLock(connection)
      } catch (error) {
        console.error(
          '[facet-maintenance] Failed to release named lock cleanly.',
          error,
        )
      }
    }
    /*
     * Teardown must never be able to fail the run on its own.
     *
     * These two calls used to be unguarded inside `finally`, so a throw from
     * either -- which is exactly what a connection already destroyed by
     * ER_CMD_CONNECTION_CLOSED produces -- propagated out of main() and became
     * the process's exit code. That had two bad consequences: maintenance that
     * had actually COMPLETED could still fail the production build, and the
     * teardown error REPLACED the real step error in the logs, hiding the true
     * cause. Both were live during the 2026-08-01 deploy outage.
     */
    try {
      connection?.release()
    } catch (error) {
      console.error(
        '[facet-maintenance] Ignoring connection release error during teardown.',
        error,
      )
    }
    try {
      await pool.end()
    } catch (error) {
      console.error(
        '[facet-maintenance] Ignoring pool shutdown error during teardown.',
        error,
      )
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
