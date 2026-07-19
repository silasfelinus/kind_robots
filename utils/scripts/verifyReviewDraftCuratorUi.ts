// /utils/scripts/verifyReviewDraftCuratorUi.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const pagePath = 'pages/admin/wonderlab-reviews.vue'
const source = await readFile(pagePath, 'utf8')

assert.match(source, /Personality review drafts/)
assert.match(source, /Nothing on this page publishes automatically/)
assert.match(source, /userStore\.isAdmin/)
assert.match(source, /\/api\/admin\/wonderlab\/review-drafts\?/)
assert.match(source, /method: 'PATCH'/)
assert.match(source, /status: 'APPROVED'/)
assert.match(source, /status: DraftStatus/)
assert.match(source, /\/publish`/)
assert.match(source, /Publish approved review/)
assert.match(source, /Create a curator-written draft/)
assert.match(source, /crypto\.subtle\.digest\('SHA-256'/)
assert.match(source, /promptVersion: 'curator-manual-v1'/)

const mountedBlock = source.match(/onMounted\([\s\S]*?\n\}\)/)?.[0] || ''
assert.doesNotMatch(mountedBlock, /publishDraft/)
assert.doesNotMatch(source, /setInterval\([\s\S]*publish/i)
assert.doesNotMatch(source, /watch\([\s\S]{0,300}publishDraft/)

console.log('Review draft curator UI contract passed.')
