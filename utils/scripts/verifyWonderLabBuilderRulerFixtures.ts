// /utils/scripts/verifyWonderLabBuilderRulerFixtures.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { getWonderLabPreviewFixture } from '@/utils/wonderlab/previewFixtureCatalog'

const builder = getWonderLabPreviewFixture('builder-card')
assert.ok(builder?.props?.card)
assert.equal(builder?.props?.allowSelect, false)
const builderCard = builder?.props?.card as Record<string, unknown>
assert.equal(builderCard.deckImage, null)
assert.ok(Array.isArray(builderCard.steps) && builderCard.steps.length === 3)

const eventCard = getWonderLabPreviewFixture('ruler-hooked-card')
const card = eventCard?.props?.card as Record<string, unknown>
assert.equal(card.kind, 'arc-step')
assert.ok(Array.isArray(card.choices) && card.choices.length >= 2)

const health = getWonderLabPreviewFixture('ruler-hooked-health')
assert.deepEqual(health?.props?.health, {
  nature: 72,
  prosperity: 58,
  treasury: 41,
  joy: 83,
  order: 66,
})

const stage = getWonderLabPreviewFixture('ruler-hooked-stage')
assert.equal(stage?.props?.showImages, false)
assert.ok(stage?.props?.scene)
assert.ok(stage?.props?.regions)

for (const key of ['dream-inspire-button', 'project-gallery-strip'] as const) {
  const fixture = getWonderLabPreviewFixture(key)
  assert.ok(fixture?.skipReason, `${key} must explain its operational context.`)
}

const builderSource = await readFile('components/builder/builder-card.vue', 'utf8')
assert.match(builderSource, /allowSelect\?: boolean/)
assert.match(builderSource, /allowSelect: true/)
assert.match(builderSource, /if \(props\.allowSelect\)/)

const stageSource = await readFile(
  'components/ruler-hooked/ruler-hooked-stage.vue',
  'utf8',
)
assert.match(stageSource, /showImages\?: boolean/)
assert.match(stageSource, /showImages: true/)
assert.match(stageSource, /props\.showImages/)

// Confirm earlier fixture modules remain available through the catalog.
assert.ok(getWonderLabPreviewFixture('academy-style-detail')?.props?.lesson)
assert.ok(getWonderLabPreviewFixture('feed-card')?.props?.item)
assert.ok(getWonderLabPreviewFixture('component-card')?.props?.component)

console.log('WonderLab Builder and Ruler Hooked fixture verification passed.')
