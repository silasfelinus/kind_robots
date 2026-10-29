import assert from 'node:assert/strict'
import {
  hybridizerArtPrompt,
  hybridizerArtSeed,
  hybridizerDeliverableUrl,
  hybridizerQueueState,
  HYBRIDIZER_ACTIVE_USER_LIMIT,
  HYBRIDIZER_RETRY_LIMIT,
} from '../../server/utils/hybridizerArt'
import { canonicalFusionPair } from '../../server/utils/hybridizerFusion'

const pair = canonicalFusionPair('banana', 'cat')
assert.equal(
  hybridizerArtSeed(pair.id),
  hybridizerArtSeed(canonicalFusionPair('cat', 'banana').id),
  'unordered pair must retain the same illustration seed',
)
assert.equal(HYBRIDIZER_ACTIVE_USER_LIMIT, 3)
assert.equal(HYBRIDIZER_RETRY_LIMIT, 2)
const prompt = hybridizerArtPrompt('Cat', 'Banana')
assert.match(prompt, /Cat/)
assert.match(prompt, /Banana/)
assert.ok(prompt.length > 90)
assert.equal(hybridizerQueueState('PENDING', null), 'QUEUED')
assert.equal(hybridizerQueueState('RUNNING', null), 'RENDERING')
assert.equal(hybridizerQueueState('FAILED', null), 'FAILED')
assert.equal(hybridizerQueueState('CANCELLED', null), 'CANCELLED')
assert.equal(hybridizerQueueState('DONE', null), 'DELIVERING',
  'DONE ArtJob is not itself proof of delivered artwork')
assert.equal(hybridizerQueueState('DONE', '/art/fusion.webp'), 'READY')
assert.equal(hybridizerQueueState(null, null), 'STUDY')
assert.equal(hybridizerDeliverableUrl('/art/fusion.webp'), '/art/fusion.webp')
assert.equal(hybridizerDeliverableUrl('https://kindrobots.org/art/fusion.webp'),
  'https://kindrobots.org/art/fusion.webp')
for (const value of ['javascript:alert(1)', '//evil.example/x.png', 'file:///tmp/a.png',
  'data:text/html,a', '']) {
  assert.equal(hybridizerDeliverableUrl(value), null)
}
console.log('Hybridizer art readiness and deterministic seed contracts passed.')
