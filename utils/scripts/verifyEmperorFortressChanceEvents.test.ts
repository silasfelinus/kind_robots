import assert from 'node:assert/strict'
import {
  CHANCE_EVENTS,
  chanceEvent,
} from '../emperorOfDust/fortress/dailyEvents'
import {
  chooseChanceEvent,
  createRun,
  finishDay,
  followerStatus,
  injuryDaysLeft,
} from '../emperorOfDust/fortress/engine'
import {
  treatmentBlocker,
  treatmentPrice,
  treatFollower,
} from '../emperorOfDust/fortress/market'
import { FOLLOWERS } from '../emperorOfDust/fortress/followers'
import { decodeBook, encodeBook, newBook } from '../emperorOfDust/fortress/saves'

assert.equal(CHANCE_EVENTS.length, 135, '26 scenarios in each act plus five special visitors')
assert.equal(new Set(CHANCE_EVENTS.map((entry) => entry.id)).size, 135)
for (const act of [1, 2, 3, 4, 5]) {
  const events = CHANCE_EVENTS.filter((entry) => entry.act === act)
  assert.equal(events.length, 27, `Act ${act}: 26 surprises plus a hidden recruit`)
  assert.equal(events.filter((entry) => !!entry.secretFollower).length, 1)
  for (const event of events) {
    assert.ok(event.text.length > 70, event.id)
    assert.equal(event.choices.length, 2, event.id)
    for (const choice of event.choices) {
      assert.ok(choice.label.length > 12, event.id)
      assert.ok(choice.response.length > 20, event.id)
    }
  }
}
const ids = new Set(FOLLOWERS.map((follower) => follower.id))
for (const offer of CHANCE_EVENTS.filter((entry) => entry.secretFollower))
  assert.ok(ids.has(offer.secretFollower!), offer.id)

const fresh = createRun(20261021)
assert.ok(fresh.dailyEvent, 'a new reign begins with an unexpected dispatch')
assert.deepEqual(
  decodeBook(encodeBook(newBook(fresh)))?.current,
  fresh,
  'the day-one chance event survives a browser save',
)
const chosen = chooseChanceEvent(fresh, fresh.dailyEvent!, chanceEvent(fresh.dailyEvent!)!.choices[0]!.id)
assert.equal(chosen.run.dailyEvent, undefined)
assert.equal(chosen.run.dailyEventOutcome?.day, 1)
assert.throws(() =>
  chooseChanceEvent(chosen.run, fresh.dailyEvent!, 'collect'),
  /no longer at court/,
)

const wounded = createRun(2077)
wounded.roster = wounded.roster.map((state) =>
  state.id === 'F001' ? { ...state, injuredUntilDay: 5 } : state,
)
assert.equal(followerStatus(wounded, 'F003'), 'ready')
const fee = treatmentPrice(wounded, 'F001', 'infirmary')
assert.ok(fee < wounded.brass)
assert.equal(treatmentBlocker(wounded, 'F001', 'infirmary'), null)
const recovered = treatFollower(wounded, 'F001', 'infirmary')
assert.equal(recovered.healed, 4)
assert.equal(injuryDaysLeft(recovered.run, 'F001'), 0)
assert.equal(recovered.run.brass, wounded.brass - fee)
assert.match(treatmentBlocker(recovered.run, 'F001', 'infirmary') ?? '', /Only the wounded/)
const withoutKiyo = {
  ...wounded,
  roster: wounded.roster.map((state) =>
    state.id === 'F003' ? { ...state, injuredUntilDay: 5 } : state,
  ),
}
assert.match(treatmentBlocker(withoutKiyo, 'F001', 'infirmary') ?? '', /Kiyo/)

for (const seed of [1, 9, 47, 113, 1204, 23018]) {
  let run = createRun(seed)
  const seen = new Set<string>()
  const offers = new Set<string>()
  while (run.day <= 50) {
    if (run.dailyEvent) {
      assert.ok(!seen.has(run.dailyEvent), `seed ${seed}: event repeated`)
      assert.ok(chanceEvent(run.dailyEvent))
      seen.add(run.dailyEvent)
      if (run.dailyEvent.startsWith('secret-')) offers.add(run.dailyEvent)
      // Accept or pass up a recruitment without forcing it into the roster.
      const event = chanceEvent(run.dailyEvent)!
      const option = event.secretFollower ? 'welcome' : 'care'
      const decision = chooseChanceEvent(run, event.id, option)
      run = decision.run
      assert.equal(run.dailyEvent, undefined)
    }
    if (run.day === 50) break
    const next = finishDay(run).run
    assert.equal(next.day, run.day + 1)
    run = next
  }
  assert.equal(seen.size, 50, `seed ${seed}: one surprise per day`)
  assert.equal(offers.size, 5, `seed ${seed}: every hidden traveler has a chance to ask`)
  assert.equal(run.chanceHistory?.length, 50)
}
console.log('Emperor of Dust: 135 chance scenes, five hidden recruits, healing and replay checks passed.')
