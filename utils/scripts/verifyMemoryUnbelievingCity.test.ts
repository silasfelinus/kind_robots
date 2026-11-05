import assert from 'node:assert/strict'
import {
  chooseOverworldEvent,
  eventNeighbors,
  eventOpening,
  newOverworldEventProgress,
  restoreOverworldEventProgress,
  revealOverworldEvent,
  worldEvent,
  worldEvents,
  type OverworldEventProgress,
} from '../memoryDungeon/overworldEventCatalog'
import { MORROW_SHIFT_BY_KEY } from '../memoryDungeon/morrowShift'
import {
  UNBELIEVING_CITY_BY_KEY,
  UNBELIEVING_CITY_SITES,
  validateUnbelievingCity,
} from '../memoryDungeon/unbelievingCity'
import {
  earthRealityCoverage,
  earthRealityReady,
} from '../memoryDungeon/earthAct'
import { EARTH_PHOTOS } from '../memoryDungeon/chronicle'

assert.deepEqual(validateUnbelievingCity(), [])
assert.equal(UNBELIEVING_CITY_SITES.length, 64)
assert.deepEqual(earthRealityCoverage(), [])

const events = worldEvents('e04')
assert.equal(events.length, 64)
for (const event of events) {
  const site = UNBELIEVING_CITY_BY_KEY.get(event.key)!
  const before = MORROW_SHIFT_BY_KEY.get(event.key)!
  assert.equal(event.title, site.title, event.key + ' serves authored title')
  assert.equal(event.place, before.place, event.key + ' same place as e03')
  assert.notEqual(
    event.title,
    before.title,
    event.key + ' is changed, not copied',
  )
  assert.ok(!event.title.includes(' / '), event.key + ' template title leaked')
  assert.ok(!/^At .+?, /.test(event.choices[0]!.label))
}

// Photographs keep their Chronicle choices.
for (const photo of EARTH_PHOTOS.filter((item) => item.experience === 'e04')) {
  const event = worldEvent('e04', photo.site)!
  assert.equal(event.photographId, photo.id)
  assert.deepEqual(
    event.choices.map((choice) => choice.id),
    ['challenge', 'hold'],
  )
}

// The tide gate keeps the pair's storyline choice exactly.
const gate = worldEvent('e04', '8,8')!
assert.deepEqual(
  gate.choices.map((choice) => [choice.id, choice.flag]),
  [
    ['open-the-tide-gate', 'e04:char-lost-in-present'],
    ['seal-the-tide-gate', 'e04:char-alive-commuters-stranded'],
    ['divert-the-current', 'e04:char-alive-district-at-risk'],
  ],
)
assert.ok(/Char/.test(gate.opening) && /Scylla/.test(gate.opening))

// Pacing mix.
const instants = events.filter((event) => event.instant)
assert.ok(instants.length >= 12, 'at least 12 instant discoveries')
assert.ok(events.filter((event) => event.kind === 'puzzle').length >= 6)
assert.equal(worldEvent('e04', '6,2')!.kind, 'dungeon')

// Echoes reach back into e03 and Sublevel B.
const echoes = UNBELIEVING_CITY_SITES.flatMap((site) => site.echoes ?? [])
assert.ok(echoes.length >= 16, 'expected 16+ echoes, got ' + echoes.length)
assert.ok(echoes.filter((echo) => echo.flag.startsWith('e03:')).length >= 8)
const e03Echo = UNBELIEVING_CITY_SITES.find((site) =>
  site.echoes?.some((echo) => echo.flag.startsWith('e03:')),
)!
const event = worldEvent('e04', e03Echo.key)!
const echo = e03Echo.echoes!.find((item) => item.flag.startsWith('e03:'))!
assert.ok(eventOpening(event, [echo.flag]).endsWith(echo.text))
assert.equal(eventOpening(event, []), event.opening)

// Template-era e04 saves (care/risk everywhere, photo hold, a gate answer) replay.
function walkAll(choose: (key: string) => string): OverworldEventProgress {
  let progress = newOverworldEventProgress('e04')
  for (let pass = 0; pass < 64; pass++)
    for (const item of events)
      progress = revealOverworldEvent(progress, item.key)
  for (const item of events)
    progress = chooseOverworldEvent(progress, item.key, choose(item.key))
  return progress
}
for (const gateChoice of [
  'open-the-tide-gate',
  'seal-the-tide-gate',
  'divert-the-current',
]) {
  const legacy = walkAll((key) =>
    key === '8,8' ? gateChoice : ['2,2', '7,6'].includes(key) ? 'hold' : 'care',
  )
  assert.equal(Object.keys(legacy.choices).length, 64)
  for (const item of instants) assert.equal(legacy.choices[item.key], 'notice')
  const restored = restoreOverworldEventProgress(
    JSON.parse(JSON.stringify(legacy)),
  )!
  assert.deepEqual(restored.choices, legacy.choices)
  assert.ok(earthRealityReady('e04', legacy))
  assert.equal(legacy.choices['8,8'], gateChoice)
}

// Reachable from 1,1.
const seen = new Set(['1,1'])
const queue = ['1,1']
while (queue.length)
  for (const next of eventNeighbors(queue.shift()!))
    if (!seen.has(next)) {
      seen.add(next)
      queue.push(next)
    }
assert.equal(seen.size, 64)

console.log(
  'Unbelieving City: 64 authored e04 sites on e03’s places, ' +
    instants.length +
    ' instants, ' +
    echoes.length +
    ' echoes; photos and the tide gate keep their choices; legacy saves replay.',
)
