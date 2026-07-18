// /utils/scripts/verifyWonderLabVisualFixtures.ts
import assert from 'node:assert/strict'
import { getWonderLabPreviewFixture } from '@/utils/wonderlab/previewFixtures'

const visualFixtures = [
  {
    key: 'dream-card',
    recordProp: 'dream',
    disabledFlags: ['showActions', 'allowEdit', 'allowDelete'],
  },
  {
    key: 'image-card',
    recordProp: 'artImage',
    disabledFlags: [
      'showActions',
      'showReaction',
      'showSelectButton',
      'allowEdit',
      'allowDelete',
      'allowCopyPrompt',
      'allowColoringPage',
      'autoLoadImage',
    ],
  },
  {
    key: 'collection-card',
    recordProp: 'collection',
    disabledFlags: [
      'showActions',
      'showReaction',
      'showSelectButton',
      'allowEdit',
      'allowDelete',
      'autoLoadPreviewImage',
    ],
  },
] as const

for (const spec of visualFixtures) {
  const fixture = getWonderLabPreviewFixture(spec.key)
  assert.ok(fixture, `${spec.key} must have a WonderLab preview fixture.`)
  assert.ok(fixture.props, `${spec.key} must provide synthetic props.`)

  const record = fixture.props?.[spec.recordProp] as
    | { id?: unknown; artImageId?: unknown; artCollectionId?: unknown }
    | undefined

  assert.ok(record, `${spec.key} must provide ${spec.recordProp}.`)
  assert.equal(
    typeof record?.id === 'number' && record.id < 0,
    true,
    `${spec.key} must use a non-persistent negative ID.`,
  )
  assert.equal(record?.artImageId ?? null, null)
  assert.equal(record?.artCollectionId ?? null, null)

  for (const flag of spec.disabledFlags) {
    assert.equal(
      fixture.props?.[flag],
      false,
      `${spec.key} must set ${flag} to false.`,
    )
  }
}

const dream = getWonderLabPreviewFixture('dream-card')?.props?.dream as
  | Record<string, unknown>
  | undefined
assert.deepEqual(dream?.ArtCollections, [])
assert.deepEqual(dream?.ArtImages, [])
assert.deepEqual(dream?.Scenarios, [])
assert.deepEqual(dream?.Characters, [])
assert.deepEqual(dream?.Rewards, [])

const collection = getWonderLabPreviewFixture('collection-card')?.props
  ?.collection as Record<string, unknown> | undefined
assert.deepEqual(collection?.ArtImages, [])

console.log('WonderLab visual preview fixture verification passed.')
