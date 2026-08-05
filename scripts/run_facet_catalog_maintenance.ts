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
import {
  createFacetMaintenanceLockGuard,
  facetMaintenanceAbortReason,
  lockOwnerMatchesConnection,
  runSerializedFacetMaintenanceSteps,
  throwIfFacetMaintenanceAborted,
} from './facetCatalogMaintenanceRuntime'

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

async function runStep(step: Step, abortSignal: AbortSignal): Promise<void> {
  throwIfFacetMaintenanceAborted(abortSignal)
  console.log(`[facet-maintenance] ${step.label}`)

  await new Promise<void>((resolve, reject) => {
    let settled = false
    const finish = (callback: () => void) => {
      if (settled) return
      settled = true
      callback()
    }

    const child = spawn(tsxBinary, [step.script, ...(step.args ?? [])], {
      env: process.env,
      stdio: 'inherit',
      signal: abortSignal,
    })

    child.once('error', (error) => {
      finish(() =>
        reject(
          abortSignal.aborted
            ? facetMaintenanceAbortReason(abortSignal)
            : error,
        ),
      )
    })
    child.once('exit', (code, exitSignal) => {
      finish(() => {
        if (abortSignal.aborted) {
          reject(facetMaintenanceAbortReason(abortSignal))
          return
        }
        if (code === 0) {
          resolve()
          return
        }
        reject(
          new Error(
            `${step.label} exited with ${
              exitSignal
                ? `signal ${exitSignal}`
                : `code ${code ?? 'unknown'}`
            }`,
          ),
        )
      })
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

async function verifyLockOwnership(
  connection: PoolConnection,
): Promise<boolean> {
  const rows = await connection.query(
    'SELECT CONNECTION_ID() AS connectionId, IS_USED_LOCK(?) AS ownerId',
    [LOCK_NAME],
  )
  return lockOwnerMatchesConnection(rows)
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
  const lockGuard = createFacetMaintenanceLockGuard()
  let connection: PoolConnection | undefined
  let keepAlive: NodeJS.Timeout | undefined
  let keepAliveCheckInFlight = false
  let lockAcquired = false

  try {
    connection = await pool.getConnection()
    const lockConnection = connection
    await acquireLock(lockConnection)
    lockAcquired = true

    const reportLockLoss = (error: unknown) => {
      if (!lockGuard.loseLock(error)) return
      if (keepAlive) clearInterval(keepAlive)
      console.error(
        '[facet-maintenance] Lost the database session holding the catalog lock.',
        error,
      )
      console.error(
        '[facet-maintenance] Aborting the current maintenance step. No further catalog mutations will run without serialization.',
      )
    }

    // Use a real SQL ownership check rather than COM_PING. ProxySQL closed the
    // leased lock session at its ten-minute idle boundary even though ping()
    // ran every twenty seconds. This query both keeps the session active and
    // proves the named lock is still owned by this exact connection.
    keepAlive = setInterval(() => {
      if (keepAliveCheckInFlight || lockGuard.signal.aborted) return
      keepAliveCheckInFlight = true
      void verifyLockOwnership(lockConnection)
        .then((ownsLock) => {
          if (!ownsLock) {
            reportLockLoss(
              new Error(
                `Database connection no longer owns named lock ${LOCK_NAME}.`,
              ),
            )
          }
        })
        .catch(reportLockLoss)
        .finally(() => {
          keepAliveCheckInFlight = false
        })
    }, LOCK_PING_INTERVAL_MS)

    if (!runCanonicalSeed) {
      console.log(
        `[facet-maintenance] Skipping unchanged canonical seed: ${seedReason}`,
      )
    }

    await runSerializedFacetMaintenanceSteps(
      steps,
      runStep,
      lockGuard.signal,
    )
  } finally {
    if (keepAlive) clearInterval(keepAlive)
    if (connection && lockAcquired && !lockGuard.signal.aborted) {
      try {
        await releaseLock(connection)
      } catch (error) {
        console.error(
          '[facet-maintenance] Failed to release named lock cleanly.',
          error,
        )
      }
    }
    // Teardown must never replace the real maintenance failure. A dead session
    // releases its named lock automatically and may throw from both calls.
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
