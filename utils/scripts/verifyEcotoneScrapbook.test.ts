import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { COMPANIONS, ENDING_IDS } from '../ecotone/content'
import {
  advance,
  chooseBeat,
  chooseCrossroads,
  chooseEvent,
  chooseFork,
  createRun,
  findCard,
  type RunState,
} from '../ecotone/engine'
import { contextualOpeningChoices } from '../ecotone/sceneOffers'
import { EVENTS } from '../ecotone/story'
import { endingDossier } from '../ecotone/endingDossier'
import {
  SCRAPBOOK_HIGHLIGHTS,
  SCRAPBOOK_LIMIT,
  addScrapbookPage,
  sanitizeScrapbook,
  scrapbookGuides,
  scrapbookPage,
} from '../ecotone/scrapbook'

// Main-game standard (STANDARD-AUDIT-2026-11-12): a persistent per-run
// Scrapbook and a guides-met record that outlives the current run.

function playRandom(seed: number, eventId: string): RunState {
  let rng = seed * 2654435761
  const next = (n: number) => {
    rng = (Math.imul(rng ^ (rng >>> 15), 2246822519) + 0x6d2b79f5) >>> 0
    return rng % n
  }
  let state: RunState = advance(
    chooseEvent(
      createRun(seed, 'reporter'),
      eventId as Exclude<RunState['event'], null>,
    ),
  )
  for (let turn = 0; state.phase !== 'end'; turn++) {
    assert.ok(turn < 120, `${eventId} seed ${seed} never stalls`)
    if (state.phase === 'fork') {
      state = chooseFork(state, state.offered[next(state.offered.length)]!)
      continue
    }
    if (state.phase === 'crossroads') {
      state = advance(chooseCrossroads(state, next(2) === 0))
      continue
    }
    const card = findCard(state.card)!
    const playable = contextualOpeningChoices(card, state).filter(
      (choice) =>
        !choice.locked &&
        (!choice.requiresFlag || state.flags.includes(choice.requiresFlag)),
    )
    state = advance(chooseBeat(state, playable[next(playable.length)]!.id))
  }
  return state
}

// An unfinished weekend earns no page.
assert.equal(scrapbookPage(createRun(3, 'reporter'), 'now'), null)

let pages: ReturnType<typeof sanitizeScrapbook> = []
let pagesWritten = 0
const fates = new Set<string>()
for (const event of EVENTS) {
  for (let seed = 1; seed <= 12; seed++) {
    const run = playRandom(seed, event.id)
    assert.ok(run.ending && ENDING_IDS.includes(run.ending))
    const page = scrapbookPage(run, '2026-11-18T20:00:00.000Z')
    assert.ok(page, `${event.id} seed ${seed} earns a page`)
    pagesWritten++
    fates.add(page.fate)
    // Every fact on the page comes from the run itself.
    assert.equal(page.endingId, run.ending)
    assert.equal(page.endingTitle, endingDossier(run.ending)!.title)
    assert.deepEqual(page.meetingOrder, run.meetingOrder)
    assert.equal(page.followed.length, run.followHistory.length)
    assert.equal(page.decisions, run.log.length)
    assert.equal(
      page.checksPassed + page.checksFailed,
      run.log.filter((entry) => entry.roll).length,
    )
    assert.ok(page.highlights.length > 0, 'a finished weekend has highlights')
    assert.ok(page.highlights.length <= SCRAPBOOK_HIGHLIGHTS)
    for (const moment of page.highlights)
      assert.ok(
        run.log.some(
          (entry) =>
            entry.choice === moment.choice &&
            entry.title === moment.title &&
            entry.day === moment.day,
        ),
        'a highlight is a choice the player actually made',
      )
    assert.deepEqual(
      page.highlights.map((moment) => moment.day),
      [...page.highlights.map((moment) => moment.day)].sort((a, b) => a - b),
      'highlights read in story order',
    )
    // Writing the same finished run twice keeps one page.
    pages = addScrapbookPage(addScrapbookPage(pages, page), page)
    // The stored form survives a JSON round-trip unchanged.
    assert.deepEqual(
      sanitizeScrapbook(JSON.parse(JSON.stringify(pages))),
      pages,
    )
  }
}
assert.equal(fates.size, 2, 'the scrapbook records hopeful and dark weekends')
assert.equal(pages.length, Math.min(pagesWritten, SCRAPBOOK_LIMIT))
assert.ok(pages.length === SCRAPBOOK_LIMIT, 'the scrapbook is capped')
// Newest first.
const newest = playRandom(999, 'kinetic')
const newestPage = scrapbookPage(newest, '2026-11-19T00:00:00.000Z')!
assert.equal(addScrapbookPage(pages, newestPage)[0]!.id, newestPage.id)

// Guides met on earlier weekends are remembered, in canonical order.
const remembered = scrapbookGuides(pages)
assert.ok(remembered.length > 0)
assert.deepEqual(
  remembered,
  COMPANIONS.map((c) => c.id).filter((id) => remembered.includes(id)),
)
assert.deepEqual(scrapbookGuides([]), [])

// Forged or malformed storage is dropped, and titles are re-read from the story.
const forged = sanitizeScrapbook([
  null,
  'page',
  { id: 'x', endingId: 'stranger.sober.hope' },
  { ...pages[0], endingTitle: 'You Win Everything', meetingOrder: ['zeus'] },
  { ...pages[0] },
  {
    ...pages[1],
    openingState: 'heroin',
    decisions: -4,
    highlights: [{ day: 1, title: 'x', choice: 'y', outcome: 'jackpot' }],
  },
])
assert.equal(forged.length, 2, 'unknown endings and duplicate ids are dropped')
assert.equal(forged[0]!.endingTitle, pages[0]!.endingTitle)
assert.deepEqual(forged[0]!.meetingOrder, [])
assert.equal(forged[1]!.openingState, null)
assert.equal(forged[1]!.decisions, 0)
assert.equal(forged[1]!.highlights[0]!.outcome, null)
assert.deepEqual(sanitizeScrapbook('nope'), [])

// The store writes pages only from a played step and clears them on reset;
// the board shows them and lets past guides stay revealed.
const store = readFileSync('stores/ecotoneStore.ts', 'utf8')
assert.match(store, /if \(before\?\.phase !== 'end'\) \{/)
assert.match(store, /scrapbookPage\(next,/)
const reset = store.slice(store.indexOf('function resetCollection()'))
assert.match(
  reset.slice(0, reset.indexOf('\n  }\n')),
  /scrapbook\.value = \[\]/,
)
for (const fn of ['function loadSlot', 'function importSave', 'function undo'])
  assert.doesNotMatch(
    store.slice(store.indexOf(fn), store.indexOf('\n  }\n', store.indexOf(fn))),
    /scrapbook/,
    `${fn} never writes a scrapbook page`,
  )
const board = readFileSync('components/ecotone-board.vue', 'utf8')
assert.match(board, /data-testid="ecotone-scrapbook"/)
assert.match(board, /scrapbookGuides\(game\.scrapbook\)/)
assert.match(board, /Met on an earlier weekend/)

console.log(
  `Ecotone scrapbook: ${pagesWritten} played weekends, ${pages.length} pages kept, ${remembered.length} guides remembered`,
)
