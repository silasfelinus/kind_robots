// utils/scripts/verifyStorybookDecks.ts
//
// Contract check for the ending-deck authoring format and its importer
// (storybook/t-030). No network and no database: this exercises the parser and
// the completeness rules directly, against both synthetic decks and the real
// conductor files when they are checked out beside this repo.
//
// The property that matters is coverage. A deck missing one outcomeKey is a
// deck a real run can fall out of with no ending to show -- surfacing as a 404
// after the reader has already played the whole story. Everything below exists
// to make that impossible to ship.

import { existsSync } from 'node:fs'
import {
  assertDeckComplete,
  deckConditionKey,
  endingConditionKey,
  endingTriggerCode,
  loadDeckFiles,
  parseDeckFile,
  type DeckPayload,
} from './seedStorybookDecks'
import {
  LIFE_DECK,
  LIFE_DECK_KEY,
  deckOutcomeKeys,
  parseDeckAxes,
  serializeDeckAxes,
} from '../../server/utils/endingDeckMath'

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

function syntheticDeck(overrides: Partial<DeckPayload> = {}): DeckPayload {
  const axes = [
    { key: 'truth', label: 'Truth' },
    { key: 'trust', label: 'Trust' },
  ]
  return {
    key: 'genre-fixture',
    title: 'Fixture',
    ownerKind: 'GENRE_FACET',
    axes,
    passValue: 1,
    endings: deckOutcomeKeys({ key: 'genre-fixture', axes, passValue: 1 }).map(
      (outcomeKey) => ({
        outcomeKey,
        title: `Ending ${outcomeKey}`,
        slug: `fixture-${outcomeKey}`,
        summary: `The fixture ending for ${outcomeKey}.`,
      }),
    ),
    ...overrides,
  }
}

console.log('Ending decks — the authoring format')

const parsed = parseDeckFile(
  `key: genre-parse
title: Parse
axes:
  - key: truth
    label: Truth
`,
  'inline',
)
check('parses a minimal deck document', parsed.key === 'genre-parse')
rejects(
  'rejects a document that is not a deck',
  () => parseDeckFile('- a\n- b', 'inline'),
  'not a deck',
)
rejects(
  'rejects a deck with no key',
  () => parseDeckFile('title: No key\naxes:\n  - key: truth\n', 'inline'),
  'key and a title',
)
rejects(
  'rejects a deck with no axes',
  () => parseDeckFile('key: k\ntitle: T\n', 'inline'),
  'at least one axis',
)

console.log('Ending decks — a deck must cover its own outcome space')

assertDeckComplete(syntheticDeck(), 'fixture')
console.log('  PASS  accepts a complete deck')

rejects(
  'rejects a deck missing an outcomeKey',
  () =>
    assertDeckComplete(
      syntheticDeck({
        endings: syntheticDeck().endings!.slice(0, 3),
      }),
      'fixture',
    ),
  'exactly 4 endings',
)
rejects(
  'rejects an outcomeKey the axes cannot produce',
  () =>
    assertDeckComplete(
      syntheticDeck({
        endings: [
          ...syntheticDeck().endings!.slice(0, 3),
          {
            outcomeKey: '111',
            title: 'Too wide',
            slug: 'fixture-too-wide',
            summary: 'A three-bit key on a two-axis deck.',
          },
        ],
      }),
      'fixture',
    ),
  'unexpected',
)
rejects(
  'rejects a duplicate outcomeKey',
  () =>
    assertDeckComplete(
      syntheticDeck({
        endings: syntheticDeck().endings!.map((ending, index) =>
          index === 3 ? { ...ending, outcomeKey: '00' } : ending,
        ),
      }),
      'fixture',
    ),
  'duplicate outcomekey',
)
rejects(
  'rejects a duplicate ending slug',
  () =>
    assertDeckComplete(
      syntheticDeck({
        endings: syntheticDeck().endings!.map((ending) => ({
          ...ending,
          slug: 'same',
        })),
      }),
      'fixture',
    ),
  'duplicate',
)
check(
  'an axes-only deck (the life deck) is complete without endings',
  (() => {
    assertDeckComplete(syntheticDeck({ endings: [] }), 'fixture')
    return true
  })(),
)

console.log('Ending decks — award keys')

check(
  'the life deck keeps its historical davinci- trigger prefix',
  endingTriggerCode(LIFE_DECK_KEY, '1010101010') ===
    'davinci-ending-1010101010',
  endingTriggerCode(LIFE_DECK_KEY, '1010101010'),
)
check(
  'the life deck keeps its historical condition key',
  endingConditionKey(LIFE_DECK_KEY, '1010101010') === 'ending:1010101010',
)
check(
  'a genre deck namespaces its trigger code by deck',
  endingTriggerCode('genre-mystery', '101') ===
    'storybook-ending-genre-mystery-101',
)
check(
  'a genre deck namespaces its condition key by deck',
  endingConditionKey('genre-mystery', '101') === 'ending:genre-mystery:101',
)
check(
  "two decks' identical outcome keys do not collide",
  endingTriggerCode('genre-mystery', '101') !==
    endingTriggerCode('genre-heist', '101'),
)
check(
  'a deck collection has its own condition key',
  deckConditionKey('genre-mystery') === 'deck:genre-mystery',
)

console.log('Ending decks — the real conductor files')

// Present when conductor is checked out beside this repo (the nightly job does
// exactly that). Skipped rather than failed otherwise, so the suite still runs
// in a bare kind_robots checkout.
const DECK_DIRS = [
  'conductor-src/projects/storybook/data/ending-decks',
  '../conductor/projects/storybook/data/ending-decks',
]
// The first path is where davinci-seed-verify.yml checks conductor out; the
// second is the usual side-by-side clone layout. A checkout with neither
// skips these checks rather than failing, so the suite still runs in a bare
// kind_robots clone.
const deckDir = DECK_DIRS.find((dir) => existsSync(dir))

if (!deckDir) {
  console.log('  SKIP  conductor not checked out beside this repo')
} else {
  const decks = loadDeckFiles(deckDir)
  check(`loads every deck file in ${deckDir}`, decks.length >= 1)

  for (const { source, deck } of decks) {
    const axes = parseDeckAxes(serializeDeckAxes(deck.axes))
    check(
      `${deck.key}: axes round-trip through the deck-math parser`,
      axes.length === deck.axes.length,
      source,
    )
    if (deck.key === LIFE_DECK_KEY) {
      check(
        'life.yaml matches LIFE_DECK bit for bit',
        deck.axes.map((axis) => axis.key).join(',') ===
          LIFE_DECK.axes.map((axis) => axis.key).join(','),
        deck.axes.map((axis) => axis.key).join(','),
      )
      check(
        'life.yaml authors no endings of its own (they are generated)',
        !(deck.endings || []).length,
      )
      continue
    }
    const endings = deck.endings || []
    check(
      `${deck.key}: authors all ${2 ** deck.axes.length} endings`,
      endings.length === 2 ** deck.axes.length,
      String(endings.length),
    )
    check(
      `${deck.key}: every ending summary is a complete sentence`,
      endings.every((ending) => {
        const text = ending.summary.trim()
        return text.endsWith('.') && text.split(/\s+/).length >= 10
      }),
    )
    check(
      `${deck.key}: not every ending is a win`,
      new Set(endings.map((ending) => ending.victoryType ?? 'MIXED')).size > 1,
    )
  }

  const allSlugs = decks.flatMap((entry) =>
    (entry.deck.endings || []).map((ending) => ending.slug),
  )
  check(
    'no ending slug is reused across decks',
    new Set(allSlugs).size === allSlugs.length,
  )
  const allOutcomeTriggers = decks.flatMap((entry) =>
    (entry.deck.endings || []).map((ending) =>
      endingTriggerCode(entry.deck.key, ending.outcomeKey),
    ),
  )
  check(
    'no Achievement trigger code is reused across decks',
    new Set(allOutcomeTriggers).size === allOutcomeTriggers.length,
  )
}

if (failures) {
  console.error(`\n${failures} check(s) failed.`)
  process.exit(1)
}
console.log('\nAll ending deck checks passed.')
