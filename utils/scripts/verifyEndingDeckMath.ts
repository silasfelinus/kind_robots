// /utils/scripts/verifyEndingDeckMath.ts
//
// Contract check for server/utils/endingDeckMath.ts (storybook/t-031).
//
// This is the math that turns a finished run into exactly one ending, so the
// properties asserted here are the ones a wrong answer corrupts silently: bit
// order, determinism, the pass threshold, and the guarantee that the Life deck
// still resolves to the keys its 1,024 seeded LifeEnding rows were generated
// for. No network and no database.

import {
  LIFE_DECK,
  deckEndingCount,
  deckOutcomeKeys,
  parseDeckAxes,
  resolveDeckOutcomeKey,
  serializeDeckAxes,
  type DeckDefinition,
} from '../../server/utils/endingDeckMath'
// From davinciDimensions, not davinci: this suite must stay free of ./prisma,
// which throws at module load when DATABASE_URL is unset (as it is in the
// contract-tests job).
import {
  DAVINCI_DIMENSIONS,
  DAVINCI_PASS_VALUE,
  resolveOutcomeKey,
} from '../../server/utils/davinciDimensions'

let failures = 0

function check(name: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`  PASS  ${name}`)
  } else {
    failures += 1
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

function rejects(name: string, run: () => unknown, expectedFragment: string) {
  try {
    run()
    failures += 1
    console.error(`  FAIL  ${name} — expected a rejection, got none`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.toLowerCase().includes(expectedFragment.toLowerCase())) {
      console.log(`  PASS  ${name}`)
    } else {
      failures += 1
      console.error(
        `  FAIL  ${name} — rejected for the wrong reason: "${message}"`,
      )
    }
  }
}

const mystery: DeckDefinition = {
  key: 'genre-mystery',
  passValue: 1,
  axes: [
    { key: 'truth', label: 'Truth' },
    { key: 'trust', label: 'Trust' },
    { key: 'nerve', label: 'Nerve' },
  ],
}

console.log('Ending deck math — a small genre deck')

check(
  'a three-axis deck has eight endings',
  deckEndingCount(mystery) === 8 && deckOutcomeKeys(mystery).length === 8,
)
check(
  'every outcome key is distinct and the right width',
  new Set(deckOutcomeKeys(mystery)).size === 8 &&
    deckOutcomeKeys(mystery).every((key) => key.length === 3),
)
check(
  'outcome keys run in ascending binary order',
  deckOutcomeKeys(mystery).join(',') === '000,001,010,011,100,101,110,111',
  deckOutcomeKeys(mystery).join(','),
)
check(
  'bit i is axis i, not a sorted or hashed order',
  resolveDeckOutcomeKey(mystery, { truth: 1 }) === '100' &&
    resolveDeckOutcomeKey(mystery, { nerve: 1 }) === '001',
)
check(
  'a missing stat fails its axis',
  resolveDeckOutcomeKey(mystery, {}) === '000',
)
check(
  'a below-threshold stat fails its axis',
  resolveDeckOutcomeKey(mystery, { truth: 0, trust: -3 }) === '000',
)
check(
  'the same stats always give the same key',
  resolveDeckOutcomeKey(mystery, { truth: 2, nerve: 1 }) ===
    resolveDeckOutcomeKey(mystery, { nerve: 1, truth: 2 }),
)
check(
  'a stat the deck does not declare cannot change the key',
  resolveDeckOutcomeKey(mystery, { truth: 1, notoriety: 99 }) === '100',
)
check(
  'passValue raises the bar rather than being ignored',
  resolveDeckOutcomeKey({ ...mystery, passValue: 3 }, { truth: 2 }) === '000' &&
    resolveDeckOutcomeKey({ ...mystery, passValue: 3 }, { truth: 3 }) === '100',
)

console.log('Ending deck math — the Life deck still resolves as it always did')

check(
  'LIFE_DECK declares the ten Da Vinci dimensions in their fixed bit order',
  LIFE_DECK.axes.map((axis) => axis.key).join(',') ===
    DAVINCI_DIMENSIONS.join(','),
  LIFE_DECK.axes.map((axis) => axis.key).join(','),
)
check('the Life deck has 1,024 endings', deckEndingCount(LIFE_DECK) === 1024)
check(
  'every Life axis carries a label and a description for the narrator',
  LIFE_DECK.axes.every((axis) => Boolean(axis.label && axis.description)),
)

// The regression that would quietly re-key 1,024 seeded endings:
// davinciDimensions.resolveOutcomeKey now delegates here, so the two must agree
// on every stat map, not merely on the happy path.
let identical = true
let mismatch = ''
for (let iteration = 0; iteration < 500; iteration += 1) {
  const stats: Record<string, number> = {}
  for (const dimension of DAVINCI_DIMENSIONS) {
    if (Math.random() < 0.6) {
      stats[dimension] = Math.floor(Math.random() * 6) - 2
    }
  }
  const legacy = DAVINCI_DIMENSIONS.map((key) =>
    (stats[key] ?? 0) >= DAVINCI_PASS_VALUE ? '1' : '0',
  ).join('')
  if (
    resolveOutcomeKey(stats) !== legacy ||
    resolveDeckOutcomeKey(LIFE_DECK, stats) !== legacy
  ) {
    identical = false
    mismatch = JSON.stringify(stats)
    break
  }
}
check(
  'the deck resolver and the pre-deck Da Vinci resolver agree on 500 random stat maps',
  identical,
  mismatch,
)

console.log('Ending deck math — axis parsing')

const roundTripped = parseDeckAxes(serializeDeckAxes(LIFE_DECK.axes))
check(
  'axes survive a serialize/parse round trip in order',
  roundTripped.map((axis) => axis.key).join(',') ===
    LIFE_DECK.axes.map((axis) => axis.key).join(','),
)
check(
  'a bare key gets its own label rather than an empty one',
  parseDeckAxes('[{"key":"truth"}]')[0]!.label === 'truth',
)
check(
  'optional copy normalizes to null rather than empty strings',
  parseDeckAxes('[{"key":"truth","description":"  "}]')[0]!.description ===
    null,
)

// Every rejection below protects the same invariant: an axis list that loads
// with a silently missing or renamed entry renumbers every bit after it, which
// corrupts already-seeded endings instead of merely erroring.
rejects('rejects empty axes', () => parseDeckAxes(''), 'must declare its axes')
rejects('rejects invalid JSON', () => parseDeckAxes('{oops'), 'valid JSON')
rejects('rejects a non-array', () => parseDeckAxes('{"key":"truth"}'), 'array')
rejects('rejects zero axes', () => parseDeckAxes('[]'), 'axes')
rejects(
  'rejects more axes than a deck may have',
  () =>
    parseDeckAxes(
      JSON.stringify(
        Array.from({ length: 13 }, (_, index) => ({ key: `axis_${index}` })),
      ),
    ),
  'axes',
)
rejects(
  'rejects a duplicate axis key',
  () => parseDeckAxes('[{"key":"truth"},{"key":"truth"}]'),
  'duplicate deck axis key',
)
rejects(
  'rejects a non-snake_case axis key',
  () => parseDeckAxes('[{"key":"Truth Level"}]'),
  'snake_case',
)
rejects(
  'rejects an axis that is not an object',
  () => parseDeckAxes('["truth"]'),
  'must be an object',
)

if (failures) {
  console.error(`\n${failures} check(s) failed.`)
  process.exit(1)
}
console.log('\nAll ending deck math checks passed.')
