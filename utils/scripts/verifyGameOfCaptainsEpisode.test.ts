import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { startVoyage, restoreVoyage } from '../gameOfCaptains/rules'
import { VOYAGE_CHAPTERS } from '../gameOfCaptains/voyageMap'
import {
  planEpisodeAssignment,
  removeEpisodeAssignment,
} from '../gameOfCaptains/episodePlanner'
import {
  startWorldTravel,
  arriveAtWorld,
  currentExpedition,
  leaveExpedition,
} from '../gameOfCaptains/expedition'
import {
  EPISODE_CHOICES,
  episodeCard,
  episodePlotSkill,
  episodeDecks,
  episodeDeckDone,
  episodeDecksDone,
  episodeDraws,
  episodeIncitingEvent,
  episodeMajorComplete,
  episodeStanding,
  episodeEndingCoda,
  observedRedshirt,
  questDuration,
  questOdds,
  dispatchEpisodeBatch,
  drawEpisodeDeck,
  type EpisodeAssignment,
  type EpisodeQuestResult,
  type EpisodeRun,
} from '../gameOfCaptains/episodeConsole'

const base = startVoyage('vale', ['pell', 'mox', 'rue'], 12045)
const landing = arriveAtWorld(startWorldTravel(base))
assert.equal(landing.phase, 'expedition')
const board = currentExpedition(landing)
const mandatory = board.filter((card) => card.priority === 'major')
assert.ok(mandatory.length >= 1 && mandatory.length <= 4)
assert.ok(episodeIncitingEvent(landing).length > 75)

// Editorial red-team: the full nine-chapter run must not recycle the same
// planetary dilemma while other crew-linked stories remain unseen.
for (let seed = 1; seed <= 240; seed++) {
  const planetIds = Array.from({ length: VOYAGE_CHAPTERS }, (_, index) =>
    episodeCard({ ...landing, seed, chapter: index + 1 }, 'planet').id,
  )
  assert.equal(
    new Set(planetIds).size,
    VOYAGE_CHAPTERS,
    `Seed ${seed}: the complete voyage should have distinct planet stories`,
  )
  assert.deepEqual(
    planetIds,
    Array.from({ length: VOYAGE_CHAPTERS }, (_, index) =>
      episodeCard({ ...landing, seed, chapter: index + 1 }, 'planet').id,
    ),
    'the sequence is seed-replayable',
  )
}
const crewLinkedPlanetTitles = [
  'The Hospital That Patented Its Patients',
  'The Unopened Letter Tribunal',
]
for (const title of crewLinkedPlanetTitles) {
  assert.ok(
    Array.from({ length: 96 }, (_, seed) =>
      Array.from({ length: VOYAGE_CHAPTERS }, (_, index) =>
        episodeCard({ ...landing, seed, chapter: index + 1 }, 'planet').title,
      ),
    ).flat().includes(title),
    `New crew-linked dilemma must actually be reachable: ${title}`,
  )
}
const previousPlanet = {
  ...landing,
  chapter: 2,
  episodeDrawHistory: [
    {
      chapter: 2,
      day: 2,
      deck: 'planet' as const,
      cardId: 'planet-the-moon-that-requested-custody',
      choice: 'ask' as const,
      result: 'Previously resolved by the crew',
    },
  ],
}
assert.equal(
  episodeCard(previousPlanet, 'planet').title,
  'The Moon That Requested Custody',
  'an existing save keeps the planet card it already resolved',
)
assert.equal(episodePlotSkill(previousPlanet, 'planet'), 'diplomacy')
assert.equal(
  episodeCard(restoreVoyage(JSON.parse(JSON.stringify(previousPlanet)))!, 'planet')
    .title,
  'The Moon That Requested Custody',
  'restoring a saved card does not silently replace the encounter',
)
assert.equal(episodeMajorComplete(landing), false)
assert.deepEqual(episodeDecks(landing), ['planet', 'casino', 'serendipity'])
assert.equal(episodeDecksDone(landing), false)
const firstRedshirt = landing.redshirtRoster![0]!
assert.equal(observedRedshirt(landing, firstRedshirt), false)
assert.equal(questOdds(landing, mandatory[0]!, firstRedshirt), null)
assert.equal(
  questDuration(landing, mandatory[0]!.id),
  questDuration(landing, mandatory[0]!.id),
)
assert.deepEqual(
  EPISODE_CHOICES.map((c) => c.id),
  ['ask', 'document', 'override'],
)
const cardAlpha = mandatory[0]!.id
const cardBeta = board.find((card) => card.id !== cardAlpha)!.id
const cardGamma = board.find(
  (card) => card.id !== cardAlpha && card.id !== cardBeta,
)!.id
const initialPlan = { [cardAlpha]: 'captain', [cardBeta]: 'pell' }
const moved = planEpisodeAssignment(initialPlan, cardBeta, 'captain')
assert.deepEqual(moved, { [cardAlpha]: 'pell', [cardBeta]: 'captain' })
assert.deepEqual(
  initialPlan,
  { [cardAlpha]: 'captain', [cardBeta]: 'pell' },
  'planning is immutable',
)
const swappedBack = planEpisodeAssignment(moved, cardAlpha, 'captain')
assert.deepEqual(swappedBack, initialPlan, 'two known actors swap safely')
assert.deepEqual(
  planEpisodeAssignment(initialPlan, cardAlpha, 'captain'),
  { [cardBeta]: 'pell' },
  'tapping same personnel unassigns',
)
const added = planEpisodeAssignment(initialPlan, cardGamma, 'mox')
assert.deepEqual(added, { ...initialPlan, [cardGamma]: 'mox' })
assert.deepEqual(removeEpisodeAssignment(added, cardBeta), {
  [cardAlpha]: 'captain',
  [cardGamma]: 'mox',
})
assert.equal(
  questOdds(landing, mandatory[0]!, firstRedshirt, {}),
  null,
  'planning never discloses untested aptitude',
)
assert.equal(questOdds(landing, mandatory[0]!, 'captain', {}) !== null, true)
const assignment: EpisodeAssignment[] = mandatory.map((card, index) => ({
  encounterId: card.id,
  lead: [firstRedshirt, 'captain', 'pell', 'mox'][index]!,
}))
assert.equal(
  dispatchEpisodeBatch(landing, [
    { encounterId: mandatory[0]!.id, lead: firstRedshirt },
    { encounterId: mandatory[0]!.id, lead: 'captain' },
  ]),
  landing,
  'duplicate assignment never deploys anyone',
)
assert.equal(
  dispatchEpisodeBatch(landing, [
    { encounterId: mandatory[0]!.id, lead: 'fake-id' },
  ]),
  landing,
)
const dispatched = dispatchEpisodeBatch(landing, assignment)
assert.equal(dispatched.phase, 'expedition')
assert.ok(episodeMajorComplete(dispatched))
assert.equal(dispatched.expeditionVisit?.results.length, mandatory.length)
assert.ok(observedRedshirt(dispatched, firstRedshirt))
assert.ok(questOdds(dispatched, mandatory[0]!, firstRedshirt)! > 0)
assert.deepEqual(
  dispatchEpisodeBatch(landing, assignment),
  dispatched,
  'the same seed and lineup yield identical dispatch results',
)
for (const raw of dispatched.expeditionVisit!.results) {
  const item = raw as typeof raw & EpisodeQuestResult
  assert.ok(item.chance! >= 5 && item.chance! <= 94)
  assert.ok(item.durationDays! >= 1 && item.durationDays! <= 3)
  assert.equal(typeof item.successful, 'boolean')
  assert.ok(item.returnedDay! >= landing.day!)
  assert.ok(
    dispatched.worldFlags?.some((flag) =>
      flag.startsWith('episode-quest:' + item.encounterId),
    ),
  )
}
assert.equal(
  dispatched.day,
  landing.day! +
    Math.max(...mandatory.map((enc) => questDuration(landing, enc.id))) -
    1,
)
const restored = restoreVoyage(JSON.parse(JSON.stringify(dispatched)))
assert.deepEqual(
  restored,
  dispatched,
  'existing v1 save migrates with new optional results',
)
assert.equal(
  drawEpisodeDeck(dispatched, 'casino', 'ask'),
  dispatched,
  'no skipping the deck',
)
const planet = drawEpisodeDeck(dispatched, 'planet', 'ask')
assert.equal(episodeDraws(planet).length, 1)
assert.ok(episodeDeckDone(planet, 'planet'))
assert.equal(
  drawEpisodeDeck(planet, 'planet', 'override'),
  planet,
  'no reward farming',
)
const casino = drawEpisodeDeck(planet, 'casino', 'document')
assert.equal(episodeDraws(casino).length, 2)
assert.ok(casino.venueProgress?.choices.some((r) => r.venue === 'casino'))
const bar = drawEpisodeDeck(casino, 'serendipity', 'ask')
assert.ok(bar.venueProgress?.choices.some((r) => r.venue === 'bar'))
assert.ok(episodeDecksDone(bar))
assert.ok(episodeStanding(bar).hosts > 0)
assert.notEqual(leaveExpedition(bar).phase, 'expedition')
assert.ok(episodeCard(bar, 'serendipity').title.length > 4)
assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(bar))), bar)

for (const chapter of [2, 4, 6, 8]) {
  const even = { ...landing, chapter }
  assert.deepEqual(episodeDecks(even), [
    'planet',
    'casino',
    'serendipity',
    'nemesis',
  ])
  assert.ok(episodeCard(even, 'nemesis').setup.length > 30)
}
const even = {
  ...dispatched,
  chapter: 2,
  expeditionVisit: { ...dispatched.expeditionVisit!, chapter: 2 },
}
let drawn = drawEpisodeDeck(even, 'planet', 'ask')
drawn = drawEpisodeDeck(drawn, 'casino', 'document')
drawn = drawEpisodeDeck(drawn, 'serendipity', 'ask')
assert.equal(episodeDecksDone(drawn), false)
drawn = drawEpisodeDeck(drawn, 'nemesis', 'override')
assert.equal(episodeDecksDone(drawn), true)
assert.ok(
  drawn.worldFlags!.some((flag) => flag.startsWith('episode-draw:nemesis:')),
)

// Every quest contract resolves as one round, regardless of seed.
const durationCounts = [0, 0, 0]
for (let seed = 1; seed <= 200; seed++) {
  const mock = { ...landing, seed }
  durationCounts[questDuration(mock, mandatory[0]!.id) - 1]!++
}
assert.equal(durationCounts[0], 200)
assert.deepEqual(durationCounts.slice(1), [0, 0])

const alternateEnding = episodeEndingCoda({
  ...bar,
  phase: 'ending',
  scene: 'The official ending.',
  trust: 8,
  expeditionHistory: [
    ...Array.from({ length: 4 }, (_, index) => ({
      chapter: index + 1,
      missionId: 'refugees',
      encounterIds: ['x'],
      results: [
        {
          encounterId: 'x',
          lead: 'captain',
          casualty: null,
          secret: false,
          revealedPower: null,
          outcome: 'good',
          successful: true,
        },
      ],
    })),
  ],
  episodeDrawHistory: [
    ...Array.from({ length: 6 }, (_, index) => ({
      chapter: index + 1,
      day: index + 1,
      deck: 'planet' as const,
      cardId: 'p',
      choice: 'ask' as const,
      result: 'helped',
    })),
  ],
} as EpisodeRun)
assert.match(alternateEnding.scene, /BLUE GIANTS.*ACCORD/)
assert.equal(
  episodeEndingCoda(bar),
  bar,
  'coda only applies after an earned finale',
)

const page = readFileSync(
  new URL('../../pages/play/game-of-captains.vue', import.meta.url),
  'utf8',
)
const daily = readFileSync(
  new URL('../../components/gameOfCaptains/daily-console.vue', import.meta.url),
  'utf8',
)
const store = readFileSync(
  new URL('../../stores/gameOfCaptainsStore.ts', import.meta.url),
  'utf8',
)
assert.ok(page.includes('<SpaceCouchDailyConsole'))
assert.ok(page.includes('cap-layout--episode'))
assert.ok(daily.includes('space-couch-daily-decks'))
assert.ok(daily.includes('space-couch-expedition-lead'))
assert.ok(daily.includes('space-couch-expedition-deploy'))
assert.ok(daily.includes('space-couch-expedition-finish'))
assert.ok(daily.includes('APTITUDE SEALED'))
assert.ok(daily.includes('SUCCESS ODDS CLASSIFIED'))
for (const marker of [
  'space-couch-compare-cast',
  'space-couch-scout-console',
  'space-couch-scout-actor',
  'space-couch-scout-back',
  'space-couch-clear-cast',
  'space-couch-undo-cast',
  'planEpisodeAssignment',
  'removeEpisodeAssignment',
]) {
  assert.ok(
    daily.includes(marker),
    'Missing tactical planning surface: ' + marker,
  )
}
assert.ok(
  daily.includes('scoutOdds(actor.id) === null') &&
    daily.includes("? 'CLASSIFIED'"),
  'Do not expose untested redshirt statistics',
)
assert.ok(
  daily.includes('lastPlan.value = { ...assignments.value }'),
  'One reversible planning step must be retained',
)
assert.ok(
  store.includes('dispatchEpisodeBatch') && store.includes('drawEpisodeDeck'),
)
assert.ok(store.includes('!episodeDecksDone(run.value)'))
console.log(
  'Space Couch episodic card dispatch, fog of war, faction choices and seeded deck cycle verified',
)
