import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  startVoyage,
  restoreVoyage,
  chooseMission,
} from '../gameOfCaptains/rules'
import {
  REDSHIRTS,
  REDSHIRT_BY_ID,
  starterRedshirts,
  nextRedshirt,
} from '../gameOfCaptains/redshirts'
import {
  REDSHIRT_QUARTERS,
  EXPEDITION_ENCOUNTERS,
  expeditionBoard,
  expeditionBusy,
  startWorldTravel,
  arriveAtWorld,
  deployExpedition,
  leaveExpedition,
  hireRedshirt,
  currentExpedition,
} from '../gameOfCaptains/expedition'
import { WORLD_ENCOUNTERS } from '../gameOfCaptains/expeditionLocal'
import {
  CASINO_ORIGIN,
  SERENDIPITY_FRANCHISES,
  solarCircuit,
  chapterSystem,
  venueArtPrompt,
  casinoIncident,
  visitCasinoVenue,
} from '../gameOfCaptains/solarCircuit'

import {
  GALACTIC_MAJOR,
  GALACTIC_MINOR,
} from '../gameOfCaptains/expeditionGalactic'

// Twenty distinct, authored, three-stage Serendipity franchises are always
// co-located on a living blue person's casino, not standalone space bars.
assert.equal(SERENDIPITY_FRANCHISES.length, 20)
assert.equal(new Set(SERENDIPITY_FRANCHISES.map((f) => f.id)).size, 20)
assert.equal(new Set(SERENDIPITY_FRANCHISES.map((f) => f.name)).size, 20)
assert.ok(SERENDIPITY_FRANCHISES.some((f) => /Tex-Mex/.test(f.theme)))
assert.ok(SERENDIPITY_FRANCHISES.some((f) => /arcade sports bar/.test(f.theme)))
assert.ok(/homeworld/.test(CASINO_ORIGIN) && /colonists/.test(CASINO_ORIGIN))
for (const franchise of SERENDIPITY_FRANCHISES) {
  assert.equal(franchise.beats.length, 3, franchise.id)
  assert.ok(franchise.illustration.length > 70, franchise.id)
  assert.equal(new Set(franchise.beats.map((b) => b.title)).size, 3, franchise.id)
  for (const beat of franchise.beats) {
    assert.ok(beat.situation.length > 45, franchise.id)
    for (const key of ['ask', 'document', 'override'] as const)
      assert.ok(beat[key].length > 30, franchise.id + ':' + key)
  }
}
const themesSeen = new Set<string>()
for (let seed = 1; seed <= 150; seed++) {
  const systems = solarCircuit(seed)
  assert.ok(systems.length >= 4 && systems.length <= 7)
  assert.deepEqual(systems, solarCircuit(seed))
  assert.equal(new Set(systems.map((s) => s.id)).size, systems.length)
  assert.equal(new Set(systems.map((s) => s.franchise.id)).size, systems.length)
  for (const system of systems) {
    themesSeen.add(system.franchise.id)
    assert.ok(system.conflict.length > 35 && system.giant.length > 2)
    const prompt = venueArtPrompt(system)
    assert.match(prompt, /living planet-sized cobalt-blue alien person/)
    assert.match(prompt, /INSIDE the casino is the Serendipity franchise/)
    assert.ok(prompt.includes(system.franchise.name) && prompt.includes(system.franchise.illustration))
  }
  for (let chapter = 1; chapter <= 9; chapter++)
    assert.equal(chapterSystem(seed, chapter).id, systems[(chapter - 1) % systems.length]!.id)
}
assert.equal(themesSeen.size, 20, 'every franchise should be reachable with a seeded voyage')
const partyForVenue = ['fen', 'mox', 'rue'] as const
let venueRun = startVoyage('fluke', [...partyForVenue], 2048)
venueRun = arriveAtWorld(startWorldTravel(venueRun))
assert.equal(venueRun.phase, 'expedition')
const venueSystem = chapterSystem(venueRun.seed, venueRun.chapter)
const casino = casinoIncident(venueRun.seed, venueRun.chapter, venueSystem)
assert.deepEqual(casino, casinoIncident(venueRun.seed, venueRun.chapter, venueSystem))
const firstVenue = visitCasinoVenue(venueRun, 'bar', 'ask')
assert.equal(firstVenue.venueProgress?.barBeats[venueSystem.id], 1)
assert.equal(firstVenue.trust, venueRun.trust + 1)
assert.equal(firstVenue.supplies, venueRun.supplies - 1)
const secondVenue = visitCasinoVenue(firstVenue, 'bar', 'document')
assert.equal(secondVenue.venueProgress?.barBeats[venueSystem.id], 2)
assert.equal(secondVenue.reputation, firstVenue.reputation + 1)
const thirdVenue = visitCasinoVenue(secondVenue, 'bar', 'override')
assert.equal(thirdVenue.venueProgress?.barBeats[venueSystem.id], 3)
assert.equal(thirdVenue.intervention, secondVenue.intervention + 1)
assert.equal(visitCasinoVenue(thirdVenue, 'bar', 'ask'), thirdVenue, 'bar closes after authored finale this visit')
const casinoVisit = visitCasinoVenue(thirdVenue, 'casino', 'document')
assert.equal(casinoVisit.venueProgress?.choices.length, 4)
assert.equal(visitCasinoVenue(casinoVisit, 'casino', 'override'), casinoVisit, 'casino quest cannot be repeated for free supplies')
assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(casinoVisit))), casinoVisit)
const oldVenueSave = JSON.parse(JSON.stringify(venueRun))
delete oldVenueSave.venueProgress
assert.ok(restoreVoyage(oldVenueSave), 'old v1 saves restore without venue progress')
assert.equal(visitCasinoVenue(venueRun, 'bar', 'bogus' as never), venueRun)
assert.equal(visitCasinoVenue(startVoyage('fluke', [...partyForVenue], 2048), 'casino', 'ask').phase, 'briefing')

assert.equal(REDSHIRTS.length, 100)
assert.equal(new Set(REDSHIRTS.map((r) => r.id)).size, 100)
assert.equal(new Set(REDSHIRTS.map((r) => r.name)).size, 100)
assert.equal(new Set(REDSHIRTS.map((r) => r.anatomy)).size, 100)
assert.equal(new Set(REDSHIRTS.map((r) => r.secretPower)).size, 100)
assert.equal(new Set(REDSHIRTS.map((r) => r.history)).size, 100)
for (const candidate of REDSHIRTS) {
  assert.ok(
    candidate.portraitPrompt.includes('red Space Couch expedition uniform'),
  )
  assert.ok(candidate.anatomy.length > 20 && candidate.history.length > 28)
  assert.ok(candidate.secretPower.length > 18)
  assert.equal(Object.keys(candidate.stats).length, 6)
  assert.equal(candidate.stats[candidate.talent], 5)
  assert.ok(Object.values(candidate.stats).every((v) => v >= 1 && v <= 5))
}
assert.equal(REDSHIRT_QUARTERS.bunks, 12)
// Later acts share a galactic fallback until their bespoke local encounter packs ship.
for (const chapter of [4, 7, 9]) {
  const expedition = expeditionBoard(405, chapter, 'act-later-unmapped')
  assert.ok(expedition.filter((e) => e.priority === 'major').length >= 1)
  assert.ok(expedition.filter((e) => e.priority === 'minor').length >= 3)
  assert.equal(new Set(expedition.map((e) => e.id)).size, expedition.length)
  assert.deepEqual(
    expedition,
    expeditionBoard(405, chapter, 'act-later-unmapped'),
  )
}
assert.equal(EXPEDITION_ENCOUNTERS.length, 53)
assert.equal(new Set(EXPEDITION_ENCOUNTERS.map((e) => e.id)).size, 53)
assert.equal(Object.keys(WORLD_ENCOUNTERS).length, 9)
assert.equal(GALACTIC_MAJOR.length, 8)
assert.equal(GALACTIC_MINOR.length, 9)
assert.ok(
  EXPEDITION_ENCOUNTERS.every(
    (e) =>
      e.setup.length > (e.priority === 'major' ? 90 : 45) &&
      e.title.length > 12,
  ),
)
for (const location of Object.keys(WORLD_ENCOUNTERS)) {
  for (const seed of [1, 22, 405, 2027]) {
    const board = expeditionBoard(seed, 1, location)
    const main = board.filter((e) => e.priority === 'major')
    const minor = board.filter((e) => e.priority === 'minor')
    assert.ok(main.length >= 1 && main.length <= 4)
    assert.ok(minor.length >= 3 && minor.length <= 5)
    assert.ok(board.some((e) => e.scope === 'local'))
    assert.ok(board.some((e) => e.scope === 'galaxy'))
    assert.equal(new Set(board.map((e) => e.id)).size, board.length)
    assert.deepEqual(board, expeditionBoard(seed, 1, location))
  }
}
assert.equal(new Set(starterRedshirts(317)).size, 6)
assert.equal(starterRedshirts(317).length, 6)
assert.ok(nextRedshirt(317, starterRedshirts(317), []))
assert.equal(
  nextRedshirt(
    317,
    REDSHIRTS.map((x) => x.id),
    [],
  ),
  null,
)

const party = ['fen', 'mox', 'rue'] as const
let run = startVoyage('solace', [...party], 405)
assert.equal(run.phase, 'briefing')
assert.equal(run.redshirtRoster?.length, 6)
assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(run))), run)
assert.equal(startWorldTravel(run).phase, 'travel')
run = startWorldTravel(run)
assert.equal(startWorldTravel(run), run)
assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(run))), run)
run = arriveAtWorld(run)
assert.equal(run.phase, 'expedition')
assert.equal(arriveAtWorld(run), run)
assert.equal(
  run.expeditionVisit?.encounterIds.length,
  currentExpedition(run).length,
)
assert.equal(leaveExpedition(run), run, 'must not abandon major crises')
assert.equal(deployExpedition(run, 'invented-encounter', 'captain'), run)
assert.equal(
  deployExpedition(run, currentExpedition(run)[0]!.id, 'fake-officer'),
  run,
)

// The captain and each main officer may lead only one encounter per stop.
const first = currentExpedition(run)[0]!
let allocated = deployExpedition(run, first.id, 'captain')
assert.equal(allocated.expeditionVisit?.results[0]?.lead, 'captain')
assert.equal(expeditionBusy(allocated).includes('captain'), true)
assert.equal(deployExpedition(allocated, first.id, 'captain'), allocated)
const second = currentExpedition(allocated).find((e) => e.id !== first.id)!
assert.equal(deployExpedition(allocated, second.id, 'captain'), allocated)

// A crew specialist doing a supposedly minor errand gets private material.
const minor = currentExpedition(allocated).find(
  (e) =>
    e.priority === 'minor' &&
    e.secretCrew.some((id) => party.includes(id as (typeof party)[number])),
)!
assert.ok(minor)
const expert = minor.secretCrew.find((id) =>
  party.includes(id as (typeof party)[number]),
)!
allocated = deployExpedition(allocated, minor.id, expert)
const secret = allocated.expeditionVisit?.results.at(-1)
assert.equal(secret?.secret, true)
assert.ok(secret?.outcome.includes('SECRET DETOUR'))
assert.ok(
  allocated.worldFlags?.includes('crew-secret:' + minor.id + ':' + expert),
)
assert.equal(deployExpedition(allocated, second.id, expert), allocated)
assert.deepEqual(
  restoreVoyage(JSON.parse(JSON.stringify(allocated))),
  allocated,
)

// Remaining major matters can be resolved by redshirts, even when command is busy.
for (const encounter of currentExpedition(allocated).filter(
  (e) => e.priority === 'major',
)) {
  if (
    allocated.expeditionVisit!.results.some(
      (res) => res.encounterId === encounter.id,
    )
  )
    continue
  let next = deployExpedition(allocated, encounter.id, 'auto')
  if (next === allocated) {
    allocated = hireRedshirt(allocated)
    next = deployExpedition(allocated, encounter.id, 'auto')
  }
  assert.notEqual(next, allocated)
  allocated = next
}
const completed = leaveExpedition(allocated)
assert.equal(completed.phase, 'briefing')
assert.equal(completed.expeditionHistory?.length, 1)
assert.equal(completed.expeditionVisit, null)
assert.equal(startWorldTravel(completed), completed)
assert.equal(
  chooseMission(completed, 'windglass'),
  completed,
  'cannot move a finished expedition to a new world',
)
assert.deepEqual(
  restoreVoyage(JSON.parse(JSON.stringify(completed))),
  completed,
)

// Redshirt casualties are deterministic per deployment and occur approximately
// one third of the time, with no fictional replacement of a fallen ID.
let dead = 0
let total = 0
for (let seed = 1; seed <= 360; seed++) {
  let sample = arriveAtWorld(
    startWorldTravel(startVoyage('fluke', [...party], seed)),
  )
  const encounter = currentExpedition(sample)[0]!
  sample = { ...sample, redshirtRoster: ['rs-001'] }
  const after = deployExpedition(sample, encounter.id, 'rs-001')
  assert.notEqual(after, sample)
  const result = after.expeditionVisit!.results[0]!
  total++
  if (result.casualty) {
    dead++
    assert.equal(result.casualty, 'rs-001')
    assert.equal(after.redshirtRoster?.includes('rs-001'), false)
    assert.equal(after.redshirtFallen?.at(-1)?.id, 'rs-001')
    assert.ok(!nextRedshirt(1, [], ['rs-001'])?.includes('rs-001'))
  } else {
    assert.ok(after.redshirtRoster?.includes('rs-001'))
  }
  assert.deepEqual(deployExpedition(sample, encounter.id, 'rs-001'), after)
  assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(after))), after)
}
assert.ok(
  dead / total > 0.27 && dead / total < 0.39,
  `fatality ratio ${dead}/${total}`,
)

// Diplomatic incompetence has a distinct, actual reputational consequence,
// not simply a change to the narration.
const weak = REDSHIRTS.find((r) => r.stats.diplomacy < 4)!
let diplomatic = false
for (let seed = 1; seed < 60 && !diplomatic; seed++) {
  const candidate = arriveAtWorld(
    startWorldTravel(startVoyage('vale', [...party], seed)),
  )
  const scene = currentExpedition(candidate).find(
    (e) => e.priority === 'major' && e.skill === 'diplomacy',
  )
  if (!scene) continue
  const before = { ...candidate, redshirtRoster: [weak.id] }
  const after = deployExpedition(before, scene.id, weak.id)
  if (after.expeditionVisit!.results[0]!.casualty) continue
  assert.equal(after.trust, before.trust - 2)
  assert.equal(after.reputation, before.reputation - 1)
  assert.ok(after.scene.includes('diplomatic incident'))
  diplomatic = true
}
assert.ok(diplomatic, 'diplomatic failure is seed-reachable')

// Hiring is bounded, persisted and cannot return a deceased employee.
let hires = startVoyage('vale', [...party], 33)
const seen = new Set(hires.redshirtRoster)
hires = hireRedshirt(hires)
assert.equal(hires.redshirtRoster?.length, 7)
assert.equal(hires.supplies, 6)
for (const id of hires.redshirtRoster!) assert.ok(REDSHIRT_BY_ID[id])
for (let n = 0; n < 5; n++) {
  hires = { ...hires, supplies: 50 }
  hires = hireRedshirt(hires)
}
assert.equal(hires.redshirtRoster?.length, 12)
assert.equal(hireRedshirt(hires), hires)
assert.equal(new Set(hires.redshirtRoster).size, 12)
assert.equal(seen.size, 6)
const emergency = { ...hires, redshirtRoster: [], supplies: 0 }
assert.equal(hireRedshirt(emergency).redshirtRoster?.length, 1)
assert.equal(hireRedshirt(emergency).supplies, 0)
const legacy = JSON.parse(JSON.stringify(startVoyage('rex', [...party], 77)))
delete legacy.redshirtRoster
delete legacy.redshirtFallen
delete legacy.expeditionHistory
delete legacy.expeditionVisit
assert.ok(restoreVoyage(legacy), 'old v1 voyage survives')

const page = readFileSync(
  new URL('../../pages/play/game-of-captains.vue', import.meta.url),
  'utf8',
)
const store = readFileSync(
  new URL('../../stores/gameOfCaptainsStore.ts', import.meta.url),
  'utf8',
)
for (const marker of [
  'space-couch-travel-prompt',
  'space-couch-transit',
  'space-couch-redshirt-dorm',
  'space-couch-encounter-board',
  'space-couch-expedition-lead',
  'space-couch-expedition-deploy',
  'space-couch-expedition-finish',
  'space-couch-hire',
])
  assert.ok(page.includes(marker), marker)
for (const action of ['travel', 'arrive', 'deploy', 'endExpedition', 'hire'])
  assert.ok(store.includes(action))
console.log(
  'Space Couch 100 redshirts, 53 encounters, travel/staffing, mortality and saves verified',
)
