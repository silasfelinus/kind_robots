import assert from 'node:assert/strict'
import {
  assertArtImageMatchesCompletion,
  enrichArtJobPayload,
  hashArtImageData,
  validateArtJobCompletionProof,
} from '../../server/utils/artJobProvenance'

function workflow(prompt: string, seed: number) {
  return {
    '57': {
      class_type: 'SaveImage',
      inputs: {
        filename_prefix: 'kindrobots_test',
        images: ['7', 0],
      },
    },
    '24': {
      class_type: 'UnetLoaderGGUF',
      inputs: { unet_name: 'flux1-dev-Q8_0.gguf' },
    },
    '59': {
      class_type: 'ImpactWildcardEncode',
      inputs: {
        wildcard_text: prompt,
        populated_text: prompt,
        seed,
        model: ['24', 0],
      },
    },
  }
}

const promptA = 'A vampire family portrait in a velvet crypt lounge.'
const promptB = 'A lighthouse keeper confronting a sea monster.'
const imageDataA = Buffer.from('job-a-pixels').toString('base64')
const imageDataB = Buffer.from('job-b-pixels').toString('base64')
const imageHashA = hashArtImageData(imageDataA)
const imageHashB = hashArtImageData(imageDataB)

assert.ok(imageHashA)
assert.ok(imageHashB)
assert.notEqual(imageHashA, imageHashB)

const attemptA = enrichArtJobPayload(
  'COMFY',
  {
    promptString: promptA,
    workflow: workflow(promptA, 840009),
    seed: 840009,
  },
  {
    projectSlug: 'coloring-book',
    idempotencyKey: 'monster-recast:mr-009:840009',
    requireCompletionProof: true,
  },
)

const duplicateA = enrichArtJobPayload(
  'COMFY',
  {
    seed: 840009,
    workflow: workflow(promptA, 840009),
    promptString: `  ${promptA}  `,
  },
  {
    projectSlug: 'coloring-book',
    idempotencyKey: 'monster-recast:mr-009:840009',
    requireCompletionProof: true,
  },
)

assert.equal(
  attemptA.provenance.attemptFingerprint,
  duplicateA.provenance.attemptFingerprint,
  'the same normalized prompt/workflow/seed attempt must be idempotent',
)
assert.equal(attemptA.provenance.workflowPromptMatches, true)
assert.ok(
  attemptA.provenance.expectedModels.includes('flux1-dev-Q8_0.gguf'),
)

const attemptB = enrichArtJobPayload(
  'COMFY',
  {
    promptString: promptB,
    workflow: workflow(promptB, 840010),
    seed: 840010,
  },
  {
    projectSlug: 'coloring-book',
    idempotencyKey: 'monster-recast:mr-010:840010',
    requireCompletionProof: true,
  },
)

assert.notEqual(
  attemptA.provenance.attemptFingerprint,
  attemptB.provenance.attemptFingerprint,
  'different prompt attempts must never collapse onto one queue identity',
)

assert.throws(
  () =>
    enrichArtJobPayload('COMFY', {
      promptString: promptA,
      workflow: workflow(promptB, 840009),
    }),
  /workflow prompt does not match/i,
)

const verified = validateArtJobCompletionProof(attemptA.payload, {
  relayVersion: 'relay-test-1',
  relayCommit: 'abc123',
  promptId: 'comfy-prompt-a',
  promptHash: attemptA.provenance.promptHash,
  workflowHash: attemptA.provenance.workflowHash,
  workflowPromptHash: attemptA.provenance.workflowPromptHash,
  imageHash: imageHashA,
  output: {
    filename: 'job-a.png',
    subfolder: '',
    type: 'output',
  },
})

assert.equal(verified.verified, true)
assert.equal(verified.promptId, 'comfy-prompt-a')
assertArtImageMatchesCompletion(verified, imageDataA)
assert.throws(
  () => assertArtImageMatchesCompletion(verified, imageDataB),
  /bytes do not match/i,
  'a correct prompt_id tuple must not be associated with different uploaded pixels',
)

assert.throws(
  () =>
    validateArtJobCompletionProof(attemptA.payload, {
      relayVersion: 'relay-test-1',
      promptId: 'comfy-prompt-b',
      promptHash: attemptA.provenance.promptHash,
      workflowHash: attemptB.provenance.workflowHash,
      workflowPromptHash: attemptB.provenance.workflowPromptHash,
      imageHash: imageHashB,
      output: {
        filename: 'job-b.png',
        subfolder: '',
        type: 'output',
      },
    }),
  /provenance mismatch/i,
  'an out-of-order Comfy output must not complete the wrong ArtJob',
)

assert.throws(
  () => validateArtJobCompletionProof(attemptA.payload, null),
  /requires completion provenance/i,
)

console.log('ArtJob prompt provenance contract passed.')
