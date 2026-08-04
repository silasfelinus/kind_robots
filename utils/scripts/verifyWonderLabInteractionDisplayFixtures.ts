// /utils/scripts/verifyWonderLabInteractionDisplayFixtures.ts
import assert from 'node:assert/strict'
import { getWonderLabPreviewFixture } from '@/utils/wonderlab/previewFixtureCatalog'

const stageSlot = getWonderLabPreviewFixture('stage-slot')
assert.ok(stageSlot?.props?.slot)
assert.deepEqual(stageSlot?.props?.characters, [])
assert.deepEqual(stageSlot?.props?.bots, [])
assert.equal(stageSlot?.props?.removable, false)
const slot = stageSlot?.props?.slot as Record<string, unknown>
assert.equal(slot.participantType, 'temporary-bot')
assert.equal(slot.participantId, null)
assert.ok(slot.temporary)

const butterfly = getWonderLabPreviewFixture('butterfly-component')
assert.ok(butterfly?.props?.butterfly)
const butterflyValue = butterfly?.props?.butterfly as Record<string, unknown>
assert.equal(butterflyValue.artImageId, undefined)
assert.ok(butterflyValue.wingTopColor)
assert.ok(butterflyValue.wingBottomColor)

const gallery = getWonderLabPreviewFixture('butterfly-gallery')
const slots = gallery?.props?.slots
assert.ok(Array.isArray(slots) && slots.length >= 6)
assert.ok(
  (slots as Array<Record<string, unknown>>).some((entry) => entry.butterfly),
)
assert.ok(
  (slots as Array<Record<string, unknown>>).some(
    (entry) => entry.butterfly === null,
  ),
)

for (const key of ['facet-picker', 'reaction-card', 'butterfly-modal'] as const) {
  const fixture = getWonderLabPreviewFixture(key)
  assert.ok(fixture?.skipReason, `${key} must explain its write/global context.`)
}

// Confirm previous fixture modules remain visible through the combined catalog.
assert.ok(getWonderLabPreviewFixture('builder-card')?.props?.card)
assert.ok(getWonderLabPreviewFixture('academy-style-detail')?.props?.lesson)
assert.ok(getWonderLabPreviewFixture('component-card')?.props?.component)

console.log('WonderLab interaction and display fixture verification passed.')
