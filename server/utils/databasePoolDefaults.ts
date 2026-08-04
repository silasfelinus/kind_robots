// /server/utils/databasePoolDefaults.ts
//
// Kind Robots currently has two materially different runtime shapes:
//
// 1. A long-lived local Node/Nitro process, where retaining a small warm pool is
//    useful and the process count is controlled.
// 2. Vercel Node functions, where every warm lambda and every preview deployment
//    can own an independent connector pool. A global minimumIdle=1 caused each
//    warm lambda to retain a ProxySQL frontend session indefinitely, eventually
//    filling the shared kindrobot 200-session frontend limit even though
//    ProxySQL successfully multiplexed those clients onto <=40 MariaDB backends.
//
// Keep both profiles centralized and explicit. Never solve a serverless fan-out
// incident by weakening the healthy long-lived process, or vice versa.

export type DatabasePoolProfile = 'long-lived' | 'vercel-function'

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

// Vercel functions scale by process count, so the per-process pool must be
// deliberately tiny and must not retain a connection merely to stay warm.
export const VERCEL_CONNECTION_LIMIT = 2
export const VERCEL_CONNECT_TIMEOUT_MS = 5_000
export const VERCEL_ACQUIRE_TIMEOUT_MS = 10_000
export const VERCEL_IDLE_TIMEOUT_SECONDS = 15
export const VERCEL_MINIMUM_IDLE = 0
export const VERCEL_PING_TIMEOUT_MS = 2_000

// Compatibility exports for maintenance scripts and existing callers. These
// continue to describe the intended long-lived local runtime.
export const SAFE_MINIMUM_CONNECTION_LIMIT =
  SAFE_MINIMUM_LONG_LIVED_CONNECTION_LIMIT
export const DEFAULT_CONNECTION_LIMIT = LONG_LIVED_CONNECTION_LIMIT
export const DEFAULT_CONNECT_TIMEOUT_MS = LONG_LIVED_CONNECT_TIMEOUT_MS
export const DEFAULT_ACQUIRE_TIMEOUT_MS = LONG_LIVED_ACQUIRE_TIMEOUT_MS
export const DEFAULT_IDLE_TIMEOUT_SECONDS = LONG_LIVED_IDLE_TIMEOUT_SECONDS
export const DEFAULT_MINIMUM_IDLE = LONG_LIVED_MINIMUM_IDLE
export const DEFAULT_PING_TIMEOUT_MS = LONG_LIVED_PING_TIMEOUT_MS

export function isVercelFunctionRuntime(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.VERCEL === '1'
}

export function resolveDatabasePoolDefaults(
  env: NodeJS.ProcessEnv = process.env,
): DatabasePoolDefaults {
  if (isVercelFunctionRuntime(env)) {
    return {
      profile: 'vercel-function',
      connectionLimit: VERCEL_CONNECTION_LIMIT,
      connectTimeoutMs: VERCEL_CONNECT_TIMEOUT_MS,
      acquireTimeoutMs: VERCEL_ACQUIRE_TIMEOUT_MS,
      idleTimeoutSeconds: VERCEL_IDLE_TIMEOUT_SECONDS,
      minimumIdle: VERCEL_MINIMUM_IDLE,
      pingTimeoutMs: VERCEL_PING_TIMEOUT_MS,
    }
  }

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

if (
  LONG_LIVED_CONNECTION_LIMIT < SAFE_MINIMUM_LONG_LIVED_CONNECTION_LIMIT
) {
  throw new Error(
    `LONG_LIVED_CONNECTION_LIMIT (${LONG_LIVED_CONNECTION_LIMIT}) is below the safe ` +
      `minimum (${SAFE_MINIMUM_LONG_LIVED_CONNECTION_LIMIT}). Do not apply ` +
      'serverless pool limits to the controlled long-lived runtime.',
  )
}

for (const defaults of [
  resolveDatabasePoolDefaults({}),
  resolveDatabasePoolDefaults({ VERCEL: '1' }),
]) {
  if (defaults.acquireTimeoutMs <= defaults.connectTimeoutMs) {
    throw new Error(
      `${defaults.profile} acquire timeout must exceed its connect timeout.`,
    )
  }

  if (
    defaults.minimumIdle < 0 ||
    defaults.minimumIdle > defaults.connectionLimit
  ) {
    throw new Error(
      `${defaults.profile} minimumIdle must be between zero and its connection limit.`,
    )
  }
}
