import assert from 'node:assert/strict'
import {
  OVERWORLD_EVENT_CATALOG,
  chooseOverworldEvent,
  eventNeighbors,
  newOverworldEventProgress,
  restoreOverworldEventProgress,
  revealOverworldEvent,
  validateOverworldEventCatalog,
  worldEvent,
  worldEvents,
} from '../memoryDungeon/overworldEventCatalog'
import { EARTH_PHOTOS } from '../memoryDungeon/chronicle'
import { HOSHIMORI_NIGHT_SITES } from '../memoryDungeon/hoshimoriNight'

assert.deepEqual(validateOverworldEventCatalog(), [])
assert.equal(OVERWORLD_EVENT_CATALOG.length, 12 * 64)

for (let n = 1; n <= 12; n++) {
  const id = 'e' + String(n).padStart(2, '0')
  const events = worldEvents(id)
  assert.equal(events.length, 64, id + ' needs 64 meaningful tiles')
  const uniqueIds = new Set(events.map((event) => event.id))
  assert.equal(uniqueIds.size, 64)
  for (const event of events) {
    assert.ok(event.opening.length > 60)
    assert.ok(event.title.length > 3)
    assert.ok(event.choices.length >= 2)
    for (const choice of event.choices) {
      assert.ok(choice.outcome.length > 35)
      assert.notEqual(choice.flag, '')
      assert.ok(choice.art.path.includes(event.key.replace(',', '-')))
      assert.equal(choice.art.status, 'placeholder')
    }
  }
  if (!['e01', 'e02', 'e07'].includes(id)) {
    const kinds = new Set(events.map((event) => event.kind))
    for (const kind of [
      'memory',
      'challenge',
      'treasure',
      'monster',
      'dungeon',
      'merchant',
      'puzzle',
      'companion',
    ] as const)
      assert.ok(kinds.has(kind), id + ' missing ' + kind)
    for (const photo of EARTH_PHOTOS.filter((item) => item.experience === id))
      assert.equal(worldEvent(id, photo.site)?.photographId, photo.id)
    assert.equal(
      events.filter((event) => event.source === 'new-authoring').length,
      id === 'e08' ? 48 : 64,
    )
  }

  let progress = newOverworldEventProgress(id)
  for (let y = 1; y <= 8; y++) {
    for (let x = 1; x <= 8; x++) {
      const key = x + ',' + y
      progress = revealOverworldEvent(progress, key)
      assert.ok(
        progress.revealed.includes(key),
        id + ':' + key + ' unreachable',
      )
      const first = worldEvent(id, key)!.choices[0]!
      const chosen = chooseOverworldEvent(progress, key, first.id)
      assert.notEqual(chosen, progress)
      assert.equal(chosen.choices[key], first.id)
      assert.equal(
        chooseOverworldEvent(chosen, key, first.id),
        chosen,
        'no duplicate payout',
      )
      progress = chosen
    }
  }
  assert.equal(progress.revealed.length, 64)
  assert.equal(Object.keys(progress.choices).length, 64)
  assert.equal(progress.flags.length, 64)
  const restored = restoreOverworldEventProgress({
    ...progress,
    supplies: 999999,
    flags: ['forged'],
    revealed: [...progress.revealed, '99,99'],
    choices: { ...progress.choices, '99,99': 'forged' },
  })
  assert.ok(restored)
  assert.deepEqual(restored.revealed, progress.revealed)
  assert.deepEqual(restored.flags, progress.flags)
  assert.equal(restored.supplies, progress.supplies)
}

const blocked = newOverworldEventProgress('e03')
assert.equal(revealOverworldEvent(blocked, '8,8'), blocked)
assert.equal(chooseOverworldEvent(blocked, '8,8', 'care'), blocked)
assert.deepEqual(eventNeighbors('1,1').sort(), ['1,2', '2,1'])
assert.deepEqual(eventNeighbors('not-a-cell'), [])

const gate = worldEvent('e04', '8,8')!
assert.equal(gate.choices.length, 3)
assert.deepEqual(
  gate.choices.map((choice) => choice.id),
  ['open-the-tide-gate', 'seal-the-tide-gate', 'divert-the-current'],
)
assert.deepEqual(
  gate.choices.map((choice) => choice.flag),
  [
    'e04:char-lost-in-present',
    'e04:char-alive-commuters-stranded',
    'e04:char-alive-district-at-risk',
  ],
)
const departure = worldEvent('e05', '8,8')!
assert.deepEqual(
  departure.choices.map((choice) => choice.id),
  ['run-again', 'stay', 'tell-char'],
)
for (const id of ['e09', 'e10', 'e11', 'e12']) {
  assert.equal(
    worldEvents(id).filter((event) => event.memoryFragment).length,
    2,
  )
}
for (const pilot of HOSHIMORI_NIGHT_SITES) {
  const adopted = worldEvent('e08', pilot.key)!
  assert.equal(adopted.title, pilot.title)
  assert.equal(adopted.opening, pilot.opening)
  assert.equal(adopted.source, 'existing-playable')
}
for (const site of worldEvents('e08')) {
  assert.ok(site.originalSite, site.key + ' lost original village landmark')
}

console.log(
  'Memory overworld reveal catalog: 768 cells, 12 graphs, fixed photos and no duplicate rewards passed',
)
