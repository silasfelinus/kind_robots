import assert from 'node:assert/strict'
import {
  chooseMission,
  destinationFollowup,
  missionBoard,
  restoreVoyage,
  seededMission,
  startVoyage,
  type CaptainId,
  type CrewId,
} from '../gameOfCaptains/rules'
import { VOYAGE_CHAPTERS } from '../gameOfCaptains/voyageMap'
import { playVoyage, type Driver } from './spaceCouchTraceHarness'

const captains: CaptainId[] = ['fluke', 'vale', 'solace', 'rex', 'quill', 'ro']
const parties: CrewId[][] = [
  ['pell', 'mox', 'rue'],
  ['vela', 'taal', 'omi'],
  ['sora', 'kivo', 'tess'],
  ['brin', 'jex', 'fen'],
  ['rue', 'vela', 'mox'],
  ['omi', 'pell', 'sora'],
]
const byChapter = Array.from(
  { length: VOYAGE_CHAPTERS + 1 },
  () => new Set<string>(),
)
const routes = new Set<string>()
const chosenCounts = new Map<string, number>()
let threadOpportunities = 0
let chosenFollowups = 0

const driver: Driver = {
  name: 'default-route-diversity',
  order: () => 'aid',
  episode: () => 'ask',
  sideQuests: false,
  trio: () => null,
  finale: 'protect',
}
for (let index = 0; index < 42; index++) {
  const captain = captains[index % captains.length]!
  const crew = parties[index % parties.length]!
  const seed = 54001 + index * 37
  const start = startVoyage(captain, crew, seed)
  assert.equal(
    start.missionId,
    'refugees',
    'chapter one remains The Last Lifeboat',
  )
  const currentRoute = ['refugees']
  const trace = playVoyage(captain, crew, seed, driver, {
    inspectEvery: false,
    onStep(label, before, after) {
      if (label !== 'next' || after.phase !== 'briefing') return
      assert.equal(before.phase, 'debrief')
      const visible: string[] = missionBoard(after).map((mission) => mission.id)
      assert.ok(
        visible.includes(after.missionId!),
        'autochart must be on the real board',
      )
      assert.equal(
        after.missionId,
        seededMission(after),
        'seeded choice is replayable',
      )
      assert.equal(
        restoreVoyage(JSON.parse(JSON.stringify(after)))?.missionId,
        after.missionId,
      )
      const manual = visible.find((id) => id !== after.missionId)
      if (manual) {
        const changed = chooseMission(after, manual)
        assert.equal(
          changed.missionId,
          manual,
          'the player can always override the default',
        )
        assert.equal(
          after.missionId,
          seededMission(after),
          'manual choice did not mutate state',
        )
      }
      currentRoute.push(after.missionId!)
      const relevant = visible.filter((id) => destinationFollowup(after, id))
      if (relevant.length) {
        threadOpportunities++
        if (relevant.includes(after.missionId!)) chosenFollowups++
      }
      byChapter[after.chapter]!.add(after.missionId!)
      chosenCounts.set(
        after.missionId!,
        (chosenCounts.get(after.missionId!) ?? 0) + 1,
      )
    },
  })
  assert.equal(trace.run.phase, 'ending')
  assert.equal(currentRoute.length, VOYAGE_CHAPTERS)
  routes.add(currentRoute.join('/'))
}
assert.ok(
  routes.size >= 24,
  '42 voyages should no longer be nearly identical: ' + routes.size,
)
for (let chapter = 2; chapter <= VOYAGE_CHAPTERS; chapter++)
  assert.ok(
    byChapter[chapter]!.size >= 2,
    'chapter ' + chapter + ' must chart more than one default destination',
  )
assert.ok(
  chosenCounts.size >= 18,
  'destination selection should expose the full circuit',
)
assert.ok(threadOpportunities >= 4, 'there must be follow-up opportunities')
assert.ok(chosenFollowups * 2 >= threadOpportunities, 'prefer earned follow-ups')
console.log(
  'Space Couch default routes: ' +
    routes.size +
    '/42 different nine-chapter itineraries, ' +
    chosenCounts.size +
    ' distinct missions; every chapter diversified, manual override and save restore OK',
)

const windglass = {
  ...startVoyage('fluke', ['tess', 'kivo', 'fen'], 123),
  chapter: 9,
  worldFlags: ['windglass-hidden'],
}
assert.ok(destinationFollowup(windglass, 'windglass-exodus'))
assert.equal(
  destinationFollowup({ ...windglass, worldFlags: [] }, 'windglass-exodus'),
  null,
)
