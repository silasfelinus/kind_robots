import mariadb from 'mariadb'

type ConnectorError = Error & {
  code?: string | number
  errno?: string | number
  sqlState?: string
  fatal?: boolean
}

export type DirectDatabaseConnection = Awaited<
  ReturnType<typeof mariadb.createConnection>
>

export type DirectDatabaseProbeResult = {
  success: boolean
  latencyMs: number
  code: string | null
}

function readDatabaseSslCa(): string | undefined {
  const encoded = process.env.DATABASE_SSL_CA_BASE64?.replace(/\s+/g, '')
  if (encoded) {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8').trim()
    return decoded.includes('BEGIN CERTIFICATE') ? decoded : undefined
  }

  return process.env.DATABASE_SSL_CA?.replace(/\\n/g, '\n').trim() || undefined
}

function rejectUnauthorized(): boolean {
  const value = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED
    ?.trim()
    .toLowerCase()
  return value !== 'false' && value !== '0' && value !== 'no'
}

function errorCode(error: ConnectorError): string | null {
  const value = error.code ?? error.errno ?? error.sqlState
  return value == null ? null : String(value)
}

function sanitizedMessage(error: ConnectorError, parsed: URL): string {
  let message = error.message || String(error)

  for (const secret of [
    decodeURIComponent(parsed.password),
    decodeURIComponent(parsed.username),
  ]) {
    if (secret) message = message.replaceAll(secret, '[redacted]')
  }

  if (parsed.hostname) {
    message = message.replaceAll(parsed.hostname, '[database-host]')
  }

  return message
}

export async function createDatabaseDirectConnection(): Promise<DirectDatabaseConnection> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw Object.assign(new Error('DATABASE_URL is missing'), {
      code: 'DATABASE_URL_MISSING',
    })
  }

  const parsed = new URL(databaseUrl)
  const sslCa = readDatabaseSslCa()

  return mariadb.createConnection({
    host: parsed.hostname,
    port: Number.parseInt(parsed.port || '3306', 10),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: decodeURIComponent(parsed.pathname.replace(/^\/+/, '')),
    connectTimeout: 5_000,
    ...(sslCa
      ? {
          ssl: {
            ca: sslCa,
            rejectUnauthorized: rejectUnauthorized(),
          },
        }
      : {}),
  })
}

export async function probeDatabaseDirect(): Promise<DirectDatabaseProbeResult> {
  const startedAt = Date.now()
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    return {
      success: false,
      latencyMs: Date.now() - startedAt,
      code: 'DATABASE_URL_MISSING',
    }
  }

  const parsed = new URL(databaseUrl)
  let connection: DirectDatabaseConnection | null = null

  try {
    connection = await createDatabaseDirectConnection()
    await connection.query('SELECT 1 AS direct_probe_ok')

    return {
      success: true,
      latencyMs: Date.now() - startedAt,
      code: null,
    }
  } catch (unknownError: unknown) {
    const error = unknownError as ConnectorError
    const code = errorCode(error)

    console.error('[database:direct-probe]', {
      name: error.name,
      code,
      fatal: error.fatal ?? null,
      message: sanitizedMessage(error, parsed),
    })

    return {
      success: false,
      latencyMs: Date.now() - startedAt,
      code,
    }
  } finally {
    await connection?.end().catch(() => undefined)
  }
}
