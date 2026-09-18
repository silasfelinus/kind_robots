// /utils/scripts/verifyArtArchivePresetModifiers.test.ts
//
// Self-test for art-archive/t-014's preset-modifier validator
// (server/utils/artArchivePresetModifiers.ts). No Prisma involved, so this
// runs without DATABASE_URL.
import assert from 'node:assert/strict'
import { validateArchivePresetModifiers } from '../../server/utils/artArchivePresetModifiers'

function testAddLoraAcceptsNameOrResourceId() {
  assert.equal(validateArchivePresetModifiers('ADD_LORA', { name: 'my-lora', weight: 0.8 }).valid, true)
  assert.equal(validateArchivePresetModifiers('ADD_LORA', { resourceId: 12 }).valid, true)
  console.log('verifyArtArchivePresetModifiers: ADD_LORA accepts a name or a resourceId')
}

function testAddLoraRejectsNeitherNameNorResourceId() {
  const result = validateArchivePresetModifiers('ADD_LORA', { weight: 0.8 })
  assert.equal(result.valid, false)
  console.log('verifyArtArchivePresetModifiers: ADD_LORA rejects modifiers with neither name nor resourceId')
}

function testReplaceCheckpointRejectsUnknownField() {
  const result = validateArchivePresetModifiers('REPLACE_CHECKPOINT', {
    checkpoint: 'my-checkpoint',
    typo: true,
  })
  assert.equal(result.valid, false)
  assert.ok(!result.valid && result.errors.some((error) => error.includes('typo')))
  console.log('verifyArtArchivePresetModifiers: REPLACE_CHECKPOINT rejects an unknown field')
}

function testReplacePromptRequiresPromptString() {
  assert.equal(validateArchivePresetModifiers('REPLACE_PROMPT', { negativePrompt: 'blurry' }).valid, false)
  assert.equal(validateArchivePresetModifiers('REPLACE_PROMPT', { promptString: 'a cat' }).valid, true)
  console.log('verifyArtArchivePresetModifiers: REPLACE_PROMPT requires promptString')
}

function testChangeSettingsRequiresAtLeastOneField() {
  assert.equal(validateArchivePresetModifiers('CHANGE_SETTINGS', {}).valid, false)
  assert.equal(validateArchivePresetModifiers('CHANGE_SETTINGS', { cfg: 7, steps: 30 }).valid, true)
  console.log('verifyArtArchivePresetModifiers: CHANGE_SETTINGS requires at least one setting')
}

function testAdditionalRenderAllowsEmptyModifiers() {
  assert.equal(validateArchivePresetModifiers('ADDITIONAL_RENDER', {}).valid, true)
  assert.equal(validateArchivePresetModifiers('ADDITIONAL_RENDER', { note: 'try again with more steps' }).valid, true)
  console.log('verifyArtArchivePresetModifiers: ADDITIONAL_RENDER allows empty or note-only modifiers')
}

function testReplaceSourceRequiresRelativePath() {
  assert.equal(validateArchivePresetModifiers('REPLACE_SOURCE', {}).valid, false)
  assert.equal(validateArchivePresetModifiers('REPLACE_SOURCE', { relativePath: 'a/b.png' }).valid, true)
  console.log('verifyArtArchivePresetModifiers: REPLACE_SOURCE requires relativePath')
}

function testRejectsNonObjectModifiers() {
  assert.equal(validateArchivePresetModifiers('CHANGE_SETTINGS', 'not-an-object').valid, false)
  assert.equal(validateArchivePresetModifiers('CHANGE_SETTINGS', null).valid, false)
  assert.equal(validateArchivePresetModifiers('CHANGE_SETTINGS', [1, 2]).valid, false)
  console.log('verifyArtArchivePresetModifiers: rejects non-object modifiers (string, null, array)')
}

function run() {
  testAddLoraAcceptsNameOrResourceId()
  testAddLoraRejectsNeitherNameNorResourceId()
  testReplaceCheckpointRejectsUnknownField()
  testReplacePromptRequiresPromptString()
  testChangeSettingsRequiresAtLeastOneField()
  testAdditionalRenderAllowsEmptyModifiers()
  testReplaceSourceRequiresRelativePath()
  testRejectsNonObjectModifiers()
  console.log('verifyArtArchivePresetModifiers: all assertions passed')
}

run()
