// /server/utils/databaseAdapterConfig.ts
//
// Single source of truth for how this app builds the @prisma/adapter-mariadb
// connection config — including the SSL/TLS options ProxySQL now enforces.
//
// server/utils/prisma.ts (the request-time singleton) AND the standalone
// maintenance scripts under utils/scripts/ both import from here, so a one-off
// script connects to ProxySQL exactly the way the running app does — with the
// CA-verified TLS handshake — instead of a bare `new PrismaMariaDb(url)` that
// ProxySQL rejects with "Access denied ... SSL is required".
//
// Keep this module free of side effects (no eager client creation, no reading
// DATABASE_URL at import time) so scripts can import the builder cheaply.

import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import type { ConnectionOptions as TlsConnectionOptions } from 'node:tls'
import {
  DEFAULT_ACQUIRE_TIMEOUT_MS,
  DEFAULT_CONNECTION_LIMIT,
  DEFAULT_CONNECT_TIMEOUT_MS,
  DEFAULT_IDLE_TIMEOUT_SECONDS,
  DEFAULT_MINIMUM_IDLE,
  DEFAULT_PING_TIMEOUT_MS,
} from './databasePoolDefaults'

export type PrismaMariaDbConfig = ConstructorParameters<typeof PrismaMariaDb>[0]
export type PrismaMariaDbPoolConfig = Exclude<PrismaMariaDbConfig, string>

export function readPositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function readNonNegativeInteger(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

// ProxySQL's frontend does not support MySQL command pipelining. When the
// MariaDB connector sends a second command while ProxySQL is still processing
// the previous one on the same session, ProxySQL logs
// "Unexpected packet from client ... Session_status: 6 ... Disconnecting it",
// closes the frontend socket, and KILLs the backend query. That surfaced as
// deterministic "Cannot execute new commands: connection closed" 503s on every
// create/update whose Prisma plan runs multiple statements in one transaction
// (an INSERT followed by the relation SELECTs of an `include`), while lean
// single-statement writes and all reads went through fine — and it reproduced
// only over the TLS ProxySQL path, never on a direct MariaDB connection (see
// scripts/db-write-repro.mjs and issue #324). The connector pipelines by
// default; disable it for this topology. Set DATABASE_PIPELINING=true to
// restore pipelining (e.g. for a direct-to-MariaDB link with no ProxySQL).
export function readDatabasePipelining(): boolean {
  const raw = process.env.DATABASE_PIPELINING?.trim().toLowerCase()
  return raw === 'true' || raw === '1' || raw === 'yes'
}

export function readDatabaseUseTextProtocol(): boolean {
  const raw = process.env.DATABASE_USE_TEXT_PROTOCOL?.trim().toLowerCase()
  return raw !== 'false' && raw !== '0' && raw !== 'no'
}

export function buildDatabaseUrl(url: string): string {
  const parsed = new URL(url)
  const connectTimeout = readPositiveInteger(
    process.env.DATABASE_CONNECT_TIMEOUT_MS,
    DEFAULT_CONNECT_TIMEOUT_MS,
  )
  const acquireTimeout = readPositiveInteger(
    process.env.DATABASE_ACQUIRE_TIMEOUT_MS,
    DEFAULT_ACQUIRE_TIMEOUT_MS,
  )
  const connectionLimit = readPositiveInteger(
    process.env.DATABASE_CONNECTION_LIMIT,
    DEFAULT_CONNECTION_LIMIT,
  )
  const minDelayValidation = readNonNegativeInteger(
    process.env.DATABASE_MIN_DELAY_VALIDATION_MS,
    0,
  )
  const idleTimeout = readPositiveInteger(
    process.env.DATABASE_IDLE_TIMEOUT_SECONDS,
    DEFAULT_IDLE_TIMEOUT_SECONDS,
  )
  const minimumIdle = readNonNegativeInteger(
    process.env.DATABASE_MINIMUM_IDLE,
    DEFAULT_MINIMUM_IDLE,
  )
  const pingTimeout = readPositiveInteger(
    process.env.DATABASE_PING_TIMEOUT_MS,
    DEFAULT_PING_TIMEOUT_MS,
  )

  if (!parsed.searchParams.has('connectTimeout')) {
    parsed.searchParams.set('connectTimeout', String(connectTimeout))
  }

  if (!parsed.searchParams.has('acquireTimeout')) {
    parsed.searchParams.set('acquireTimeout', String(acquireTimeout))
  }

  if (!parsed.searchParams.has('connectionLimit')) {
    parsed.searchParams.set('connectionLimit', String(connectionLimit))
  }

  if (!parsed.searchParams.has('minDelayValidation')) {
    parsed.searchParams.set('minDelayValidation', String(minDelayValidation))
  }

  if (!parsed.searchParams.has('idleTimeout')) {
    parsed.searchParams.set('idleTimeout', String(idleTimeout))
  }

  if (!parsed.searchParams.has('minimumIdle')) {
    parsed.searchParams.set('minimumIdle', String(minimumIdle))
  }

  if (!parsed.searchParams.has('pingTimeout')) {
    parsed.searchParams.set('pingTimeout', String(pingTimeout))
  }

  if (!parsed.searchParams.has('pipelining')) {
    parsed.searchParams.set('pipelining', String(readDatabasePipelining()))
  }

  return parsed.toString()
}

export function readDatabaseSslCa(): string | undefined {
  const encoded = process.env.DATABASE_SSL_CA_BASE64?.trim()

  if (encoded) {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8').trim()

    if (!decoded.includes('BEGIN CERTIFICATE')) {
      throw new Error('DATABASE_SSL_CA_BASE64 is not a PEM certificate')
    }

    return decoded
  }

  const plain = process.env.DATABASE_SSL_CA?.replace(/\\n/g, '\n').trim()

  if (!plain) return undefined

  if (!plain.includes('BEGIN CERTIFICATE')) {
    throw new Error('DATABASE_SSL_CA is not a PEM certificate')
  }

  return plain
}

export function readSslRejectUnauthorized(): boolean {
  const raw = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED?.trim().toLowerCase()
  return raw !== 'false' && raw !== '0' && raw !== 'no'
}

export function buildDatabaseConfig(url: string): PrismaMariaDbConfig {
  const resolvedUrl = buildDatabaseUrl(url)
  const sslCa = readDatabaseSslCa()
  const rejectUnauthorized = readSslRejectUnauthorized()

  if (!sslCa && rejectUnauthorized) return resolvedUrl

  const parsed = new URL(resolvedUrl)
  const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''))
  const tlsOptions: TlsConnectionOptions = rejectUnauthorized
    ? {
        ca: sslCa,
        rejectUnauthorized: true,
      }
    : {
        ...(sslCa ? { ca: sslCa } : {}),
        rejectUnauthorized: false,
      }

  if (!rejectUnauthorized) {
    console.warn(
      '[prisma] DATABASE_SSL_REJECT_UNAUTHORIZED=false — TLS is on but the ' +
        'database certificate is NOT being verified. Stopgap only; restore ' +
        'verification once the ProxySQL cert/CA is fixed.',
    )
  }

  const poolConfig: PrismaMariaDbPoolConfig = {
    host: parsed.hostname,
    port: readPositiveInteger(parsed.port, 3_306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
    connectTimeout: readPositiveInteger(
      parsed.searchParams.get('connectTimeout') ?? undefined,
      DEFAULT_CONNECT_TIMEOUT_MS,
    ),
    acquireTimeout: readPositiveInteger(
      parsed.searchParams.get('acquireTimeout') ?? undefined,
      DEFAULT_ACQUIRE_TIMEOUT_MS,
    ),
    connectionLimit: readPositiveInteger(
      parsed.searchParams.get('connectionLimit') ?? undefined,
      DEFAULT_CONNECTION_LIMIT,
    ),
    minDelayValidation: readNonNegativeInteger(
      parsed.searchParams.get('minDelayValidation') ?? undefined,
      0,
    ),
    idleTimeout: readPositiveInteger(
      parsed.searchParams.get('idleTimeout') ?? undefined,
      DEFAULT_IDLE_TIMEOUT_SECONDS,
    ),
    minimumIdle: readNonNegativeInteger(
      parsed.searchParams.get('minimumIdle') ?? undefined,
      DEFAULT_MINIMUM_IDLE,
    ),
    ssl: tlsOptions,
  }

  Object.assign(poolConfig, {
    pingTimeout: readPositiveInteger(
      parsed.searchParams.get('pingTimeout') ?? undefined,
      DEFAULT_PING_TIMEOUT_MS,
    ),
    // Off by default for the ProxySQL topology — see readDatabasePipelining().
    pipelining: readDatabasePipelining(),
  })

  return poolConfig
}

// True when buildDatabaseConfig will negotiate TLS (a CA is configured, or
// verification was explicitly relaxed while TLS stays on). Lets callers log
// whether the ProxySQL-required TLS handshake is engaged WITHOUT ever touching
// the host, credentials, or the certificate itself.
export function databaseConfigUsesSsl(): boolean {
  return Boolean(readDatabaseSslCa()) || !readSslRejectUnauthorized()
}

// The one true way to build the adapter: SSL-aware config + the app's protocol
// mode. Standalone scripts should call this instead of `new PrismaMariaDb(url)`
// so they inherit the ProxySQL-required TLS handshake automatically.
export function createDatabaseAdapter(url: string): PrismaMariaDb {
  return new PrismaMariaDb(buildDatabaseConfig(url), {
    useTextProtocol: readDatabaseUseTextProtocol(),
  })
}
