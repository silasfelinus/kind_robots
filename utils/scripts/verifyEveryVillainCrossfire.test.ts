import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CROSSFIRE_CHAPTERS,
  advanceCrossfire,
  applyCrossfireCarryover,
  crossfireCarryover,
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

// Consequences of *authored* choices are carried into the next real battle.
// Every resulting checkpoint must still pass the existing strict v2 validator.
const callbackCases: ReadonlyArray<{
  chapter: number
  flag?: string
  mercy?: boolean
  evidence?: number
  effect: 'guard' | 'intel' | 'none'
}> = [
  { chapter: 0, mercy: true, effect: 'guard' },
  { chapter: 0, evidence: 2, effect: 'intel' },
  { chapter: 0, effect: 'none' },
  { chapter: 1, flag: 'lab-rescued', effect: 'guard' },
  { chapter: 1, flag: 'lab-evidence', effect: 'intel' },
  { chapter: 2, flag: 'crosswalk-medics', effect: 'guard' },
  { chapter: 2, flag: 'crosswalk-jammed', effect: 'intel' },
  { chapter: 3, flag: 'roof-warning', effect: 'guard' },
  { chapter: 3, flag: 'roof-jammed', effect: 'intel' },
  { chapter: 4, flag: 'breach-vented', effect: 'guard' },
  { chapter: 4, flag: 'breach-evidence', effect: 'intel' },
]
for (const test of callbackCases) {
  const sourceStage =
    test.chapter === 0
      ? null
      : clonePreset(CROSSFIRE_CHAPTERS[test.chapter]!.id)
  const previousState = trainingState(0x53a1b7, sourceStage ?? undefined, {
    lead: 'accident-fire',
    foil: 'accident-air',
  })
  previousState.phase = 'victory'
  if (test.flag) previousState.flags = [test.flag]
  const previousStory = createStory()
  previousStory.current = null
  if (test.chapter === 0) {
    previousStory.seen.push('victory')
    previousStory.decisions.push('finish')
    previousStory.completed = true
    previousStory.mercy = !!test.mercy
    previousStory.evidence = test.evidence ?? 0
    previousState.fired ??= []
    previousState.fired.push('story:victory')
  }
  const previous = createSave({
    slot: 'auto',
    perspective: 'hero',
    leadSignature: 'accident-fire',
    foilSignature: test.chapter === 0 ? 'accident-air' : undefined,
    stage: sourceStage,
    state: previousState,
    story: previousStory,
  })
  assert.ok(
    loadSave(previous).ok,
    'the source decision must be a valid completed battle save',
  )
  const carry = crossfireCarryover(previous, test.chapter)
  assert.equal(carry.effect, test.effect)
  const nextStage = clonePreset(CROSSFIRE_CHAPTERS[test.chapter + 1]!.id)
  const incoming = trainingState(0x53a1b7 + test.chapter, nextStage, {
    lead: 'accident-fire',
  })
  applyCrossfireCarryover(incoming, previous, test.chapter)
  const squadLead = incoming.units.find((unit) => unit.id === 'backdraft')!
  const firstRival = incoming.units.find(
    (unit) => unit.team === 'rival' && unit.hp > 0,
  )!
  assert.equal(
    squadLead.statuses.includes('guarded'),
    test.effect === 'guard',
    'rescuing civilians gives a real opening defensive bonus',
  )
  assert.equal(
    firstRival.statuses.includes('marked'),
    test.effect === 'intel',
    'evidence carries a real opening hit-chance bonus',
  )
  assert.ok(incoming.log.includes(carry.note))
  assert.ok(incoming.events.includes(carry.note))
  const checkpoint = createSave({
    slot: 'auto',
    perspective: 'hero',
    leadSignature: 'accident-fire',
    stage: nextStage,
    state: incoming,
    story: { ...createStory(), current: null },
  })
  assert.ok(
    loadSave(checkpoint).ok,
    'the cross-chapter status effects must survive save/load validation',
  )
}

// Wounds carry as a single recoverable scar. Even a downed ally returns
// playable rather than silently killing that character in the next chapter.
const injured = structuredClone(started.active)
injured.state.units.find((unit) => unit.id === 'priya')!.hp = 1
injured.state.units.find((unit) => unit.id === 'hattie')!.hp = 0
const priorWounded = createSave({
  slot: 'auto',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  foilSignature: 'accident-air',
  stage: null,
  state: injured.state,
  story: started.active.story,
})
assert.ok(loadSave(priorWounded).ok)
const scars = crossfireCarryover(priorWounded, 0)
assert.deepEqual(scars.wounded, ['priya', 'hattie'])
const scarStage = clonePreset('science-lab')
const scarState = trainingState(0x53a1b7, scarStage, {
  lead: 'accident-fire',
})
applyCrossfireCarryover(scarState, priorWounded, 0)
for (const unit of scarState.units.filter((u) => scars.wounded.includes(u.id)))
  assert.equal(unit.hp, Math.max(1, unit.maxHp - 1))
assert.equal(
  scarState.units.find((unit) => unit.id === 'backdraft')!.hp,
  scarState.units.find((unit) => unit.id === 'backdraft')!.maxHp,
)
const scarSave = createSave({
  slot: 'auto',
  perspective: 'hero',
  leadSignature: 'accident-fire',
  stage: scarStage,
  state: scarState,
  story: { ...createStory(), current: null },
})
assert.ok(loadSave(scarSave).ok, 'persistent wounds remain legal and playable')

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
