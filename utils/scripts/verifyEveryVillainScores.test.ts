import assert from 'node:assert/strict'
import {
  emptyScrapbook,
  mergeScrapbook,
  sanitizeScrapbook,
} from '../everyVillainTactics/frontMenu'
import { createStory } from '../everyVillainTactics/firstBellStory'
import { createSave, loadSave } from '../everyVillainTactics/saves'
import {
  MAX_SCORE_HISTORY,
  mergeBattleResults,
  scoreFromSave,
} from '../everyVillainTactics/scores'
import { clonePreset } from '../everyVillainTactics/studio'
import { trainingState } from '../everyVillainTactics/training'

const stage = clonePreset('picnic-plaza')
const state = trainingState(0x5a55, stage, { lead: 'accident-fire' })
const story = { ...createStory(), current: null }
const save = createSave({
  slot: 'auto',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  stage,
  state,
  story,
  savedAt: '2026-10-31T20:00:00.000Z',
})
assert.equal(scoreFromSave(save), null, 'no awards during active combat')

state.phase = 'victory'
state.turn = 4
const civilians = state.civilians!
for (const civilian of civilians) civilian.status = 'rescued'
const victory = createSave({
  slot: 'auto',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  stage,
  state,
  story,
  savedAt: '2026-10-31T20:00:00.000Z',
})
const score = scoreFromSave(victory)!
assert.ok(score)
assert.equal(score.outcome, 'victory')
assert.equal(score.stage, 'Picnic Panic')
assert.ok(score.medals.includes('every-civilian'))
assert.ok(score.medals.includes('no-knockouts'))
assert.ok(score.medals.includes('healthy-extraction'))
assert.ok(score.medals.includes('quick-clear'))
assert.equal(
  score.total,
  score.lines.reduce((sum, line) => sum + line.points, 0),
)
assert.equal(
  score.lines.find((line) => line.id === 'evacuation')!.points,
  civilians.length * 75,
)

const sameOutcome = createSave({
  slot: 'slot-1',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  stage,
  state,
  story,
  savedAt: '2026-11-01T02:00:00.000Z',
})
assert.equal(
  scoreFromSave(sameOutcome)!.id,
  score.id,
  'changing slot or save time is not a new run',
)
assert.equal(
  mergeBattleResults([score], [scoreFromSave(sameOutcome)!]).length,
  1,
)

const lost = structuredClone(state)
lost.phase = 'defeat'
lost.units.find((unit) => unit.team === 'squad')!.hp = 0
lost.civilians![0]!.status = 'lost'
const defeat = scoreFromSave(
  createSave({
    slot: 'auto',
    perspective: 'hero',
    leadSignature: 'accident-fire',
    stage,
    state: lost,
    story,
  }),
)!
assert.notEqual(defeat.id, score.id)
assert.ok(defeat.total < score.total)
assert.ok(!defeat.medals.includes('no-knockouts'))
assert.ok(!defeat.medals.includes('every-civilian'))

const wounded = structuredClone(state)
wounded.units.find((unit) => unit.team === 'squad')!.hp--
const extraction = scoreFromSave(
  createSave({
    slot: 'auto',
    perspective: 'hero',
    leadSignature: 'accident-fire',
    stage,
    state: wounded,
    story,
  }),
)!
assert.ok(extraction.medals.includes('no-knockouts'))
assert.ok(!extraction.medals.includes('healthy-extraction'))

const claimedStory = createSave({
  slot: 'slot-2',
  perspective: 'villain',
  leadSignature: 'accident-fire',
  stage: null,
  state: trainingState(42),
  story: createStory(),
})
claimedStory.state.phase = 'victory'
assert.equal(
  scoreFromSave(claimedStory),
  null,
  'unfinished story epilogues cannot award points',
)

const freshBook = emptyScrapbook()
freshBook.results = mergeBattleResults([], [score, defeat])
const book = mergeScrapbook(freshBook, [])
assert.equal(book.results.length, 2)
const parsed = sanitizeScrapbook(JSON.stringify(book))
assert.deepEqual(parsed, book)
assert.deepEqual(
  sanitizeScrapbook(JSON.stringify({ ...book, results: { forged: true } })),
  { ...book, results: [] },
  'bad local history is discarded',
)
assert.deepEqual(mergeBattleResults([], [{ ...score, total: 999999 }]), [])
assert.equal(
  mergeBattleResults(
    [],
    Array.from({ length: MAX_SCORE_HISTORY + 12 }, (_, i) => ({
      ...score,
      id: i.toString(16).padStart(8, '0'),
      at: new Date(Date.UTC(2026, 9, 31, 0, i)).toISOString(),
    })),
  ).length,
  MAX_SCORE_HISTORY,
  'history is bounded',
)

console.log(
  'Every Villain Tactics scored debriefs, outcome medals, replay-safe points and scrapbook retention verified.',
)
