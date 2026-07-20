// /utils/scripts/verifyReviewDraftGeneration.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const generatorPath = 'server/utils/wonderLabReviewDraftGenerator.ts'
const endpointPath = 'server/api/admin/wonderlab/review-drafts/generate.post.ts'
const pagePath = 'pages/admin/wonderlab-review-generator.vue'
const repositoryPath = 'server/utils/reviewDraftRepository.ts'

const generator = await readFile(generatorPath, 'utf8')
const endpoint = await readFile(endpointPath, 'utf8')
const page = await readFile(pagePath, 'utf8')
const repository = await readFile(repositoryPath, 'utf8')

assert.match(endpoint, /requireAdminApiUser\(event\)/)
assert.match(endpoint, /generateWonderLabReviewDraft/)
assert.match(endpoint, /openai review generation timed out/i)
assert.doesNotMatch(endpoint, /publishReviewDraft/)
assert.doesNotMatch(endpoint, /status:\s*'APPROVED'/)

assert.match(generator, /buildWonderLabReviewDraftPrompt/)
assert.match(generator, /rankWonderLabReviewers/)
assert.match(generator, /prisma\.narratorThread\.findMany/)
assert.match(generator, /response_format:[\s\S]*type: 'json_schema'/)
assert.match(generator, /validateGeneratedPayload/)
assert.match(generator, /MINIMUM_CONFIDENCE/)
assert.match(generator, /REVIEW_GENERATION_TIMEOUT_MS = 30_000/)
assert.match(generator, /timed out before the serverless deadline/)
assert.match(generator, /status: 'FAILED'/)
assert.match(generator, /createReviewDraft/)
assert.match(generator, /generationAttempt: attempt/)
assert.doesNotMatch(generator, /INSERT\s+INTO\s+Reaction/i)
assert.doesNotMatch(generator, /UPDATE\s+Reaction/i)
assert.doesNotMatch(generator, /publishReviewDraft/)

assert.match(repository, /generationAttempt\?: number/)
assert.match(repository, /generationAttempt\n\s*\)/)
assert.match(repository, /\$\{generationAttempt\}/)

assert.match(page, /This creates a proposed draft only/)
assert.match(page, /\/api\/admin\/wonderlab\/review-drafts\/generate/)
assert.match(page, /Open curator workspace/)
assert.doesNotMatch(page, /\/publish/)
assert.doesNotMatch(page, /status:\s*'APPROVED'/)

console.log('Review draft generation contract passed.')
