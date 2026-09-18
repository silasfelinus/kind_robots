// /utils/scripts/verifyApplyArchivePresetToPayload.test.ts
//
// Self-test for art-archive/t-025's preset-to-payload merge
// (server/utils/applyArchivePresetToPayload.ts). No Prisma involved, so
// this runs without DATABASE_URL.
import assert from 'node:assert/strict'
import { applyArchivePresetToPayload } from '../../server/utils/applyArchivePresetToPayload'

function testAddLoraAppendsToExistingLoras() {
  const base = { loras: [{ name: 'old-lora', strength: 0.5 }] }
  const result = applyArchivePresetToPayload('ADD_LORA', { name: 'new-lora', weight: 0.8 }, base)
  assert.deepEqual(result.loras, [
    { name: 'old-lora', strength: 0.5 },
    { name: 'new-lora', strength: 0.8 },
  ])
  // base is never mutated
  assert.deepEqual(base.loras, [{ name: 'old-lora', strength: 0.5 }])
  console.log('verifyApplyArchivePresetToPayload: ADD_LORA appends without mutating base')
}

function testReplaceLoraOverwritesExistingLoras() {
  const base = { loras: [{ name: 'old-lora' }, { name: 'another-lora' }] }
  const result = applyArchivePresetToPayload('REPLACE_LORA', { resourceId: 42, weight: 1 }, base)
  assert.deepEqual(result.loras, [{ resourceId: 42, strength: 1 }])
  console.log('verifyApplyArchivePresetToPayload: REPLACE_LORA replaces the whole loras array')
}

function testReplaceCheckpointSetsBothFields() {
  const result = applyArchivePresetToPayload(
    'REPLACE_CHECKPOINT',
    { checkpoint: 'dreamshaperXL', checkpointResourceId: 7 },
    { checkpoint: 'old-checkpoint' },
  )
  assert.equal(result.checkpoint, 'dreamshaperXL')
  assert.equal(result.checkpointResourceId, 7)
  console.log('verifyApplyArchivePresetToPayload: REPLACE_CHECKPOINT sets checkpoint and checkpointResourceId')
}

function testAppendPromptJoinsExistingText() {
  const result = applyArchivePresetToPayload(
    'APPEND_PROMPT',
    { promptString: 'glowing eyes', negativePrompt: 'blurry' },
    { promptString: 'a butterfly over a rooftop', negativePrompt: 'watermark' },
  )
  assert.equal(result.promptString, 'a butterfly over a rooftop, glowing eyes')
  assert.equal(result.negativePrompt, 'watermark, blurry')
  console.log('verifyApplyArchivePresetToPayload: APPEND_PROMPT joins onto existing prompt/negativePrompt')
}

function testAppendPromptWithNoExistingTextDoesNotLeadingComma() {
  const result = applyArchivePresetToPayload('APPEND_PROMPT', { promptString: 'glowing eyes' }, {})
  assert.equal(result.promptString, 'glowing eyes')
  console.log('verifyApplyArchivePresetToPayload: APPEND_PROMPT with no existing prompt has no leading comma')
}

function testReplacePromptOverwrites() {
  const result = applyArchivePresetToPayload(
    'REPLACE_PROMPT',
    { promptString: 'a cat' },
    { promptString: 'a butterfly', negativePrompt: 'blurry' },
  )
  assert.equal(result.promptString, 'a cat')
  assert.equal(result.negativePrompt, 'blurry')
  console.log('verifyApplyArchivePresetToPayload: REPLACE_PROMPT overwrites promptString, leaves untouched fields alone')
}

function testChangeSettingsOverwritesOnlyListedFields() {
  const result = applyArchivePresetToPayload(
    'CHANGE_SETTINGS',
    { cfg: 7, steps: 30 },
    { cfg: 3, steps: 20, seed: 123, checkpoint: 'unrelated' },
  )
  assert.equal(result.cfg, 7)
  assert.equal(result.steps, 30)
  assert.equal(result.seed, 123)
  assert.equal(result.checkpoint, 'unrelated')
  console.log('verifyApplyArchivePresetToPayload: CHANGE_SETTINGS overwrites only the listed fields')
}

function testAdditionalRenderReturnsBasePayloadUnchanged() {
  const base = { promptString: 'a butterfly', cfg: 3 }
  const result = applyArchivePresetToPayload('ADDITIONAL_RENDER', { note: 'try again' }, base)
  assert.deepEqual(result, base)
  console.log('verifyApplyArchivePresetToPayload: ADDITIONAL_RENDER leaves the payload unchanged')
}

function testReplaceSourceSetsRelativePath() {
  const result = applyArchivePresetToPayload('REPLACE_SOURCE', { relativePath: 'a/b.png' }, {})
  assert.equal(result.relativePath, 'a/b.png')
  console.log('verifyApplyArchivePresetToPayload: REPLACE_SOURCE sets relativePath')
}

function run() {
  testAddLoraAppendsToExistingLoras()
  testReplaceLoraOverwritesExistingLoras()
  testReplaceCheckpointSetsBothFields()
  testAppendPromptJoinsExistingText()
  testAppendPromptWithNoExistingTextDoesNotLeadingComma()
  testReplacePromptOverwrites()
  testChangeSettingsOverwritesOnlyListedFields()
  testAdditionalRenderReturnsBasePayloadUnchanged()
  testReplaceSourceSetsRelativePath()
  console.log('verifyApplyArchivePresetToPayload: all assertions passed')
}

run()
