import assert from 'node:assert/strict'
import {
  JOURNEY_WORLD,
  confrontJourneyBoss,
  isJourneyState,
  newJourney,
  reachableLocations,
  replayJourney,
  resolveJourney,
  restoreJourney,
  stepJourney,
  travelJourney,
  type JourneyAction,
  type JourneyState,
} from '../shiftingLands/journey'

assert.equal(JOURNEY_WORLD.schemaVersion, 2)
assert.equal(JOURNEY_WORLD.lands.length, 5)
assert.equal(JOURNEY_WORLD.lands.flatMap((land) => land.locations).length, 15)
assert.equal(new Set(JOURNEY_WORLD.lands.flatMap((land) => land.locations.map((loc) => loc.id))).size, 15)
assert.equal(JOURNEY_WORLD.source.blobSha.length, 40)
assert.doesNotMatch(JSON.stringify(JOURNEY_WORLD).toLowerCase(), /canon_motivation|world_mysteries|cosmic horror|sacrifice/)

function act(state: JourneyState, command: JourneyAction) {
  const next = stepJourney(state, command)
  assert.notEqual(next, state, 'expected a legal transition: ' + command.type)
  assert.equal(isJourneyState(JSON.parse(JSON.stringify(next))), true, 'round-trip state remains valid')
  return next
}

const start = newJourney(20261009)
assert.deepEqual(start, newJourney(20261009))
assert.equal(start.phase, 'explore')
assert.equal(start.hp, 8)
assert.equal(start.provisions, 2)
assert.equal(isJourneyState(start), true)
assert.deepEqual(reachableLocations(start), start.layouts.homestead?.slice(0, 2))
assert.equal(travelJourney(start, 'not-a-real-tile'), start)
assert.equal(resolveJourney(start, 'test'), start)
assert.equal(confrontJourneyBoss(start, 'challenge'), start)

const chosen = reachableLocations(start)[0]!
const during = act(start, { type: 'TRAVEL', locationId: chosen })
assert.equal(during.active, chosen)
assert.equal(travelJourney(during, reachableLocations(start)[1]!), during)
const landed = act(during, { type: 'RESOLVE', approach: 'test' })
assert.equal(landed.active, null)
assert.equal(landed.resolved.length, 1)
assert.ok(landed.lastRoll?.dice.every((die) => die >= 1 && die <= 6))
assert.equal(landed.lastRoll?.total,
  landed.lastRoll!.dice[0] + landed.lastRoll!.dice[1] + landed.lastRoll!.modifier)
assert.deepEqual(
  resolveJourney(JSON.parse(JSON.stringify(during)), 'test'),
  resolveJourney(during, 'test'),
  'a refresh cannot reroll the same deterministic encounter',
)
assert.equal(isJourneyState({ ...landed, lastRoll: { ...landed.lastRoll, dice: [8, 0] } }), false)
assert.equal(isJourneyState({ ...landed, resolved: [landed.resolved[0], landed.resolved[0]] }), false)
assert.equal(isJourneyState({ ...landed, manifestBlobSha: 'obsolete' }), false)
assert.equal(restoreJourney({ ...landed, layouts: { homestead: ['fake', 'fake', 'fake'] } }), null)

let reopened = travelJourney(landed, chosen)
assert.equal(reopened.active, null, 'revisits never recreate an encounter')
assert.equal(resolveJourney(reopened, 'test'), reopened, 'revisits never farm rewards')

const expected = [start.layouts.homestead, start.layouts.dustwater,
  start.layouts.tablelands, start.layouts.cave, start.layouts.verge]
assert.ok(expected.every((ids) => ids?.length === 3 && new Set(ids).size === 3))
let shifted = false
for (let seed = 1; seed <= 100; seed++) {
  const fresh = newJourney(seed)
  const tile = reachableLocations(fresh)[0]!
  const before = fresh.layouts.homestead!
  const next = resolveJourney(travelJourney(fresh, tile), 'test')
  if (!next.shifts.length) continue
  const change = next.shifts[0]!
  assert.deepEqual(change.before, before)
  assert.deepEqual(change.after, next.layouts.homestead)
  assert.equal(change.after.indexOf(tile), change.before.indexOf(tile),
    'resolved location cannot move after the traveler visited it')
  assert.ok(change.reason.length > 12)
  assert.ok(next.journal.some((item) => item.kind === 'shift' && item.text === change.reason))
  shifted = true
  break
}
assert.equal(shifted, true, 'some reproducible seeds cause visible land mutations')

const commands: JourneyAction[] = []
let endState: JourneyState | null = null
let victoriousRuns = 0
for (let seed = 1; seed <= 600; seed++) {
  let s = newJourney(seed)
  const history: JourneyAction[] = []
  for (let turn = 0; turn < 100 && !['complete', 'fallen', 'retired'].includes(s.phase); turn++) {
    if (s.phase === 'boss') {
      const command: JourneyAction = { type: 'BOSS', approach: 'challenge' }
      s = stepJourney(s, command)
      history.push(command)
    } else if (s.active) {
      const command: JourneyAction = { type: 'RESOLVE', approach: 'test' }
      s = stepJourney(s, command)
      history.push(command)
    } else {
      const candidates = reachableLocations(s)
      const next = candidates.find((id) => !s.resolved.some((r) => r.locationId === id)) ??
        candidates[0]
      assert.ok(next, 'a live journey must always have a legal map step')
      const command: JourneyAction = { type: 'TRAVEL', locationId: next }
      s = stepJourney(s, command)
      history.push(command)
    }
    assert.ok(isJourneyState(s), 'all transitions preserve a valid state')
  }
  if (s.phase !== 'complete') continue
  victoriousRuns++
  if (!endState) {
    endState = s
    commands.push(...history)
  }
  assert.equal(s.bosses.length, 5)
  assert.equal(s.resolved.length, 15)
  assert.deepEqual(s.bosses.map((boss) => boss.landId),
    JOURNEY_WORLD.lands.map((land) => land.id))
  assert.equal(s.hp > 0, true)
  assert.deepEqual(replayJourney(seed, history), s,
    'complete run must replay deterministically from the seed and recorded commands')
}
assert.ok(endState, 'at least one seeded complete five-land run must exist')
assert.ok(victoriousRuns >= 15, 'random travel and combat should not make a complete run vanishingly rare')
assert.equal(stepJourney(endState!, { type: 'TRAVEL', locationId: chosen }), endState,
  'winning runs are terminal')

let retirement = newJourney(33)
while (retirement.phase === 'explore') {
  const candidate = reachableLocations(retirement).find((id) =>
    !retirement.resolved.some((r) => r.locationId === id))!
  retirement = act(retirement, { type: 'TRAVEL', locationId: candidate })
  retirement = act(retirement, { type: 'RESOLVE', approach: 'withdraw' })
}
assert.equal(retirement.phase, 'boss')
assert.equal(retirement.resolved.length, 3)
const retired = act(retirement, { type: 'BOSS', approach: 'retreat' })
assert.equal(retired.phase, 'retired')
assert.equal(stepJourney(retired, { type: 'BOSS', approach: 'challenge' }), retired)
assert.throws(() => replayJourney(99, [{ type: 'BOSS', approach: 'challenge' }]), /Illegal journey action/)

console.log('Shifting Lands journey contract passed: five lands, 15 encounters, boss gates, replay, map shifts, terminal states and corruption rejection')
