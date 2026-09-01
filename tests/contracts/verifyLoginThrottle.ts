import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const login = readFileSync('server/api/auth/login.post.ts', 'utf8')
const authAttemptLimit = readFileSync(
  'server/utils/authAttemptLimit.ts',
  'utf8',
)

// The ordinary /api/auth/login endpoint reuses the same failure-window helper
// the first-party password exchange uses (rainbow-butterflies/t-036 ->
// t-037), rather than growing its own ad hoc rate limiter.
assert.match(login, /assertAuthAttemptAllowed\(event, safeUsername\)/)
assert.match(login, /recordAuthFailure\(event, safeUsername\)/)
assert.match(login, /clearAuthFailures\(event, safeUsername\)/)

// A thrown H3Error (the helper's 429) must reach the client with its real
// status code, not get flattened into a generic 500 by the handler's own
// catch block.
assert.match(login, /isError\(error\)/)
assert.match(login, /sendError\(event, error\)/)

assert.match(authAttemptLimit, /statusCode:\s*429/)
assert.match(authAttemptLimit, /'Retry-After'/)
assert.match(authAttemptLimit, /MAX_PAIR_FAILURES/)
assert.match(authAttemptLimit, /MAX_IP_FAILURES/)

console.log('Login throttle contract OK')
