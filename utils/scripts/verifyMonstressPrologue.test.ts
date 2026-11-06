import assert from 'node:assert/strict'
import {
  availableTopics,
  HOTEL_ROOMS,
  newCase,
  performAction,
  restoreCase,
  switchInvestigator,
  travel,
  type CaseState,
} from '../monstressConvention/prologue'

const walk = (state: CaseState, room: keyof typeof HOTEL_ROOMS): CaseState => {
  const result = travel(state, room)
  assert.equal(result.changed, true, result.line)
  return result.state
}
const doIt = (state: CaseState, verb: Parameters<typeof performAction>[1]['verb'], target: string, topic?: string): CaseState => {
  const result = performAction(state, { verb, target, topic })
  assert.equal(result.changed, true, result.line)
  return result.state
}
const play = (badge: 'iris' | 'nico', ghost: 'iris' | 'nico', accuse: boolean): CaseState => {
  let s = newCase(42)
  assert.equal(travel(s, 'convention').changed, false, 'badge gates the panel')
  if (badge === 'nico') s = doIt(s, 'take', 'lost-pass')
  else s = doIt(s, 'photograph', 'marquee')
  if (s.actor !== badge) s = switchInvestigator(s).state
  s = walk(s, 'lobby')
  s = walk(s, 'registration')
  s = doIt(s, 'talk', 'clerk')
  s = doIt(s, 'use', 'clerk')
  assert.ok(s.flags.includes('press-badge'))
  s = walk(s, 'lobby')
  s = walk(s, 'convention')
  s = doIt(s, 'talk', 'celestine')
  s = doIt(s, 'ask', 'celestine', 'royalties')
  s = doIt(s, 'use', 'stage')
  assert.ok(s.flags.includes('murder'))
  s = walk(s, 'lobby')
  s = walk(s, 'stairwell')
  s = doIt(s, 'look', 'bell')
  s = walk(s, 'suite-205')
  if (s.actor !== ghost) s = switchInvestigator(s).state
  s = doIt(s, 'talk', 'ghost')
  assert.ok(availableTopics(s, 'ghost').includes('last-sensation'))
  s = doIt(s, 'ask', 'ghost', 'last-sensation')
  assert.ok(!availableTopics(s, 'ghost').includes('last-sensation'))
  s = switchInvestigator(s).state
  assert.ok(availableTopics(s, 'ghost').includes('last-sensation'), 'questions are shared, exhaustion is per investigator')
  s = doIt(s, 'ask', 'ghost', 'last-sensation')
  s = walk(s, 'stairwell')
  s = walk(s, 'lobby')
  if (!accuse) {
    s = doIt(s, 'talk', 'porter')
    s = doIt(s, 'ask', 'porter', 'service-bell')
    s = walk(s, 'courtyard')
    s = doIt(s, 'talk', 'gavin')
    s = doIt(s, 'photograph', 'camera')
    assert.ok(s.evidence.includes('fan-exonerated'))
    s = walk(s, 'lobby')
  }
  s = doIt(s, 'use', 'desk')
  assert.equal(s.ending, accuse ? 'reckless' : 'responsible')
  return s
}

const rooms = Object.values(HOTEL_ROOMS)
assert.equal(rooms.length, 7)
for (const room of rooms) {
  assert.ok(room.hotspots.length > 0, room.id)
  for (const exit of room.exits) {
    assert.ok(HOTEL_ROOMS[exit].exits.includes(room.id), room.id + ' -> ' + exit)
  }
}
for (const badge of ['nico', 'iris'] as const) {
  for (const ghost of ['nico', 'iris'] as const) {
    for (const accuse of [false, true]) {
      const result = play(badge, ghost, accuse)
      assert.ok(result.ending)
      const saved = JSON.parse(JSON.stringify(result))
      assert.deepEqual(restoreCase(saved), result)
      assert.equal(restoreCase({ ...saved, version: 2 }), null)
      assert.equal(restoreCase({ ...saved, actor: 'unknown' }), null)
      assert.equal(restoreCase({ ...saved, flags: [42] }), null)
      assert.equal(restoreCase({ ...saved, room: 'attic' }), null)
      assert.equal(switchInvestigator(result).changed, false)
    }
  }
}
let state = newCase()
state = walk(state, 'lobby')
const original = state
assert.equal(performAction(state, { verb: 'use', target: 'desk' }).changed, false)
assert.deepEqual(state, original, 'rejected action does not mutate state')
assert.equal(travel(state, 'suite-205').changed, false)
console.log('Monstress opening case: 8 complete evidence/character/ending paths passed')
