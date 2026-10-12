import assert from 'node:assert/strict'
import {
  advanceClock,
  availableFollowers,
  availableHorde,
  createCampaign,
  dayAt,
  dispatchFollowers,
  neglectIncident,
  previewDispatch,
  timeAt,
} from '../emperorOfDust/engine'
import type { Choice, Follower, Incident } from '../emperorOfDust/types'

const followers: Follower[] = [
  {
    id: 'F001',
    name: 'Rook',
    stats: { might: 5, diplomacy: 2, ingenuity: 4 },
    specialties: ['tracking'],
  },
  {
    id: 'F002',
    name: 'Saffron',
    stats: { might: 3, diplomacy: 1, ingenuity: 5 },
    specialties: ['mechanics'],
  },
  {
    id: 'F003',
    name: 'Wisp',
    stats: { might: 0, diplomacy: 0, ingenuity: 0 },
    specialties: ['medicine'],
  },
]

const sure: Choice = {
  id: 'stand-ground',
  label: 'Secure the causeway',
  approach: 'might',
  difficulty: 1,
  specialty: 'tracking',
  moralEffect: { popularity: -4 },
  success: { prosperity: 6 },
  failure: { prosperity: -3 },
}

const impossible: Choice = {
  id: 'alone',
  label: 'Investigate alone',
  approach: 'diplomacy',
  difficulty: 12,
  moralEffect: { popularity: 3 },
  success: { prosperity: 5 },
  failure: { prosperity: -2, horde: -4 },
  injuryDaysOnFailure: 2,
}

const incident = (
  id: string,
  choice: Choice,
  overrides: Partial<Incident> = {},
): Incident => ({
  id,
  day: 1,
  title: 'Roadside trouble',
  destinationId: 'hollow-bell',
  opensAtHour: 7,
  deadlineHour: 18,
  outwardHours: 3,
  missionHours: 2,
  hordeMinimum: 0,
  hordeMaximum: 20,
  choices: [choice],
  neglected: { popularity: -2 },
  ...overrides,
})

const first = incident('first', sure)
const second = incident('second', impossible, { outwardHours: 5 })
const initial = createCampaign(4242, followers, 60)
assert.equal(dayAt(initial.hour), 1)
assert.equal(timeAt(2, 0), 24)
assert.equal(availableHorde(initial), 60)
assert.equal(availableFollowers(initial).length, 3)

const odds = previewDispatch(initial, first, ['F001'], 20, 'stand-ground')
assert.equal(odds.probability, 1)
assert.equal(odds.projectedReturnHour, 15)
assert.equal(odds.denominator, 36)
assert.equal(odds.numerator, 36)

const sent = dispatchFollowers(initial, first, ['F001'], 20, 'stand-ground')
assert.equal(initial.dispatches.length, 0, 'dispatch does not mutate input')
assert.equal(availableHorde(sent), 40)
assert.equal(availableFollowers(sent).length, 2)
assert.equal(sent.dispatches[0]?.arrivesAt, 10)
assert.equal(sent.dispatches[0]?.resolvesAt, 12)
assert.equal(sent.dispatches[0]?.returnsAt, 15)
assert.throws(
  () => dispatchFollowers(sent, first, ['F001'], 1, 'stand-ground'),
  /already answered/,
)
assert.throws(
  () =>
    dispatchFollowers(
      sent,
      incident('third', sure),
      ['F001'],
      1,
      'stand-ground',
    ),
  /unavailable/,
)
assert.throws(
  () =>
    dispatchFollowers(
      sent,
      incident('third', sure),
      ['F002', 'F002'],
      0,
      'stand-ground',
    ),
  /distinct/,
)

const inFlight = advanceClock(sent, 12)
assert.equal(inFlight.dispatches[0]?.outcome?.success, true)
assert.equal(inFlight.prosperity, 51)
assert.equal(inFlight.popularity, 51, 'moral effect applies on success')
assert.equal(availableHorde(inFlight), 40, 'troops stay busy until they return')
assert.equal(availableFollowers(inFlight).length, 2)
const home = advanceClock(inFlight, 15)
assert.equal(home.horde, 60)
assert.equal(availableHorde(home), 60)
assert.equal(availableFollowers(home).length, 3)
assert.equal(home.log.filter((event) => event.type === 'resolved').length, 1)
assert.equal(home.log.filter((event) => event.type === 'returned').length, 1)
assert.equal(advanceClock(sent, 15).log.length, home.log.length)
assert.deepEqual(
  advanceClock(sent, 15),
  home,
  'step-wise and full advance replay match',
)

const sentWisp = dispatchFollowers(initial, second, ['F003'], 10, 'alone')
const resolved = advanceClock(sentWisp, 14)
assert.equal(resolved.dispatches[0]?.outcome?.success, false)
assert.equal(resolved.dispatches[0]?.outcome?.lostHorde, 4)
assert.equal(resolved.horde, 56)
assert.equal(resolved.prosperity, 43)
assert.equal(
  resolved.popularity,
  58,
  'moral choice independent of skill failure',
)
assert.equal(resolved.followers[2]?.injuredUntilDay, 4)
assert.equal(
  resolved.followers[2]?.dead,
  undefined,
  'failure cannot randomly kill',
)
assert.equal(availableHorde(resolved), 50, 'survivors are still returning')
const afterReturn = advanceClock(resolved, 19)
assert.equal(availableHorde(afterReturn), 56)
assert.deepEqual(
  availableFollowers(afterReturn).map((follower) => follower.id),
  ['F001', 'F002'],
)
assert.equal(availableFollowers(advanceClock(afterReturn, 72)).length, 3)
assert.equal(advanceClock(afterReturn, 48).followers[2]?.injuredUntilDay, 4)
assert.deepEqual(
  advanceClock(sentWisp, 19).dispatches[0]?.outcome,
  advanceClock(sentWisp, 19).dispatches[0]?.outcome,
)

const twoMissions = dispatchFollowers(sent, second, ['F003'], 10, 'alone')
assert.equal(availableHorde(twoMissions), 30)
assert.throws(
  () =>
    dispatchFollowers(
      twoMissions,
      incident('fourth', sure),
      ['F002'],
      31,
      'stand-ground',
    ),
  /Horde contingent unavailable or outside mission limits/,
)
const ignored = neglectIncident(initial, incident('unused', impossible))
assert.equal(ignored.popularity, 53)
assert.equal(ignored.ignoredIncidentIds.length, 1)
assert.equal(ignored.dispatches.length, 0)
assert.throws(
  () => neglectIncident(ignored, incident('unused', impossible)),
  /already answered/,
)

assert.throws(
  () => previewDispatch(initial, first, ['missing'], 1, 'stand-ground'),
  /unavailable/,
)
assert.throws(
  () =>
    previewDispatch(
      initial,
      incident('late', sure, { outwardHours: 6 }),
      ['F001'],
      1,
      'stand-ground',
    ),
  /invalid incident/,
)
assert.throws(
  () =>
    dispatchFollowers(
      advanceClock(initial, 17),
      first,
      ['F001'],
      1,
      'stand-ground',
    ),
  /cannot reach incident/,
)
assert.throws(() => advanceClock(initial, 6), /rewind/)
assert.throws(
  () => createCampaign(1, [followers[0]!, followers[0]!]),
  /duplicate/,
)
console.log('Emperor of Dust timed dispatch tests passed')
