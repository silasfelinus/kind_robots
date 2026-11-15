import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { localHybridizerStudies } from '../hybridizer/studyPersistence'
import {
  canonicalFusionPair,
  clientIngredientKey,
  fusionDisplayTitle,
  fusionIdForIdentity,
  normalizedIngredientKey,
  starterForIdentity,
} from '../../server/utils/hybridizerFusion'

const cat = canonicalFusionPair('cat', 'banana')
const swapped = canonicalFusionPair('banana', 'cat')
assert.deepEqual(cat, swapped, 'A + B must use the same durable key as B + A')
assert.equal(cat.leftKey, 'starter:banana')
assert.equal(cat.rightKey, 'starter:cat')
assert.equal(cat.id.length, 64)
assert.equal(canonicalFusionPair('starter:cat', 'banana').id, cat.id)
assert.equal(starterForIdentity('starter:banana')?.taxonomy, 'OTHER')
assert.equal(clientIngredientKey('starter:banana'), 'banana')
assert.equal(fusionIdForIdentity('fusion:' + cat.id), cat.id)
assert.equal(
  canonicalFusionPair('fusion:' + cat.id, 'vampire').leftKey,
  'fusion:' + cat.id,
)
assert.equal(fusionDisplayTitle('Banana', 'Cat'), 'Bananacat')
assert.equal(fusionDisplayTitle('Vampire', 'Bananacat'), 'Vampire Bananacat')
assert.notEqual(canonicalFusionPair('cat', 'vampire').id, cat.id)
assert.throws(() => canonicalFusionPair('cat', 'cat'), /different/)
assert.throws(() => normalizedIngredientKey('invalid'), /Unknown/)
assert.throws(
  () => normalizedIngredientKey('hybrid:some-local-study'),
  /Unknown/,
)
const offlineStudy = {
  key: 'hybrid:["banana","cat"]',
  title: 'Bananacat',
  sources: ['banana', 'cat'],
  depth: 1,
  status: 'LOCAL',
}
const leakedPrivateStudy = {
  key: 'fusion:' + cat.id,
  title: 'Private owner study',
  sources: ['banana', 'cat'],
  depth: 1,
  status: 'READY',
}
assert.deepEqual(
  localHybridizerStudies([offlineStudy, leakedPrivateStudy]),
  [offlineStudy],
  'Only local drafts may be saved; remote private fusions remain server-authoritative',
)
assert.deepEqual(
  localHybridizerStudies([
    { ...offlineStudy, depth: 5 },
    { ...offlineStudy, sources: [null, 'cat'] },
    { ...offlineStudy, status: 'READY' },
  ]),
  [],
  'Malformed, server-backed and over-depth records must not be hydrated',
)
assert.deepEqual(localHybridizerStudies(null), [])

// Silas, 2026-11-14: "people should be able to browse it without logging in. It
// only needs a login if you want to review or create new hybrids."
const tab = readFileSync('content/channels/arcade/hybridizer.md', 'utf8')
assert.doesNotMatch(
  tab,
  /^requiredPermission:/m,
  'Hybridizer browsing is public',
)
assert.doesNotMatch(tab, /^requiredRole:/m, 'Hybridizer browsing is public')
const store = readFileSync('stores/hybridizerStore.ts', 'utf8')
assert.match(
  store,
  /if \(!userStore\.isLoggedIn\) \{[\s\S]*?fetchKnownPair\([\s\S]*?needsSignIn\.value = true/,
  'guests see shared discoveries and are asked to sign in only for a new hybrid',
)
const lab = readFileSync('pages/admin/hybridizer.vue', 'utf8')
assert.match(lab, /data-testid="hybridizer-sign-in-to-review"/)
assert.match(lab, /data-testid="hybridizer-sign-in-to-fuse"/)
assert.match(
  lab,
  /reactionImageId &&\s*userStore\.isLoggedIn\s*"\s*type="button"\s*data-testid="hybridizer-upvote"/,
  'upvoting is for signed-in reviewers',
)
for (const route of [
  'server/api/hybridizer/fusions/index.post.ts',
  'server/api/hybridizer/fusions/[id]/enqueue.post.ts',
]) {
  assert.match(
    readFileSync(route, 'utf8'),
    /require\w*ApiUser\(event/,
    `${route} still requires an account`,
  )
}
for (const route of [
  'server/api/hybridizer/fusions/index.get.ts',
  'server/api/hybridizer/fusions/pair.get.ts',
  'server/api/hybridizer/fusions/[id].get.ts',
]) {
  assert.doesNotMatch(
    readFileSync(route, 'utf8'),
    /require\w*ApiUser\(event/,
    `${route} stays readable by guests`,
  )
}

console.log('Hybridizer canonical pair identity contracts passed.')
