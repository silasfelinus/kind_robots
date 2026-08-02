import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const route = await readFile(
  new URL('../../server/api/art/queue/cancel-failed.post.ts', import.meta.url),
  'utf8',
)
const component = await readFile(
  new URL(
    '../../components/art/artjob-failed-page-requeue.vue',
    import.meta.url,
  ),
  'utf8',
)

assert.match(route, /prisma\.artJob\.updateMany/)
assert.match(route, /status: 'FAILED'/)
assert.match(route, /status: 'CANCELLED'/)
assert.match(component, /\/api\/art\/queue\/cancel-failed/)
assert.doesNotMatch(component, /jobIds\.map\([\s\S]*\/cancel/)

console.log('Failed ArtJob bulk cancellation checks passed.')
