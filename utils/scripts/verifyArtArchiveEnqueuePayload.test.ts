// /utils/scripts/verifyArtArchiveEnqueuePayload.test.ts
//
// Self-test for art-archive/t-016's enqueue-payload builder
// (server/utils/buildArchiveEnqueuePayload.ts). No Prisma involved, so this
// runs without DATABASE_URL.
import assert from 'node:assert/strict'
import {
  ArchiveEnqueueError,
  buildArchiveEnqueuePayload,
  type ArchiveSourceArtImage,
} from '../../server/utils/buildArchiveEnqueuePayload'

const BASE_ART_IMAGE: ArchiveSourceArtImage = {
  promptString: 'a rainbow butterfly over a rooftop',
  negativePrompt: 'watermark',
  checkpoint: 'dreamshaperXL',
  checkpointResourceId: 12,
  cfg: 3,
  cfgHalf: false,
  sampler: 'euler',
  seed: 42,
  steps: 20,
  isPublic: true,
  isMature: true,
  designer: 'archive-import',
}

function testBuildsBasePayloadFromArtImage() {
  const payload = buildArchiveEnqueuePayload({
    archiveEntryId: 7,
    presetId: 3,
    actionType: 'ADDITIONAL_RENDER',
    modifiers: {},
    artImage: BASE_ART_IMAGE,
  })
  assert.equal(payload.promptString, BASE_ART_IMAGE.promptString)
  assert.equal(payload.negativePrompt, 'watermark')
  assert.equal(payload.checkpoint, 'dreamshaperXL')
  assert.equal(payload.checkpointResourceId, 12)
  assert.equal(payload.cfg, 3)
  assert.equal(payload.sampler, 'euler')
  assert.equal(payload.seed, 42)
  assert.equal(payload.steps, 20)
  assert.deepEqual(payload.save, {
    isPublic: true,
    isMature: true,
    designer: 'archive-import',
    artCollectionIds: [],
  })
  console.log('verifyArtArchiveEnqueuePayload: builds a base payload from the source ArtImage')
}

function testTagsProvenanceIds() {
  const payload = buildArchiveEnqueuePayload({
    archiveEntryId: 9,
    presetId: 4,
    actionType: 'ADDITIONAL_RENDER',
    modifiers: {},
    artImage: BASE_ART_IMAGE,
  })
  assert.equal(payload.archiveEntryId, 9)
  assert.equal(payload.archivePresetId, 4)
  console.log('verifyArtArchiveEnqueuePayload: tags archiveEntryId/archivePresetId for provenance')
}

function testMergesPresetOnTopOfBasePayload() {
  const payload = buildArchiveEnqueuePayload({
    archiveEntryId: 1,
    presetId: 2,
    actionType: 'REPLACE_PROMPT',
    modifiers: { promptString: 'a cat instead' },
    artImage: BASE_ART_IMAGE,
  })
  assert.equal(payload.promptString, 'a cat instead')
  // Untouched fields still come from the base ArtImage.
  assert.equal(payload.checkpoint, 'dreamshaperXL')
  console.log('verifyArtArchiveEnqueuePayload: merges the preset on top of the base payload')
}

function testThrowsWhenArtImageHasNoPromptString() {
  assert.throws(
    () =>
      buildArchiveEnqueuePayload({
        archiveEntryId: 5,
        presetId: 6,
        actionType: 'ADDITIONAL_RENDER',
        modifiers: {},
        artImage: { ...BASE_ART_IMAGE, promptString: null },
      }),
    ArchiveEnqueueError,
  )
  assert.throws(
    () =>
      buildArchiveEnqueuePayload({
        archiveEntryId: 5,
        presetId: 6,
        actionType: 'ADDITIONAL_RENDER',
        modifiers: {},
        artImage: { ...BASE_ART_IMAGE, promptString: '   ' },
      }),
    ArchiveEnqueueError,
  )
  console.log('verifyArtArchiveEnqueuePayload: throws ArchiveEnqueueError when promptString is empty/blank')
}

function testDefaultsMissingSaveFieldsSafely() {
  const payload = buildArchiveEnqueuePayload({
    archiveEntryId: 8,
    presetId: 1,
    actionType: 'ADDITIONAL_RENDER',
    modifiers: {},
    artImage: {
      ...BASE_ART_IMAGE,
      isPublic: null,
      isMature: null,
      designer: null,
      negativePrompt: null,
      cfgHalf: null,
    },
  })
  assert.deepEqual(payload.save, {
    isPublic: true,
    isMature: true,
    designer: null,
    artCollectionIds: [],
  })
  assert.equal(payload.negativePrompt, '')
  assert.equal(payload.cfgHalf, false)
  console.log('verifyArtArchiveEnqueuePayload: defaults missing nullable ArtImage fields safely')
}

function run() {
  testBuildsBasePayloadFromArtImage()
  testTagsProvenanceIds()
  testMergesPresetOnTopOfBasePayload()
  testThrowsWhenArtImageHasNoPromptString()
  testDefaultsMissingSaveFieldsSafely()
  console.log('verifyArtArchiveEnqueuePayload: all assertions passed')
}

run()
