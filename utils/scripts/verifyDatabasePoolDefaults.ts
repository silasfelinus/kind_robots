// /utils/scripts/verifyDatabasePoolDefaults.ts
import assert from 'node:assert/strict'
import {
  DEFAULT_CONNECTION_LIMIT,
  SAFE_MINIMUM_CONNECTION_LIMIT,
} from './../../server/utils/databasePoolDefaults'

// Regression guard: this fallback has silently dropped from 10 to 2 twice
// (e2caf03d, then kind_robots PR #296), each time causing a full production
// outage (every DB-backed route 503ing on pool exhaustion). Fail CI loudly
// instead of waiting for the next outage to notice.
assert.ok(
  DEFAULT_CONNECTION_LIMIT >= SAFE_MINIMUM_CONNECTION_LIMIT,
  `DEFAULT_CONNECTION_LIMIT (${DEFAULT_CONNECTION_LIMIT}) must be >= ` +
    `SAFE_MINIMUM_CONNECTION_LIMIT (${SAFE_MINIMUM_CONNECTION_LIMIT}) — ` +
    'see server/utils/databasePoolDefaults.ts',
)

console.log(
  `Database pool connection-limit fallback verified: ${DEFAULT_CONNECTION_LIMIT} >= ${SAFE_MINIMUM_CONNECTION_LIMIT}.`,
)
