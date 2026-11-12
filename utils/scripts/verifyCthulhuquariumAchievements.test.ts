import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { achievementsForGame } from '../achievements/gameAchievements'
import {
  anyUpgradeMaxed,
  bestiaryAchievementCodes,
  milestoneAchievementCodes,
  unlockAchievementCodes,
} from '../cthulhuquariumAchievements'

const catalog = new Set(
  achievementsForGame('cthulhuquarium').map((entry) => entry.code),
)
assert.ok(catalog.size >= 12, 'Cthulhuquarium carries 12 or more achievements.')

const known = (codes: string[]) => {
  for (const code of codes)
    assert.ok(catalog.has(code), `${code} is not in the catalog.`)
  return codes
}

assert.deepEqual(bestiaryAchievementCodes(9), [])
assert.deepEqual(known(bestiaryAchievementCodes(10)), [
  'cthulhuquarium-bestiary-10',
])
assert.deepEqual(known(bestiaryAchievementCodes(60)), [
  'cthulhuquarium-bestiary-10',
  'cthulhuquarium-bestiary-25',
  'cthulhuquarium-bestiary-50',
])

assert.deepEqual(milestoneAchievementCodes('bestiary_5'), [])
assert.deepEqual(
  known(milestoneAchievementCodes('bestiary_35')),
  ['cthulhuquarium-bestiary-10', 'cthulhuquarium-bestiary-25'],
  'A later breakpoint backfills the lower bestiary achievements.',
)
assert.equal(milestoneAchievementCodes('bestiary_151').length, 4)
assert.deepEqual(known(milestoneAchievementCodes('first_full_tank')), [
  'cthulhuquarium-full-tank',
])
assert.deepEqual(known(milestoneAchievementCodes('first_spotless_tank')), [
  'cthulhuquarium-spotless',
])
assert.deepEqual(known(milestoneAchievementCodes('first_rivalry_resolved')), [
  'cthulhuquarium-rivalry',
])
assert.deepEqual(milestoneAchievementCodes('first_evolution'), [])

assert.deepEqual(known(unlockAchievementCodes('COMMON')), [
  'cthulhuquarium-first-adoption',
])
assert.deepEqual(known(unlockAchievementCodes('MYTHIC')), [
  'cthulhuquarium-first-adoption',
  'cthulhuquarium-mythic',
])
assert.deepEqual(unlockAchievementCodes(undefined), [
  'cthulhuquarium-first-adoption',
])

assert.equal(anyUpgradeMaxed([{ level: 2, maxLevel: 5 }]), false)
assert.equal(
  anyUpgradeMaxed([
    { level: 2, maxLevel: 5 },
    { level: 3, maxLevel: 3 },
  ]),
  true,
)
assert.equal(anyUpgradeMaxed([]), false)

// The store awards only after a server response confirms the deed (a fired
// milestone is recorded server-side, so it fires once): never from load().
const store = readFileSync('stores/cthulhuquariumTankStore.ts', 'utf8')
const load = store.slice(
  store.indexOf('async function load()'),
  store.indexOf('async function loadCatalog()'),
)
assert.ok(load.length > 0 && !load.includes('award('))
for (const call of [
  'milestoneAchievementCodes(milestone.id)',
  'unlockAchievementCodes(res.data.stock?.Monster?.tier)',
  "award('cthulhuquarium-bestiary-complete')",
  "award('cthulhuquarium-last-aquarium')",
]) {
  assert.ok(store.includes(call), `The tank store must call ${call}.`)
}

console.log(`Cthulhuquarium achievements passed: ${catalog.size} achievements.`)
