// /utils/scripts/repairRewardImagePaths.test.ts
//
// Self-test for repairedRewardImagePath(). This function decides whether a row
// gets written, so the cases that matter most are the ones where it must say
// NO: cardPath/heroPath/iconPath all use /api/art routes, and a rule that
// matched them too would rewrite 234 working paths into 404s.
import assert from 'node:assert/strict'

import { repairedRewardImagePath } from './repairRewardImagePaths'

/* --- rewritten ------------------------------------------------------- */

assert.equal(
  repairedRewardImagePath('/rewards/item/alien-communicator.webp'),
  '/images/rewards/item/alien-communicator.webp',
)
assert.equal(
  repairedRewardImagePath('/rewards/skill/adhd-spark.webp'),
  '/images/rewards/skill/adhd-spark.webp',
)
// Every reward type seen in production, so a nested segment can't slip through.
for (const type of ['item', 'skill', 'pet', 'favor', 'magic', 'power']) {
  assert.equal(
    repairedRewardImagePath(`/rewards/${type}/x.webp`),
    `/images/rewards/${type}/x.webp`,
  )
}
// Surrounding whitespace is a storage artefact, not a different path.
assert.equal(
  repairedRewardImagePath('  /rewards/item/x.webp  '),
  '/images/rewards/item/x.webp',
)

/* --- left alone ------------------------------------------------------ */

for (const untouched of [
  '/images/rewards/item/x.webp', // already correct — must not double-prefix
  '/api/art/images/14913/file?v=2026-08-03', // what cardPath/heroPath/iconPath use
  '/images/characters/x.webp',
  'https://media.acrocatranch.com/images/rewards/item/x.webp',
  '/rewardsx/item/x.webp', // prefix must match the full segment
  '/reward/item/x.webp',
  'rewards/item/x.webp', // no leading slash: not the stored shape
  '',
  '   ',
]) {
  assert.equal(
    repairedRewardImagePath(untouched),
    null,
    `should have been left alone: ${JSON.stringify(untouched)}`,
  )
}

for (const nonString of [null, undefined, 42, {}, []]) {
  assert.equal(repairedRewardImagePath(nonString), null)
}

/* Applying the repair twice is the same as applying it once — a re-run after a
   partial failure must not produce /images/images/rewards/. */
const once = repairedRewardImagePath('/rewards/item/x.webp')
assert.equal(repairedRewardImagePath(once), null)

console.log('repairRewardImagePaths self-test passed.')
