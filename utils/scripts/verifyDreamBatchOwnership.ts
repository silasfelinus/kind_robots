import { readFileSync } from 'node:fs'
import { strict as assert } from 'node:assert'

const source = readFileSync('server/api/dreams/batch.post.ts', 'utf8')

assert(!source.includes('userId?: number'), 'Dream batch input must not accept userId')
assert(!source.includes('callerIsAdmin'), 'Dream batch ownership must not branch on admin status')
assert(!source.includes('body.userId'), 'Dream batch must not read ownership from request data')
assert(
  source.includes('connect: { id: callerUserId }'),
  'Dream batch must connect every created Dream to the authenticated caller',
)
assert(
  source.includes('Ownership, IDs, and timestamps are server-owned.'),
  'Dream batch must reject unsupported server-owned fields explicitly',
)

console.log('Dream batch ownership contract passed.')
