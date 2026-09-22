// /utils/scripts/verifyCivitaiIds.test.ts
//
// The lookup that silently did nothing.
//
// --fetch-tags reached 2 rows out of 1,221 on 2026-09-22 because it keyed on
// `civitaiModelId`, and almost no row has that column set -- the ids live in
// `civitaiUrl`. The preview backfill hit the identical wall earlier ("read
// 2,343 resources and found 0 with a version id"). A lookup that finds nothing
// and reports success is indistinguishable from an upstream with nothing to
// say, which is why this needs a test rather than a comment.
import assert from 'node:assert/strict'
import {
  civitaiModelIdFromUrl,
  civitaiTagNames,
  civitaiVersionIdFromUrl,
  resolveCivitaiIds,
} from '../civitaiIds'

// The real url shape, both ids in one string.
const URL = 'https://civitai.com/models/122806?modelVersionId=133805'
assert.equal(civitaiModelIdFromUrl(URL), 122806)
assert.equal(civitaiVersionIdFromUrl(URL), 133805)

// Model id without a version.
assert.equal(civitaiModelIdFromUrl('https://civitai.com/models/122806'), 122806)
assert.equal(civitaiVersionIdFromUrl('https://civitai.com/models/122806'), null)

// Nothing to find.
for (const value of [null, undefined, '', 'https://example.com/whatever']) {
  assert.equal(civitaiModelIdFromUrl(value), null)
  assert.equal(civitaiVersionIdFromUrl(value), null)
}

// A trailing slug after the id is normal and must not break the match.
assert.equal(
  civitaiModelIdFromUrl('https://civitai.com/models/4384/dreamshaper'),
  4384,
)

// Zero and negatives are not ids.
assert.equal(civitaiModelIdFromUrl('https://civitai.com/models/0'), null)

// Columns win when present, and say so.
assert.deepEqual(
  resolveCivitaiIds({
    civitaiModelId: 999,
    civitaiModelVersionId: 888,
    civitaiUrl: URL,
  }),
  {
    modelId: 999,
    versionId: 888,
    modelIdSource: 'column',
    versionIdSource: 'column',
  },
)

// THE CASE THAT WAS BROKEN: no columns, ids only in the url.
assert.deepEqual(resolveCivitaiIds({ civitaiUrl: URL }), {
  modelId: 122806,
  versionId: 133805,
  modelIdSource: 'url',
  versionIdSource: 'url',
})

// Half-populated rows resolve each id independently.
assert.deepEqual(resolveCivitaiIds({ civitaiModelId: 999, civitaiUrl: URL }), {
  modelId: 999,
  versionId: 133805,
  modelIdSource: 'column',
  versionIdSource: 'url',
})

// CivArchive uses the same `/models/<id>` shape, and is the only link a row
// keeps once Civitai removes the model.
assert.equal(
  resolveCivitaiIds({ customUrl: 'https://civitaiarchive.com/models/55555' })
    .modelId,
  55555,
)

// A row with nothing anywhere is reported as unreachable rather than guessed.
assert.deepEqual(resolveCivitaiIds({}), {
  modelId: null,
  versionId: null,
  modelIdSource: null,
  versionIdSource: null,
})

// Tags: plain strings, `{ name }` objects, and junk mixed together. An object
// stringifies to "[object Object]", which matches no category and reads
// exactly like a model with no tags.
assert.deepEqual(civitaiTagNames(['character', 'anime']), [
  'character',
  'anime',
])
assert.deepEqual(civitaiTagNames([{ name: 'style' }, { name: 'concept' }]), [
  'style',
  'concept',
])
assert.deepEqual(
  civitaiTagNames(['character', { name: 'style' }, null, '', 42]),
  ['character', 'style'],
)
assert.deepEqual(civitaiTagNames(undefined), [])
assert.deepEqual(civitaiTagNames('character'), [])

console.log('Civitai id resolution verified.')
