// /scripts/prisma-migrate-deploy.mjs
import { X509Certificate } from 'node:crypto'
import { writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import mariadb from 'mariadb'
import { repairKnownFailedMigrations } from './repair-known-prisma-migrations.mjs'
import { withConnectionRetry } from './db-connection-retry.mjs'

// Resolve the same URL Prisma Migrate will use. prisma.config.ts reads
// `MIGRATION_DATABASE_URL ?? DATABASE_URL`, so we must resolve it identically —
// otherwise a MIGRATION_DATABASE_URL set without SSL params bypasses the TLS
// setup below, and ProxySQL (which requires TLS) rejects with P1000.
const databaseUrl =
  process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL
const caFilePath = '/tmp/kindrobots-proxysql-ca.pem'

if (!databaseUrl) {
  throw new Error('MIGRATION_DATABASE_URL / DATABASE_URL is missing')
}

function readDatabaseSslCa() {
  const encoded = process.env.DATABASE_SSL_CA_BASE64?.replace(/\s+/g, '')
  if (encoded) {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8').trim()
    if (!decoded.includes('BEGIN CERTIFICATE')) {
      throw new Error('DATABASE_SSL_CA_BASE64 does not decode to a PEM certificate')
    }
    return decoded
  }

  const plain = process.env.DATABASE_SSL_CA?.replace(/\\n/g, '\n').trim()
  return plain || undefined
}

function runPrismaCommand(url, args) {
  const prismaBinary = path.resolve('node_modules/.bin/prisma')

  return new Promise((resolve, reject) => {
    const child = spawn(prismaBinary, args, {
      stdio: 'inherit',
      env: {
        ...process.env,
        // Force BOTH vars to the SSL-augmented URL so prisma.config.ts
        // (`MIGRATION_DATABASE_URL ?? DATABASE_URL`) cannot route around the
        // TLS params ProxySQL requires.
        DATABASE_URL: url,
        MIGRATION_DATABASE_URL: url,
      },
    })

    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(
        new Error(
          signal
            ? `prisma ${args.join(' ')} terminated by ${signal}`
            : `prisma ${args.join(' ')} exited with code ${code ?? 'unknown'}`,
        ),
      )
    })
  })
}

function runPrismaMigrate(url) {
  return runPrismaCommand(url, ['migrate', 'deploy'])
}

async function createTlsConnection(parsedUrl, sslCa) {
  const connection = await mariadb.createConnection({
    host: parsedUrl.hostname,
    port: Number.parseInt(parsedUrl.port || '3306', 10),
    user: decodeURIComponent(parsedUrl.username),
    password: decodeURIComponent(parsedUrl.password),
    database: decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, '')),
    connectTimeout: 5_000,
    ssl: {
      ca: sslCa,
      rejectUnauthorized: true,
    },
  })

  await connection.query('SELECT 1 AS tls_connection_ok')
  console.log('[database] Verified TLS connection to ProxySQL before migration.')
  return connection
}

async function main() {
  const sslCa = readDatabaseSslCa()

  if (!sslCa) {
    console.warn(
      '[database] No custom CA configured; running Prisma Migrate with DATABASE_URL unchanged.',
    )
    await runPrismaMigrate(databaseUrl)
    return
  }

  let certificate
  try {
    certificate = new X509Certificate(sslCa)
  } catch (error) {
    throw new Error('Configured database CA is not a valid X.509 certificate', {
      cause: error,
    })
  }

  console.log(
    `[database] Loaded ProxySQL CA subject=${certificate.subject} fingerprint=${certificate.fingerprint256} validTo=${certificate.validTo}`,
  )

  await writeFile(caFilePath, `${sslCa}\n`, { mode: 0o600 })

  try {
    const parsedUrl = new URL(databaseUrl)
    parsedUrl.searchParams.set('sslcert', caFilePath)
    parsedUrl.searchParams.set('sslaccept', 'strict')
    const prismaUrl = parsedUrl.toString()

    // The repair runs a short sequence of idempotent, existence-guarded
    // statements against ProxySQL, which can drop the connection mid-sequence
    // (SQLState 08S01, "socket has unexpectedly been closed"). Reconnect and
    // re-run the repair on connection-level failures — safe because every step
    // is idempotent — instead of failing the whole production deploy.
    await withConnectionRetry(
      async () => {
        let connection
        try {
          connection = await createTlsConnection(parsedUrl, sslCa)
          await repairKnownFailedMigrations({
            connection,
            prismaUrl,
            runPrismaCommand,
          })
        } finally {
          await connection?.end().catch(() => undefined)
        }
      },
      {
        onRetry: ({ attempt, attempts, error, backoff }) => {
          console.warn(
            `[database repair] Attempt ${attempt}/${attempts} hit a transient connection error (${
              error?.code || error?.sqlState || 'unknown'
            }); reconnecting in ${backoff}ms.`,
          )
        },
      },
    )

    await runPrismaMigrate(prismaUrl)
  } finally {
    await unlink(caFilePath).catch(() => undefined)
  }
}

await main()
