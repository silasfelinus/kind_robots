// /scripts/db-connection-retry.mjs
//
// Small, DB-agnostic retry helper for the production migration bootstrap.
//
// The known-failed-migration repair (scripts/repair-known-prisma-migrations.mjs)
// runs a short sequence of idempotent, existence-guarded statements against
// ProxySQL during `npm run vercel-build`. ProxySQL can drop a backend/frontend
// connection mid-sequence (observed as MariaDB SQLState 08S01 / errno 45009,
// "socket has unexpectedly been closed"), which fails the whole production
// deploy even though nothing is logically wrong. Because every repair step is
// idempotent, reconnecting and re-running the repair is safe, so we retry the
// repair on connection-level (not query-logic) errors.

/**
 * Classifies whether an error is a transient *connection* failure that is safe
 * to retry with a fresh connection. Deliberately narrow: only socket/connection
 * level failures qualify. Logical errors (parse errors, constraint violations,
 * permission errors, etc.) are never retried — retrying those just wastes a
 * deploy and hides a real bug.
 */
export function isRetryableConnectionError(error) {
  if (!error) return false

  const code = typeof error.code === 'string' ? error.code : ''
  if (
    code === 'ER_SOCKET_UNEXPECTED_CLOSE' ||
    code === 'ER_CONNECTION_ALREADY_CLOSED' ||
    code === 'ER_GET_CONNECTION_TIMEOUT' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'EPIPE' ||
    code === 'ETIMEDOUT'
  ) {
    return true
  }

  // SQLState class "08" is the SQL standard "connection exception" class
  // (e.g. 08S01 "socket has unexpectedly been closed", 08004, 08006).
  const sqlState = typeof error.sqlState === 'string' ? error.sqlState : ''
  if (sqlState.startsWith('08')) return true

  return false
}

const defaultDelay = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

/**
 * Runs `run` with bounded retries and exponential backoff, retrying only when
 * `isRetryable` says the failure was a transient connection error. `run`
 * receives the 1-based attempt number and is responsible for acquiring (and
 * releasing) any per-attempt connection, so each retry gets a fresh connection.
 */
export async function withConnectionRetry(
  run,
  {
    attempts = 4,
    baseDelayMs = 1_000,
    isRetryable = isRetryableConnectionError,
    onRetry = () => {},
    delay = defaultDelay,
  } = {},
) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await run(attempt)
    } catch (error) {
      lastError = error
      if (attempt >= attempts || !isRetryable(error)) throw error
      const backoff = baseDelayMs * 2 ** (attempt - 1)
      onRetry({ attempt, attempts, error, backoff })
      await delay(backoff)
    }
  }
  throw lastError
}
