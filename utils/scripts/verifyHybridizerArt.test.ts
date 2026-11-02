import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  hybridizerArtPrompt,
  hybridizerArtSeed,
  hybridizerRevisionSeed,
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
assert.equal(hybridizerRevisionSeed(pair.id, 0), hybridizerArtSeed(pair.id))
assert.equal(
  hybridizerRevisionSeed(pair.id, 1),
  hybridizerRevisionSeed(canonicalFusionPair('cat', 'banana').id, 1),
)
assert.notEqual(hybridizerRevisionSeed(pair.id, 1), hybridizerArtSeed(pair.id))
assert.notEqual(
  hybridizerRevisionSeed(pair.id, 1),
  hybridizerRevisionSeed(pair.id, 2),
)
for (const invalid of [-1, 12, 1.5, NaN, Infinity]) {
  assert.throws(() => hybridizerRevisionSeed(pair.id, invalid))
}
assert.equal(HYBRIDIZER_ACTIVE_USER_LIMIT, 3)
assert.equal(HYBRIDIZER_RETRY_LIMIT, 2)
const prompt = hybridizerArtPrompt('Cat', 'Banana')
assert.match(prompt, /a cat/)
assert.match(prompt, /a banana/)
assert.match(prompt, /living creature/)
assert.ok(prompt.length > 90)
const weightedPrompt = hybridizerArtPrompt('Cat', 'Banana', 'creature', {
  leftWeight: 70,
  direction: 'Make its striped tail curl around its peel-shaped body.',
})
assert.match(weightedPrompt, /70% characteristics of a cat/)
assert.match(weightedPrompt, /30% of a banana/)
assert.match(
  weightedPrompt,
  /Additional creative direction: Make its striped tail/,
)
assert.doesNotMatch(prompt, /Additional creative direction/)
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
// Silas, 2026-11-02: launch hybrids are low priority and all submitted at once.
assert.ok(
  HYBRIDIZER_BATCH_PRIORITY >= 1 && HYBRIDIZER_BATCH_PRIORITY <= 10,
  'launch hybrids are low-priority bulk art, behind interactive fusions and game art',
)
assert.ok(HYBRIDIZER_BATCH_PRIORITY < HYBRIDIZER_ART_PRIORITY)
assert.ok(
  HYBRIDIZER_BATCH_MAX_PAIRS <= 50 && HYBRIDIZER_BATCH_PENDING_CAP >= 4000,
  'one batch stays small, but the whole 4,000-pair launch set may be queued at once',
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

const atlasApi = readFileSync(
  new URL('../../server/api/hybridizer/fusions/index.get.ts', import.meta.url),
  'utf8',
)
const labStore = readFileSync(
  new URL('../../stores/hybridizerStore.ts', import.meta.url),
  'utf8',
)
const labPage = readFileSync(
  new URL('../../pages/admin/hybridizer.vue', import.meta.url),
  'utf8',
)
assert.match(atlasApi, /const where: Prisma\.HybridizerFusionWhereInput = \{ AND: filters \}/)
assert.match(atlasApi, /filteredTotal/)
assert.match(atlasApi, /status === 'READY'/)
assert.match(atlasApi, /status === 'IN_PROGRESS'/)
assert.match(atlasApi, /status === 'OTHER'/)
assert.match(atlasApi, /prisma\.hybridizerFusion\.count\(\{ where \}\)/)
assert.match(atlasApi, /ids\.split\(','\)\.filter/)
assert.match(labStore, /function loadAtlas\(/)
assert.match(labStore, /atlasEntries\.value/)
assert.match(labStore, /function randomize\(/)
assert.match(labStore, /maxDepth=3/)
assert.match(labStore, /function preferencesKey\(/)
assert.match(labStore, /authenticatedUserId/)
assert.match(labStore, /function toggleFavorite\(/)
assert.match(labPage, /data-testid="hybridizer-random"/)
assert.match(labPage, /data-testid="hybridizer-favorites"/)
assert.match(labPage, /data-testid="hybridizer-settings"/)
assert.match(labPage, /class="favorite-heart/)
console.log('Hybridizer atlas, randomizer and favorites contracts passed.')
