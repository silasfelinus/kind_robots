import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'

const manifestPath = 'config/wonderlab-voice-polish-batch-014.json'
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const sourceKey = `components/screenfx/${['siege', 'engine'].join('-')}.vue`

assert.equal(manifest.batchId, 'wonderlab-definitive-011')
assert.ok(Array.isArray(manifest.revisions))

const targets = new Map([
  [227, { reactionId: 1862, authorKind: 'BOT', authorId: 3 }],
  [228, { reactionId: 1863, authorKind: 'BOT', authorId: 18 }],
])

let corrected = 0
for (const revision of manifest.revisions) {
  const target = targets.get(revision.draftId)
  if (!target) continue

  assert.equal(revision.reactionId, target.reactionId)
  assert.equal(revision.componentId, 1261)
  assert.equal(revision.sourceKey, sourceKey)
  assert.equal(revision.author?.kind, target.authorKind)
  assert.equal(revision.author?.id, target.authorId)
  assert.match(revision.expectedCurrentCommentHash, /^[0-9a-f]{64}$/)
  assert.equal(revision.expectedRating, 4)
  assert.equal(revision.expectedReactionType, 'LOVED')

  revision.componentId = 1262
  corrected += 1
}

assert.equal(corrected, targets.size)
assert.equal(
  manifest.revisions.filter((revision) => revision.componentId === 1262).length,
  2,
)
assert.equal(
  manifest.revisions.filter((revision) => revision.componentId === 1261).length,
  0,
)

await writeFile(manifestPath, `${JSON.stringify(manifest)}\n`)
console.log('Corrected final-effect Component locks for drafts #227 and #228: 1261 -> 1262.')
