import assert from 'node:assert/strict'
import {
  chooseOverworldEvent,
  eventOpening,
  newOverworldEventProgress,
  restoreOverworldEventProgress,
  revealOverworldEvent,
  worldEvent,
  worldEvents,
  type OverworldEventProgress,
} from '../memoryDungeon/overworldEventCatalog'
import { SCYLLAS_SHORE_BY_KEY } from '../memoryDungeon/scyllasShore'
import {
  DEPARTURE_FLAGS,
  UNDERTIDE_CROWN_BY_KEY,
  UNDERTIDE_CROWN_SITES,
  validateUndertideCrown,
} from '../memoryDungeon/undertideCrown'
import { seaActCoverage, seaRealityReady } from '../memoryDungeon/seaAct'
import { EARTH_PHOTOS } from '../memoryDungeon/chronicle'
import {
  MEMORY_CHAR_AGENCY_CHOICES,
  MEMORY_PAIR_ENDINGS,
} from '../memoryDungeon/reimaginerCampaign'

assert.deepEqual(validateUndertideCrown(), [])
assert.equal(UNDERTIDE_CROWN_SITES.length, 64)
assert.deepEqual(seaActCoverage(), [])

const events = worldEvents('e06')
assert.equal(events.length, 64)
for (const event of events) {
  const site = UNDERTIDE_CROWN_BY_KEY.get(event.key)!
  const before = SCYLLAS_SHORE_BY_KEY.get(event.key)!
  assert.equal(event.title, site.title, event.key + ' serves authored title')
  assert.equal(event.place, before.place, event.key + ' same place as e05')
  assert.notEqual(event.title, before.title, event.key + ' changed, not copied')
  assert.ok(!event.title.includes(' / '), event.key + ' template title leaked')
}
const titles = UNDERTIDE_CROWN_SITES.map((site) => site.title)
assert.equal(new Set(titles).size, titles.length, 'titles are unique')

// Fixed choices keep their exact ids and flags.
for (const photo of EARTH_PHOTOS.filter((item) => item.experience === 'e06')) {
  const event = worldEvent('e06', photo.site)!
  assert.equal(event.photographId, photo.id)
  assert.deepEqual(
    event.choices.map((choice) => choice.id),
    ['challenge', 'hold'],
  )
}
assert.deepEqual(
  worldEvent('e06', '7,7')!.choices.map((choice) => choice.id),
  MEMORY_CHAR_AGENCY_CHOICES.map((choice) => choice.id),
)
assert.deepEqual(
  worldEvent('e06', '8,8')!.choices.map((choice) => [choice.id, choice.flag]),
  [
    ['publish-twin-testimony', 'e06:twin-testimony-public'],
    ['protect-private-memory', 'e06:twin-testimony-private'],
  ],
)
assert.ok(/Char/.test(worldEvent('e06', '7,7')!.opening))
assert.equal(worldEvent('e06', '4,6')!.kind, 'dungeon')

// Pacing.
const instants = events.filter((event) => event.instant)
assert.ok(instants.length >= 12, 'at least 12 instants, got ' + instants.length)
assert.ok(events.filter((event) => event.kind === 'puzzle').length >= 6)

// Every e05 departure is remembered, and echoes render.
const echoes = UNDERTIDE_CROWN_SITES.flatMap((site) => site.echoes ?? [])
assert.ok(echoes.length >= 24, 'expected 24+ echoes, got ' + echoes.length)
assert.ok(echoes.some((echo) => echo.flag.startsWith('e04:char-')))
for (const flag of DEPARTURE_FLAGS) {
  const site = UNDERTIDE_CROWN_SITES.find((item) =>
    item.echoes?.some((echo) => echo.flag === flag),
  )!
  const event = worldEvent('e06', site.key)!
  const echo = site.echoes!.find((item) => item.flag === flag)!
  assert.ok(eventOpening(event, [flag]).includes(echo.text))
}

// Template-era e06 saves replay for every Char choice and testimony answer.
function walkAll(choose: (key: string) => string): OverworldEventProgress {
  let progress = newOverworldEventProgress('e06')
  for (let pass = 0; pass < 64; pass++)
    for (const item of events)
      progress = revealOverworldEvent(progress, item.key)
  for (const item of events)
    progress = chooseOverworldEvent(progress, item.key, choose(item.key))
  return progress
}
for (const agency of MEMORY_CHAR_AGENCY_CHOICES)
  for (const ending of MEMORY_PAIR_ENDINGS.e06) {
    const legacy = walkAll((key) =>
      key === '7,7'
        ? agency.id
        : key === '8,8'
          ? ending.id
          : ['2,6', '6,2'].includes(key)
            ? 'hold'
            : 'care',
    )
    assert.equal(Object.keys(legacy.choices).length, 64)
    const restored = restoreOverworldEventProgress(
      JSON.parse(JSON.stringify(legacy)),
    )!
    assert.deepEqual(restored.choices, legacy.choices)
    assert.ok(seaRealityReady('e06', legacy))
  }

console.log(
  'Undertide Crown: 64 authored e06 sites on e05’s places, ' +
    instants.length +
    ' instants, ' +
    echoes.length +
    ' echoes; every departure remembered; photos, Char’s choice and the bells keep their choices; legacy saves replay.',
)
