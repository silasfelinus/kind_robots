import assert from 'node:assert/strict'
import {
  isTransientDatabaseError,
  withDatabaseRetry,
} from '../../scripts/lib/databaseRetry'

assert.equal(isTransientDatabaseError({ code: 'P1001' }), true)
assert.equal(
  isTransientDatabaseError({
    code: 'P2039',
    message: 'pool timeout: failed to retrieve a connection',
  }),
  true,
)
assert.equal(
  isTransientDatabaseError({ code: 'P2039', message: 'invalid query shape' }),
  false,
)

let attempts = 0
const result = await withDatabaseRetry(
  'self-test',
  async () => {
    attempts += 1
    if (attempts < 3) {
      throw Object.assign(new Error('connection reset'), { code: 'P1017' })
    }
    return 'connected'
  },
  3,
  0,
)
assert.equal(result, 'connected')
assert.equal(attempts, 3)

let permanentAttempts = 0
await assert.rejects(
  withDatabaseRetry(
    'permanent self-test',
    async () => {
      permanentAttempts += 1
      throw new Error('invalid query')
    },
    3,
    0,
  ),
  /invalid query/,
)
assert.equal(permanentAttempts, 1)

console.log('Database retry contract passed.')
