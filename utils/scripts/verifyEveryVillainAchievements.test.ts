import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { achievementsForGame } from '../achievements/gameAchievements'
import {
  EVT_ACHIEVEMENT_CODES,
  achievementsFor,
  achievementsProven,
} from '../everyVillainTactics/achievements'
import { createStory } from '../everyVillainTactics/firstBellStory'
import {
  ONE_SHOT_MENU,
  SCRAPBOOK_MOMENTS,
  emptyScrapbook,
  type Scrapbook,
  type ScrapbookRecord,
} from '../everyVillainTactics/frontMenu'
import { createSave } from '../everyVillainTactics/saves'
import type { BattleResult } from '../everyVillainTactics/scores'
import { STAGE_PRESETS } from '../everyVillainTactics/studio'
import { trainingState } from '../everyVillainTactics/training'

const C = EVT_ACHIEVEMENT_CODES

const catalog = achievementsForGame('every-villain-tactics').map((e) => e.code)
assert.deepEqual(
  [...catalog].sort(),
  Object.values(C).sort(),
  'Every catalog code has an award rule, and every rule a catalog row.',
)

const record = (id: string): ScrapbookRecord => ({
  id,
  at: '2026-11-01T10:00:00.000Z',
  lead: 'accident-fire',
  perspective: 'hero',
  stage: 'First Bell',
})
let n = 0
const result = (patch: Partial<BattleResult>): BattleResult => ({
  id: (n++).toString(16).padStart(8, '0'),
  at: '2026-11-01T10:00:00.000Z',
  mode: 'story',
  stage: 'First Bell',
  lead: 'accident-fire',
  foil: null,
  perspective: 'hero',
  outcome: 'victory',
  turns: 5,
  total: 500,
  medals: [],
  lines: [],
  ...patch,
})
const book = (
  records: ScrapbookRecord[],
  results: BattleResult[] = [],
): Scrapbook => ({ version: 1, records, results })

assert.deepEqual(achievementsProven(emptyScrapbook(), []), [])

// Story endings and Picnic Panic pages come from witnessed moments.
assert.deepEqual(achievementsProven(book([record('story:victory')]), []), [
  C.firstBellCleared,
])
assert.deepEqual(
  achievementsProven(
    book([
      record('story:defeat'),
      record('picnic:all-rescued'),
      record('picnic:overtime'),
      record('picnic:victory'),
    ]),
    [],
  ),
  [C.firstBellLost, C.picnicRescued, C.overtime, C.picnicWon],
)
assert.ok(
  achievementsProven(
    book(SCRAPBOOK_MOMENTS.map((m) => record(m.id))),
    [],
  ).includes(C.scrapbookFull),
)
assert.ok(
  !achievementsProven(
    book(SCRAPBOOK_MOMENTS.slice(1).map((m) => record(m.id))),
    [],
  ).includes(C.scrapbookFull),
)

// Medals on results.
assert.deepEqual(
  achievementsProven(
    book(
      [],
      [
        result({
          medals: [
            'untouched',
            'no-knockouts',
            'every-civilian',
            'quick-clear',
            'evidence-recovered',
            'healthy-extraction',
          ],
        }),
      ],
    ),
    [],
  ),
  [C.untouched, C.noKnockouts, C.everyCivilian, C.quickClear, C.evidence],
)

// A foil only counts when beaten.
assert.ok(
  !achievementsProven(
    book([], [result({ foil: 'accident-fire', outcome: 'defeat' })]),
    [],
  ).includes(C.rivalFoil),
)
assert.ok(
  achievementsProven(
    book([], [result({ foil: 'accident-fire' })]),
    [],
  ).includes(C.rivalFoil),
)

// Every side: First Bell victories from all four perspectives.
const sides = ['hero', 'villain', 'henchman', 'sidekick'] as const
assert.ok(
  !achievementsProven(
    book(
      [],
      sides.slice(0, 3).map((perspective) => result({ perspective })),
    ),
    [],
  ).includes(C.everySide),
)
assert.ok(
  achievementsProven(
    book(
      [],
      sides.map((perspective) => result({ perspective })),
    ),
    [],
  ).includes(C.everySide),
)

// One-shot sweep: a victory on every stage in the One-Shot menu.
const titles = ONE_SHOT_MENU.map(
  (entry) => STAGE_PRESETS.find((stage) => stage.id === entry.id)!.title,
)
assert.equal(titles.length, 8)
const oneShots = titles.map((stage) => result({ mode: 'oneshot', stage }))
assert.ok(achievementsProven(book([], oneShots), []).includes(C.oneShotSweep))
assert.ok(
  !achievementsProven(
    book(
      [],
      [
        ...oneShots.slice(1),
        result({ mode: 'oneshot', stage: titles[0], outcome: 'defeat' }),
      ],
    ),
    [],
  ).includes(C.oneShotSweep),
)

// Story decisions come from the player's own saves.
const state = trainingState(0x5a55, undefined, { lead: 'accident-fire' })
const storySave = (decisions: string[], completed: boolean) =>
  createSave({
    slot: 'auto',
    perspective: 'hero',
    leadSignature: 'accident-fire',
    stage: null,
    state,
    story: {
      ...createStory(),
      current: null,
      decisions: decisions as never,
      completed,
    },
  })
assert.deepEqual(
  achievementsProven(emptyScrapbook(), [storySave(['rescue'], false)]),
  [C.rescueCall],
)
assert.deepEqual(
  achievementsProven(emptyScrapbook(), [storySave(['spare'], false)]),
  [],
  'Mercy needs the story finished.',
)
assert.deepEqual(
  achievementsProven(emptyScrapbook(), [storySave(['spare'], true)]),
  [C.mercy],
)

// The diff: nothing new in the book awards nothing but story decisions.
const full = book(
  [record('story:victory')],
  [result({ medals: ['untouched'] })],
)
assert.deepEqual(achievementsFor(full, full, []), [])
assert.deepEqual(achievementsFor(full, full, [storySave(['rescue'], false)]), [
  C.rescueCall,
])
assert.deepEqual(achievementsFor(emptyScrapbook(), full, []), [
  C.firstBellCleared,
  C.untouched,
])
const grown = book(full.records, [
  ...full.results,
  result({ foil: 'accident-fire' }),
])
assert.deepEqual(
  achievementsFor(full, grown, []),
  [C.firstBellCleared, C.rivalFoil, C.untouched],
  'A grown book awards everything it proves; the store skips earned codes.',
)

// The store awards only from live saves, never on load.
const store = readFileSync('stores/everyVillainTacticsStore.ts', 'utf8')
assert.ok(store.includes('achievementsFor(before, scrapbook.value, saves)'))
assert.ok(store.includes('if (!award) return'))
assert.ok(store.includes('readSaves(ok)'))
assert.ok(store.includes('recordMoments([result.save])'))
assert.ok(store.includes('EVT_ACHIEVEMENT_CODES.stageArchitect'))

console.log(
  'Every Villain Tactics achievements: 17 codes, diff awards verified.',
)
