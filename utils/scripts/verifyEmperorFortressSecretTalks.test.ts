import assert from 'node:assert/strict'
import {
  createRun,
  chooseTalkOption,
  talkFor,
} from '../emperorOfDust/fortress/engine'
import { SECRET_TALKS } from '../emperorOfDust/fortress/secretTalks'
import { EPILOGUE, epilogueFor } from '../emperorOfDust/fortress/epilogue'
import type { FortressRun } from '../emperorOfDust/fortress/types'

assert.equal(
  SECRET_TALKS.length,
  11,
  'five secret wanderers each have follow-up stories',
)
assert.equal(new Set(SECRET_TALKS.map((talk) => talk.id)).size, 11)
const secretIds = ['F021', 'F022', 'F023', 'F024', 'F025']
for (const follower of secretIds) {
  const talks = SECRET_TALKS.filter((entry) => entry.follower === follower)
  assert.ok(talks.length >= 2, `${follower}: a continuing story`)
  assert.ok(
    EPILOGUE.some((entry) => entry.follower === follower),
    `${follower}: a remembered ending`,
  )
}
for (const talk of SECRET_TALKS) {
  assert.ok(secretIds.includes(talk.follower), talk.id)
  assert.ok(talk.lines.length >= 2, talk.id)
  assert.equal(talk.options.length, 2, `${talk.id}: two actual consequences`)
  assert.notDeepEqual(
    talk.options[0]?.effects,
    talk.options[1]?.effects,
    `${talk.id}: real choice`,
  )
  assert.ok(
    talk.options.every(
      (choice) => !!choice.response && !!choice.effects.flags?.length,
    ),
    talk.id,
  )
  assert.ok(talk.fromDay >= 1 && talk.fromDay <= 50, talk.id)
}
const withFollower = (id: string, day: number): FortressRun => {
  const run = createRun(314159)
  run.day = day
  run.roster.push({ id, joinedDay: 1, equipment: {} })
  return run
}

let nettle = withFollower('F021', 8)
assert.equal(talkFor(nettle, 'F021')?.id, 'nettle-1')
nettle = chooseTalkOption(nettle, 'nettle-1', 'treasury').run
assert.ok(nettle.flags.includes('heard:nettle-1'))
assert.ok(nettle.flags.includes('nettle-beds-open'))
nettle.day = 17
nettle = chooseTalkOption(nettle, 'nettle-2', 'make-room').run
assert.ok(nettle.flags.includes('nettle-four-names'))
nettle.day = 44
nettle.flags.push('komodo-betrayal')
nettle = chooseTalkOption(nettle, 'nettle-exile', 'outside').run
assert.ok(nettle.inventory.includes('caravan-salve'))
const nettleFinal = epilogueFor(nettle, 'open-roads').find(
  (entry) => entry.subject.follower === 'F021',
)
assert.ok(nettleFinal?.variant.text.includes('carts carried medicine'))

let odo = withFollower('F025', 45)
odo.flags.push('komodo-betrayal')
assert.equal(talkFor(odo, 'F025')?.id, 'odo-1')
odo = chooseTalkOption(odo, 'odo-1', 'banks').run
assert.ok(odo.flags.includes('odo-held-bank'))
odo.day = 49
odo = chooseTalkOption(odo, 'odo-2', 'warn').run
assert.ok(odo.inventory.includes('storm-glass-vial'))
assert.ok(odo.flags.includes('odo-broke-forecast'))
const odoFinal = epilogueFor(odo, 'open-roads').find(
  (entry) => entry.subject.follower === 'F025',
)
assert.ok(odoFinal?.variant.text.includes('broken rain gauge'))

console.log(
  'Emperor of Dust: eleven hidden-follower conversations, costly decisions, rare artifacts and remembered endings verified.',
)
