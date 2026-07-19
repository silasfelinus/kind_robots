// /utils/scripts/verifyWonderLabReviewRolloutAudit.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const auditPath = 'server/utils/wonderLabReviewRolloutAudit.ts'
const endpointPath = 'server/api/admin/wonderlab/review-rollout.get.ts'
const pagePath = 'pages/admin/wonderlab-review-rollout.vue'
const runbookPath = 'docs/wonderlab-personality-review-rollout.md'
const productionWorkflowPath = '.github/workflows/wonderlab-production-rollout.yml'
const componentContractPath =
  'scripts/wonderlab-production-component-contract.mjs'

const [audit, endpoint, page, runbook, productionWorkflow, componentContract] =
  await Promise.all([
    readFile(auditPath, 'utf8'),
    readFile(endpointPath, 'utf8'),
    readFile(pagePath, 'utf8'),
    readFile(runbookPath, 'utf8'),
    readFile(productionWorkflowPath, 'utf8'),
    readFile(componentContractPath, 'utf8'),
  ])

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

assert.match(
  productionWorkflow,
  /Verify canonical Component API contract[\s\S]*wonderlab-production-component-contract\.mjs/,
)
assert.match(
  productionWorkflow,
  /component-contract-verification\.json/,
)
assert.match(productionWorkflow, /for \(const issue_number of \[381, 472, 473\]\)/)

for (const status of [
  'UNREVIEWED',
  'WORKING',
  'NEEDS_CONTEXT',
  'UNDER_CONSTRUCTION',
  'BROKEN',
  'RETIRED',
  'PREVIEW_UNSUPPORTED',
]) {
  assert.match(componentContract, new RegExp(status))
}
for (const retiredField of [
  'isWorking',
  'underConstruction',
  'isBroken',
]) {
  assert.match(componentContract, new RegExp(retiredField))
}
for (const sourceField of ['sourceKey', 'sourcePath', 'sourceHash']) {
  assert.match(componentContract, new RegExp(sourceField))
}
assert.match(componentContract, /\/api\/components/)
assert.match(componentContract, /contractVersion:\s*1/)
assert.match(componentContract, /component-contract-verification\.json/)
assert.match(componentContract, /Object\.prototype\.hasOwnProperty\.call/)
assert.doesNotMatch(componentContract, /method\s*:/)
assert.doesNotMatch(
  componentContract,
  /WONDERLAB_ADMIN_TOKEN|x-api-key|x-admin-token/,
)
assert.doesNotMatch(componentContract, /\/reconcile|\/publish|\/generate|\/approve/)

console.log('WonderLab review rollout audit contract passed.')
