import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { startVoyage, restoreVoyage } from '../gameOfCaptains/rules'
import {
  arriveAtWorld,
  currentExpedition,
  startWorldTravel,
} from '../gameOfCaptains/expedition'
import {
  STAR_SIGNS,
  STAR_QUEST_CHAPTERS,
  STAR_QUESTIONS,
  calculateStarSign,
  createStarAssessment,
  availableStarQuest,
  starSignFor,
  validStarAssessment,
} from '../gameOfCaptains/starSigns'
import {
  dispatchEpisodeBatch,
  drawEpisodeDeck,
  episodeCard,
  episodeDecks,
  episodeDecksDone,
  episodeEndingCoda,
} from '../gameOfCaptains/episodeConsole'

assert.equal(
  STAR_QUESTIONS.length,
  4,
  'four questions before captain selection',
)
assert.equal(STAR_SIGNS.length, 12, 'an original dozen constellations')
assert.deepEqual(STAR_QUEST_CHAPTERS, [1, 4, 7])
assert.equal(new Set(STAR_SIGNS.map((s) => s.id)).size, 12)
assert.equal(new Set(STAR_SIGNS.map((s) => s.name)).size, 12)
assert.ok(STAR_SIGNS.some((s) => s.name === 'The Northern Sloth'))
assert.ok(STAR_SIGNS.some((s) => s.name === 'The Princess Mantic Shrimp'))
for (const sign of STAR_SIGNS) {
  assert.ok(sign.myth.length > 65)
  assert.ok(sign.omen.length > 30)
  assert.equal(sign.quests.length, 3)
  assert.equal(new Set(sign.quests.map((q) => q.id)).size, 3)
  assert.ok(
    sign.quests.every((q) => q.setup.length > 60 && q.ending.length > 24),
  )
}
const seen = new Map<string, ReturnType<typeof createStarAssessment>>()
for (let a = 0; a < 3; a++)
  for (let b = 0; b < 3; b++)
    for (let c = 0; c < 3; c++)
      for (let d = 0; d < 3; d++) {
        const answers: [number, number, number, number] = [a, b, c, d]
        const assessment = createStarAssessment(answers)!
        assert.ok(validStarAssessment(assessment))
        assert.equal(assessment.sign, calculateStarSign(answers).id)
        seen.set(assessment.sign, assessment)
      }
assert.equal(
  seen.size,
  12,
  'every sign is reachable with actual answer choices',
)
for (const invalid of [
  [0, 1, 2],
  [0, 0, 0, 3],
  [0, -1, 0, 0],
  [],
  null,
  '0000',
]) {
  assert.equal(createStarAssessment(invalid), null)
}
for (const sign of STAR_SIGNS) {
  const correct = seen.get(sign.id)!
  assert.equal(starSignFor(correct!.sign), sign)
  assert.equal(
    validStarAssessment({ ...correct, sign: 'cosmic-falsehood' }),
    false,
  )
  assert.equal(availableStarQuest(correct!, 0, []), null)
  assert.equal(availableStarQuest(correct!, 1, [])!.id, sign.quests[0]!.id)
  assert.equal(
    availableStarQuest(correct!, 3, ['star-quest:' + sign.quests[0]!.id]),
    null,
  )
  assert.equal(
    availableStarQuest(correct!, 4, ['star-quest:' + sign.quests[0]!.id])!.id,
    sign.quests[1]!.id,
  )
  assert.equal(
    availableStarQuest(
      correct!,
      7,
      sign.quests.slice(0, 2).map((q) => 'star-quest:' + q.id),
    )!.id,
    sign.quests[2]!.id,
  )
  assert.equal(
    availableStarQuest(
      correct!,
      9,
      sign.quests.map((q) => 'star-quest:' + q.id),
    ),
    null,
  )
  for (const other of STAR_SIGNS.filter((s) => s.id !== sign.id))
    assert.ok(!sign.quests.some((q) => other.quests.some((b) => b.id === q.id)))
}

const astrology = seen.get('princess-mantic-shrimp')!
assert.ok(astrology)
const initial = startVoyage('vale', ['pell', 'mox', 'rue'], 12045, astrology!)
assert.equal(initial.starAssessment?.sign, 'princess-mantic-shrimp')
assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(initial))), initial)
const legacy = startVoyage('vale', ['pell', 'mox', 'rue'], 12045)
assert.equal(legacy.starAssessment, undefined)
assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(legacy))), legacy)
assert.equal(episodeDecks(legacy).includes('constellation'), false)
assert.equal(availableStarQuest(undefined, 1, []), null)
const tampered = JSON.parse(JSON.stringify(initial))
tampered.starAssessment.sign = 'nonsense-celestial-sign'
assert.equal(
  restoreVoyage(tampered),
  null,
  'spoofed sign and mismatching answers are rejected',
)
assert.throws(() =>
  startVoyage('vale', ['pell', 'mox', 'rue'], 12045, {
    sign: 'invalid',
    answers: [0, 0, 0, 0],
  } as never),
)
let landing = arriveAtWorld(startWorldTravel(initial))
const mandatory = currentExpedition(landing).filter(
  (x) => x.priority === 'major',
)
assert.ok(mandatory.length > 0)
landing = dispatchEpisodeBatch(
  landing,
  mandatory.map((card, index) => ({
    encounterId: card.id,
    lead: ['captain', 'pell', 'mox', 'rue'][index]!,
  })),
)
let drawing = drawEpisodeDeck(landing, 'planet', 'ask')
drawing = drawEpisodeDeck(drawing, 'casino', 'document')
drawing = drawEpisodeDeck(drawing, 'serendipity', 'ask')
assert.equal(
  episodeDecksDone(drawing),
  false,
  'sign quest is required this episode',
)
assert.ok(episodeDecks(drawing).includes('constellation'))
assert.equal(
  episodeCard(drawing, 'constellation').id,
  starSignFor(astrology!.sign).quests[0]!.id,
)
assert.equal(
  drawEpisodeDeck(drawing, 'nemesis', 'ask'),
  drawing,
  'cannot skip ahead',
)
drawing = drawEpisodeDeck(drawing, 'constellation', 'document')
assert.ok(drawing.worldFlags!.includes('star-quest:shrimp-coronation'))
assert.ok(drawing.log.at(-1)!.includes('The Royal Prawn Uprising'))
assert.ok(episodeDecksDone(drawing))
assert.equal(
  drawEpisodeDeck(drawing, 'constellation', 'ask'),
  drawing,
  'no duplicate prizes',
)
assert.equal(
  availableStarQuest(drawing.starAssessment, 1, drawing.worldFlags ?? []),
  null,
)
assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(drawing))), drawing)
assert.equal(
  episodeCard(landing, 'constellation').link.includes('Princess Mantic Shrimp'),
  true,
)

// The same episode and seed are deterministic, but a different sign gets a
// completely separate quest with zero access to the Shrimp's story.
const northern = seen.get('northern-sloth')!
const other = { ...landing, starAssessment: northern! }
assert.equal(episodeCard(other, 'constellation').id, 'sloth-vigil')
assert.equal(
  episodeCard(other, 'constellation').id,
  episodeCard(other, 'constellation').id,
)
assert.notEqual(
  episodeCard(other, 'constellation').id,
  episodeCard(landing, 'constellation').id,
)

const sign = starSignFor(astrology!.sign)
const allFlags = sign.quests.map((q) => 'star-quest:' + q.id)
const withEnding = episodeEndingCoda({
  ...drawing,
  phase: 'ending',
  ending: 'Homeward Bound',
  scene: 'And that was the episode.',
  worldFlags: [...(drawing.worldFlags ?? []), ...allFlags],
})
assert.match(withEnding.ending ?? '', /Princess Mantic Shrimp/)
assert.match(withEnding.scene, /CONSTELLATION FINALE/)
const partialEnding = episodeEndingCoda({
  ...drawing,
  phase: 'ending',
  scene: 'The story ends.',
})
assert.match(partialEnding.scene, /UNFINISHED STAR CHART/)
assert.equal(
  episodeEndingCoda(drawing),
  drawing,
  'never announce the ending before the finale',
)

const page = readFileSync(
  new URL('../../pages/play/game-of-captains.vue', import.meta.url),
  'utf8',
)
const quiz = readFileSync(
  new URL(
    '../../components/gameOfCaptains/constellation-test.vue',
    import.meta.url,
  ),
  'utf8',
)
const deck = readFileSync(
  new URL('../../components/gameOfCaptains/daily-console.vue', import.meta.url),
  'utf8',
)
const store = readFileSync(
  new URL('../../stores/gameOfCaptainsStore.ts', import.meta.url),
  'utf8',
)
assert.ok(page.includes("selectionScreen === 'stars'"))
assert.ok(page.includes('SpaceCouchConstellationTest'))
assert.ok(page.includes('confirmStarAssessment'))
assert.ok(page.includes('beginWithStarSign'))
assert.ok(page.includes('cap-layout--stars'))
for (const marker of [
  'space-couch-star-question',
  'space-couch-star-reveal',
  'space-couch-star-retake',
  'space-couch-star-accept',
]) {
  assert.ok(quiz.includes(marker), marker)
}
assert.ok(quiz.includes("emit('confirm', assessment)"))
assert.ok(deck.includes('YOUR STAR SIGN QUEST'))
assert.ok(store.includes('assessment?: StarAssessment'))
console.log(
  'Space Couch 12 constellations, 4-question test, 36 sign quests, save and finale contract verified',
)
