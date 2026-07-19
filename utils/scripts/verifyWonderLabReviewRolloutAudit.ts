// /utils/scripts/verifyWonderLabReviewRolloutAudit.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const auditPath = 'server/utils/wonderLabReviewRolloutAudit.ts'
const endpointPath = 'server/api/admin/wonderlab/review-rollout.get.ts'
const pagePath = 'pages/admin/wonderlab-review-rollout.vue'
const runbookPath = 'docs/wonderlab-personality-review-rollout.md'

const audit = await readFile(auditPath, 'utf8')
const endpoint = await readFile(endpointPath, 'utf8')
const page = await readFile(pagePath, 'utf8')
const runbook = await readFile(runbookPath, 'utf8')

assert.match(endpoint, /requireAdminApiUser\(event\)/)
assert.match(endpoint, /auditWonderLabReviewRollout/)

assert.match(audit, /20260719031500_reaction_first_party_author_expand/)
assert.match(audit, /20260719033500_review_draft_storage_expand/)
assert.match(audit, /duplicateFirstPartyReviews/)
assert.match(audit, /unsafeFirstPartyReviews/)
assert.match(audit, /publishedDraftMismatches/)
assert.match(audit, /authorBotId IS NULL[\s\S]*authorCharacterId IS NULL/)
assert.match(audit, /HAVING COUNT\(\*\) > 1/)
assert.match(audit, /NOT \(r\.authorBotId <=> rd\.authorBotId\)/)
assert.doesNotMatch(audit, /\$executeRaw/)
assert.doesNotMatch(audit, /INSERT\s+INTO/i)
assert.doesNotMatch(audit, /UPDATE\s+/i)
assert.doesNotMatch(audit, /DELETE\s+FROM/i)

assert.match(page, /Read-only production checks/)
assert.match(page, /This page never generates, approves, or publishes/)
assert.match(page, /\/api\/admin\/wonderlab\/review-rollout/)
assert.doesNotMatch(page, /method:\s*'POST'/)
assert.doesNotMatch(page, /method:\s*'PATCH'/)
assert.doesNotMatch(page, /\/publish/)

assert.match(runbook, /Human and community Reactions are never deleted/)
assert.match(runbook, /Dry run defaults to true/)
assert.match(runbook, /Only an `APPROVED` draft can be published/)
assert.match(runbook, /Do not manually edit `_prisma_migrations`/)
assert.match(runbook, /Dotti/)
assert.match(runbook, /Catbot/)

console.log('WonderLab review rollout audit contract passed.')
