import assert from 'node:assert/strict'
import {
  hybridizerArtPrompt,
  hybridizerArtSeed,
  hybridizerDeliverableUrl,
  hybridizerQueueState,
  hybridizerSubjectKind,
  HYBRIDIZER_ACTIVE_USER_LIMIT,
  HYBRIDIZER_ART_PRIORITY,
  HYBRIDIZER_BATCH_MAX_PAIRS,
  HYBRIDIZER_BATCH_PENDING_CAP,
  HYBRIDIZER_BATCH_PRIORITY,
  HYBRIDIZER_RETRY_LIMIT,
} from '../../server/utils/hybridizerArt'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'
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
assert.match(prompt, /a cat/)
assert.match(prompt, /a banana/)
assert.match(prompt, /living creature/)
assert.ok(prompt.length > 90)
// The jar/specimen look belongs to the front-end chrome, never the artwork.
for (const banned of [
  /\bjar\b/i,
  /specimen/i,
  /test tube/i,
  /capsule/i,
  /laborator/i,
  /\bglass\b/i,
  /chimera/i,
]) {
  assert.doesNotMatch(prompt, banned, 'fusion art must show only the hybrid')
}
assert.match(
  hybridizerArtPrompt('Disco Ball', 'Cupcake', 'object'),
  /One single object that is an even physical blend of a disco ball and a cupcake/,
)
assert.match(
  hybridizerArtPrompt('Octopus', 'Astronaut'),
  /an octopus and an astronaut/,
)
assert.equal(hybridizerSubjectKind('OTHER', 'OTHER'), 'object')
assert.equal(hybridizerSubjectKind('OTHER', 'ANIMAL'), 'creature')
assert.equal(hybridizerSubjectKind('SPECIES', undefined), 'creature')
for (const [left, right] of [
  ['Cat', 'Banana'],
  ['Disco Ball', 'Cupcake'],
  ['Kiwi Fruit', 'Werewolf'],
] as const) {
  assert.deepEqual(
    checkArtPromptContract({
      prompt: hybridizerArtPrompt(left, right),
      engine: 'krea2',
      steps: 8,
      cfg: 1,
    }),
    [],
    left + ' + ' + right + ' prompt must pass the art prompt contract',
  )
}
assert.ok(
  HYBRIDIZER_BATCH_PRIORITY > 60 &&
    HYBRIDIZER_BATCH_PRIORITY < HYBRIDIZER_ART_PRIORITY,
  'launch hybrids queue behind interactive fusions but ahead of bulk backfill packs',
)
assert.ok(
  HYBRIDIZER_BATCH_MAX_PAIRS <= 50 && HYBRIDIZER_BATCH_PENDING_CAP <= 100,
)
assert.equal(hybridizerQueueState('PENDING', null), 'QUEUED')
assert.equal(hybridizerQueueState('RUNNING', null), 'RENDERING')
assert.equal(hybridizerQueueState('FAILED', null), 'FAILED')
assert.equal(hybridizerQueueState('CANCELLED', null), 'CANCELLED')
assert.equal(
  hybridizerQueueState('DONE', null),
  'DELIVERING',
  'DONE ArtJob is not itself proof of delivered artwork',
)
assert.equal(hybridizerQueueState('DONE', '/art/fusion.webp'), 'READY')
assert.equal(hybridizerQueueState(null, null), 'STUDY')
assert.equal(hybridizerDeliverableUrl('/art/fusion.webp'), '/art/fusion.webp')
assert.equal(
  hybridizerDeliverableUrl('https://kindrobots.org/art/fusion.webp'),
  'https://kindrobots.org/art/fusion.webp',
)
for (const value of [
  'javascript:alert(1)',
  '//evil.example/x.png',
  'file:///tmp/a.png',
  'data:text/html,a',
  '',
]) {
  assert.equal(hybridizerDeliverableUrl(value), null)
}
console.log('Hybridizer art readiness and deterministic seed contracts passed.')
