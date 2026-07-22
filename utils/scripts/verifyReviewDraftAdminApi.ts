// /utils/scripts/verifyReviewDraftAdminApi.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  assertReviewDraftTransition,
  buildReviewDraftKey,
  canTransitionReviewDraft,
  finalReviewDraftComment,
  normalizeReviewDraftRating,
  reviewDraftAuthor,
} from '@/utils/wonderlab/reviewDraft'

const bot = reviewDraftAuthor(7, null)
const character = reviewDraftAuthor(null, 9)
assert.deepEqual(bot, { kind: 'BOT', id: 7 })
assert.deepEqual(character, { kind: 'CHARACTER', id: 9 })
assert.throws(() => reviewDraftAuthor(null, null), /exactly one/i)
assert.throws(() => reviewDraftAuthor(7, 9), /exactly one/i)

const keyA = buildReviewDraftKey({
  componentId: 12,
  author: bot,
  promptVersion: 'wonderlab-v1',
  promptHash: 'abc123',
})
const keyB = buildReviewDraftKey({
  componentId: 12,
  author: bot,
  promptVersion: 'wonderlab-v1',
  promptHash: 'abc123',
})
const keyC = buildReviewDraftKey({
  componentId: 12,
  author: character,
  promptVersion: 'wonderlab-v1',
  promptHash: 'abc123',
})
assert.equal(keyA, keyB, 'draft keys must be deterministic')
assert.notEqual(keyA, keyC, 'reviewer identity must be part of the key')
assert.ok(keyA.length <= 191)

assert.equal(normalizeReviewDraftRating(7), 5)
assert.equal(normalizeReviewDraftRating(-2), 0)
assert.equal(finalReviewDraftComment({ generatedComment: 'generated', editedComment: ' edited ' }), 'edited')
assert.equal(canTransitionReviewDraft('PROPOSED', 'APPROVED'), true)
assert.equal(canTransitionReviewDraft('PUBLISHED', 'PROPOSED'), false)
assert.throws(() => assertReviewDraftTransition('SUPERSEDED', 'APPROVED'), /cannot transition/i)

const listPath = 'server/api/admin/wonderlab/review-drafts/index.get.ts'
const createPath = 'server/api/admin/wonderlab/review-drafts/index.post.ts'
const detailPath = 'server/api/admin/wonderlab/review-drafts/[id].get.ts'
const patchPath = 'server/api/admin/wonderlab/review-drafts/[id].patch.ts'
const statsPath = 'server/api/admin/wonderlab/review-drafts/stats.get.ts'
const reactionGuardPath = 'server/api/admin/wonderlab/reactions/[id].get.ts'
const paths = [listPath, createPath, detailPath, patchPath, statsPath, reactionGuardPath]

for (const path of paths) {
  const source = await readFile(path, 'utf8')
  assert.match(source, /requireAdminApiUser\(event\)/, `${path} must be admin-only`)
}

const createSource = await readFile(createPath, 'utf8')
assert.doesNotMatch(createSource, /publisherUserId\??:/)
assert.doesNotMatch(createSource, /publishedReactionId\??:/)
assert.doesNotMatch(createSource, /status\??:/)

const patchSource = await readFile(patchPath, 'utf8')
assert.match(patchSource, /controlled publication service/i)

const statsSource = await readFile(statsPath, 'utf8')
assert.match(statsSource, /SELECT MAX\(id\) AS highestDraftId, COUNT\(\*\) AS reviewDrafts/)
assert.match(statsSource, /WHERE \(\? IS NULL OR status = \?\)/)
assert.match(statsSource, /normalizeReviewDraftStatus/)
assert.doesNotMatch(statsSource, /ORDER BY|LIMIT|\$executeRaw|INSERT\s+INTO|UPDATE\s+|DELETE\s+FROM/i)

const reactionGuardSource = await readFile(reactionGuardPath, 'utf8')
assert.match(reactionGuardSource, /WHERE r\.id = \$\{reactionId\}/)
assert.match(reactionGuardSource, /LIMIT 1/)
assert.doesNotMatch(reactionGuardSource, /WHERE r\.componentId/)

const applySource = await readFile('scripts/apply-wonderlab-voice-polish-batch.mjs', 'utf8')
assert.match(applySource, /\/api\/admin\/wonderlab\/reactions\/\$\{revision\.reactionId\}/)
assert.doesNotMatch(applySource, /\/api\/reactions\/component\//)

const inventorySource = await readFile('scripts/wonderlab-definitive-inventory.mjs', 'utf8')
assert.match(inventorySource, /\/api\/admin\/wonderlab\/review-drafts\/stats\?status=PUBLISHED/)
assert.match(inventorySource, /expectedPublishedReviews/)
assert.match(inventorySource, /Published ReviewDraft scan was incomplete/)
assert.doesNotMatch(inventorySource, /review-drafts\?status=PUBLISHED&limit=200/)

const repositorySource = await readFile('server/utils/reviewDraftRepository.ts', 'utf8')
assert.match(repositorySource, /INSERT IGNORE INTO ReviewDraft/)
assert.doesNotMatch(repositorySource, /INSERT\s+(?:IGNORE\s+)?INTO\s+Reaction/i)
assert.doesNotMatch(repositorySource, /DELETE\s+FROM\s+Reaction/i)

console.log('Review draft admin API contract passed.')