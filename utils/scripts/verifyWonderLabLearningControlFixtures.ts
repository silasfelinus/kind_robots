// /utils/scripts/verifyWonderLabLearningControlFixtures.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { getWonderLabPreviewFixture } from '@/utils/wonderlab/previewFixtureCatalog'

const academy = getWonderLabPreviewFixture('academy-style-detail')
assert.ok(academy?.props?.lesson)
assert.equal(academy?.props?.showClose, false)
assert.equal(academy?.props?.showRemixButton, false)
assert.equal(academy?.props?.allowMarkViewed, false)

const lesson = academy?.props?.lesson as Record<string, unknown>
assert.ok(Array.isArray(lesson.recognitionCues))
assert.ok(Array.isArray(lesson.artists))
assert.deepEqual(lesson.exampleWorks, [])

const range = getWonderLabPreviewFixture('butterfly-slider')
assert.deepEqual(range?.props?.modelValue, { min: 24, max: 72 })
assert.equal(range?.props?.min, 0)
assert.equal(range?.props?.max, 100)
assert.equal(range?.props?.originalMin, 10)
assert.equal(range?.props?.originalMax, 90)

const single = getWonderLabPreviewFixture('single-slider')
assert.equal(single?.props?.modelValue, 8)
assert.equal(single?.props?.min, 0)
assert.equal(single?.props?.max, 20)

for (const key of ['butterfly-toggle', 'choice-manager', 'fx-region'] as const) {
  const fixture = getWonderLabPreviewFixture(key)
  assert.ok(fixture?.skipReason, `${key} must explain its required app context.`)
}

const academySource = await readFile(
  'components/academy/academy-style-detail.vue',
  'utf8',
)
assert.match(academySource, /allowMarkViewed\?: boolean/)
assert.match(academySource, /allowMarkViewed: true/)
assert.match(academySource, /if \(props\.allowMarkViewed\)/)

// Confirm every earlier fixture layer still resolves through the shared catalog.
assert.ok(getWonderLabPreviewFixture('feed-card')?.props?.item)
assert.ok(getWonderLabPreviewFixture('hero-showcase')?.props?.items)
assert.ok(getWonderLabPreviewFixture('component-card')?.props?.component)

console.log('WonderLab learning and control fixture verification passed.')
