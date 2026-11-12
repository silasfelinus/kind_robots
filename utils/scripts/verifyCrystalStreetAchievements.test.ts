// Crystal Street achievements come from committed moves only (crystal-street t-025).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { achievementsForGame } from '../achievements/gameAchievements'
import {
  CRYSTAL_FIVE,
  CRYSTAL_TEN_FRIENDS,
  crystalStreetDeeds,
} from '../crystalStreet/achievements'
import {
  ARCHETYPES,
  BEST_WINS,
  VILLAINS,
  endingKey,
  newRun,
  type RunState,
} from '../crystalStreet/rules'

const run = newRun({
  seed: 'ach-test',
  name: 'Tester',
  pronouns: 'they/them',
  archetype: ARCHETYPES[0]!.id,
})
const book = { runs: [], endings: [], friends: [] }
const step = (patch: Partial<RunState>): RunState => ({ ...run, ...patch })

// A new or swapped-in week is not a played move.
assert.deepEqual(crystalStreetDeeds(null, run, book, book), [])
assert.deepEqual(
  crystalStreetDeeds(
    { ...run, seed: 'other' },
    step({ ending: { tier: 'best', at: 1 } }),
    book,
    book,
  ),
  [],
)

const best = crystalStreetDeeds(
  run,
  step({ ending: { tier: 'best', at: 7 } }),
  book,
  book,
)
assert.ok(best.includes('crystal-street-first-week'))
assert.ok(best.includes('crystal-street-best-ending'))
assert.ok(!best.includes('crystal-street-rough-week'))
// An ending already reached awards nothing new.
const ended = step({ ending: { tier: 'best', at: 7 } })
assert.deepEqual(crystalStreetDeeds(ended, { ...ended }, book, book), [])

const finalGirl = crystalStreetDeeds(
  run,
  step({ ending: { tier: 'good', at: 7, special: 'final-girl' } }),
  book,
  book,
)
assert.ok(finalGirl.includes('crystal-street-final-girl'))
assert.ok(!finalGirl.includes('crystal-street-burned-bridges'))
const collapse = crystalStreetDeeds(
  run,
  step({ ending: { tier: 'bad', at: 5, special: 'family' } }),
  book,
  book,
)
assert.ok(collapse.includes('crystal-street-burned-bridges'))
assert.ok(!collapse.includes('crystal-street-rough-week'))
assert.ok(
  crystalStreetDeeds(
    run,
    step({ ending: { tier: 'bad', at: 7 } }),
    book,
    book,
  ).includes('crystal-street-rough-week'),
)

const crew = ['a', 'b', 'c'] as unknown as RunState['crew']
assert.ok(
  crystalStreetDeeds(run, step({ crew }), book, book).includes(
    'crystal-street-full-crew',
  ),
)
assert.ok(
  crystalStreetDeeds(run, step({ flags: ['arc:x:3'] }), book, book).includes(
    'crystal-street-arc-complete',
  ),
)
assert.ok(
  !crystalStreetDeeds(run, step({ flags: ['arc:x:2'] }), book, book).includes(
    'crystal-street-arc-complete',
  ),
)
assert.ok(
  crystalStreetDeeds(
    step({ wins: BEST_WINS - 1 }),
    step({ wins: BEST_WINS }),
    book,
    book,
  ).includes('crystal-street-twelve-wins'),
)
assert.ok(
  crystalStreetDeeds(
    step({ clues: ['a', 'b'] }),
    step({ clues: ['a', 'b', 'c'] }),
    book,
    book,
  ).includes('crystal-street-case-cracked'),
)
const roll = { success: true } as NonNullable<RunState['pending']>['roll']
const pending = (rerolled: boolean, success = true) => ({
  choiceId: 'x',
  roll: { ...roll, success },
  rerolled,
  shielded: null,
})
assert.ok(
  crystalStreetDeeds(
    step({ pending: pending(false, false) }),
    step({ pending: pending(true) }),
    book,
    book,
  ).includes('crystal-street-second-chance'),
)
assert.ok(
  !crystalStreetDeeds(
    step({ pending: pending(false, false) }),
    step({ pending: pending(true, false) }),
    book,
    book,
  ).includes('crystal-street-second-chance'),
)
assert.ok(
  crystalStreetDeeds(
    step({ quarters: 5, items: [] }),
    step({ quarters: 3, items: ['x'] as unknown as RunState['items'] }),
    book,
    book,
  ).includes('crystal-street-shopper'),
)

const villains = VILLAINS.map((v) => v.id)
const runsOf = (n: number, archetype = ARCHETYPES[0]!.id) =>
  villains.slice(0, n).map((villain) => ({ villain, archetype }))
const ledger = (runs: { villain: string; archetype: string }[]) => ({
  runs,
  endings: [] as string[],
  friends: [] as string[],
})
assert.ok(
  crystalStreetDeeds(
    run,
    step({}),
    ledger(runsOf(CRYSTAL_FIVE - 1)),
    ledger(runsOf(CRYSTAL_FIVE)),
  ).includes('crystal-street-five-nightmares'),
)
assert.ok(
  crystalStreetDeeds(
    run,
    step({}),
    ledger(runsOf(villains.length - 1)),
    ledger(runsOf(villains.length)),
  ).includes('crystal-street-all-nightmares'),
)
const bestKeys = villains
  .slice(0, CRYSTAL_FIVE)
  .map((v) => endingKey(v, 'best'))
assert.ok(
  crystalStreetDeeds(
    run,
    step({}),
    { ...book, endings: bestKeys.slice(1) },
    { ...book, endings: bestKeys },
  ).includes('crystal-street-best-five'),
)
const cliques = ARCHETYPES.map((a, i) => ({
  villain: villains[0]!,
  archetype: a.id,
  i,
}))
assert.ok(
  crystalStreetDeeds(
    run,
    step({}),
    ledger(cliques.slice(1)),
    ledger(cliques),
  ).includes('crystal-street-every-clique'),
)
const friends = Array.from({ length: CRYSTAL_TEN_FRIENDS }, (_, i) => `f${i}`)
assert.ok(
  crystalStreetDeeds(
    run,
    step({}),
    { ...book, friends: friends.slice(1) },
    { ...book, friends },
  ).includes('crystal-street-ten-friends'),
)

// Every catalog code is awarded by the helper, and the store only judges
// from commit(): load() restores a week without committing it.
const helper = readFileSync('utils/crystalStreet/achievements.ts', 'utf8')
const catalog = new Set(
  achievementsForGame('crystal-street').map((e) => e.code),
)
const awarded = new Set(
  [...helper.matchAll(/'(crystal-street-[a-z0-9-]+)'/g)].map((m) => m[1]!),
)
assert.ok(catalog.size >= 12)
for (const code of catalog) assert.ok(awarded.has(code), `${code} is awarded`)
for (const code of awarded) assert.ok(catalog.has(code), `${code} is cataloged`)
const store = readFileSync('stores/crystalStreetStore.ts', 'utf8')
assert.equal(store.match(/crystalStreetDeeds\(/g)?.length, 1)
const commitBody = store.slice(
  store.indexOf('function commit('),
  store.indexOf('function start('),
)
assert.ok(commitBody.includes('crystalStreetDeeds(before, next'))
const loadBody = store.slice(
  store.indexOf('function load('),
  store.indexOf('function record('),
)
assert.ok(!loadBody.includes('commit(') && !loadBody.includes('Deeds('))

console.log(`Crystal Street achievements passed: ${catalog.size}.`)
