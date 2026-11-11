import assert from 'node:assert/strict'
import {
  HOTEL_ROOMS,
  CITY_DESTINATIONS,
  availableTopics,
  newCase,
  performAction,
  restoreCase,
  switchInvestigator,
  travel,
  type CaseState,
  type Verb,
} from '../monstressConvention/prologue'

function move(
  state: CaseState,
  destination: keyof typeof HOTEL_ROOMS,
): CaseState {
  const response = travel(state, destination)
  assert.equal(response.changed, true, response.line)
  return response.state
}
function act(
  state: CaseState,
  verb: Verb,
  target: string,
  topic?: string,
): CaseState {
  const response = performAction(state, { verb, target, topic })
  assert.equal(response.changed, true, response.line)
  return response.state
}
function run(
  entrance: 'marta' | 'neighbor',
  order: 'odette' | 'violet',
  careful: boolean,
): CaseState {
  let s = newCase(42)
  assert.equal(s.actor, 'iris', 'Iris starts as lead')
  assert.equal(s.room, 'motel-exterior')
  assert.equal(
    travel(s, 'convention-center').changed,
    false,
    'convention is separate',
  )
  s = move(s, 'front-office')
  if (entrance === 'marta') {
    s = act(s, 'look', 'guest-ledger')
    s = act(s, 'talk', 'marta')
    s = act(s, 'ask', 'marta', 'room-access')
  }
  s = move(s, 'balcony')
  if (entrance === 'neighbor') {
    s = move(s, 'neighbor-room')
    s = act(s, 'talk', 'neighbor')
    s = act(s, 'ask', 'neighbor', 'unknown-visitor')
    s = move(s, 'balcony')
  }
  assert.ok(s.flags.includes('crime-room-access'))
  s = move(s, 'odette-room')
  assert.ok(s.evidence.includes('double-murder'))
  s = act(s, 'photograph', 'knife')
  const ghosts =
    order === 'odette'
      ? ['odette-ghost', 'violet-ghost']
      : ['violet-ghost', 'odette-ghost']
  for (const name of ghosts) {
    s = act(s, 'talk', name)
    const topic = name === 'odette-ghost' ? 'agent-deals' : 'violet-witness'
    assert.ok(availableTopics(s, name).includes(topic))
    s = act(s, 'ask', name, topic)
    assert.equal(availableTopics(s, name).includes(topic), false)
    const nico = switchInvestigator(s).state
    assert.ok(
      availableTopics(nico, name).includes(topic),
      'second investigator gets a separate answer',
    )
    assert.equal(
      performAction(nico, { verb: 'photograph', target: 'knife' }).changed,
      false,
      'Nico never touches',
    )
    s = act(nico, 'ask', name, topic)
    s = switchInvestigator(s).state
  }
  assert.ok(s.evidence.includes('ghost-odette'))
  assert.ok(s.evidence.includes('ghost-violet'))
  s = move(s, 'balcony')
  if (careful) {
    s = move(s, 'ice-alcove')
    s = act(s, 'photograph', 'ice-machine')
    s = move(s, 'motel-exterior')
    s = act(s, 'photograph', 'fan-camera')
    assert.ok(s.evidence.includes('fan-exonerated'))
    s = move(s, 'front-office')
    s = move(s, 'balcony')
  }
  s = move(s, 'investigators-room')
  s = act(s, 'use', 'desk')
  if (careful) {
    assert.equal(s.ending, null)
    assert.ok(s.flags.includes('city-lead'))
    s = move(s, 'balcony')
    s = move(s, 'front-office')
    s = move(s, 'motel-exterior')
    s = move(s, 'city-map')
    assert.ok(HOTEL_ROOMS['city-map'].label.includes('City Map'))
    s = move(s, 'convention-center')
    s = act(s, 'photograph', 'idol-poster')
    assert.equal(s.ending, 'lead-earned')
  } else {
    assert.equal(s.ending, 'reckless')
  }
  return s
}

assert.equal(CITY_DESTINATIONS.length, 5)
assert.equal(CITY_DESTINATIONS[0]?.label, 'MONSTRIQUE Convention')
assert.ok(CITY_DESTINATIONS.some((location) => location.id === 'sewers'))
for (const room of Object.values(HOTEL_ROOMS)) {
  assert.ok(room.hotspots.length > 0, room.id)
  for (const exit of room.exits)
    assert.ok(
      HOTEL_ROOMS[exit].exits.includes(room.id),
      room.id + ' -> ' + exit,
    )
}
for (const entrance of ['marta', 'neighbor'] as const) {
  for (const firstGhost of ['odette', 'violet'] as const) {
    for (const careful of [false, true]) {
      const s = run(entrance, firstGhost, careful)
      assert.equal(restoreCase(JSON.parse(JSON.stringify(s)))?.room, s.room)
      assert.equal(restoreCase({ ...s, version: 1 }), null)
      assert.equal(restoreCase({ ...s, room: '__proto__' }), null)
      assert.equal(restoreCase({ ...s, flags: ['valid', 42] }), null)
      assert.equal(switchInvestigator(s).changed, false)
    }
  }
}
let s = newCase()
const original = JSON.stringify(s)
assert.equal(performAction(s, { verb: 'take', target: 'gavin' }).changed, false)
assert.equal(
  JSON.stringify(s),
  original,
  'a rejected action does not mutate the state',
)
s = move(s, 'front-office')
assert.equal(travel(s, 'odette-room').changed, false)

// --- Monstrique: Odette hires the investigators, Violet's favours, flirting.
function reachCrimeRoom(): CaseState {
  let c = newCase(7)
  c = move(c, 'front-office')
  c = act(c, 'look', 'guest-ledger')
  c = act(c, 'use', 'marta')
  c = move(c, 'balcony')
  return move(c, 'odette-room')
}
let m = reachCrimeRoom()
m = act(m, 'talk', 'odette-ghost')
assert.ok(m.flags.includes('odette-hired-us'), 'the dead agent is the client')
assert.ok(availableTopics(m, 'odette-ghost').includes('harker-files'))
m = act(m, 'ask', 'odette-ghost', 'harker-files')
assert.ok(m.evidence.includes('harker-file'))
m = act(m, 'ask', 'odette-ghost', 'ghost-accounts')
assert.ok(m.evidence.includes('odette-floating'))
m = act(m, 'talk', 'violet-ghost')
// Flirting before any favour is a joke, never progress or a lock.
m = act(m, 'flirt', 'violet-ghost')
assert.equal(m.gratitude.violet ?? 0, 0)
assert.equal(m.flags.includes('ghost-kiss'), false)
// Favour 1: the fangs went into the ice bucket, which left the room.
m = act(m, 'look', 'ice-ring')
assert.ok(m.evidence.includes('ice-ring'))
m = act(m, 'ask', 'violet-ghost', 'missing-fangs')
m = move(m, 'balcony')
m = move(m, 'ice-alcove')
m = act(m, 'use', 'ice-machine')
assert.ok(m.inventory.includes('plastic-fangs'))
assert.ok(m.evidence.includes('makeup-smear'))
const beforeCombination = JSON.stringify(m)
const combined = performAction(m, {
  verb: 'combine',
  item: 'camera',
  target: 'plastic-fangs',
})
assert.equal(combined.changed, true)
assert.ok(combined.state.evidence.includes('fangs-detail'))
assert.deepEqual(
  restoreCase(JSON.parse(JSON.stringify(combined.state))),
  combined.state,
  'a combined clue survives save and reload',
)
assert.equal(JSON.stringify(m), beforeCombination, 'combining cannot mutate the source save')
assert.equal(
  performAction(combined.state, {
    verb: 'combine',
    item: 'plastic-fangs',
    target: 'camera',
  }).changed,
  false,
  'combining twice does not duplicate the clue',
)
assert.equal(
  performAction(m, {
    verb: 'combine',
    item: 'plastic-fangs',
    target: 'camera',
  }).changed,
  true,
  'combinations work regardless of selected item order',
)
assert.equal(
  performAction(m, {
    verb: 'combine',
    item: 'camera',
    target: 'motel-key',
  }).changed,
  false,
  'uncrafted combinations do not fabricate inventory or clues',
)
assert.equal(
  performAction(m, {
    verb: 'combine',
    item: 'camera',
    target: 'unowned-item',
  }).changed,
  false,
  'a forged inventory item cannot be combined',
)
assert.equal(
  performAction(m, {
    verb: 'use',
    target: 'ice-machine',
  }).state.inventory.filter((item) => item === 'plastic-fangs').length,
  1,
  'the fangs are found once',
)
m = move(m, 'balcony')
m = move(m, 'odette-room')
const norbHolding = switchInvestigator(m).state
assert.equal(
  performAction(norbHolding, {
    verb: 'combine',
    item: 'camera',
    target: 'plastic-fangs',
  }).changed,
  false,
  'Norb must never manipulate or combine inventory',
)
assert.equal(
  performAction(norbHolding, {
    verb: 'use',
    target: 'violet-ghost',
    item: 'plastic-fangs',
  }).changed,
  false,
  'Norb never hands anything over',
)
assert.equal(
  performAction(norbHolding, { verb: 'flirt', target: 'violet-ghost' }).changed,
  false,
  'Norb does not flirt',
)
m = performAction(m, {
  verb: 'use',
  target: 'violet-ghost',
  item: 'plastic-fangs',
}).state
assert.equal(m.gratitude.violet, 1)
assert.ok(m.evidence.includes('violet-scent'))
assert.equal(m.inventory.includes('plastic-fangs'), false)
// Favour 2, low morals: pay Violet out of the dead client's purse.
m = act(m, 'ask', 'odette-ghost', 'violet-fee')
m = act(m, 'take', 'odette-purse')
assert.equal(
  performAction(m, { verb: 'take', target: 'odette-purse' }).changed,
  false,
)
m = performAction(m, {
  verb: 'use',
  target: 'violet-ghost',
  item: 'odette-purse',
}).state
assert.equal(m.gratitude.violet, 2)
assert.ok(m.transcript.at(-1)?.includes('cab fare'))
assert.equal(
  performAction(m, { verb: 'use', target: 'violet-ghost', item: 'camera' })
    .changed,
  false,
  'nonsense combinations get a joke and change nothing',
)
m = act(m, 'flirt', 'violet-ghost')
assert.ok(m.flags.includes('ghost-kiss'))
m = act(m, 'flirt', 'odette-ghost')
assert.ok(m.transcript.at(-1)?.includes('she gets a kiss'))
// Norb rebuffs every time, and the rebuffs escalate.
m = move(m, 'balcony')
m = move(m, 'investigators-room')
const rebuffs = new Set<string>()
for (let i = 0; i < 7; i += 1) {
  m = act(m, 'flirt', 'nico')
  rebuffs.add(m.transcript.at(-1) ?? '')
}
assert.equal(m.rebuffs, 7)
assert.equal(rebuffs.size, 7, 'seven distinct rebuffs before repeating')
assert.equal(performAction(m, { verb: 'flirt', target: 'nico' }).changed, true)
// Saves round-trip, upgrade from MONSTREXX v2 and reject forged graces.
assert.deepEqual(restoreCase(JSON.parse(JSON.stringify(m))), m)
const legacy = { ...m, version: 2 } as Record<string, unknown>
delete legacy.gratitude
delete legacy.rebuffs
const upgraded = restoreCase(legacy)
assert.equal(upgraded?.version, 3)
assert.deepEqual(upgraded?.gratitude, {})
assert.equal(upgraded?.rebuffs, 0)
assert.equal(restoreCase({ ...m, gratitude: { draculina: 9 } }), null)
assert.equal(
  restoreCase({ ...m, gratitude: { violet: 99 } })?.gratitude.violet,
  2,
)
assert.equal(restoreCase({ ...m, rebuffs: -1 }), null)
// Silas, 2026-11-07 PT: the mummy star is Cleo Pappatra, and Draculina's
// last-act reveal is planted fairly in Chapter 1 (the costume, the fog).
const castText = JSON.stringify(HOTEL_ROOMS)
assert.match(castText, /Cleo Pappatra, the mummy star/)
assert.doesNotMatch(castText, /Celestine|Nefertari/)
let plant = newCase(11)
plant = move(plant, 'front-office')
plant = act(plant, 'look', 'guest-ledger')
plant = act(plant, 'use', 'marta')
plant = move(plant, 'balcony')
plant = move(plant, 'odette-room')
plant = act(plant, 'talk', 'violet-ghost')
plant = act(plant, 'ask', 'violet-ghost', 'violet-fee')
assert.match(plant.transcript.at(-1) ?? '', /Draculina/)
plant = move(plant, 'balcony')
plant = move(plant, 'front-office')
plant = move(plant, 'motel-exterior')
plant = act(plant, 'photograph', 'fan-camera')
assert.match(plant.transcript.at(-1) ?? '', /fog curling up the stairs/)
console.log(
  'MONSTRIQUE: eight Iris-led double-ghost playthroughs, client hire, Violet favours, flirting and save upgrades pass',
)
