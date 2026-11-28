import assert from 'node:assert/strict'
import {
  EVIDENCE,
  HOTEL_ROOMS,
  caseScore,
  maxScore,
  newCase,
  performAction,
  restoreCase,
  type CaseState,
  type RoomId,
} from '../monstressConvention/prologue'
import {
  actionForAudience,
  roomForAudience,
  travelForAudience,
} from '../monstressConvention/edition'
import {
  WALK_AREAS,
  approachPoint,
  depthScale,
  entryPoint,
  figureHeight,
  findPath,
  followerPoint,
  isWalkable,
  nearestWalkable,
  pathLength,
  planRoute,
  shortcutRooms,
  travelRoute,
  type StagePoint,
} from '../monstressConvention/navigation'

const rooms = Object.keys(HOTEL_ROOMS) as RoomId[]

function segmentWalkable(room: RoomId, a: StagePoint, b: StagePoint): boolean {
  const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 0.5)
  for (let step = 0; step <= steps; step++) {
    const t = steps === 0 ? 0 : step / steps
    if (
      !isWalkable(room, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })
    )
      return false
  }
  return true
}

function assertRoute(room: RoomId, from: StagePoint, to: StagePoint): void {
  const start = nearestWalkable(room, from)
  const goal = nearestWalkable(room, to)
  const path = findPath(room, from, to)
  if (Math.hypot(goal.x - start.x, goal.y - start.y) < 0.01) {
    assert.deepEqual(path, [], `${room}: already standing there`)
    return
  }
  assert.ok(path.length > 0, `${room}: no route to ${JSON.stringify(to)}`)
  assert.deepEqual(path.at(-1), goal, `${room}: route ends at the target`)
  let previous = start
  for (const point of path) {
    assert.ok(
      segmentWalkable(room, previous, point),
      `${room}: segment ${JSON.stringify(previous)} -> ${JSON.stringify(point)} crosses furniture`,
    )
    previous = point
  }
  assert.deepEqual(findPath(room, from, to), path, `${room}: deterministic`)
}

for (const room of rooms) {
  const area = WALK_AREAS[room]
  assert.ok(area, `${room} has a walk area`)
  assert.ok(isWalkable(room, area.entry), `${room} entry is on the floor`)
  for (const audience of ['general', 'mature'] as const)
    for (const hotspot of roomForAudience(room, audience).hotspots) {
      const stand = approachPoint(room, hotspot)
      assert.ok(isWalkable(room, stand), `${room}/${hotspot.id} stand spot`)
      assertRoute(room, area.entry, stand)
      assertRoute(room, stand, area.entry)
      assert.ok(isWalkable(room, followerPoint(room, stand)))
    }
  assertRoute(room, area.entry, { x: 3, y: 99 })
  assertRoute(room, area.entry, { x: 97, y: 99 })
}

for (const room of rooms) {
  for (const [from, point] of Object.entries(WALK_AREAS[room].entries ?? {})) {
    assert.ok(
      HOTEL_ROOMS[room].exits.includes(from as RoomId),
      `${room} entry from ${from} matches a real door`,
    )
    assert.ok(isWalkable(room, point), `${room} entry from ${from} on floor`)
    assert.deepEqual(entryPoint(room, from as RoomId), point)
    assertRoute(room, point, WALK_AREAS[room].entry)
  }
  assert.deepEqual(entryPoint(room), WALK_AREAS[room].entry)
  assert.ok(
    figureHeight(room, 60) <= figureHeight(room, 96),
    `${room}: nearer characters draw larger`,
  )
  assert.ok(figureHeight(room, 96) > 10 && figureHeight(room, 96) <= 90)
}
assert.notDeepEqual(
  entryPoint('balcony', 'odette-room'),
  entryPoint('balcony', 'front-office'),
  'Iris arrives at the door she used',
)
assert.ok(
  Math.abs(figureHeight('city-map', 70) - 52 * depthScale(70)) < 1e-9,
  'rooms without a painting keep the vector-set scale',
)

const around = findPath('odette-room', { x: 10, y: 82 }, { x: 90, y: 82 })
assert.ok(around.length >= 2, 'Iris walks around the bodies, not over them')
assert.ok(
  pathLength({ x: 10, y: 82 }, around) > 80,
  'the detour is longer than the straight line',
)
const snapped = nearestWalkable('front-office', { x: 60, y: 50 })
assert.ok(isWalkable('front-office', snapped), 'clicks behind the counter snap')
assert.ok(depthScale(60) < depthScale(95), 'nearer characters draw larger')
assert.ok(depthScale(0) >= 0.7 && depthScale(100) <= 1)

const start = newCase(7)
assert.deepEqual(planRoute(start, 'balcony'), ['front-office', 'balcony'])
assert.equal(planRoute(start, 'odette-room'), null, '205 stays sealed')
assert.equal(planRoute(start, 'city-map'), null, 'the city needs a lead')
assert.deepEqual(shortcutRooms(start).sort(), [
  'balcony',
  'front-office',
  'ice-alcove',
  'investigators-room',
  'neighbor-room',
])
const shortcut = travelRoute(start, 'neighbor-room')
assert.equal(shortcut.changed, true, shortcut.line)
assert.equal(shortcut.state.room, 'neighbor-room')
assert.equal(
  shortcut.state.transcript.length,
  start.transcript.length + 1,
  'one transcript line per shortcut',
)
assert.match(shortcut.line, /Motel Front Office, Second-Floor Balcony/)
assert.equal(travelRoute(start, 'odette-room').changed, false)
assert.equal(
  JSON.stringify(start),
  JSON.stringify(newCase(7)),
  'planning never mutates the case',
)

const opened: CaseState = { ...newCase(7), flags: ['crime-room-access'] }
const toCrime = travelRoute(opened, 'odette-room')
assert.equal(toCrime.state.room, 'odette-room')
assert.ok(
  toCrime.state.evidence.includes('double-murder'),
  'arrival effects fire on a shortcut exactly as on foot',
)

const general = (state: CaseState, room: RoomId) =>
  travelForAudience(state, room, 'general')
const generalLead: CaseState = { ...newCase(7), flags: ['city-lead'] }
for (const room of shortcutRooms(generalLead, general))
  assert.ok(
    roomForAudience(room, 'general').hotspots.length > 0,
    `general shortcut ${room} is a general-edition room`,
  )
const generalTrip = travelRoute(generalLead, 'convention-center', general)
assert.equal(generalTrip.changed, true, generalTrip.line)
assert.ok(
  generalTrip.line.endsWith(
    roomForAudience('convention-center', 'general').caption,
  ),
  'general shortcuts end on the general caption',
)

const smearless: CaseState = {
  ...newCase(3),
  inventory: ['camera', 'odette-purse'],
}
const tooSoon = performAction(smearless, {
  verb: 'combine',
  item: 'camera',
  target: 'odette-purse',
})
assert.equal(tooSoon.changed, false, 'one sample is not a comparison')
assert.match(tooSoon.line, /second sample/)
const smeared: CaseState = {
  ...smearless,
  evidence: ['makeup-smear'],
}
const comparisons: Array<[string, string]> = [
  ['camera', 'odette-purse'],
  ['odette-purse', 'camera'],
]
for (const [item, target] of comparisons) {
  const compared = performAction(smeared, { verb: 'combine', item, target })
  assert.equal(compared.changed, true, compared.line)
  assert.ok(compared.state.evidence.includes('compact-shade'))
  assert.equal(
    caseScore(compared.state),
    caseScore(smeared),
    'the optional comparison is unscored, so 205 stays the maximum',
  )
  assert.equal(
    performAction(compared.state, { verb: 'combine', item, target }).changed,
    false,
  )
}
const generalCompare = actionForAudience(
  smeared,
  { verb: 'combine', item: 'odette-purse', target: 'camera' },
  'general',
)
assert.ok(generalCompare.state.evidence.includes('compact-shade'))
assert.doesNotMatch(generalCompare.line, /Draculina|Marta/)
assert.equal(
  performAction(
    { ...smeared, actor: 'nico' },
    { verb: 'combine', item: 'camera', target: 'odette-purse' },
  ).changed,
  false,
  'Norb never handles the purse',
)
assert.equal(maxScore('mature'), 205)
assert.ok(EVIDENCE['compact-shade'])

const stranded = restoreCase({ ...newCase(5), room: 'odette-room' })
assert.equal(stranded?.room, 'balcony', 'a save never skips the 205 seal')
assert.equal(
  restoreCase({ ...newCase(5), room: 'convention-center' })?.room,
  'motel-exterior',
)
const legit = restoreCase({
  ...newCase(5),
  room: 'odette-room',
  flags: ['crime-room-access'],
})
assert.equal(legit?.room, 'odette-room')
const messy = restoreCase({
  ...newCase(5),
  inventory: ['plastic-fangs', 'plastic-fangs', 'flamethrower'],
  evidence: ['knife-photo', 'knife-photo', 'retired-clue'],
  topics: ['shrine', 'shrine', 'not-a-topic'],
  flags: ['fangs-lost', 'fangs-lost'],
  transcript: [],
})
assert.ok(messy)
assert.deepEqual(messy.inventory, ['camera', 'plastic-fangs'])
assert.deepEqual(messy.evidence, ['knife-photo'])
assert.deepEqual(messy.topics, ['shrine'])
assert.deepEqual(messy.flags, ['fangs-lost'])
assert.equal(messy.transcript.length, 1, 'an empty transcript gets its opener')
const clean = newCase(5)
assert.deepEqual(restoreCase(JSON.parse(JSON.stringify(clean))), clean)

console.log('Monstrique navigation, shortcuts, compact clue and reload: OK')
