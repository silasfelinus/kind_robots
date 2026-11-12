// Zuzu Gamebook achievements (conductor zuzu-gamebook t-016): each step of
// play earns its codes once, a pasted save code earns nothing, and every
// code is in the catalog.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { achievementsForGame } from '../achievements/gameAchievements'
import { scene, startRun, type Run } from '../zuzuGamebook/adventure'
import {
  ENDING_IDS,
  collectionAchievements,
  stepAchievements,
} from '../zuzuGamebook/achievements'
import { BOOK } from '../zuzuGamebook/book'

const catalog = new Set(
  achievementsForGame('zuzu-gamebook').map((entry) => entry.code),
)
assert.ok(catalog.size >= 12, 'Zuzu Gamebook carries at least 12.')
assert.equal(ENDING_IDS.length, 15, 'The book has fifteen endings.')

const base = startRun(7)
const at = (sceneId: string, extra: Partial<Run> = {}): Run => ({
  ...base,
  sceneId,
  ...extra,
})
const sceneIn = (prefix: string) =>
  Object.values(BOOK).find((node) => node.chapter.startsWith(prefix))!.id

// Beating the River Croc with a quiet draw and no damage taken.
const croc = scene('crocodile').battle!
const round = (action: string, taken: number) =>
  ({ action, taken }) as NonNullable<Run['lastFight']>['rounds'][number]
const wonCroc = at(croc.win, {
  lastFight: {
    foe: croc.name,
    foeMax: croc.hp,
    won: true,
    rounds: [round('strike', 0), round('quiet-draw', 0)],
  },
})
const inFight = at('crocodile', { battle: base.battle ?? ({} as never) })
assert.deepEqual(stepAchievements(inFight, wonCroc).sort(), [
  'zuzu-gamebook-croc-crossing',
  'zuzu-gamebook-quiet-draw',
  'zuzu-gamebook-untouched',
])
const bruised = at(croc.win, {
  lastFight: { ...wonCroc.lastFight!, rounds: [round('strike', 2)] },
})
assert.deepEqual(stepAchievements(inFight, bruised), [
  'zuzu-gamebook-croc-crossing',
])

// Chapters V and IX, once each.
const mission = sceneIn('V · ')
const bell = sceneIn('IX · ')
assert.deepEqual(stepAchievements(at(sceneIn('IV · ')), at(mission)), [
  'zuzu-gamebook-reached-the-mission',
])
assert.deepEqual(stepAchievements(at(mission), at(mission)), [])
assert.deepEqual(stepAchievements(at(sceneIn('VIII · ')), at(bell)), [
  'zuzu-gamebook-reached-the-bell',
])

// A fresh double six counts; the same roll carried over does not.
const sixes = { ...(base.lastRoll ?? {}), dice: [6, 6] } as Run['lastRoll']
assert.deepEqual(
  stepAchievements(at('standoff'), at('standoff', { lastRoll: sixes })),
  ['zuzu-gamebook-double-six'],
)
assert.deepEqual(
  stepAchievements(
    at('standoff', { lastRoll: sixes }),
    at('standoff', { lastRoll: sixes }),
  ),
  [],
)

// Freeing the sister, and reaching endings by tone.
assert.deepEqual(
  stepAchievements(at('rescue'), at('rescue', { flags: ['sister-free'] })),
  ['zuzu-gamebook-sister-free'],
)
assert.deepEqual(
  stepAchievements(
    at('rescue'),
    at('ending-four', { endings: ['ending-four'] }),
  ),
  ['zuzu-gamebook-one-fire'],
)
assert.deepEqual(
  stepAchievements(
    at('standoff'),
    at('ending-water', { endings: ['ending-water'] }),
  ),
  ['zuzu-gamebook-dark-road'],
)
assert.deepEqual(
  stepAchievements(
    at('standoff'),
    at('ending-alone', { endings: ['ending-alone'] }),
  ),
  ['zuzu-gamebook-bittersweet'],
)

// The collection: three tones, five endings, all fifteen.
assert.deepEqual(
  collectionAchievements(
    ['ending-four', 'ending-water'],
    ['ending-four', 'ending-water', 'ending-alone'],
  ),
  ['zuzu-gamebook-three-tones'],
)
assert.ok(
  collectionAchievements(
    ENDING_IDS.slice(0, 4),
    ENDING_IDS.slice(0, 5),
  ).includes('zuzu-gamebook-five-endings'),
)
assert.ok(
  collectionAchievements(ENDING_IDS.slice(0, 14), [...ENDING_IDS]).includes(
    'zuzu-gamebook-every-ending',
  ),
)
assert.deepEqual(collectionAchievements(ENDING_IDS, ENDING_IDS), [])

// Every code the rules return is in the catalog, and nothing is left over.
const awarded = new Set([
  'zuzu-gamebook-first-fight-won',
  'zuzu-gamebook-hopeful-ending',
  'zuzu-gamebook-ring-the-bell',
  'zuzu-gamebook-croc-crossing',
  'zuzu-gamebook-abbess-falls',
  'zuzu-gamebook-quiet-draw',
  'zuzu-gamebook-untouched',
  'zuzu-gamebook-reached-the-mission',
  'zuzu-gamebook-reached-the-bell',
  'zuzu-gamebook-double-six',
  'zuzu-gamebook-sister-free',
  'zuzu-gamebook-one-fire',
  'zuzu-gamebook-dark-road',
  'zuzu-gamebook-bittersweet',
  'zuzu-gamebook-three-tones',
  'zuzu-gamebook-five-endings',
  'zuzu-gamebook-every-ending',
])
assert.deepEqual([...awarded].sort(), [...catalog].sort())
assert.ok(scene('abbess').battle?.name === 'The Abbess')

// The store awards only from play: importCode and load never award, and a
// save code never adds to the endings counted for the collection.
const store = readFileSync('stores/zuzuGamebookStore.ts', 'utf8')
const body = (name: string) => {
  const from = store.indexOf(`function ${name}(`)
  return store.slice(from, store.indexOf('\n  }\n', from))
}
for (const name of ['importCode', 'load', 'recover', 'restart'])
  assert.doesNotMatch(body(name), /awardDeeds|rewardAchievementByCode/)
assert.doesNotMatch(body('importCode'), /played/)
assert.match(body('choose'), /awardDeeds\(before, next\)/)
assert.match(body('battle'), /awardDeeds\(before, next\)/)
assert.match(body('awardDeeds'), /stepAchievements\(before, after\)/)
assert.match(
  body('awardDeeds'),
  /collectionAchievements\(earlier, played\.value\)/,
)

console.log(`Zuzu Gamebook achievements passed: ${catalog.size} achievements.`)
