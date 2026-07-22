// /utils/scripts/verifyWonderLabCoreFixtures.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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

const liveActionFlags = [
  'allowEdit',
  'allowCopyName',
  'allowClone',
  'allowDelete',
  'showLaunchButton',
  'showModeButtons',
  'showInlineInteract',
  'showSelectButton',
] as const

for (const key of safeCoreCards) {
  const fixture = getWonderLabPreviewFixture(key)
  assert.ok(fixture, `${key} must have a WonderLab preview fixture.`)
  assert.ok(fixture.props, `${key} must provide synthetic props.`)

  const actionContainerDisabled = fixture.props?.showActions === false
  const liveCapability = liveActionFlags.find(
    (flag) => fixture.props?.[flag] === true,
  )

  assert.ok(
    actionContainerDisabled || !liveCapability,
    `${key} must disable its action container or every live action capability.`,
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

const commentaryGuide = readFileSync(
  'pages/wonderlab/commentary-guide.vue',
  'utf8',
)
const commentaryNavigation = readFileSync(
  'content/channels/lab/commentary-guide.md',
  'utf8',
)

for (const principle of [
  'Stars carry the evaluation',
  'Write the personality, not a report',
  'Let verbosity belong to the speaker',
  'Use the exhibit as scenery',
  'Uniform length is a defect',
  '*purrs*',
  'Components are the rehearsal room',
  'Remove the review voice',
]) {
  assert.ok(
    commentaryGuide.includes(principle),
    `WonderLab commentary guide must retain principle: ${principle}`,
  )
}

for (const antiPattern of [
  'Function lists',
  'shared house voice',
  'comments padded to the same length',
  'Invented behavior',
]) {
  assert.ok(
    commentaryGuide.includes(antiPattern),
    `WonderLab commentary guide must name anti-pattern: ${antiPattern}`,
  )
}

assert.ok(commentaryNavigation.includes('route: /wonderlab/commentary-guide'))
assert.ok(commentaryNavigation.includes('label: Voice Guide'))
assert.ok(commentaryNavigation.includes('requiredRole: GUEST'))

const keys = listWonderLabPreviewFixtureKeys()
assert.equal(keys.length, new Set(keys).size)
assert.deepEqual([...keys].sort(), keys)

console.log('WonderLab core preview fixture verification passed.')
