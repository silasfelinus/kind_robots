// /server/utils/databasePoolDefaults.ts
// The DATABASE_CONNECTION_LIMIT fallback has regressed from 10 down to 2 twice
// (historical commit e2caf03d, then again in kind_robots PR #296) — each time a
// full production outage, every DB-backed API route 503ing with
// "pool timeout ... (pool connections: active=0 idle=0 limit=2)" once the
// two-connection pool starved. server/utils/prisma.ts imports
// DEFAULT_CONNECTION_LIMIT from here instead of hardcoding the fallback so a
// future edit can't silently reintroduce an unsafe value without either
// changing this file (visible in review) or failing the guard below and
// utils/scripts/verifyDatabasePoolDefaults.ts in CI.
export const SAFE_MINIMUM_CONNECTION_LIMIT = 8
export const DEFAULT_CONNECTION_LIMIT = 10

if (DEFAULT_CONNECTION_LIMIT < SAFE_MINIMUM_CONNECTION_LIMIT) {
  throw new Error(
    `DEFAULT_CONNECTION_LIMIT (${DEFAULT_CONNECTION_LIMIT}) is below the safe ` +
      `minimum (${SAFE_MINIMUM_CONNECTION_LIMIT}) in server/utils/databasePoolDefaults.ts — ` +
      'this fallback has caused two production outages, see the file header before lowering it.',
  )
}
