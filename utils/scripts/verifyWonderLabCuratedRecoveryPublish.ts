// /utils/scripts/verifyWonderLabCuratedRecoveryPublish.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const runnerPath = 'scripts/wonderlab-curated-recovery-publish.mjs'
const workflowPath = '.github/workflows/wonderlab-curated-recovery-publish.yml'
const configPath = 'config/wonderlab-curated-recovery-publish.json'

const [runner, workflow, configSource] = await Promise.all([
  readFile(runnerPath, 'utf8'),
  readFile(workflowPath, 'utf8'),
  readFile(configPath, 'utf8'),
])
const config = JSON.parse(configSource) as {
  version: number
  minimumProductionCommit: string
  publications: Array<{
    draftId: number
    componentId: number
    sourceKey: string
    expectedStatus: string
    editedComment: string
  }>
}

assert.match(runner, /expectedStatus/)
assert.match(runner, /component\.sourceKey === instruction\.sourceKey/)
assert.match(runner, /component\.isDiscovered === true/)
assert.match(runner, /status: 'PROPOSED'/)
assert.match(runner, /status: 'APPROVED'/)
assert.match(runner, /failureReason: null/)
assert.match(runner, /retained its obsolete failure reason/)
assert.match(runner, /review-drafts\/\$\{instruction\.draftId\}\/publish/)
assert.match(runner, /duplicateFirstPartyReviews/)
assert.match(runner, /unsafeFirstPartyReviews/)
assert.match(runner, /publishedDraftMismatches/)
assert.doesNotMatch(runner, /review-drafts\/generate/)
assert.doesNotMatch(runner, /generate-batch/)
assert.doesNotMatch(runner, /DATABASE_URL/)
assert.doesNotMatch(runner, /prisma\./)

assert.match(workflow, /\[wonderlab-curated-publish\]/)
assert.match(workflow, /CYPRESS_BETA_ADMIN_TOKEN/)
assert.match(workflow, /check-deploy-ancestry\.sh/)
assert.match(workflow, /wonderlab-curated-recovery-artifacts/)

assert.equal(config.version, 1)
assert.match(config.minimumProductionCommit, /^[0-9a-f]{40}$/)
assert.ok(config.publications.length > 0 && config.publications.length <= 20)
assert.equal(
  new Set(config.publications.map((entry) => entry.draftId)).size,
  config.publications.length,
)
assert.ok(
  config.publications.every((entry) =>
    ['PROPOSED', 'FAILED', 'REJECTED', 'APPROVED'].includes(
      entry.expectedStatus,
    ),
  ),
)
assert.ok(
  config.publications.every(
    (entry) =>
      entry.sourceKey.startsWith('components/') &&
      entry.sourceKey.endsWith('.vue'),
  ),
)
assert.ok(
  config.publications.every(
    (entry) => entry.editedComment.trim().split(/\s+/).length >= 20,
  ),
)

console.log('WonderLab curated recovery publication contract passed.')
