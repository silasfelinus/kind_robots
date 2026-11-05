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
import {
  SCYLLAS_SHORE_BY_KEY,
  SCYLLAS_SHORE_SITES,
  TIDE_GATE_FLAGS,
  validateScyllasShore,
} from '../memoryDungeon/scyllasShore'
import {
  seaActCoverage,
  seaNarrative,
  seaRealityReady,
} from '../memoryDungeon/seaAct'
import { EARTH_PHOTOS } from '../memoryDungeon/chronicle'
import {
  MEMORY_SCYLLA_DEPARTURE_CHOICES,
  newMemoryCampaignProgress,
} from '../memoryDungeon/reimaginerCampaign'

assert.deepEqual(validateScyllasShore(), [])
assert.equal(SCYLLAS_SHORE_SITES.length, 64)
assert.deepEqual(seaActCoverage(), [])

const events = worldEvents('e05')
assert.equal(events.length, 64)
for (const event of events) {
  const site = SCYLLAS_SHORE_BY_KEY.get(event.key)!
  assert.equal(event.title, site.title, event.key + ' serves authored title')
  assert.equal(event.place, site.place)
  assert.ok(!event.title.includes(' / '), event.key + ' template title leaked')
  assert.ok(!/^At .+?, /.test(event.choices[0]!.label))
}

// Photographs and the departure gate keep their choices exactly.
for (const photo of EARTH_PHOTOS.filter((item) => item.experience === 'e05')) {
  const event = worldEvent('e05', photo.site)!
  assert.equal(event.photographId, photo.id)
  assert.deepEqual(
    event.choices.map((choice) => choice.id),
    ['challenge', 'hold'],
  )
}
const gate = worldEvent('e05', '8,8')!
assert.deepEqual(
  gate.choices.map((choice) => choice.id),
  MEMORY_SCYLLA_DEPARTURE_CHOICES.map((choice) => choice.id),
)
assert.ok(/Char/.test(gate.opening))

// The template key-scene line is gone for e05; the campaign line remains.
const campaign = {
  ...newMemoryCampaignProgress(),
  pairDecisions: { e04: 'open-the-tide-gate' },
} as Parameters<typeof seaNarrative>[2]
assert.equal(seaNarrative('e05', '4,3', campaign), '')
assert.ok(/Char die/.test(seaNarrative('e05', '1,1', campaign)))
assert.ok(seaNarrative('e05', '8,8', campaign).length > 20)

// Pacing.
const instants = events.filter((event) => event.instant)
assert.ok(instants.length >= 12, 'at least 12 instants, got ' + instants.length)
assert.ok(events.filter((event) => event.kind === 'puzzle').length >= 6)

// Every tide-gate outcome is remembered somewhere, and echoes render.
const echoes = SCYLLAS_SHORE_SITES.flatMap((site) => site.echoes ?? [])
assert.ok(echoes.length >= 24, 'expected 24+ echoes, got ' + echoes.length)
for (const flag of TIDE_GATE_FLAGS) {
  const site = SCYLLAS_SHORE_SITES.find((item) =>
    item.echoes?.some((echo) => echo.flag === flag),
  )!
  const event = worldEvent('e05', site.key)!
  const echo = site.echoes!.find((item) => item.flag === flag)!
  assert.ok(eventOpening(event, [flag]).includes(echo.text))
  assert.equal(eventOpening(event, []), event.opening)
}

// Template-era e05 saves replay for every departure answer.
function walkAll(choose: (key: string) => string): OverworldEventProgress {
  let progress = newOverworldEventProgress('e05')
  for (let pass = 0; pass < 64; pass++)
    for (const item of events)
      progress = revealOverworldEvent(progress, item.key)
  for (const item of events)
    progress = chooseOverworldEvent(progress, item.key, choose(item.key))
  return progress
}
for (const departure of MEMORY_SCYLLA_DEPARTURE_CHOICES) {
  const legacy = walkAll((key) =>
    key === '8,8'
      ? departure.id
      : ['3,1', '8,5'].includes(key)
        ? 'challenge'
        : 'risk',
  )
  assert.equal(Object.keys(legacy.choices).length, 64)
  for (const item of instants) assert.equal(legacy.choices[item.key], 'notice')
  const restored = restoreOverworldEventProgress(
    JSON.parse(JSON.stringify(legacy)),
  )!
  assert.deepEqual(restored.choices, legacy.choices)
  assert.ok(seaRealityReady('e05', legacy))
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
  'Scylla’s Shore: 64 authored e05 sites, ' +
    instants.length +
    ' instants, ' +
    echoes.length +
    ' echoes; all three tide-gate outcomes remembered; photos and the departure keep their choices; legacy saves replay.',
)
