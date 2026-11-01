import assert from 'node:assert/strict'
import { CAPTAIN_ORIGINS } from '../gameOfCaptains/captainOrigins'
import {
  COUCH_ONBOARDING_ART_COUNT,
  COUCH_ONBOARDING_ART_IDS,
} from '../gameOfCaptains/onboardingArt'
import { COUCH_VOYAGE_ART_IDS } from '../gameOfCaptains/voyagePaintings'
import { COUCH_EXPRESSION_ART_IDS } from '../gameOfCaptains/expressionPaintings'
import { readFileSync } from 'node:fs'
import { startVoyage, restoreVoyage, CREW } from '../gameOfCaptains/rules'
import {
  arriveAtWorld,
  currentExpedition,
  startWorldTravel,
} from '../gameOfCaptains/expedition'
import {
  STAR_SIGNS,
  STAR_QUEST_CHAPTERS,
  STAR_QUESTIONS,
  STAR_HR_VERDICTS,
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
  'four questions after the captain dossier',
)
assert.equal(STAR_SIGNS.length, 12, 'an original dozen constellations')
assert.equal(
  Object.keys(COUCH_EXPRESSION_ART_IDS).length,
  44,
  '22 characters each have a unique defiant and vulnerable illustration',
)
assert.equal(
  Object.keys(COUCH_EXPRESSION_ART_IDS).filter((key) =>
    key.endsWith('-defiant'),
  ).length,
  22,
)
assert.equal(
  Object.keys(COUCH_EXPRESSION_ART_IDS).filter((key) =>
    key.endsWith('-vulnerable'),
  ).length,
  22,
)
assert.equal(
  new Set([
    ...Object.values(COUCH_ONBOARDING_ART_IDS),
    ...Object.values(COUCH_VOYAGE_ART_IDS),
    ...Object.values(COUCH_EXPRESSION_ART_IDS),
  ]).size,
  172,
  'previously mapped painting IDs stay distinct from character expressions',
)
assert.equal(
  Object.keys(COUCH_VOYAGE_ART_IDS).length,
  106,
  'finished runtime, venue and opening art is registered',
)
assert.equal(
  Object.keys(COUCH_VOYAGE_ART_IDS).filter((key) => key.startsWith('missions/'))
    .length,
  27,
)
assert.equal(
  Object.keys(COUCH_VOYAGE_ART_IDS).filter((key) => key.startsWith('venues/'))
    .length,
  20,
)
assert.equal(
  Object.keys(COUCH_VOYAGE_ART_IDS).filter((key) => key.startsWith('opening/'))
    .length,
  18,
)
assert.equal(
  new Set([
    ...Object.values(COUCH_ONBOARDING_ART_IDS),
    ...Object.values(COUCH_VOYAGE_ART_IDS),
  ]).size,
  128,
  'no two paintings overwrite the same ArtImage slot',
)
assert.equal(
  COUCH_ONBOARDING_ART_COUNT,
  22,
  'all painted onboarding images are linked',
)
assert.equal(
  new Set(Object.values(COUCH_ONBOARDING_ART_IDS)).size,
  COUCH_ONBOARDING_ART_COUNT,
  'each art slot points to its own completed ArtImage',
)
assert.equal(
  Object.keys(COUCH_ONBOARDING_ART_IDS).filter((key) =>
    key.startsWith('origins/'),
  ).length,
  6,
)
assert.equal(
  Object.keys(COUCH_ONBOARDING_ART_IDS).filter((key) =>
    /couchscope\/question-0[1-4]$/.test(key),
  ).length,
  4,
)
assert.equal(
  Object.keys(COUCH_ONBOARDING_ART_IDS).filter((key) =>
    key.includes('-answer-'),
  ).length,
  12,
)
assert.equal(Object.keys(STAR_HR_VERDICTS).length, 12)
assert.ok(STAR_SIGNS.every((sign) => STAR_HR_VERDICTS[sign.id].length > 35))
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

assert.equal(CAPTAIN_ORIGINS.length, 6, 'six independent captain backgrounds')
assert.equal(new Set(CAPTAIN_ORIGINS.map((origin) => origin.id)).size, 6)
for (const origin of CAPTAIN_ORIGINS) {
  const voyage = startVoyage(
    'fluke',
    ['pell', 'mox', 'rue'],
    101,
    undefined,
    origin.id,
  )
  assert.equal(voyage.origin, origin.id)
  assert.ok(voyage.worldFlags?.includes('origin:' + origin.id))
  assert.ok(voyage.log[0]?.includes(origin.prologue))
  assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(voyage))), voyage)
}
const mechanic = startVoyage(
  'fluke',
  ['pell', 'mox', 'rue'],
  101,
  undefined,
  'mechanic',
)
assert.equal(
  mechanic.shieldCharge,
  3,
  "the mechanic's origin has a playable bonus",
)
const courier = startVoyage(
  'fluke',
  ['pell', 'mox', 'rue'],
  101,
  undefined,
  'courier',
)
assert.equal(courier.supplies, 9, 'the courier gets extra supplies')
const brokenOrigin = { ...courier, origin: 'never-on-the-couch' }
assert.equal(
  restoreVoyage(brokenOrigin),
  null,
  'corrupted origin cannot enter a save',
)
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
assert.ok(page.includes('data-testid="space-couch-title-screen"'))
assert.ok(page.includes('data-testid="space-couch-new-game"'))
assert.ok(page.includes('data-testid="space-couch-continue"'))
assert.ok(page.includes('data-testid="space-couch-main-settings"'))
assert.ok(page.includes('data-testid="space-couch-main-log"'))
assert.ok(page.includes('data-testid="space-couch-backgrounds"'))
assert.ok(page.includes('data-testid="space-couch-background-next"'))

assert.ok(
  page.includes("  'captain',"),
  'new voyage starts at captain selection',
)
assert.ok(
  page.includes("selectionScreen.value = 'captain'"),
  'restart returns to captain',
)
assert.ok(
  page.includes('@click="selectionScreen = \'background\'"'),
  'captain advances to background',
)
assert.ok(
  page.includes('@click="selectionScreen = \'stars\'"'),
  'background advances to Couchscope',
)
assert.ok(
  page.includes('@back="selectionScreen = \'background\'"'),
  'Couchscope back returns to background',
)
assert.ok(
  page.includes("warpArt('origins/' + origin.id)"),
  'every origin reserves an art slot',
)
assert.ok(page.includes('cap-origin-art'), 'background is image-led')
assert.ok(
  page.includes('cap-origin-ready'),
  'detail text waits for image readiness',
)
assert.ok(
  page.includes('grid-template-columns: repeat(3, minmax(0, 1fr))'),
  'compact 3-column mobile statistics',
)
assert.ok(
  quiz.includes('scope-answer-art'),
  'Couchscope options reserve a painted art slot',
)
assert.ok(
  quiz.includes('couchscope/question-'),
  'Couchscope art slots are sign-specific',
)
assert.ok(
  quiz.includes('scope-option-ready'),
  'Couchscope detail text reveals after image',
)
assert.ok(STAR_QUESTIONS.every((q) => q.cue.startsWith('FORM HR-')))

assert.ok(page.includes("selectionScreen = 'captain'"))
assert.ok(page.includes("selectionScreen = 'stars'"))
assert.ok(page.includes("selectionScreen.value = 'crew'"))
assert.ok(page.includes('    selectedOrigin.value,'))
assert.ok(page.includes('class="cap-menu-journal"'))
assert.ok(page.includes('cap-layout--personnel'))
assert.ok(page.includes('cap-personnel-scroll'))
assert.ok(page.includes('data-testid="space-couch-crew-roster"'))
assert.ok(page.includes('data-testid="space-couch-crew-prev"'))
assert.ok(page.includes('data-testid="space-couch-crew-next"'))
assert.ok(page.includes('data-testid="space-couch-captain-dossier-tab"'))
assert.ok(page.includes('data-testid="space-couch-crew-dossier-tab"'))
assert.ok(page.includes('crewPageMembers'))
assert.ok(page.includes('CREW.slice(crewPage.value * 6'))
assert.ok(page.includes('crewPage.value = 0'))
assert.ok(page.includes("captainDossierTab === 'history'"))
assert.ok(page.includes("crewDossierTab === 'route'"))
assert.ok(page.includes('overflow: hidden;'))
assert.ok(
  !page.includes('v-for="member in CREW"'),
  '12 personnel should not become a scrolling list',
)
assert.equal(CREW.length, 12, 'two complete six-person roster screens')
const firstRoster = CREW.slice(0, 6)
const secondRoster = CREW.slice(6, 12)
assert.equal(firstRoster.length, 6)
assert.equal(secondRoster.length, 6)
assert.equal(
  new Set([...firstRoster, ...secondRoster].map((member) => member.id)).size,
  12,
)
for (const role of ['captain', 'crew'] as const) {
  assert.ok(
    page.includes('data-testid="space-couch-' + role + '-hero"'),
    role + ' selection keeps a full-size character portrait',
  )
  assert.ok(
    page.includes('data-testid="space-couch-' + role + '-stats"'),
    role + ' statistics must remain visible outside of the dossier tabs',
  )
}
assert.ok(page.includes('cap-personnel-hero-image'))
assert.ok(page.includes('cap-personnel-hero-fallback'))
assert.ok(
  page.includes('grid-template-columns: minmax(0, 0.78fr) minmax(0, 1.22fr)'),
)
assert.ok(
  page.includes('grid-template-columns: minmax(0, 0.45fr) minmax(0, 0.55fr)'),
)
assert.ok(page.includes('grid-template-rows: repeat(6, minmax(0, 1fr))'))
assert.ok(page.includes('cap-layout--stars'))
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
assert.ok(quiz.includes("warpArt('couchscope/question-' + index)"))
assert.ok(quiz.includes('scope-question-art'))
assert.ok(quiz.includes('space-couch-star-return-background'))
assert.ok(quiz.includes('max-height: 560px'))
for (const [index, subject] of [
  ['01', 'protesting crescent moon'],
  ['02', 'time portal'],
  ['03', 'lost-and-found'],
  ['04', 'one-time miracle'],
] as const) {
  const drawing = readFileSync(
    new URL(
      '../../public/game-of-captains/couchscope/question-' + index + '.svg',
      import.meta.url,
    ),
    'utf8',
  )
  assert.ok(drawing.includes('<svg'))
  assert.ok(drawing.includes(subject), 'distinct authored drawing ' + index)
}
const artEndpoint = readFileSync(
  new URL(
    '../../server/api/game-of-captains/onboarding-art.get.ts',
    import.meta.url,
  ),
  'utf8',
)
assert.ok(
  artEndpoint.includes('buildArtImageWhere(access)'),
  'private art must obey viewer access',
)
assert.ok(artEndpoint.includes('Object.values(PAINTED_ART_IDS)'))
assert.ok(artEndpoint.includes('...COUCH_VOYAGE_ART_IDS'))
assert.ok(artEndpoint.includes('...COUCH_EXPRESSION_ART_IDS'))
assert.ok(page.includes('captainDossierPortrait'))
assert.ok(page.includes('crewDossierPortrait'))
assert.ok(page.includes('crewVoyagePortrait(member.id)'))
assert.ok(page.includes("store.onboardingArt['portraits/v2/' + key + '-' + mood]"))
assert.ok(page.includes("pocketRoomPainting(run.value.pocketRoom)"))
assert.ok(page.includes('cap-pocket-room-art'))
assert.ok(page.includes('cap-expression-tabs'))
assert.ok(page.includes('voyageStageArt(run.value, paintedVoyageImage)'))
assert.ok(page.includes('onPaintedImageError'))
assert.ok(
  artEndpoint.includes('select: { id: true, imagePath: true, path: true }'),
)
assert.ok(
  page.includes('store.loadOnboardingArt()'),
  'the art manifest loads when the game mounts',
)
assert.ok(page.includes("store.onboardingArt['origins/' + origin.id]"))
assert.ok(
  quiz.includes(
    "artwork['couchscope/question-' + question + '-answer-' + answer]",
  ),
)
assert.ok(
  quiz.includes('onAnswerArtError'),
  'image failures must not hide text forever',
)
const origins = readFileSync(
  new URL('../../utils/gameOfCaptains/captainOrigins.ts', import.meta.url),
  'utf8',
)
assert.ok(origins.includes('Displaced Diplomat'))
assert.ok(store.includes('PREFERENCES_KEY'))
assert.ok(store.includes('origin?: CaptainOriginId'))
assert.ok(deck.includes('YOUR STAR SIGN QUEST'))
assert.ok(store.includes('assessment?: StarAssessment'))
console.log(
  'Space Couch 12 constellations, 4-question test, 36 sign quests, save and finale contract verified',
)
