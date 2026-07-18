// /utils/scripts/verifyWonderLabPassiveCardFixtures.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { getWonderLabPreviewFixture } from '@/utils/wonderlab/previewFixtureCatalog'

const stageMessage = getWonderLabPreviewFixture('stage-message')
assert.ok(stageMessage?.props?.entry)
const entry = stageMessage.props.entry as Record<string, unknown>
assert.equal(entry.speakerArtImageId, null)
assert.equal(entry.speakerImagePath, null)
assert.equal(entry.kind, 'speaker')

const stagePreset = getWonderLabPreviewFixture('stage-preset')
assert.equal(stagePreset?.props?.isSelected, true)
const preset = stagePreset?.props?.preset as Record<string, unknown>
assert.equal(preset.imagePath, null)
assert.ok(Array.isArray(preset.roles) && preset.roles.length >= 2)

const honeydo = getWonderLabPreviewFixture('honeydo-card')
assert.ok(honeydo?.props?.todo)
assert.equal(honeydo?.props?.project, null)
assert.equal(honeydo?.props?.showRelativeTime, false)
assert.equal(honeydo?.props?.showArchiveAction, false)
assert.equal(honeydo?.props?.showDeleteAction, false)

const feed = getWonderLabPreviewFixture('feed-card')
assert.ok(feed?.props?.item)
assert.equal(feed?.props?.showImage, false)
assert.equal(feed?.props?.allowNavigation, false)
const feedItem = feed.props.item as Record<string, unknown>
assert.equal(feedItem.image, null)

for (const key of ['loading-messages', 'tutorial-flyer'] as const) {
  const fixture = getWonderLabPreviewFixture(key)
  assert.ok(fixture?.skipReason, `${key} must explain its application context.`)
}

const feedSource = await readFile('components/newsfeed/feed-card.vue', 'utf8')
assert.match(feedSource, /allowNavigation\?: boolean/)
assert.match(feedSource, /allowNavigation: true/)
assert.match(feedSource, /allowNavigation \? 'a' : 'article'/)
assert.match(feedSource, /v-if="allowNavigation"/)

// Confirm earlier fixture modules still resolve after adding another catalog layer.
assert.ok(getWonderLabPreviewFixture('hero-showcase')?.props?.items)
assert.ok(getWonderLabPreviewFixture('component-card')?.props?.component)

console.log('WonderLab passive card fixture verification passed.')
