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
  assert.ok(
    Number(achievement.id) < 0,
    `${key} must use a synthetic negative ID.`,
  )
  assert.equal(
    achievement.imagePath,
    null,
    `${key} must not load live artwork.`,
  )
  assert.equal(
    achievement.pageHint,
    null,
    `${key} must not navigate from preview.`,
  )
}

const leaderboard = getWonderLabPreviewFixture('leaderboard-table')
assert.ok(Array.isArray(leaderboard?.props?.rows))
assert.equal(leaderboard?.props?.scoreKey, 'matchRecord')

/*
 * hero-showcase, slot-reel-gallery and swipe-deck were asserted here until
 * interface-vision t-074 retired all three (Silas, 2026-08-04: "if they are not
 * used, yes retire"). They lost their only production mount when the
 * gallery-vocabulary consolidation dropped dream-gallery's private
 * reel/hero/swipe modes, and their preview fixtures went with the components.
 *
 * Their museum record is unaffected: per docs/wonderlab-component-retirement-
 * policy.md the Component rows and their reviews live in the database, survive
 * file deletion, and reconcile only flips isDiscovered.
 */
for (const key of [
  'earned-achievement-card',
  'unearned-achievement-card',
] as const) {
  assert.ok(
    getWonderLabPreviewFixture(key)?.props?.achievement,
    `${key} must still resolve after the t-074 retirements.`,
  )
}

// The modular catalog must preserve fixtures from the original registry.
assert.ok(getWonderLabPreviewFixture('component-card')?.props?.component)

const keys = listWonderLabPreviewFixtureKeys()
assert.equal(keys.length, new Set(keys).size)
assert.deepEqual([...keys].sort(), keys)

console.log('WonderLab achievement and navigation fixture verification passed.')
