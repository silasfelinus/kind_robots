// /utils/scripts/verifyWonderLabReviewBatchPlan.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const planPath = 'server/utils/wonderLabReviewPlan.ts'
const getPath = 'server/api/admin/wonderlab/review-plan.get.ts'
const batchPath = 'server/api/admin/wonderlab/review-drafts/generate-batch.post.ts'
const pagePath = 'pages/admin/wonderlab-review-plan.vue'

const plan = await readFile(planPath, 'utf8')
const getEndpoint = await readFile(getPath, 'utf8')
const batch = await readFile(batchPath, 'utf8')
const page = await readFile(pagePath, 'utf8')

assert.match(getEndpoint, /requireAdminApiUser\(event\)/)
assert.match(getEndpoint, /buildWonderLabReviewPlan/)
assert.match(getEndpoint, /reviewersPerComponent/)

assert.match(plan, /rankWonderLabReviewers/)
assert.match(plan, /reviewer\.kind !== first\.reviewer\.kind/)
assert.match(plan, /coverage: coverageStatus/)
assert.match(plan, /'MISSING' \| 'DRAFTED' \| 'PUBLISHED'/)
assert.match(plan, /authorBotId IS NOT NULL OR authorCharacterId IS NOT NULL/)
assert.doesNotMatch(plan, /INSERT\s+INTO/i)
assert.doesNotMatch(plan, /UPDATE\s+/i)
assert.doesNotMatch(plan, /DELETE\s+FROM/i)

assert.match(batch, /const MAX_BATCH_COMPONENTS = 10/)
assert.match(batch, /const MAX_BATCH_GENERATIONS = 20/)
assert.match(batch, /booleanValue\(body\.dryRun, true, 'dryRun'\)/)
assert.match(batch, /if \(dryRun\)/)
assert.match(batch, /no model calls or writes were made/i)
assert.match(batch, /for \(const target of targets\)/)
assert.match(batch, /generateWonderLabReviewDraft/)
assert.match(batch, /coverage === 'PUBLISHED'\) return false/)
assert.doesNotMatch(batch, /publishReviewDraft/)
assert.doesNotMatch(batch, /status:\s*'APPROVED'/)

assert.match(page, /Preview deterministic reviewer assignments/)
assert.match(page, /Batch generation creates proposed drafts only/)
assert.match(page, /executeEnabled/)
assert.match(page, /runBatch\(true\)/)
assert.match(page, /runBatch\(false\)/)
assert.match(page, /dryRun,/)
assert.match(page, /Enable model calls for this batch/)
assert.doesNotMatch(page, /onMounted\([\s\S]{0,500}runBatch\(false\)/)
assert.doesNotMatch(page, /\/publish/)

console.log('WonderLab review batch planning contract passed.')
