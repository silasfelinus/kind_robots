import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { restoreVoyage, startVoyage } from '../gameOfCaptains/rules'
import {
  arriveAtWorld,
  currentExpedition,
  startWorldTravel,
} from '../gameOfCaptains/expedition'
import {
  dispatchEpisodeBatch,
  drawEpisodeDeck,
  episodeDeckDone,
  episodeDraws,
  episodeMajorComplete,
  episodePlotOdds,
  episodeStanding,
} from '../gameOfCaptains/episodeConsole'
import { chapterSystem } from '../gameOfCaptains/solarCircuit'

const prepare = (seed: number) => {
  const visit = arriveAtWorld(
    startWorldTravel(startVoyage('vale', ['pell', 'mox', 'rue'], seed)),
  )
  const majors = currentExpedition(visit).filter((card) => card.priority === 'major')
  const landed = dispatchEpisodeBatch(
    visit,
    majors.map((card, index) => ({
      encounterId: card.id,
      lead: ['captain', 'pell', 'mox', 'rue'][index]!,
    })),
  )
  assert.ok(episodeMajorComplete(landed))
  return landed
}

const ready = prepare(12045)
const remaining = currentExpedition(ready).filter((card) => (
  card.priority === 'minor' &&
  !ready.expeditionVisit?.results.some((result) => result.encounterId === card.id)
))
assert.ok(remaining.length >= 3, 'minor quests exist after majors are resolved')
const planet = drawEpisodeDeck(ready, 'planet', 'ask')
const available = ready.redshirtRoster!.find((id) => !ready.expeditionVisit!.results.some((result) => result.lead === id))!
assert.ok(available)
const lateQuest = dispatchEpisodeBatch(planet, [
  { encounterId: remaining[0]!.id, lead: available },
])
assert.notEqual(lateQuest, planet, 'minor quests still dispatch after the plot begins')
assert.equal(lateQuest.expeditionVisit?.results.length, ready.expeditionVisit!.results.length + 1)
assert.ok(episodeDeckDone(lateQuest, 'planet'), 'interleaving preserves the previous plot card')
const casino = drawEpisodeDeck(lateQuest, 'casino', 'document')
assert.ok(episodeDeckDone(casino, 'casino'))
assert.equal(casino.day, ready.day, 'plot and side quest each cost exactly one round')
assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(casino))), casino)

// New failed rolls must not write an invented win into the actual story.
// Existing voyage data still reconstructs without needing a save migration.
const failureSeed = Array.from({ length: 300 }, (_, n) => n + 1).find((seed) => {
  const candidate = prepare(seed)
  return drawEpisodeDeck(candidate, 'planet', 'ask').episodeDrawHistory?.at(-1)?.successful === false
})!
assert.ok(failureSeed)
const beforeFailure = prepare(failureSeed)
const failedPlanet = drawEpisodeDeck(beforeFailure, 'planet', 'ask')
const event = episodeDraws(failedPlanet)[0]!
assert.equal(event.successful, false)
assert.match(event.result, /cannot secure/)
assert.doesNotMatch(event.result, /Local residents vote to lend|workers negotiate a rotating/)
assert.ok(failedPlanet.worldFlags?.includes('episode-plot:planet:complication:1'))
assert.equal(failedPlanet.reputation, beforeFailure.reputation)
assert.equal(failedPlanet.trust, beforeFailure.trust - 1)
assert.deepEqual(drawEpisodeDeck(failedPlanet, 'planet', 'ask'), failedPlanet)
assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(failedPlanet))), failedPlanet)

// When a casino roll fails, the blue host has not agreed to the plan:
// the choice is recorded but no venue stage, completed badge or bonus is granted.
let failedVenueSeed = 0
for (let seed = 1; seed < 300; seed++) {
  const open = prepare(seed)
  const afterPlanet = drawEpisodeDeck(open, 'planet', 'ask')
  const next = drawEpisodeDeck(afterPlanet, 'casino', 'document')
  if (episodeDraws(next).at(-1)?.successful === false) {
    failedVenueSeed = seed
    const before = afterPlanet.venueProgress!
    const after = next.venueProgress!
    assert.equal(after.completed.length, before.completed.length)
    assert.deepEqual(after.barBeats, before.barBeats)
    assert.equal(after.choices.length, before.choices.length + 1)
    assert.match(after.choices.at(-1)!.scene, /cannot secure/)
    assert.equal(next.reputation, afterPlanet.reputation)
    assert.equal(next.supplies, Math.max(0, afterPlanet.supplies - 1))
    assert.equal(next.trust, afterPlanet.trust - 1)
    assert.equal(episodeStanding(next).records, episodeStanding(afterPlanet).records)
    assert.equal(episodeDraws(next).length, 2)
    assert.equal(next.day, afterPlanet.day)
    assert.ok(chapterSystem(next.seed, next.chapter).giant)
    break
  }
}
assert.ok(failedVenueSeed, 'at least one failed casino objective is covered')
assert.equal(episodePlotOdds(ready, 'planet', []), 0)

// Legacy draw records without successful maintain their existing faction credit.
const legacy = {
  ...ready,
  episodeDrawHistory: [{
    chapter: 1,
    day: 1,
    deck: 'planet' as const,
    cardId: 'legacy',
    choice: 'ask' as const,
    result: 'Saved before one-round checks',
  }],
}
assert.equal(episodeStanding(legacy).hosts, 2)
const daily = readFileSync(
  new URL('../../components/gameOfCaptains/daily-console.vue', import.meta.url),
  'utf8',
)
assert.ok(daily.includes('!majorDone || showQuestBoard'))
assert.ok(daily.includes('space-couch-return-to-side-quests'))
assert.ok(daily.includes('space-couch-return-to-plot'))
assert.ok(daily.includes('openSideCount'))
console.log('Space Couch late side quests, interleaved plot, earned effects and legacy records verified')
