// Space Couch achievements: what an action newly earns, and that loading a
// saved voyage earns nothing (utils/gameOfCaptains/achievements.ts).

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { achievementsForGame } from '../achievements/gameAchievements'
import { ALIEN_SPECIES } from '../gameOfCaptains/alienSpecies'
import { startVoyage, type VoyageRun } from '../gameOfCaptains/rules'
import {
  ANTHOLOGY_ENDINGS,
  NO_VOYAGE_FACTS,
  XENOLOGIST_SPECIES,
  alienAchievements,
  redshirtAchievements,
  voyageDeedAchievements,
  voyageDeedFacts,
} from '../gameOfCaptains/achievements'
import { SPACE_COUCH_KIT } from '../playbookKit/games/spaceCouch'

const catalog = new Set(
  achievementsForGame('game-of-captains').map((entry) => entry.code),
)
assert.ok(catalog.size >= 12, 'Space Couch carries 12 or more achievements.')
const known = (codes: string[]) => {
  for (const code of codes)
    assert.ok(catalog.has(code), `${code} is not in the catalog.`)
  return codes
}

const fresh = startVoyage('fluke', ['pell', 'vela', 'tess'], 7)
const start = voyageDeedFacts(fresh)
assert.deepEqual(voyageDeedFacts(null), NO_VOYAGE_FACTS)
assert.deepEqual(voyageDeedAchievements(NO_VOYAGE_FACTS, start), [])
const with_ = (extra: Record<string, unknown>) =>
  voyageDeedFacts({ ...fresh, ...extra } as VoyageRun)

// Every kit ending is a voyage ending; reaching one earns Homeward once.
for (const ending of SPACE_COUCH_KIT.endings) {
  const facts = with_({ phase: 'ending', ending: ending.title })
  assert.equal(facts.ending, ending.id, `${ending.title} slugs to its kit id`)
  const codes = known(voyageDeedAchievements(start, facts))
  assert.ok(codes.includes('game-of-captains-homeward'), ending.id)
  assert.deepEqual(voyageDeedAchievements(facts, facts), [], ending.id)
}
const titled = (id: string) =>
  SPACE_COUCH_KIT.endings.find((ending) => ending.id === id)!.title
assert.deepEqual(
  voyageDeedAchievements(
    start,
    with_({ ending: titled('captain-of-the-open-horizon') }),
  ),
  ['game-of-captains-homeward', 'game-of-captains-open-horizon'],
)
for (const id of ['the-union-cancellation', 'the-witness-coalition'])
  assert.ok(
    voyageDeedAchievements(start, with_({ ending: titled(id) })).includes(
      'game-of-captains-off-the-record',
    ),
  )
const ended = with_({ ending: titled('the-memoirs') })
assert.ok(
  !voyageDeedAchievements(start, ended, ANTHOLOGY_ENDINGS - 1).includes(
    'game-of-captains-anthology',
  ),
)
assert.ok(
  voyageDeedAchievements(start, ended, ANTHOLOGY_ENDINGS).includes(
    'game-of-captains-anthology',
  ),
)
// A new voyage compares against nothing, not the last voyage's facts.
assert.deepEqual(voyageDeedAchievements(ended, { ...ended, seed: 8 }), [
  'game-of-captains-homeward',
])

assert.deepEqual(
  known(
    voyageDeedAchievements(
      start,
      with_({
        romance: {
          route: 'x',
          status: 'committed',
          lastChapter: 3,
          result: '',
          history: [],
        },
        cloneProgram: {
          step: 1,
          beats: [],
          records: [{ id: 'rs-001' }],
        },
        trioAdventure: { ending: 0 },
        journeyHistory: [{ crewId: 'pell' }],
        venueProgress: {
          barBeats: {},
          completed: [],
          choices: [{ venue: 'casino', choice: 'ask' }],
        },
      }),
    ),
  ),
  [
    'game-of-captains-couch-for-two',
    'game-of-captains-print-another',
    'game-of-captains-trio',
    'game-of-captains-detour',
    'game-of-captains-ask-the-host',
  ],
)
assert.deepEqual(
  voyageDeedAchievements(
    start,
    with_({
      romance: { status: 'courting' },
      venueProgress: {
        barBeats: {},
        completed: [],
        choices: [{ venue: 'casino', choice: 'override' }],
      },
    }),
  ),
  [],
)

assert.deepEqual(alienAchievements(0, 0), [])
assert.deepEqual(known(alienAchievements(0, 1)), [
  'game-of-captains-first-contact',
])
assert.deepEqual(known(alienAchievements(24, XENOLOGIST_SPECIES)), [
  'game-of-captains-first-contact',
  'game-of-captains-xenologist',
])
assert.ok(
  alienAchievements(ALIEN_SPECIES.length - 1, ALIEN_SPECIES.length).includes(
    'game-of-captains-field-guide',
  ),
)
assert.deepEqual(known(redshirtAchievements(9, 10)), [
  'game-of-captains-names-known',
])
assert.deepEqual(redshirtAchievements(10, 11), [])

// The store awards from persist() after an action; load() persists with
// `restoring` set, so a restored voyage only resets the snapshot.
const store = readFileSync('stores/gameOfCaptainsStore.ts', 'utf8')
assert.match(
  store,
  /if \(restoring\) deedFacts = voyageDeedFacts\(run\.value\)\s+else awardDeeds\(namesBefore\)/,
)
assert.match(
  store,
  /restoring = true\s+if \(run\.value\) persist\(\)\s+restoring = false/,
)
assert.equal(
  (store.match(/restoring = true/g) ?? []).length,
  1,
  'only load() persists without awarding',
)
assert.ok(store.includes("award('game-of-captains-launch')"))
assert.match(
  store,
  /alienAchievements\(\s*discoveredBefore,\s*alienGuide\.value\.discovered\.length,?\s*\)/,
)

console.log(`Space Couch achievements passed: ${catalog.size} achievements.`)
