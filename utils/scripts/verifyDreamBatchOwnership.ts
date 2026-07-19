import { readFileSync } from 'node:fs'
import { strict as assert } from 'node:assert'

const batchSource = readFileSync('server/api/dreams/batch.post.ts', 'utf8')
const boundarySource = readFileSync('server/api/dreams/mutation.ts', 'utf8')

assert(
  !batchSource.includes('callerIsAdmin'),
  'Dream batch ownership must not branch on admin status',
)
assert(
  !batchSource.includes('body.userId'),
  'Dream batch must not read ownership from request data',
)
assert(
  batchSource.includes('connect: { id: callerUserId }'),
  'Dream batch must connect every created Dream to the authenticated caller',
)
assert(
  batchSource.includes('allowedFields: dreamBatchCreateFields'),
  'Dream batch must enforce the shared strict create field set',
)
assert(
  boundarySource.includes(
    'export const dreamBatchCreateFields = new Set<string>(persistedMutationFields)',
  ),
  'Dream batch field set must exclude singular compatibility identity fields',
)
assert(
  boundarySource.includes(
    'IDs, timestamps, identity, and system fields are server-owned.',
  ),
  'Dream batch must reject unsupported server-owned fields explicitly',
)

console.log('Dream batch ownership contract passed.')
