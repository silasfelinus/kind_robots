import assert from 'node:assert/strict'
import { advanceClock, availableFollowers, dayAt, dispatchFollowers } from '../emperorOfDust/engine'
import { FOLLOWER_POOL } from '../emperorOfDust/followers'
import {
  earnStoryFlag,
  recruitFollower,
  recruitmentStatus,
  remainingCandidates,
  remainingRecoveryDays,
  scriptedFollowerDeath,
  startEmperorCampaign,
} from '../emperorOfDust/progression'
import {
  decodeEmperorSave,
  encodeEmperorSave,
  isSavedEmperorCampaign,
} from '../emperorOfDust/save'
import type { Incident } from '../emperorOfDust/types'

assert.equal(FOLLOWER_POOL.length, 10, 'first authored pilot, not 100 fabricated characters')
assert.equal(new Set(FOLLOWER_POOL.map((leader) => leader.id)).size, 10)
assert.equal(FOLLOWER_POOL.filter((leader) => leader.starter).length, 5)
assert.ok(FOLLOWER_POOL.every((leader) =>
  Object.keys(leader.art).sort().join(',') === 'injured,portrait,splash' &&
  Object.values(leader.art).every((asset) => asset === null),
), 'three reserved art variants, none yet delivered')

const first = startEmperorCampaign(123456)
assert.equal(first.followers.length, 5)
assert.equal(first.horde, 60)
assert.equal(dayAt(first.hour), 1)
assert.equal(remainingCandidates(first).length, 5)
assert.equal(availableFollowers(first).length, 5)

assert.deepEqual(decodeEmperorSave(encodeEmperorSave(first)), first)
assert.equal(decodeEmperorSave('{bad json'), null)
assert.equal(decodeEmperorSave('{"format":9}'), null)
assert.equal(decodeEmperorSave(JSON.stringify({format:1,campaign:{...first,horde:-10}})), null)
assert.equal(decodeEmperorSave(JSON.stringify({format:1,campaign:{...first,followers:[first.followers[0],first.followers[0]]}})), null)
assert.equal(decodeEmperorSave(JSON.stringify({format:1,campaign:{...first, hour:'today'}})), null)

const nera = recruitmentStatus(first, 'F006')
assert.equal(nera.eligible, false)
assert.match(nera.reason, /Day 11/)
assert.throws(() => recruitFollower(first, 'F006'), /Day 11/)
assert.throws(() => recruitFollower(first, 'F001'), /Not a recruitable/)

const later = advanceClock(first, 240)
assert.equal(dayAt(later.hour), 11)
assert.match(recruitmentStatus(later, 'F006').reason, /Story allegiance/)
const joinedStory = earnStoryFlag(later, 'rain-dispute-heard')
assert.equal(recruitmentStatus(joinedStory, 'F006').eligible, true)
const recruited = recruitFollower(joinedStory, 'F006')
assert.equal(recruited.prosperity, 33)
assert.equal(joinedStory.prosperity, 45, 'recruitment is immutable')
assert.equal(recruited.followers.length, 6)
assert.equal(recruited.followers[5]?.availableOnDay, 12)
assert.equal(availableFollowers(recruited).length, 5)
assert.throws(() => recruitFollower(recruited, 'F006'), /Already enlisted/)
const restored = decodeEmperorSave(encodeEmperorSave(recruited))!
assert.equal(restored.followers.length, 6)
assert.equal(availableFollowers(advanceClock(restored, 264)).length, 6)

const poor = { ...joinedStory, prosperity: 5 }
assert.match(recruitmentStatus(poor, 'F006').reason, /Insufficient/)
assert.throws(() => recruitFollower(poor, 'F006'), /Insufficient/)
assert.throws(() => earnStoryFlag(first, 'bad flag with spaces'), /Invalid/)

const incident: Incident = {
  id: 'wounds-first',
  day: 1,
  title: 'The flooded culvert',
  destinationId: 'hollow-bell',
  opensAtHour: 7,
  deadlineHour: 20,
  outwardHours: 3,
  missionHours: 2,
  hordeMinimum: 5,
  hordeMaximum: 20,
  neglected: { popularity: -4 },
  choices: [{
    id: 'mercy',
    label: 'Seek a peaceful resolution',
    approach: 'diplomacy',
    difficulty: 12,
    moralEffect: { popularity: 3 },
    success: { prosperity: 2 },
    failure: { prosperity: -2, horde: -2 },
    injuryDaysOnFailure: 3,
  }],
}

const travel = dispatchFollowers(first, incident, ['F003'], 10, 'mercy')
const travelSave = decodeEmperorSave(encodeEmperorSave(travel))!
assert.deepEqual(advanceClock(travelSave, 12), advanceClock(travel, 12))
const completed = advanceClock(travelSave, 19)
assert.equal(completed.dispatches[0]?.outcome?.success, false)
assert.equal(completed.followers[2]?.dead, undefined)
assert.equal(remainingRecoveryDays(completed, completed.followers[2]!), 4)
assert.equal(availableFollowers(completed).length, 4)
const savedWound = decodeEmperorSave(encodeEmperorSave(completed))!
assert.deepEqual(savedWound, completed)
assert.equal(remainingRecoveryDays(savedWound, savedWound.followers[2]!), 4)
const recovered = advanceClock(savedWound, 96)
assert.equal(availableFollowers(recovered).length, 5)
assert.equal(remainingRecoveryDays(recovered, recovered.followers[2]!), 0)

assert.throws(() =>
  scriptedFollowerDeath(first, 'F001', 'terrible-bridge', 'The bridge fell'),
  /Fatal danger must be authored/,
)
const forewarned = earnStoryFlag(first, 'fatal-risk-terrible-bridge')
const memorial = scriptedFollowerDeath(
  forewarned,
  'F001',
  'terrible-bridge',
  'The signposted bridge-collapse sacrifice was chosen',
)
assert.equal(memorial.followers[0]?.dead, true)
assert.equal(memorial.memorials?.length, 1)
assert.equal(availableFollowers(memorial).length, 4)
assert.equal(isSavedEmperorCampaign(memorial), true)
assert.deepEqual(decodeEmperorSave(encodeEmperorSave(memorial)), memorial)
assert.throws(() =>
  scriptedFollowerDeath(memorial, 'F001', 'terrible-bridge', 'The same event repeats'),
  /Fatal danger/,
)
assert.equal(first.followers[0]?.dead, undefined)
console.log('Emperor of Dust recruitment, recovery, death and save contracts passed')
