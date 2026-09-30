// utils/scripts/verifyCthulhuquariumCanon.test.ts
//
// The synced Cthulhuquarium canon (utils/cthulhuquariumCanon.generated.ts,
// written by scripts/sync_cthulhuquarium_canon.mjs) agrees with the economy
// that fires it: every milestone the server can fire has a scene where
// Charlotte appears and a background she hands over, every scene speaks in a
// pose that exists, and every species moves in a motion the renderer knows.

import assert from 'node:assert/strict'
import {
  BESTIARY_MILESTONES,
  FIRST_EVOLUTION_MILESTONE,
  FIRST_FULL_TANK_MILESTONE,
  FIRST_SPOTLESS_TANK_MILESTONE,
  unlockedBackgroundKeys,
} from '../../server/utils/aquariumEconomy'
import { FIRST_RIVALRY_RESOLVED_MILESTONE_ID } from '../../server/utils/aquariumRivalryMilestone'
import {
  CTHULHUQUARIUM_BACKGROUNDS,
  CTHULHUQUARIUM_SCENES,
  CTHULHUQUARIUM_SPRITE_MOTIONS,
} from '../cthulhuquariumCanon.generated'

const firable = [
  ...BESTIARY_MILESTONES.map((milestone) => milestone.id),
  FIRST_EVOLUTION_MILESTONE.id,
  FIRST_FULL_TANK_MILESTONE.id,
  FIRST_SPOTLESS_TANK_MILESTONE.id,
  FIRST_RIVALRY_RESOLVED_MILESTONE_ID,
]

for (const id of firable) {
  const scene = CTHULHUQUARIUM_SCENES[`milestone_${id}`]
  assert.ok(scene, `milestone ${id} has no Charlotte scene`)
  assert.ok(
    scene.background,
    `milestone ${id}'s scene hands over no background`,
  )
  const background = CTHULHUQUARIUM_BACKGROUNDS.find(
    (entry) => entry.key === scene.background,
  )
  assert.equal(
    background?.unlock,
    id,
    `${scene.background} is not unlocked by ${id}`,
  )
}
console.log(
  `✅ all ${firable.length} firable milestones have a scene and a background`,
)

assert.deepEqual(unlockedBackgroundKeys(new Set()), ['parlour'])
assert.deepEqual(
  unlockedBackgroundKeys(new Set(['bestiary_5', 'first_full_tank'])).sort(),
  ['kelp-stair', 'parlour', 'public-baths'],
)
assert.equal(
  unlockedBackgroundKeys(new Set(firable)).length,
  CTHULHUQUARIUM_BACKGROUNDS.length,
)
console.log(
  '✅ unlockedBackgroundKeys: default always, one more per fired milestone',
)

const POSES: Record<string, string[]> = {
  charlotte: ['welcome', 'delighted', 'presenting', 'confiding', 'lorgnette'],
  wilbur: ['greeting', 'explaining', 'wince', 'hopeful', 'alarmed'],
}
const AWAITS = new Set(['unlock', 'feed', 'clean'])
for (const scene of Object.values(CTHULHUQUARIUM_SCENES)) {
  assert.ok(scene.beats.length > 0, `${scene.id} has no beats`)
  for (const beat of scene.beats) {
    assert.ok(
      POSES[beat.speaker]?.includes(beat.pose),
      `${scene.id}: ${beat.speaker} has no pose ${beat.pose}`,
    )
    if (beat.await)
      assert.ok(
        AWAITS.has(beat.await),
        `${scene.id}: unknown await ${beat.await}`,
      )
  }
}
assert.ok(CTHULHUQUARIUM_SCENES.intro, 'the intro scene exists')
console.log('✅ every beat speaks in a real pose and awaits a real action')

const MOTIONS = new Set([
  'tailbeat',
  'undulate',
  'ripple',
  'pulse',
  'sway',
  'breathe',
  'rigid',
])
const slugs = Object.keys(CTHULHUQUARIUM_SPRITE_MOTIONS)
assert.equal(slugs.length, 151, 'every species in the bible declares a motion')
for (const slug of slugs) {
  assert.ok(
    MOTIONS.has(CTHULHUQUARIUM_SPRITE_MOTIONS[slug]!),
    `${slug}: unknown motion`,
  )
}
console.log('✅ all 151 species move in a motion the renderer implements')
console.log('✅ verifyCthulhuquariumCanon: all assertions passed')
