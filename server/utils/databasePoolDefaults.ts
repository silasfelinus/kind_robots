// /server/utils/databasePoolDefaults.ts
//
// Kind Robots production runs as a controlled, long-lived Node/Nitro container.
// Keep one explicit pool profile for that topology. Provider-specific serverless
// envelopes were retired with the former serverless deployment path.

export type DatabasePoolProfile = 'long-lived'

export type DatabasePoolDefaults = {
  profile: DatabasePoolProfile
  connectionLimit: number
  connectTimeoutMs: number
  acquireTimeoutMs: number
  idleTimeoutSeconds: number
  minimumIdle: number
  pingTimeoutMs: number
}

export const SAFE_MINIMUM_LONG_LIVED_CONNECTION_LIMIT = 8

export const LONG_LIVED_CONNECTION_LIMIT = 10
export const LONG_LIVED_CONNECT_TIMEOUT_MS = 5_000
export const LONG_LIVED_ACQUIRE_TIMEOUT_MS = 10_000
export const LONG_LIVED_IDLE_TIMEOUT_SECONDS = 300
export const LONG_LIVED_MINIMUM_IDLE = 1
export const LONG_LIVED_PING_TIMEOUT_MS = 2_000

export function resolveDatabasePoolDefaults(): DatabasePoolDefaults {
  return {
    profile: 'long-lived',
    connectionLimit: LONG_LIVED_CONNECTION_LIMIT,
    connectTimeoutMs: LONG_LIVED_CONNECT_TIMEOUT_MS,
    acquireTimeoutMs: LONG_LIVED_ACQUIRE_TIMEOUT_MS,
    idleTimeoutSeconds: LONG_LIVED_IDLE_TIMEOUT_SECONDS,
    minimumIdle: LONG_LIVED_MINIMUM_IDLE,
    pingTimeoutMs: LONG_LIVED_PING_TIMEOUT_MS,
  }
}

const ACTIVE_POOL_DEFAULTS = resolveDatabasePoolDefaults()

export const SAFE_MINIMUM_CONNECTION_LIMIT =
  SAFE_MINIMUM_LONG_LIVED_CONNECTION_LIMIT
export const DEFAULT_CONNECTION_LIMIT = ACTIVE_POOL_DEFAULTS.connectionLimit
export const DEFAULT_CONNECT_TIMEOUT_MS = ACTIVE_POOL_DEFAULTS.connectTimeoutMs
export const DEFAULT_ACQUIRE_TIMEOUT_MS = ACTIVE_POOL_DEFAULTS.acquireTimeoutMs
export const DEFAULT_IDLE_TIMEOUT_SECONDS =
  ACTIVE_POOL_DEFAULTS.idleTimeoutSeconds
export const DEFAULT_MINIMUM_IDLE = ACTIVE_POOL_DEFAULTS.minimumIdle
export const DEFAULT_PING_TIMEOUT_MS = ACTIVE_POOL_DEFAULTS.pingTimeoutMs
export const DEFAULT_DATABASE_POOL_PROFILE = ACTIVE_POOL_DEFAULTS.profile

if (
  LONG_LIVED_CONNECTION_LIMIT < SAFE_MINIMUM_LONG_LIVED_CONNECTION_LIMIT
) {
  throw new Error(
    `LONG_LIVED_CONNECTION_LIMIT (${LONG_LIVED_CONNECTION_LIMIT}) is below the safe ` +
      `minimum (${SAFE_MINIMUM_LONG_LIVED_CONNECTION_LIMIT}).`,
  )
}

if (ACTIVE_POOL_DEFAULTS.acquireTimeoutMs <= ACTIVE_POOL_DEFAULTS.connectTimeoutMs) {
  throw new Error('Long-lived acquire timeout must exceed its connect timeout.')
}

if (
  ACTIVE_POOL_DEFAULTS.minimumIdle < 0 ||
  ACTIVE_POOL_DEFAULTS.minimumIdle > ACTIVE_POOL_DEFAULTS.connectionLimit
) {
  throw new Error(
    'Long-lived minimumIdle must be between zero and its connection limit.',
  )
}
