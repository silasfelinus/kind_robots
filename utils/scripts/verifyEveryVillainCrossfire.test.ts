import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CROSSFIRE_CHAPTERS,
  advanceCrossfire,
  crossfireChapterTitle,
  evtCrossfireKey,
  newCrossfireJournal,
  readCrossfireJournal,
  snapshotCrossfire,
} from '../everyVillainTactics/crossfireCampaign'
import { createStory } from '../everyVillainTactics/firstBellStory'
import { createSave, evtSaveKey, loadSave } from '../everyVillainTactics/saves'
import { clonePreset, stageProblems } from '../everyVillainTactics/studio'
import { trainingState } from '../everyVillainTactics/training'

assert.deepEqual(
  CROSSFIRE_CHAPTERS.map((chapter) => chapter.id),
  [
    'first-bell',
    'science-lab',
    'crosswalk-crisis',
    'rooftop-broadcast',
    'under-comet-breach',
    'prom-night-finale',
  ],
)
assert.notEqual(evtCrossfireKey, evtSaveKey('auto'))
for (const chapter of CROSSFIRE_CHAPTERS.slice(1))
  assert.deepEqual(stageProblems(clonePreset(chapter.id)), [])

const first = createSave({
  slot: 'auto',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  foilSignature: 'accident-air',
  stage: null,
  state: trainingState(0x53a1b7, undefined, {
    lead: 'accident-fire',
    foil: 'accident-air',
  }),
  story: createStory(),
})
const started = newCrossfireJournal(first)!
assert.ok(started)
assert.equal(crossfireChapterTitle(started), 'First Bell')
assert.equal(started.completed.length, 0)
assert.equal(started.finished, false)
assert.ok(readCrossfireJournal(JSON.stringify(started)))
assert.equal(advanceCrossfire(started), null, 'no free chapter advances')
assert.equal(
  readCrossfireJournal(JSON.stringify({ ...started, chapter: 5 })),
  null,
  'a forged chapter counter does not unlock Prom Night',
)
assert.equal(readCrossfireJournal('this is not JSON'), null)
assert.equal(readCrossfireJournal(null), null)

const losing = createSave({
  slot: 'auto',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  foilSignature: 'accident-air',
  stage: null,
  state: { ...first.state, phase: 'defeat' },
  story: first.story,
})
assert.equal(
  advanceCrossfire(snapshotCrossfire(started, losing)!),
  null,
  'losses never silently advance the campaign',
)
const unrelated = createSave({
  slot: 'auto',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  stage: clonePreset('picnic-plaza'),
  state: trainingState(123, clonePreset('picnic-plaza'), {
    lead: 'accident-fire',
  }),
  story: { ...createStory(), current: null },
})
assert.equal(snapshotCrossfire(started, unrelated), null)

let journal = started
for (let chapter = 0; chapter < CROSSFIRE_CHAPTERS.length; chapter++) {
  const save = journal.active
  const state = structuredClone(save.state)
  state.phase = 'victory'
  const story = structuredClone(save.story)
  if (chapter === 0) {
    story.current = null
    story.seen.push('victory')
    story.decisions.push('finish')
    story.completed = true
    state.fired ??= []
    state.fired.push('story:victory')
  }
  const victory = createSave({
    slot: 'auto',
    perspective: 'hero',
    leadSignature: 'accident-fire',
    foilSignature: save.foilSignature,
    stage: save.stage,
    state,
    story,
  })
  assert.ok(loadSave(victory).ok, 'each chapter has a valid v2 checkpoint')
  const checkpoint = snapshotCrossfire(journal, victory)!
  assert.ok(checkpoint)
  assert.ok(readCrossfireJournal(JSON.stringify(checkpoint)))
  const next = advanceCrossfire(checkpoint)!
  assert.ok(next, 'the earned victory advances to next chapter')
  assert.equal(next.completed.length, chapter + 1)
  assert.equal(next.chapter, Math.min(chapter + 1, 5))
  assert.ok(readCrossfireJournal(JSON.stringify(next)))
  if (chapter < 5) {
    assert.equal(
      next.active.stage?.id ?? 'first-bell',
      CROSSFIRE_CHAPTERS[chapter + 1]!.id,
    )
    assert.equal(next.active.leadSignature, 'accident-fire')
    assert.equal(next.active.perspective, 'hero')
  }
  journal = next
}
assert.ok(journal.finished)
assert.equal(journal.completed.length, 6)
assert.equal(advanceCrossfire(journal), null, 'finale never repeats')
const forgedPrefix = structuredClone(journal)
forgedPrefix.completed[0] = unrelated
assert.equal(readCrossfireJournal(forgedPrefix), null)
const wrongOrder = structuredClone(journal)
wrongOrder.completed.reverse()
assert.equal(readCrossfireJournal(wrongOrder), null)

const store = readFileSync('stores/everyVillainTacticsStore.ts', 'utf8')
const front = readFileSync(
  'components/every-villain-tactics/every-villain-front-menu.vue',
  'utf8',
)
const page = readFileSync('pages/admin/every-villain-tactics.vue', 'utf8')
assert.ok(store.includes('storage.setItem(evtCrossfireKey'))
assert.ok(
  store.includes("campaign ? { ...result, mode: 'story' as const } : result"),
  'Crossfire battles must not count toward the One-Shot sweep',
)
assert.ok(store.includes('crossfireActive.value = false'))
assert.ok(store.includes('function continueCrossfire()'))
assert.ok(front.includes('data-testid="front-new-crossfire"'))
assert.ok(front.includes('data-testid="front-continue-crossfire"'))
assert.ok(front.includes('data-testid="front-new-story"'))
assert.ok(page.includes('data-testid="tactics-crossfire-advance"'))
console.log(
  'Crossfire: six ordered chapters, independent save key, First Bell story bridge, verified victory/defeat transitions, checkpoint restoration, anti-forgery and UI wiring checked.',
)
