import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { trainingState } from '../everyVillainTactics/training'
import {
  allPerspectives,
  applyChoice,
  createStory,
  enqueueBeat,
  storyBeats,
  storyMoment,
} from '../everyVillainTactics/firstBellStory'

assert.deepEqual(allPerspectives, ['hero', 'villain', 'henchman', 'sidekick'])
assert.deepEqual(storyBeats, ['arrival', 'alarm', 'reckoning', 'victory', 'defeat'])
const openingTitles = new Set<string>()
const midfightTitles = new Set<string>()
const endingLines = new Set<string>()
for (const role of allPerspectives) {
  const state = trainingState(102)
  const story = createStory()
  const initialSeed = state.seed
  const opening = storyMoment(role, 'arrival', 'accident-fire', story)
  assert.equal(opening.choices.length, 2)
  assert.ok(opening.lines.length >= 4, role + ' needs an authored Backdraft route')
  openingTitles.add(opening.title)
  assert.equal(applyChoice(story, state, role, 'rescue'), false)
  assert.equal(state.seed, initialSeed, 'invalid dialogue choice must not consume RNG')
  assert.equal(applyChoice(story, state, role, 'catwalk'), true)
  assert.equal(state.units[0]?.x, 1)
  assert.equal(state.units[0]?.y, 2)
  assert.equal(state.units[0]?.ap, 2, 'opening placement costs no action points')
  assert.equal(story.current, null)
  assert.equal(story.approach, 'catwalk')
  assert.equal(applyChoice(story, state, role, 'catwalk'), false)
  state.turn = 2
  enqueueBeat(story, state)
  assert.equal(story.current, 'alarm')
  const alarm = storyMoment(role, 'alarm', 'accident-fire', story)
  midfightTitles.add(alarm.title)
  assert.equal(alarm.choices.length, 2)
  assert.ok(applyChoice(story, state, role, 'rescue'))
  assert.equal(story.civilians, 2)
  assert.equal(story.current, null)
  assert.ok(!story.seen.includes('reckoning'))
  state.units.find(u => u.id === 'pip')!.hp = 0
  enqueueBeat(story, state)
  assert.equal(story.current, 'reckoning')
  assert.ok(applyChoice(story, state, role, 'spare'))
  assert.equal(story.mercy, true)
  state.units.filter(u => u.team === 'rival').forEach(u => { u.hp = 0 })
  state.phase = 'victory'
  enqueueBeat(story, state)
  assert.equal(story.current, 'victory')
  const victory = storyMoment(role, 'victory', 'accident-fire', story)
  endingLines.add(victory.lines[0]!.text)
  assert.ok(victory.lines.some(line => line.text.includes('2 students evacuated')))
  assert.equal(applyChoice(story, state, role, 'finish'), true)
  assert.equal(story.completed, true)
  enqueueBeat(story, state)
  assert.equal(story.current, null, 'closing cannot re-open after dismissal')
  assert.deepEqual(story.seen, ['arrival', 'alarm', 'reckoning', 'victory'])
  assert.deepEqual(story.decisions, ['catwalk', 'rescue', 'spare', 'finish'])
}
assert.equal(openingTitles.size, 4, 'four roles need four authored opening scenes')
assert.equal(midfightTitles.size, 4, 'four roles need four authored alarm scenes')
assert.equal(endingLines.size, 4, 'four roles need independently authored victory endings')

for (const role of allPerspectives) {
  const state = trainingState(88)
  const story = createStory()
  const standard = storyMoment(role, 'arrival', 'magic-social', story)
  assert.equal(standard.lines.length, 3)
  assert.ok(applyChoice(story, state, role, 'service'))
  assert.equal(state.units[0]?.x, 1)
  assert.equal(state.units[0]?.y, 4)
  assert.equal(story.approach, 'service')
  state.turn = 2
  enqueueBeat(story, state)
  assert.ok(applyChoice(story, state, role, 'contain'))
  assert.equal(story.evidence, 1)
  assert.ok(state.units.some(u => u.team === 'rival' && u.statuses.includes('suppressed')))
  state.units.find(u => u.id === 'vee')!.hp = 0
  enqueueBeat(story, state)
  assert.ok(applyChoice(story, state, role, 'press'))
  assert.equal(story.mercy, false)
  state.units.filter(u => u.team === 'squad').forEach(u => { u.hp = 0 })
  state.phase = 'defeat'
  enqueueBeat(story, state)
  assert.equal(story.current, 'defeat')
  assert.equal(storyMoment(role, 'defeat', 'magic-social', story).choices[0]!.effect, 'finish')
  assert.ok(applyChoice(story, state, role, 'finish'))
  assert.equal(story.completed, true)
}

const page = readFileSync(new URL('../../pages/admin/every-villain-tactics.vue', import.meta.url), 'utf8')
const store = readFileSync(new URL('../../stores/everyVillainTacticsStore.ts', import.meta.url), 'utf8')
assert.match(page, /data-testid="tactics-cinematic"/)
assert.match(page, /evt-impact-hit/)
assert.match(page, /evt-impact-strike/)
assert.match(page, /evt-fallen/)
assert.match(page, /displayUnitAt\(store\.state, cell\)/)
assert.match(page, /prefers-reduced-motion: reduce/)
assert.match(page, /data-testid="tactics-story-flags"/)
assert.match(page, /aria-modal="true"/)
assert.match(page, /store\.chooseStory\(choice\.effect\)/)
assert.match(page, /event\.code === 'Digit1'/)
assert.match(store, /enqueueBeat\(story\.value, state\.value\)/)
assert.match(store, /storyMoment\(perspective\.value/)
console.log('Every Villain Tactics: four complete perspective trees, two approaches, deterministic events and endings verified.')
