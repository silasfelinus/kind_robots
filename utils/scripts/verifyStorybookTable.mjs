// /utils/scripts/verifyStorybookTable.mjs
//
// The Table and the Reading, pinned (storybook/t-034, t-035).
//
// Silas rejected the screen these replace on 2026-09-09 for being "too
// text-and-button driven", and drew the line himself on 2026-09-12: "All
// selections before the story begins should be card hand based" -- clarified as
// "that doesn't count reasonable settings, start story, etc. I just meant all
// the flavor bits, including mode select, narrator, etc."
//
// That line is the thing worth pinning. It is easy to satisfy on the day and
// lose in a later polish pass: one refactor turns the mode cards into a
// <select>, another moves the length dial into the hand, and the screen is a
// form again with cards decorating it. These checks fail that.
//
// They also pin the two behaviours that are correctness rather than taste: a
// turn-count that must not be shown when there is no budget (an open-ended run
// has none -- t-040), and the ledger that only structured mode may show.
//
//   node utils/scripts/verifyStorybookTable.mjs

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const TABLE = 'components/storybook/storybook-table.vue'
const READING = 'components/storybook/storybook-reading.vue'
const STORYMAKER = 'components/storybook/storybook-storymaker.vue'
const SHELL = 'components/pages/storybook-library-page.vue'
const DECKS = 'utils/storybookTableDecks.ts'

const read = (path) => readFileSync(path, 'utf8')
const table = read(TABLE)
const reading = read(READING)
const storymaker = read(STORYMAKER)
const shell = read(SHELL)
const decks = read(DECKS)

let failures = 0
function check(label, condition) {
  if (condition) {
    console.log(`  PASS  ${label}`)
    return
  }
  console.error(`  FAIL  ${label}`)
  failures += 1
}

console.log('Storybook Table — the flavour bits are cards')

check(
  'every creative slot is on the board',
  ['mode', 'genre', 'place', 'hero', 'company', 'narrator', 'thread', 'treasures'].every(
    (slot) => new RegExp(`key: '${slot}'`).test(decks),
  ),
)
check(
  'mode is dealt as cards, not a select',
  decks.includes('MODE_CARDS') &&
    table.includes('MODE_CARDS') &&
    !/\bv-model="mode"/.test(table),
)
check(
  'the narrator slot is dealt from real narrator Bots',
  table.includes("performFetch<NarratorLike[]>('/api/narrators')") &&
    decks.includes('toNarratorCard'),
)
check(
  'slots render the entity card component rather than a bespoke tile',
  table.includes('<NarrativeIngredientCard'),
)
check(
  'only genre, place and hero are required',
  (decks.match(/required: true/g) || []).length === 3,
)

console.log('\nStorybook Table — settings stay ordinary controls')

check(
  'the length dial is a select, and is not in the hand',
  /v-model\.number="turnBudget"/.test(table) &&
    !decks.includes('LENGTH_PRESETS_AS_CARDS'),
)
check(
  'title and spark are typed input',
  /v-model="title"/.test(table) && /v-model="spark"/.test(table),
)
check(
  'the delivery dial rides on the placed narrator card',
  /v-if="placed\('narrator'\)\.length"/.test(table) &&
    /v-model="narratorStyle"/.test(table),
)
check(
  'endless is a length choice, not a mode card of its own',
  table.includes('payload.turnBudget = null') &&
    !decks.includes("slug: 'endless'"),
)

console.log('\nStorybook Reading — three moves, always together')

check(
  'options, a written move and the character sheet are all rendered',
  reading.includes('storybook-options') &&
    reading.includes('runStore.writeMove') &&
    reading.includes('runStore.playCard'),
)
check(
  'the sheet plays a card by slug and nothing else',
  /runStore\.playCard\(card\.slug\)/.test(reading),
)
check(
  'choosing an option sends only its id',
  /runStore\.chooseOption\(option\.id\)/.test(reading),
)

console.log('\nStorybook Reading — an endless run has no last page')

check(
  'the turn pips only count toward a budget when there is one',
  /v-if="runStore\.isEndless"[\s\S]{0,200}no last page/.test(reading),
)
check(
  'the end-of-story button reads as the reader\'s own move when endless',
  /runStore\.isEndless \? 'Bring this to an end'/.test(reading),
)
check(
  'resolving is offered on the server\'s word, not a local guess',
  /v-if="runStore\.readyToResolve"/.test(reading),
)

console.log('\nStorybook Reading — the deck keeps its secrets')

check(
  'the ledger renders only when the server sent stats at all',
  /v-if="runStore\.stats"/.test(reading),
)
check(
  'the real objective is a field beside the fiction, not prose',
  reading.includes('storybook-quest-objective') &&
    /quest\.objective/.test(reading),
)

console.log('\nStorybook — the storymaker is the front door')

check(
  'the shell opens on the storymaker',
  shell.includes('<StorybookStorymaker v-if="!legacy"'),
)
check(
  'the outgoing beat loop is reachable only at ?legacy=1',
  /route\.query\.legacy === '1'/.test(shell),
)
check(
  'the storymaker resumes an active run on mount',
  storymaker.includes('runStore.resumeActiveRun()'),
)
check(
  'the storymaker shows the Reading when there is a run, the Table when not',
  /<StorybookReading[\s\S]{0,120}v-if="runStore\.run"/.test(storymaker) &&
    storymaker.includes('<StorybookTable'),
)

if (failures > 0) {
  console.error(`\n${failures} Storybook Table/Reading check(s) FAILED`)
  process.exit(1)
}
console.log('\nAll Storybook Table and Reading checks passed.')
