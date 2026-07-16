// /server/utils/databasePoolDefaults.ts
// Production has regressed in two different ways when pool defaults were made
// too aggressive:
//
// - lowering connectionLimit from 10 to 2 starved every DB-backed route
// - minimumIdle=0 plus idleTimeout=15 let warm Vercel instances retain or
//   repeatedly recreate unhealthy ProxySQL sockets under sustained API tests
//
// Keep the lifecycle policy centralized so a future edit is visible in review
// and covered by utils/scripts/verifyDatabasePoolDefaults.ts.
export const SAFE_MINIMUM_CONNECTION_LIMIT = 8
export const DEFAULT_CONNECTION_LIMIT = 10
export const DEFAULT_CONNECT_TIMEOUT_MS = 5_000
export const DEFAULT_ACQUIRE_TIMEOUT_MS = 10_000
export const DEFAULT_IDLE_TIMEOUT_SECONDS = 300
export const DEFAULT_MINIMUM_IDLE = 1
export const DEFAULT_PING_TIMEOUT_MS = 2_000

if (DEFAULT_CONNECTION_LIMIT < SAFE_MINIMUM_CONNECTION_LIMIT) {
  throw new Error(
    `DEFAULT_CONNECTION_LIMIT (${DEFAULT_CONNECTION_LIMIT}) is below the safe ` +
      `minimum (${SAFE_MINIMUM_CONNECTION_LIMIT}) in server/utils/databasePoolDefaults.ts — ` +
      'this fallback has caused two production outages, see the file header before lowering it.',
  )
}

if (DEFAULT_ACQUIRE_TIMEOUT_MS <= DEFAULT_CONNECT_TIMEOUT_MS) {
  throw new Error(
    'DEFAULT_ACQUIRE_TIMEOUT_MS must be greater than DEFAULT_CONNECT_TIMEOUT_MS ' +
      'so pool acquisition can surface the underlying connection failure.',
  )
}

if (
  DEFAULT_MINIMUM_IDLE < 1 ||
  DEFAULT_MINIMUM_IDLE > DEFAULT_CONNECTION_LIMIT
) {
  throw new Error(
    'DEFAULT_MINIMUM_IDLE must keep at least one warm connection without ' +
      'exceeding DEFAULT_CONNECTION_LIMIT.',
  )
}
