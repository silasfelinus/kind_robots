// /utils/scripts/verifyWonderLabReviewBatchPlan.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { selectWonderLabReviewPortfolioBatch } from '@/utils/wonderlab/reviewPortfolioBatch'

const portfolioPlanPath = 'server/utils/wonderLabReviewBatchPlan.ts'
const selectorPath = 'utils/wonderlab/reviewPortfolioBatch.ts'
const getPath = 'server/api/admin/wonderlab/review-plan.get.ts'
const batchPath = 'server/api/admin/wonderlab/review-drafts/generate-batch.post.ts'
const pagePath = 'pages/admin/wonderlab-review-plan.vue'

const portfolioPlan = await readFile(portfolioPlanPath, 'utf8')
const selector = await readFile(selectorPath, 'utf8')
const getEndpoint = await readFile(getPath, 'utf8')
const batch = await readFile(batchPath, 'utf8')
const page = await readFile(pagePath, 'utf8')

assert.match(getEndpoint, /requireAdminApiUser\(event\)/)
assert.match(getEndpoint, /buildWonderLabReviewBatchPlan/)
assert.match(getEndpoint, /globally portfolio-planned/)
assert.doesNotMatch(getEndpoint, /buildWonderLabReviewPlan/)

assert.match(portfolioPlan, /buildWonderLabReviewPortfolio/)
assert.match(portfolioPlan, /limit: 500/)
assert.match(portfolioPlan, /minimumAssignmentsPerReviewer: 2/)
assert.match(portfolioPlan, /representationMinimumScore: 1/)
assert.match(portfolioPlan, /selectWonderLabReviewPortfolioBatch/)
assert.match(portfolioPlan, /assignmentMode: globalPortfolio\.assignmentMode/)
assert.doesNotMatch(portfolioPlan, /INSERT\s+INTO|UPDATE\s+|DELETE\s+FROM/i)

assert.match(selector, /cast representation floor:/)
assert.match(selector, /Explicit IDs preserve caller order/)
assert.doesNotMatch(selector, /prisma|\$fetch|fetch\(/)

assert.match(batch, /const MAX_BATCH_COMPONENTS = 10/)
assert.match(batch, /const MAX_BATCH_GENERATIONS = 20/)
assert.match(batch, /buildWonderLabReviewBatchPlan/)
assert.doesNotMatch(batch, /buildWonderLabReviewPlan/)
assert.match(batch, /booleanValue\(body\.dryRun, true, 'dryRun'\)/)
assert.match(batch, /if \(dryRun\)/)
assert.match(batch, /no model calls or writes were made/i)
assert.match(batch, /Small batches must not invent a different cast/)
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

const genericMissing = {
  coverage: 'MISSING' as const,
  score: 20,
  reasons: ['shared expertise: interface'],
}
const representationMissing = {
  coverage: 'MISSING' as const,
  score: 5,
  reasons: ['cast representation floor: assignment 1 of 2'],
}
const published = {
  coverage: 'PUBLISHED' as const,
  score: 50,
  reasons: ['existing publication'],
}
const exhibits = [
  { componentId: 1, reviewers: [genericMissing] },
  { componentId: 2, reviewers: [representationMissing] },
  { componentId: 3, reviewers: [published] },
]

assert.deepEqual(
  selectWonderLabReviewPortfolioBatch(exhibits, { limit: 1 }).map(
    (exhibit) => exhibit.componentId,
  ),
  [2],
  'automatic batches should prioritize missing cast-representation assignments',
)
assert.deepEqual(
  selectWonderLabReviewPortfolioBatch(exhibits, {
    componentIds: [3, 1, 3],
    limit: 1,
  }).map((exhibit) => exhibit.componentId),
  [3, 1],
  'explicit Component IDs should preserve caller order and ignore the automatic limit',
)

console.log('WonderLab review batch planning contract passed.')
