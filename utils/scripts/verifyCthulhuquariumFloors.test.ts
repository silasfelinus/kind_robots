// /utils/scripts/verifyCthulhuquariumFloors.test.ts
//
// cthulhuquarium/t-102: the descent through Charlotte's building. Pure checks
// of utils/cthulhuquariumFloors.ts and the price rule that makes the
// evolution-only species buyable again -- no prisma, no database.
import assert from 'node:assert/strict'

import {
  BESTIARY_MILESTONES,
  effectiveUnlockOverride,
  RARITY_TIERS,
  rotateShopStock,
  SHOP_ROTATION_SIZE,
  unlockCost,
} from '../../server/utils/aquariumEconomy.js'
import {
  canBuySpecies,
  CTHULHUQUARIUM_FLOORS,
  floorForDepth,
  floorOpenedBy,
  floorStatus,
  LOCKED_TEASER_COUNT,
  openDepthsFor,
  openFloorFor,
  portraitCandidates,
} from '../cthulhuquariumFloors.js'
import {
  CTHULHUQUARIUM_BACKGROUNDS,
  CTHULHUQUARIUM_SCENES,
} from '../cthulhuquariumCanon.generated.js'

// --- the five floors -------------------------------------------------------

assert.equal(CTHULHUQUARIUM_FLOORS.length, 5)
CTHULHUQUARIUM_FLOORS.forEach((entry, index) => {
  assert.equal(entry.floor, index + 1, 'floors are numbered 1..5 in order')
  assert.deepEqual([...entry.depths], [index + 1], 'one canon tier per floor')
  if (index > 0) {
    assert.ok(
      entry.opensAt > CTHULHUQUARIUM_FLOORS[index - 1]!.opensAt,
      'each floor opens later than the one above it',
    )
  }
  assert.ok(
    CTHULHUQUARIUM_BACKGROUNDS.some((bg) => bg.key === entry.background),
    `floor ${entry.floor}'s background ${entry.background} is a canon background`,
  )
  if (entry.milestoneId) {
    const milestone = BESTIARY_MILESTONES.find(
      (m) => m.id === entry.milestoneId,
    )
    assert.ok(milestone, `${entry.milestoneId} is a real bestiary milestone`)
    assert.equal(
      milestone!.threshold,
      entry.opensAt,
      `floor ${entry.floor} opens exactly at its milestone`,
    )
    const scene = CTHULHUQUARIUM_SCENES[`milestone_${entry.milestoneId}`]
    assert.ok(scene, `floor ${entry.floor} has an opening scene`)
    assert.equal(
      scene!.background,
      entry.background,
      `floor ${entry.floor}'s opening scene hands over the floor's background`,
    )
  } else {
    assert.equal(entry.opensAt, 0, 'only the Shop Floor is open from the start')
  }
})
console.log('✅ five floors, one per tier, each opened by a bestiary milestone')

const expectedOpen: Array<[number, number]> = [
  [0, 1],
  [9, 1],
  [10, 2],
  [24, 2],
  [25, 3],
  [49, 3],
  [50, 4],
  [94, 4],
  [95, 5],
  [151, 5],
]
for (const [count, floor] of expectedOpen) {
  assert.equal(openFloorFor(count), floor, `${count} species -> floor ${floor}`)
}
assert.deepEqual(openDepthsFor(0), [1])
assert.deepEqual(openDepthsFor(25), [1, 2, 3])
assert.deepEqual(openDepthsFor(151), [1, 2, 3, 4, 5])
console.log('✅ openFloorFor / openDepthsFor thresholds')

assert.equal(floorForDepth(null), 1, 'a species with no depth is upstairs')
assert.equal(floorForDepth(undefined), 1)
assert.equal(floorForDepth(3), 3)
assert.equal(floorForDepth(9), 5, 'anything deeper than 5 is at the bottom')
console.log('✅ floorForDepth')

// --- who may buy what ------------------------------------------------------

assert.equal(
  canBuySpecies({ depth: 1, everCollected: false, collectedCount: 0 }),
  true,
)
assert.equal(
  canBuySpecies({ depth: 2, everCollected: false, collectedCount: 9 }),
  false,
  'Below Stairs is shut at nine species',
)
assert.equal(
  canBuySpecies({ depth: 2, everCollected: false, collectedCount: 10 }),
  true,
)
assert.equal(
  canBuySpecies({ depth: 5, everCollected: false, collectedCount: 94 }),
  false,
)
assert.equal(
  canBuySpecies({ depth: 5, everCollected: true, collectedCount: 3 }),
  true,
  'a species the player has ever known is never locked (veterans keep it)',
)
assert.equal(
  canBuySpecies({ depth: null, everCollected: false, collectedCount: 0 }),
  true,
)
console.log('✅ canBuySpecies: floors lock the unknown, never the known')

const start = floorStatus(0)
assert.equal(start.floor, 1)
assert.equal(start.name, 'The Shop Floor')
assert.deepEqual(start.next, {
  floor: 2,
  numeral: 'II',
  name: 'Below Stairs',
  threshold: 10,
  remaining: 10,
})
assert.equal(floorStatus(30).next?.remaining, 20)
assert.equal(floorStatus(151).next, null, 'nothing below the bottom')
assert.equal(floorOpenedBy('bestiary_10'), 2)
assert.equal(floorOpenedBy('bestiary_95'), 5)
assert.equal(floorOpenedBy('bestiary_15'), null)
console.log('✅ floorStatus / floorOpenedBy')

// --- per-floor portraits ---------------------------------------------------

assert.deepEqual(portraitCandidates('wilbur-stint', 'wince', 1), [
  'wilbur-stint-wince',
])
assert.deepEqual(portraitCandidates('wilbur-stint', 'wince', 3), [
  'wilbur-stint-wince-f3',
  'wilbur-stint-wince-f2',
  'wilbur-stint-wince',
])
assert.equal(portraitCandidates('wilbur-stint', 'wince', 9).length, 5)
console.log('✅ portraitCandidates: deepest variant first, base pose last')

// --- the evolution-only species are priced, not free -----------------------

assert.equal(
  effectiveUnlockOverride(0, true),
  null,
  'evolution-only species take the rarity default price',
)
assert.equal(effectiveUnlockOverride(0, false), 0, 'free starters stay free')
assert.equal(effectiveUnlockOverride(240, true), 240)
assert.equal(effectiveUnlockOverride(null, false), null)
assert.equal(
  unlockCost('EPIC', effectiveUnlockOverride(0, true)),
  RARITY_TIERS.EPIC.unlockCost,
)
console.log('✅ effectiveUnlockOverride: no species is free by accident')

// --- the rotation options keep the old slate ------------------------------

const ids = Array.from({ length: 40 }, (_, index) => index + 1)
assert.deepEqual(
  rotateShopStock(ids, 7, '2026-11-21'),
  rotateShopStock(ids, 7, '2026-11-21', {
    size: SHOP_ROTATION_SIZE,
    salt: 'shop',
  }),
  'the defaults are the old rotation, unchanged',
)
const teasers = rotateShopStock(ids, 7, '2026-11-21', {
  size: LOCKED_TEASER_COUNT,
  salt: 'floor',
})
assert.equal(teasers.length, LOCKED_TEASER_COUNT)
assert.equal(new Set(teasers).size, LOCKED_TEASER_COUNT)
console.log('✅ rotateShopStock size/salt options')
