import assert from 'node:assert/strict'
import {
  achievementEntityMarker,
  buildAchievementArtPayload,
} from '../../scripts/generate_achievement_art'

const payloadFor = (id: number) =>
  JSON.stringify(
    buildAchievementArtPayload({
      id,
      triggerCode: `achievement-${id}`,
      artPrompt: 'A friendly robot achievement emblem',
    }),
  )

assert.ok(payloadFor(9).includes(achievementEntityMarker(9)))
assert.ok(!payloadFor(978).includes(achievementEntityMarker(9)))
assert.ok(!payloadFor(10).includes(achievementEntityMarker(1)))
assert.ok(payloadFor(978).includes(achievementEntityMarker(978)))

console.log('Achievement ArtJob exact-ID dedupe contract passed.')
