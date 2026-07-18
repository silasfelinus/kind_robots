// /utils/scripts/verifyWonderLabCoverageClosureFixtures.ts
import assert from 'node:assert/strict'
import { getWonderLabPreviewFixture } from '@/utils/wonderlab/previewFixtureCatalog'

const character = getWonderLabPreviewFixture('character-sheet')
assert.ok(character?.props?.sheet)
assert.ok(Array.isArray(character?.props?.rewardSlots))
assert.equal(character?.props?.isBuilderMode, false)
assert.equal(character?.props?.allowArt, false)
const characterSheet = character?.props?.sheet as Record<string, unknown>
assert.equal(characterSheet.id, null)
assert.equal(characterSheet.artImageId, null)
assert.equal(characterSheet.imagePath, null)
assert.ok(Array.isArray(characterSheet.rewards))

const coloring = getWonderLabPreviewFixture('coloring-canvas')
assert.ok(coloring?.props?.page)
assert.ok(coloring?.props?.fills)
assert.equal(coloring?.props?.interactive, false)
assert.equal(typeof coloring?.props?.paletteResolver, 'function')
const coloringPage = coloring?.props?.page as Record<string, unknown>
assert.equal(coloringPage.mode, 'svg-regions')
assert.ok(Array.isArray(coloringPage.regions))
assert.ok(Array.isArray(coloringPage.palette))

const pitchSheet = getWonderLabPreviewFixture('dream-pitch-sheet')
assert.ok(pitchSheet?.props?.dream)
assert.ok(pitchSheet?.props?.sheet)
assert.equal(pitchSheet?.props?.autoLoad, false)
assert.equal(pitchSheet?.props?.ensureOnLoad, false)
assert.equal(pitchSheet?.props?.allowEnsure, false)
assert.equal(pitchSheet?.props?.allowEdit, false)
assert.equal(pitchSheet?.props?.allowActions, false)
assert.equal(pitchSheet?.props?.showImage, false)

for (const key of [
  'art-builder',
  'project-deliverables-panel',
  'project-front-page',
  'project-pitch-board',
  'dream-sheet-toolbar',
  'model-builder-batch-editor',
  'model-builder-item-panel',
  'conductor-art-gallery',
  'conductor-project-chat',
  'chat-card',
] as const) {
  const fixture = getWonderLabPreviewFixture(key)
  assert.ok(fixture?.skipReason, `${key} must explain its workflow context.`)
}

// Confirm earlier fixture modules remain available through the complete catalog.
assert.ok(getWonderLabPreviewFixture('butterfly-gallery')?.props?.slots)
assert.ok(getWonderLabPreviewFixture('builder-card')?.props?.card)
assert.ok(getWonderLabPreviewFixture('component-card')?.props?.component)

console.log('WonderLab final preview coverage verification passed.')
