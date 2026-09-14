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
const felt = read('assets/css/tailwind.css')

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

console.log('\nStorybook Table — three bands, in this order')

// Silas, 2026-09-13: configuration "should really be at the very top", the
// cards "should appear as a horizontal row at the very bottom of the screen".
// Layout is exactly what a later polish pass silently undoes, so the ORDER is
// pinned rather than the styling.
const bandOrder = ['<header', 'kr-table-felt', 'data-testid="storybook-hand"']
const bandPositions = bandOrder.map((marker) => table.indexOf(marker))
check(
  'the Table renders a top bar, then the cloth, then the hand',
  bandPositions.every((position) => position > 0) &&
    bandPositions.every(
      (position, index) => index === 0 || position > bandPositions[index - 1],
    ),
)
check(
  'configuration lives in the top bar, above the cloth',
  table.indexOf('v-model="title"') < table.indexOf('kr-table-felt') &&
    table.indexOf('v-model="spark"') < table.indexOf('kr-table-felt') &&
    table.indexOf('v-model.number="turnBudget"') <
      table.indexOf('kr-table-felt'),
)
check(
  'the hand is the last band, so nothing sits below it',
  table.lastIndexOf('data-testid="storybook-hand"') >
    table.lastIndexOf('kr-table-felt'),
)
check(
  'the hand is a horizontal row, not a grid',
  /data-testid="storybook-hand"[\s\S]{0,1400}overflow-x-auto/.test(table),
)
check(
  'the cloth is a shared class, not inline gradient soup',
  table.includes('kr-table-felt') && felt.includes('.kr-table-felt'),
)
check(
  'the spread is laid in named rows rather than one auto-fill strip',
  decks.includes('STORYBOOK_SLOT_ROWS') &&
    /The frame/.test(decks) &&
    /The cast/.test(decks),
)
check(
  'each spread row is centered across the cloth instead of piled at the left edge',
  table.includes('mx-auto grid w-full gap-3') &&
    table.includes('justify-self-center') &&
    table.includes('max-w-3xl grid-cols-3') &&
    table.includes('max-w-xl grid-cols-2'),
)
check(
  'hand cards are wide enough to preserve the shared 2:3 card shape',
  table.includes('w-[9.5rem] shrink-0 snap-start'),
)
check(
  'the Collection opens from Chronicle rather than sitting under the Table',
  table.includes('chronicleOpen') &&
    table.includes('Chronicle') &&
    !/StorybookCollection/.test(storymaker),
)
check(
  'the legacy library band only exists at ?legacy=1',
  shell.includes('<header\n      v-if="legacy"') ||
    /v-if="legacy"[\s\S]{0,200}kr-surface-raised/.test(shell),
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

console.log('\nStorybook Taskmaster — the accept step is the feature')

check(
  'a proposal says what applying would do before it is applied',
  /proposal\.effect/.test(reading) && /proposal\.note/.test(reading),
)
check(
  'an unapplied proposal is labelled as not having happened',
  /Not applied — nothing has changed yet/.test(reading),
)
check(
  'accepting is a button the reader presses, not a turn side effect',
  /runStore\.applyProposal\(proposal\.id\)/.test(reading) &&
    !/applyProposal/.test(table),
)
check(
  'an applied proposal renders differently from an unapplied one',
  /v-if="proposal\.applied"/.test(reading),
)
check(
  'the Thread slot deals real projects in taskmaster mode',
  /isTaskmaster\.value\s*\n?\s*\? projectCards\.value/.test(table) &&
    /conductorSlug/.test(table),
)
check(
  'a taskmaster quest refuses to open without an objective and a project',
  /needs an objective/.test(table) && /Thread slot/.test(table),
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
  /<StorybookReading[\s\S]{0,120}v-else-if="runStore\.run"/.test(storymaker) &&
    storymaker.includes('<StorybookTable'),
)
check(
  'a resolved run shows its ending rather than another turn',
  storymaker.includes('<StorybookEnding') &&
    /runStore\.isComplete && runStore\.ending/.test(storymaker),
)
check(
  'the Collection is reachable from the Table, not behind a run',
  // It moved into the Table's Chronicle drawer on 2026-09-13, so the
  // storymaker no longer renders it directly -- the Table does.
  table.includes('<StorybookCollection') &&
    !storymaker.includes('<StorybookCollection'),
)

console.log('\nStorybook Ending — credit without spoilers')

const endingScreen = read('components/storybook/storybook-ending.vue')
const collectionScreen = read('components/storybook/storybook-collection.vue')

check(
  'the ending reveal names the deck total it was added to',
  endingScreen.includes('Added to your collection') &&
    /collection\.found/.test(endingScreen) &&
    /collection\.total/.test(endingScreen),
)
check(
  'an unfound ending renders no title and no summary',
  /entry\.unlocked \? entry\.title : 'Not found yet'/.test(endingScreen) &&
    /v-if="entry\.unlocked"[\s\S]{0,120}entry\.title/.test(endingScreen),
)
check(
  'a thousand-ending album is capped rather than drawn tile by tile',
  /MAX_ALBUM_TILES/.test(endingScreen),
)
check(
  'found endings are drawn before the dark ones',
  /const found = all\.filter\(\(entry\) => entry\.unlocked\)/.test(
    endingScreen,
  ),
)
check(
  'the Collection reads adventures off the server, not localStorage',
  // The word appears in this file's header, explaining what it replaced -- so
  // this looks for a CALL, not a mention.
  /runStore\.fetchAdventures\(\)/.test(collectionScreen) &&
    !/localStorage\.(get|set|remove)Item/.test(collectionScreen),
)

if (failures > 0) {
  console.error(`\n${failures} Storybook Table/Reading check(s) FAILED`)
  process.exit(1)
}
console.log('\nAll Storybook Table and Reading checks passed.')
