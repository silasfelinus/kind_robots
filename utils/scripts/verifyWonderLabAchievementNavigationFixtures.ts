// /utils/scripts/verifyWonderLabAchievementNavigationFixtures.ts
import assert from 'node:assert/strict'
import {
  getWonderLabPreviewFixture,
  listWonderLabPreviewFixtureKeys,
} from '@/utils/wonderlab/previewFixtureCatalog'

const achievementKeys = [
  'earned-achievement-card',
  'unearned-achievement-card',
] as const

for (const key of achievementKeys) {
  const fixture = getWonderLabPreviewFixture(key)
  assert.ok(fixture?.props?.achievement, `${key} must provide an achievement.`)

  const achievement = fixture.props.achievement as Record<string, unknown>
  assert.ok(Number(achievement.id) < 0, `${key} must use a synthetic negative ID.`)
  assert.equal(achievement.imagePath, null, `${key} must not load live artwork.`)
  assert.equal(achievement.pageHint, null, `${key} must not navigate from preview.`)
}

const leaderboard = getWonderLabPreviewFixture('leaderboard-table')
assert.ok(Array.isArray(leaderboard?.props?.rows))
assert.equal(leaderboard?.props?.scoreKey, 'matchRecord')

for (const key of ['hero-showcase', 'slot-reel-gallery', 'swipe-deck'] as const) {
  const fixture = getWonderLabPreviewFixture(key)
  const items = fixture?.props?.items
  assert.ok(Array.isArray(items) && items.length >= 3, `${key} needs synthetic items.`)

  for (const item of items as Array<Record<string, unknown>>) {
    assert.equal(item.imagePath, '', `${key} must not load external artwork.`)
    assert.ok(item.id, `${key} items need stable synthetic IDs.`)
    assert.ok(item.title, `${key} items need visible titles.`)
  }
}

assert.equal(getWonderLabPreviewFixture('hero-showcase')?.props?.intervalMs, 60_000)
assert.equal(getWonderLabPreviewFixture('slot-reel-gallery')?.props?.itemH, 132)

// The modular catalog must preserve fixtures from the original registry.
assert.ok(getWonderLabPreviewFixture('component-card')?.props?.component)

const keys = listWonderLabPreviewFixtureKeys()
assert.equal(keys.length, new Set(keys).size)
assert.deepEqual([...keys].sort(), keys)

console.log('WonderLab achievement and navigation fixture verification passed.')
