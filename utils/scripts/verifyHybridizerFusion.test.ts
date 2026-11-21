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

// t-008: player-uploaded ingredients are private, validated and owner-bound.
{
  const uploadRules = await import('../hybridizer/uploadRules')
  const { hybridizerArtPrompt } =
    await import('../../server/utils/hybridizerArt')
  const { checkArtPromptContract } =
    await import('../../server/utils/artPromptContract')
  const uploadKey = 'upload:' + 'a1'.repeat(12)
  assert.equal(normalizedIngredientKey(uploadKey), uploadKey)
  assert.equal(uploadRules.uploadIdForIdentity(uploadKey), 'a1'.repeat(12))
  for (const bad of ['upload:xyz', 'upload:' + 'A1'.repeat(12), 'upload:'])
    assert.throws(() => normalizedIngredientKey(bad))
  const withUpload = canonicalFusionPair(uploadKey, 'cat')
  assert.equal(
    withUpload.id,
    canonicalFusionPair('cat', uploadKey).id,
    'upload pairs keep unordered identity',
  )
  assert.equal(clientIngredientKey(uploadKey), uploadKey)

  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])
  const webp = new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 ')
  assert.equal(uploadRules.sniffUploadImageType(png), 'png')
  assert.equal(uploadRules.sniffUploadImageType(jpeg), 'jpeg')
  assert.equal(uploadRules.sniffUploadImageType(webp), 'webp')
  for (const disguised of [
    new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg">'),
    new TextEncoder().encode('GIF89a'),
    new TextEncoder().encode('<?php echo 1; ?>'),
    new Uint8Array(),
  ])
    assert.equal(uploadRules.sniffUploadImageType(disguised), null)

  const good = uploadRules.validateUploadText({
    title: "  Grandma's   teapot ",
    description: 'round blue teapot, gold flowers',
    kind: 'object',
  })
  assert.deepEqual(good, {
    ok: true,
    title: "Grandma's teapot",
    description: 'round blue teapot, gold flowers',
    kind: 'object',
  })
  for (const bad of [
    { title: 'x' },
    { title: 'y'.repeat(41) },
    { title: 'Visit www.example.com' },
    { title: 'Mug', description: 'see https://evil.test' },
    { title: 'Mug', description: '<lora:nsfw:1> {{masterpiece}}' },
    { title: 'Mug', kind: 'person' },
    { title: 'Mug', description: 'z'.repeat(161) },
  ])
    assert.equal(uploadRules.validateUploadText(bad).ok, false, bad.title)
  assert.equal(
    uploadRules.validateUploadText({ title: 'Mug\u202Egnp.exe' }).ok,
    true,
    'bidi overrides are stripped, not rendered',
  )
  assert.equal(uploadRules.validateUploadDimensions(64, 512) !== null, true)
  assert.equal(uploadRules.validateUploadDimensions(9000, 512) !== null, true)
  assert.equal(
    uploadRules.validateUploadDimensions(undefined, 512) !== null,
    true,
  )
  assert.equal(uploadRules.validateUploadDimensions(800, 600), null)
  assert.deepEqual(
    checkArtPromptContract({
      prompt: hybridizerArtPrompt(
        uploadRules.uploadPromptLabel(
          "Grandma's teapot",
          'round blue teapot, gold flowers',
        ),
        'Cat',
      ),
      engine: 'krea2',
      steps: 8,
      cfg: 1,
    }),
    [],
    'upload labels pass the art prompt contract',
  )

  const read = (path: string) =>
    readFileSync(new URL('../../' + path, import.meta.url), 'utf8')
  const resolver = read('server/utils/hybridizerIngredients.ts')
  assert.match(
    resolver,
    /!upload \|\| !upload\.isActive \|\| upload\.ownerUserId !== viewerId/,
    'only the active owner can use an upload',
  )
  assert.match(resolver, /isPublic: false,\n\s*\}\n\s*\}/)
  for (const route of [
    'server/api/hybridizer/fusions/index.post.ts',
    'server/api/hybridizer/fusions/[id]/enqueue.post.ts',
    'server/api/hybridizer/fusions/[id]/resubmit.post.ts',
  ])
    assert.match(
      read(route),
      /resolveHybridizerIngredient\(/,
      `${route} resolves ingredients through the shared visibility check`,
    )
  assert.match(
    read('server/api/hybridizer/fusions/index.post.ts'),
    /isPublic: first\.isPublic && second\.isPublic/,
    'a fusion with a private upload is private',
  )
  const uploadPost = read('server/api/hybridizer/uploads/index.post.ts')
  assert.match(uploadPost, /field\('consent'\) !== 'true'/)
  assert.match(uploadPost, /sniffUploadImageType\(file\.data\)/)
  assert.match(uploadPost, /\.rotate\(\)/)
  assert.match(uploadPost, /\.webp\(/, 're-encoding drops EXIF and GPS')
  assert.match(uploadPost, /isPublic: false,\n\s*isMature: false,/)
  assert.match(uploadPost, /HYBRIDIZER_UPLOAD_DAILY_LIMIT/)
  assert.match(uploadPost, /HYBRIDIZER_UPLOAD_ACTIVE_LIMIT/)
  assert.doesNotMatch(uploadPost, /isPublic: true|isPublic: field/)
  assert.match(
    read('server/api/hybridizer/uploads/index.get.ts'),
    /where: \{ ownerUserId: user\.id, isActive: true \}/,
  )
  assert.match(
    read('server/api/hybridizer/uploads/[id].delete.ts'),
    /upload\.ownerUserId !== user\.id/,
  )
  const store = read('stores/hybridizerStore.ts')
  assert.match(store, /Authorization: 'Bearer ' \+ token/)
  assert.match(store, /clearUploads\(\)\n\s*hydrate\(\)/)
  const page = read('pages/admin/hybridizer.vue')
  assert.match(page, /data-testid="hybridizer-upload-form"/)
  assert.match(page, /HYBRIDIZER_UPLOAD_CONSENT/)
  assert.match(page, /'MINE'/)
  console.log('Hybridizer private ingredient upload contracts passed.')
}
