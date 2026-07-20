// /utils/scripts/verifyReviewDraftGeneration.ts
import './verifyWonderLabReviewGrounding'
import './verifyWonderLabSourceEvidence'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const generatorPath = 'server/utils/wonderLabReviewDraftGenerator.ts'
const endpointPath = 'server/api/admin/wonderlab/review-drafts/generate.post.ts'
const groundingGatePath = 'server/utils/wonderLabReviewGroundingGate.ts'
const groundingPath = 'utils/wonderlab/reviewDraftGrounding.ts'
const evidencePath = 'utils/wonderlab/componentSourceEvidence.mjs'
const promptPath = 'utils/wonderlab/reviewDraftPrompt.ts'
const pagePath = 'pages/admin/wonderlab-review-generator.vue'
const repositoryPath = 'server/utils/reviewDraftRepository.ts'

const generator = await readFile(generatorPath, 'utf8')
const endpoint = await readFile(endpointPath, 'utf8')
const groundingGate = await readFile(groundingGatePath, 'utf8')
const grounding = await readFile(groundingPath, 'utf8')
const evidence = await readFile(evidencePath, 'utf8')
const prompt = await readFile(promptPath, 'utf8')
const page = await readFile(pagePath, 'utf8')
const repository = await readFile(repositoryPath, 'utf8')

assert.match(endpoint, /requireAdminApiUser\(event\)/)
assert.match(endpoint, /generateWonderLabReviewDraft/)
assert.match(endpoint, /enforceWonderLabReviewGrounding/)
assert.match(endpoint, /held for editorial safety review/)
assert.match(endpoint, /openai review generation timed out/i)
assert.doesNotMatch(endpoint, /publishReviewDraft/)
assert.doesNotMatch(endpoint, /status:\s*'APPROVED'/)

assert.match(groundingGate, /assertWonderLabReviewGrounding/)
assert.match(groundingGate, /resolveWonderLabReviewSourceEvidence/)
assert.match(groundingGate, /status: 'FAILED'/)
assert.match(groundingGate, /Grounding validation failed/)
assert.doesNotMatch(groundingGate, /status: 'APPROVED'/)
assert.doesNotMatch(groundingGate, /publishReviewDraft/)

assert.match(grounding, /highSignalMatches\.length >= 1/)
assert.match(grounding, /nativeElementMatches\.length >= 2/)
assert.match(grounding, /declarativeSourceClaim/)
assert.match(grounding, /unsupported causal experience claim/)
assert.match(grounding, /unsupported inference from identifiers/)
assert.match(grounding, /unsupported visual deficiency judgment/)
assert.match(grounding, /unverified device responsiveness/)
assert.match(grounding, /unsupported source observations/)
assert.match(grounding, /wonderLabSourceEvidenceByPath/)

assert.match(evidence, /browserEvents/)
assert.match(evidence, /requestAnimationFrame\|cancelAnimationFrame/)
assert.match(evidence, /styleBindings/)
assert.match(evidence, /cssAnimations/)
assert.match(evidence, /storeCalls/)

assert.match(prompt, /Use source-declarative language/)
assert.match(prompt, /Do not say they ensure, encourage, invite, suggest, hint, imply/)
assert.match(prompt, /write every observation as a declarative source claim/)
assert.match(prompt, /do not turn fallback text into a judgment about visual quality/)

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
