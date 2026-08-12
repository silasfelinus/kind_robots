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
    parsed.searchParams.get('connectTimeout') ??
      process.env.DATABASE_CONNECT_TIMEOUT_MS,
    DEFAULT_CONNECT_TIMEOUT_MS,
  )
  const acquireTimeout = readPositiveInteger(
    parsed.searchParams.get('acquireTimeout') ??
      process.env.DATABASE_ACQUIRE_TIMEOUT_MS,
    DEFAULT_ACQUIRE_TIMEOUT_MS,
  )
  const connectionLimit = readPositiveInteger(
    parsed.searchParams.get('connectionLimit') ??
      process.env.DATABASE_CONNECTION_LIMIT,
    DEFAULT_CONNECTION_LIMIT,
  )
  const minDelayValidation = readNonNegativeInteger(
    parsed.searchParams.get('minDelayValidation') ??
      process.env.DATABASE_MIN_DELAY_VALIDATION_MS,
    0,
  )
  const idleTimeout = readPositiveInteger(
    parsed.searchParams.get('idleTimeout') ??
      process.env.DATABASE_IDLE_TIMEOUT_SECONDS,
    DEFAULT_IDLE_TIMEOUT_SECONDS,
  )
  const minimumIdle = readNonNegativeInteger(
    parsed.searchParams.get('minimumIdle') ??
      process.env.DATABASE_MINIMUM_IDLE,
    DEFAULT_MINIMUM_IDLE,
  )
  const pingTimeout = readPositiveInteger(
    parsed.searchParams.get('pingTimeout') ??
      process.env.DATABASE_PING_TIMEOUT_MS,
    DEFAULT_PING_TIMEOUT_MS,
  )

  parsed.searchParams.set('connectTimeout', String(connectTimeout))
  parsed.searchParams.set('acquireTimeout', String(acquireTimeout))
  parsed.searchParams.set('connectionLimit', String(connectionLimit))
  parsed.searchParams.set('minDelayValidation', String(minDelayValidation))
  parsed.searchParams.set('idleTimeout', String(idleTimeout))
  parsed.searchParams.set('minimumIdle', String(minimumIdle))
  parsed.searchParams.set('pingTimeout', String(pingTimeout))

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
    pipelining: readDatabasePipelining(),
  })

  return poolConfig
}

export function databaseConfigUsesSsl(): boolean {
  return Boolean(readDatabaseSslCa()) || !readSslRejectUnauthorized()
}

export function createDatabaseAdapter(url: string): PrismaMariaDb {
  return new PrismaMariaDb(buildDatabaseConfig(url), {
    useTextProtocol: readDatabaseUseTextProtocol(),
  })
}
