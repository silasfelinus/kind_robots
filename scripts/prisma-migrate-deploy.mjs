// /scripts/prisma-migrate-deploy.mjs
import { X509Certificate } from 'node:crypto'
import { writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import mariadb from 'mariadb'
import { repairKnownFailedMigrations } from './repair-known-prisma-migrations.mjs'

const databaseUrl = process.env.DATABASE_URL
const caFilePath = '/tmp/kindrobots-proxysql-ca.pem'

if (!databaseUrl) {
  throw new Error('DATABASE_URL is missing')
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
        DATABASE_URL: url,
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

  let connection
  try {
    const parsedUrl = new URL(databaseUrl)
    connection = await createTlsConnection(parsedUrl, sslCa)

    parsedUrl.searchParams.set('sslcert', caFilePath)
    parsedUrl.searchParams.set('sslaccept', 'strict')
    const prismaUrl = parsedUrl.toString()

    await repairKnownFailedMigrations({
      connection,
      prismaUrl,
      runPrismaCommand,
    })

    await connection.end()
    connection = undefined
    await runPrismaMigrate(prismaUrl)
  } finally {
    await connection?.end().catch(() => undefined)
    await unlink(caFilePath).catch(() => undefined)
  }
}

await main()
