// /utils/scripts/verifyStorybookPlayAgainBoardGuard.mjs
//
// Regression guard (storybook/t-060). storybook-storymaker.vue's playAgain()
// used to drop the reader straight back on a blank Table -- t-059's own
// comment documented that as a known gap, kept as a separate function from
// newTable() specifically so retention had a seam to land in later. This
// guard pins that later landing:
//
//   - storybookRunStore.ts records the board a run was opened with (in
//     slugs, via openStory()'s optional boardSlugs argument) into
//     `openedBoard`, which reset() clears like everything else tied to a
//     specific run.
//   - playAgain() must call retainBoardForPlayAgain() BEFORE leaveRun() --
//     leaveRun() calls reset(), which wipes openedBoard, so copying it into
//     the one-shot `playAgainBoard` handoff has to happen first.
//   - newTable() must NOT retain anything: "start over" stays a true reset.
//   - consumePlayAgainBoard() is one-shot (reads playAgainBoard then clears
//     it), so an ordinary visit or a second "start over" never re-seeds a
//     stale board.
//   - storybook-table.vue's openStory() must pass a boardSlugs snapshot
//     alongside the wire payload, and its onMounted() must call
//     seedFromPlayAgain() (which consumes the store's one-shot handoff)
//     after the decks it resolves slugs against have loaded.
//
// Deliberately narrow, matching this repo's other storybook guards: it does
// not assert UI classes or exact seeding order beyond "after the decks
// loaded" -- a restyle of the Table must not fail this.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractTsFunctionBody } from './lib/extractTsFunctionBody.mjs'

const STORE_PATH = 'stores/storybookRunStore.ts'
const STORYMAKER_PATH = 'components/storybook/storybook-storymaker.vue'
const TABLE_PATH = 'components/storybook/storybook-table.vue'

function source(path) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

const storeContent = source(STORE_PATH)
const storymakerContent = source(STORYMAKER_PATH)
const tableContent = source(TABLE_PATH)

console.log('Storybook Play Again board retention — the store')

assert.ok(
  /export interface StorybookBoardSlugs\b/.test(storeContent),
  `${STORE_PATH} must export a StorybookBoardSlugs type -- the per-slot slug ` +
    'snapshot playAgain() retains and the Table re-seeds from.',
)

assert.ok(
  /const openedBoard = ref<StorybookBoardSlugs \| null>\(null\)/.test(
    storeContent,
  ),
  `${STORE_PATH} must keep an \`openedBoard\` ref recording the board the ` +
    'current run was opened with -- retainBoardForPlayAgain() has nothing ' +
    'to copy from otherwise.',
)

assert.ok(
  /const playAgainBoard = ref<StorybookBoardSlugs \| null>\(null\)/.test(
    storeContent,
  ),
  `${STORE_PATH} must keep a \`playAgainBoard\` ref -- the one-shot handoff ` +
    "to the Table's next mount.",
)

const openStoryStoreBody = extractTsFunctionBody(storeContent, 'openStory', {
  path: STORE_PATH,
  notFoundHint: 'has it been renamed, removed, or inlined?',
})
assert.ok(
  /boardSlugs\?:\s*StorybookBoardSlugs/.test(
    storeContent.slice(
      storeContent.indexOf('function openStory('),
      storeContent.indexOf('function openStory(') + 200,
    ),
  ),
  `openStory() in ${STORE_PATH} must accept an optional boardSlugs: ` +
    'StorybookBoardSlugs second parameter -- the wire payload alone cannot ' +
    'tell hero apart from company or carry a narrator slug.',
)
assert.ok(
  /openedBoard\.value = boardSlugs \?\? null/.test(openStoryStoreBody),
  `openStory() in ${STORE_PATH} must record \`openedBoard.value = ` +
    'boardSlugs ?? null` once the run is successfully applied -- otherwise ' +
    'a played board is never remembered for playAgain() to retain.',
)

const resetBody = extractTsFunctionBody(storeContent, 'reset', {
  path: STORE_PATH,
  notFoundHint: 'has it been renamed, removed, or inlined?',
})
assert.ok(
  /openedBoard\.value = null/.test(resetBody),
  `reset() in ${STORE_PATH} must clear openedBoard, like every other piece ` +
    'of state tied to a specific run.',
)
assert.ok(
  !/playAgainBoard\.value = null/.test(resetBody),
  `reset() in ${STORE_PATH} must NOT clear playAgainBoard -- leaveRun() ` +
    'calls reset() on every exit from a run, including playAgain(), and ' +
    'the whole point of the one-shot handoff is to survive that clear.',
)

const retainBody = extractTsFunctionBody(
  storeContent,
  'retainBoardForPlayAgain',
  {
    path: STORE_PATH,
    notFoundHint: 'has it been renamed, removed, or inlined?',
  },
)
assert.ok(
  /playAgainBoard\.value = openedBoard\.value/.test(retainBody),
  `retainBoardForPlayAgain() in ${STORE_PATH} must copy openedBoard into ` +
    'playAgainBoard.',
)

const consumeBody = extractTsFunctionBody(
  storeContent,
  'consumePlayAgainBoard',
  {
    path: STORE_PATH,
    notFoundHint: 'has it been renamed, removed, or inlined?',
  },
)
assert.ok(
  /playAgainBoard\.value = null/.test(consumeBody) &&
    /return board/.test(consumeBody),
  `consumePlayAgainBoard() in ${STORE_PATH} must read playAgainBoard, clear ` +
    'it, and return what it read -- it has to be one-shot, or an ordinary ' +
    'page visit (or a later "start over") would re-seed a stale board.',
)

assert.ok(
  storeContent.includes('retainBoardForPlayAgain,') &&
    storeContent.includes('consumePlayAgainBoard,'),
  `${STORE_PATH} must return retainBoardForPlayAgain and ` +
    'consumePlayAgainBoard from the store, or nothing outside it can call them.',
)

console.log('Storybook Play Again board retention — the storymaker')

const playAgainBody = extractTsFunctionBody(storymakerContent, 'playAgain', {
  path: STORYMAKER_PATH,
  notFoundHint: 'has it been renamed, removed, or inlined?',
})
const retainCallIndex = playAgainBody.indexOf(
  'runStore.retainBoardForPlayAgain()',
)
const leaveRunCallIndex = playAgainBody.indexOf('runStore.leaveRun()')
assert.ok(
  retainCallIndex !== -1 && leaveRunCallIndex !== -1,
  `playAgain() in ${STORYMAKER_PATH} must call both ` +
    'runStore.retainBoardForPlayAgain() and runStore.leaveRun().',
)
assert.ok(
  retainCallIndex < leaveRunCallIndex,
  `playAgain() in ${STORYMAKER_PATH} must call retainBoardForPlayAgain() ` +
    'BEFORE leaveRun() -- leaveRun() resets openedBoard, so retaining it ' +
    'after that call would always copy null.',
)

const newTableBody = extractTsFunctionBody(storymakerContent, 'newTable', {
  path: STORYMAKER_PATH,
  notFoundHint: 'has it been renamed, removed, or inlined?',
})
assert.ok(
  !newTableBody.includes('retainBoardForPlayAgain'),
  `newTable() in ${STORYMAKER_PATH} must NOT retain the board -- "start ` +
    'over" is a true reset, distinct from "Play Again".',
)

console.log('Storybook Play Again board retention — the Table')

const openStoryTableBody = extractTsFunctionBody(tableContent, 'openStory', {
  path: TABLE_PATH,
  notFoundHint: 'has it been renamed, removed, or inlined?',
})
assert.ok(
  /runStore\.openStory\(payload, boardSlugs\)/.test(openStoryTableBody),
  `openStory() in ${TABLE_PATH} must call runStore.openStory(payload, ` +
    'boardSlugs) -- passing only payload leaves nothing for playAgain() to ' +
    'retain.',
)

assert.ok(
  /function seedFromPlayAgain\(\): void \{/.test(tableContent),
  `${TABLE_PATH} must define a seedFromPlayAgain() function.`,
)
const seedFromPlayAgainBody = extractTsFunctionBody(
  tableContent,
  'seedFromPlayAgain',
  {
    path: TABLE_PATH,
    notFoundHint: 'has it been renamed, removed, or inlined?',
  },
)
assert.ok(
  /runStore\.consumePlayAgainBoard\(\)/.test(seedFromPlayAgainBody),
  `seedFromPlayAgain() in ${TABLE_PATH} must call ` +
    'runStore.consumePlayAgainBoard() -- otherwise the retained board is ' +
    'never actually read.',
)

// The receiving half: onMounted must call seedFromPlayAgain() only after the
// decks it resolves retained slugs against have loaded, same discipline as
// the deep-link guard requires of seedFromQuery().
const onMountedBody = (() => {
  const match = /onMounted\(async \(\) => \{([\s\S]*?)\n\}\)/.exec(tableContent)
  if (!match) {
    throw new Error(
      `Could not find \`onMounted(async () => { ... })\` in ${TABLE_PATH} -- ` +
        'has it been renamed, removed, or restructured? If so, this guard ' +
        'needs to move with it.',
    )
  }
  return match[1]
})()
const allSettledIndex = onMountedBody.indexOf('Promise.allSettled')
const seedPlayAgainCallIndex = onMountedBody.indexOf('seedFromPlayAgain()')
assert.ok(
  allSettledIndex !== -1 && seedPlayAgainCallIndex !== -1,
  `onMounted() in ${TABLE_PATH} must await Promise.allSettled(...) and call ` +
    'seedFromPlayAgain().',
)
assert.ok(
  seedPlayAgainCallIndex > allSettledIndex,
  `onMounted() in ${TABLE_PATH} must call seedFromPlayAgain() AFTER ` +
    'awaiting Promise.allSettled([...]) -- calling it earlier means every ' +
    'deck lookup it depends on runs against empty stores.',
)

console.log(
  'Storybook Play Again board retention contract passed: playAgain() ' +
    'retains the played board before leaveRun() clears it, newTable() stays ' +
    'a true reset, the handoff is one-shot, and the Table only re-seeds ' +
    'from it once its decks have loaded.',
)
