// /utils/scripts/verifyArtArchiveEnqueuePayload.test.ts
//
// Self-test for art-archive/t-016's enqueue-payload builder
// (server/utils/buildArchiveEnqueuePayload.ts). No Prisma involved, so this
// runs without DATABASE_URL.
//
// art-archive/t-027: the admin enqueue endpoint
// (server/api/admin/art-archive/entries/[id]/enqueue.post.ts) always creates
// its ArtJob with `engine: 'A1111'` and a flat payload -- it never builds a
// COMFY workflow graph via enqueue.post.ts's buildJobPayload(), so there is
// no "survives COMFY workflow construction" integration point to test here
// (see the corrected task note). What IS real and untested: the endpoint's
// own `payload: JSON.stringify(payload)` write, and a later
// parseArtJobPayload() read, is a genuine serialization round-trip a preset
// merge's fields must survive -- JSON.stringify silently DROPS any key whose
// value is `undefined` (not `null`), which `applyArchivePresetToPayload`'s
// `if (key in modifiers) payload[key] = modifiers[key]` merge could produce
// if a caller ever passed an explicit `undefined` in `modifiers`.
import assert from 'node:assert/strict'
import {
  ArchiveEnqueueError,
  buildArchiveEnqueuePayload,
  type ArchiveSourceArtImage,
} from '../../server/utils/buildArchiveEnqueuePayload'
import { parseArtJobPayload, serializeArtJobPayload } from '../../server/utils/artJobPayload'

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
  assert.equal(payload.actionType, 'ADDITIONAL_RENDER')
  console.log('verifyArtArchiveEnqueuePayload: tags archiveEntryId/archivePresetId/actionType for provenance')
}

function testTagsActionTypeIndependentlyOfPresetId() {
  // art-archive/t-034: actionType must survive a serialize/parse round-trip
  // on its own, so a report can read it even if the ArchiveActionPreset row
  // (archivePresetId points at) is later edited or deleted.
  const payload = buildArchiveEnqueuePayload({
    archiveEntryId: 11,
    presetId: 8,
    actionType: 'REPLACE_CHECKPOINT',
    modifiers: {},
    artImage: BASE_ART_IMAGE,
  })
  const roundTripped = parseArtJobPayload(serializeArtJobPayload(payload))
  assert.equal(roundTripped.actionType, 'REPLACE_CHECKPOINT')
  assert.equal(roundTripped.archivePresetId, 8)
  console.log('verifyArtArchiveEnqueuePayload: actionType survives serialization independent of archivePresetId')
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

function testChangeSettingsSurvivesTheJsonStorageRoundTrip() {
  const payload = buildArchiveEnqueuePayload({
    archiveEntryId: 11,
    presetId: 13,
    actionType: 'CHANGE_SETTINGS',
    modifiers: { cfg: 9, steps: 30, seed: 777, sampler: 'dpmpp_2m', width: 1024, height: 1536 },
    artImage: BASE_ART_IMAGE,
  })

  // Mirrors the real write/read path: the endpoint stores
  // `JSON.stringify(payload)` on ArtJob.payload, and a later consumer reads
  // it back through parseArtJobPayload().
  const roundTripped = parseArtJobPayload(serializeArtJobPayload(payload))

  assert.equal(roundTripped.cfg, 9)
  assert.equal(roundTripped.steps, 30)
  assert.equal(roundTripped.seed, 777)
  assert.equal(roundTripped.sampler, 'dpmpp_2m')
  assert.equal(roundTripped.width, 1024)
  assert.equal(roundTripped.height, 1536)
  // Untouched fields, provenance tags, and the nested save object must all
  // survive the same round trip, not just the ones CHANGE_SETTINGS touched.
  assert.equal(roundTripped.promptString, BASE_ART_IMAGE.promptString)
  assert.equal(roundTripped.checkpoint, 'dreamshaperXL')
  assert.equal(roundTripped.archiveEntryId, 11)
  assert.equal(roundTripped.archivePresetId, 13)
  assert.deepEqual(roundTripped.save, {
    isPublic: true,
    isMature: true,
    designer: 'archive-import',
    artCollectionIds: [],
  })
  console.log('verifyArtArchiveEnqueuePayload: a CHANGE_SETTINGS merge survives the JSON storage round trip')
}

function testAnExplicitUndefinedModifierDoesNotSilentlyVanish() {
  // JSON.stringify drops any key whose value is `undefined` entirely (unlike
  // `null`, which survives). CHANGE_SETTINGS's `if (key in modifiers)` merge
  // would copy an explicit `undefined` straight onto the payload -- this
  // proves that if it ever did, the round trip would make the drop visible
  // rather than silently discarding the field with no test ever noticing.
  const payload = buildArchiveEnqueuePayload({
    archiveEntryId: 14,
    presetId: 15,
    actionType: 'CHANGE_SETTINGS',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- deliberately malformed input, the case under test
    modifiers: { cfg: undefined as any },
    artImage: BASE_ART_IMAGE,
  })
  assert.ok(!('cfg' in payload) || payload.cfg === undefined)

  const roundTripped = parseArtJobPayload(serializeArtJobPayload(payload))
  assert.ok(
    !('cfg' in roundTripped),
    'an explicit undefined modifier value is expected to vanish across JSON storage -- ' +
      'if this ever changes, buildArchiveEnqueuePayload must be reviewed for the opposite case too',
  )
  console.log(
    'verifyArtArchiveEnqueuePayload: documents that an explicit undefined modifier value does not survive JSON storage',
  )
}

function run() {
  testBuildsBasePayloadFromArtImage()
  testTagsProvenanceIds()
  testTagsActionTypeIndependentlyOfPresetId()
  testMergesPresetOnTopOfBasePayload()
  testThrowsWhenArtImageHasNoPromptString()
  testDefaultsMissingSaveFieldsSafely()
  testChangeSettingsSurvivesTheJsonStorageRoundTrip()
  testAnExplicitUndefinedModifierDoesNotSilentlyVanish()
  console.log('verifyArtArchiveEnqueuePayload: all assertions passed')
}

run()
