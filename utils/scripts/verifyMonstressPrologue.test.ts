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

function move(state: CaseState, destination: keyof typeof HOTEL_ROOMS): CaseState {
  const response = travel(state, destination)
  assert.equal(response.changed, true, response.line)
  return response.state
}
function act(state: CaseState, verb: Verb, target: string, topic?: string): CaseState {
  const response = performAction(state, { verb, target, topic })
  assert.equal(response.changed, true, response.line)
  return response.state
}
function run(entrance: 'marta' | 'neighbor', order: 'odette' | 'violet', careful: boolean): CaseState {
  let s = newCase(42)
  assert.equal(s.actor, 'iris', 'Iris starts as lead')
  assert.equal(s.room, 'motel-exterior')
  assert.equal(travel(s, 'convention-center').changed, false, 'convention is separate')
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
  const ghosts = order === 'odette'
    ? ['odette-ghost', 'violet-ghost']
    : ['violet-ghost', 'odette-ghost']
  for (const name of ghosts) {
    s = act(s, 'talk', name)
    const topic = name === 'odette-ghost' ? 'agent-deals' : 'violet-witness'
    assert.ok(availableTopics(s, name).includes(topic))
    s = act(s, 'ask', name, topic)
    assert.equal(availableTopics(s, name).includes(topic), false)
    const nico = switchInvestigator(s).state
    assert.ok(availableTopics(nico, name).includes(topic), 'second investigator gets a separate answer')
    assert.equal(performAction(nico, { verb: 'photograph', target: 'knife' }).changed, false, 'Nico never touches')
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

assert.equal(CITY_DESTINATIONS.length, 4)
assert.equal(CITY_DESTINATIONS[0]?.label, 'MONSTREXX Convention')
assert.ok(CITY_DESTINATIONS.some((location) => location.id === 'sewers'))
for (const room of Object.values(HOTEL_ROOMS)) {
  assert.ok(room.hotspots.length > 0, room.id)
  for (const exit of room.exits)
    assert.ok(HOTEL_ROOMS[exit].exits.includes(room.id), room.id + ' -> ' + exit)
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
assert.equal(JSON.stringify(s), original, 'a rejected action does not mutate the state')
s = move(s, 'front-office')
assert.equal(travel(s, 'odette-room').changed, false)
console.log('MONSTREXX: eight Iris-led double-ghost playthroughs and privacy-agnostic state contracts pass')
