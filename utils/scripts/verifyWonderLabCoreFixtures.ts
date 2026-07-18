// /utils/scripts/verifyWonderLabCoreFixtures.ts
import assert from 'node:assert/strict'
import {
  getWonderLabPreviewFixture,
  listWonderLabPreviewFixtureKeys,
} from '@/utils/wonderlab/previewFixtures'

const safeCoreCards = [
  'bot-card',
  'character-card',
  'component-card',
  'reward-card',
  'scenario-card',
] as const

for (const key of safeCoreCards) {
  const fixture = getWonderLabPreviewFixture(key)
  assert.ok(fixture, `${key} must have a WonderLab preview fixture.`)
  assert.ok(fixture.props, `${key} must provide synthetic props.`)
  assert.equal(
    fixture.props?.showActions,
    false,
    `${key} must disable live action controls.`,
  )
  assert.equal(
    fixture.props?.showReaction,
    false,
    `${key} must disable live Reaction controls.`,
  )
}

const reviewFeed = getWonderLabPreviewFixture('component-review-feed')
assert.equal(reviewFeed?.props?.componentId, -1)

const previewHost = getWonderLabPreviewFixture('wonderlab-preview-host')
assert.equal(previewHost?.props?.componentName, 'component-card')
assert.equal(previewHost?.props?.folderName, 'wonderlab')

for (const key of [
  'component-sync',
  'component-test-fixture-cleanup',
  'lab-interact',
  'lab-manager',
  'wonderlab-selection-router',
]) {
  const fixture = getWonderLabPreviewFixture(key)
  assert.ok(fixture?.skipReason, `${key} must have an explicit skip reason.`)
}

const keys = listWonderLabPreviewFixtureKeys()
assert.equal(keys.length, new Set(keys).size)
assert.deepEqual([...keys].sort(), keys)

console.log('WonderLab core preview fixture verification passed.')
