import assert from 'node:assert/strict'
import { ACT_ONE_CHOICES } from '../emperorOfDust/fortress/dailyEventsActOne'
import {
  CHANCE_EVENTS,
  chanceEvent,
} from '../emperorOfDust/fortress/dailyEvents'
import {
  chooseChanceEvent,
  chooseAudienceOption,
  audiencesToday,
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
import { COURT_RECRUITMENT_IDS } from '../emperorOfDust/fortress/onboarding'
import {
  decodeBook,
  encodeBook,
  newBook,
} from '../emperorOfDust/fortress/saves'

assert.equal(
  CHANCE_EVENTS.length,
  135,
  '26 scenarios in each act plus five special visitors',
)
assert.equal(new Set(CHANCE_EVENTS.map((entry) => entry.id)).size, 135)
assert.equal(Object.keys(ACT_ONE_CHOICES).length, 26)
const actOneScenes = CHANCE_EVENTS.filter(
  (entry) => entry.act === 1 && !entry.secretFollower,
)
assert.equal(actOneScenes.length, 26)
const choiceLabels = new Set<string>()
for (const scene of actOneScenes) {
  assert.equal(scene.choices.length, 2, scene.id)
  for (const option of scene.choices) {
    assert.ok(
      option.response.length > 100,
      `${scene.id} needs a specific aftermath`,
    )
    assert.ok(
      (option.effects.flags ?? []).some((f) => f.startsWith('eod-')),
      `${scene.id} needs a remembered decision`,
    )
    assert.ok(
      !choiceLabels.has(option.label),
      `${scene.id} repeats a previous option`,
    )
    choiceLabels.add(option.label)
  }
  assert.ok(
    scene.choices[1]?.effects.flags?.includes(`chance:${scene.series}:1`),
    `${scene.id}: later-act callbacks remain available`,
  )
  assert.notDeepEqual(
    scene.choices[0]?.effects,
    scene.choices[1]?.effects,
    scene.id,
  )
}
assert.equal(
  choiceLabels.size,
  52,
  'two uniquely authored decisions per Act I chance event',
)

for (const act of [1, 2, 3, 4, 5]) {
  const events = CHANCE_EVENTS.filter((entry) => entry.act === act)
  assert.equal(
    events.length,
    27,
    `Act ${act}: 26 surprises plus a hidden recruit`,
  )
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

// First Bell belongs to recruitment rather than an unrelated random visitor.
// The fifty-day event draw starts on Day 2, with save and reload intact.
const welcomeCourt = (run: ReturnType<typeof createRun>) => {
  let next = run
  for (const audience of audiencesToday(run)) {
    if (!COURT_RECRUITMENT_IDS.includes(audience.id)) continue
    next = chooseAudienceOption(next, audience.id, audience.options[0]!.id).run
  }
  return next
}
const fresh = createRun(20261021)
assert.equal(fresh.dailyEvent, undefined, 'Day 1 is reserved for recruiting')
assert.deepEqual(
  decodeBook(encodeBook(newBook(fresh)))?.current,
  fresh,
  'the empty starting roster survives a browser save',
)
const day2 = finishDay(welcomeCourt(fresh)).run
assert.ok(day2.dailyEvent, 'chance events begin after First Bell')
const chosen = chooseChanceEvent(
  day2,
  day2.dailyEvent!,
  chanceEvent(day2.dailyEvent!)!.choices[0]!.id,
)
assert.equal(chosen.run.dailyEvent, undefined)
assert.equal(chosen.run.dailyEventOutcome?.day, 2)
assert.throws(
  () => chooseChanceEvent(chosen.run, day2.dailyEvent!, 'collect'),
  /no longer at court/,
)

const wounded = createRun(2077)
wounded.roster = [
  { id: 'F001', joinedDay: 1, equipment: {}, injuredUntilDay: 5 },
  { id: 'F003', joinedDay: 1, equipment: {} },
]
assert.equal(followerStatus(wounded, 'F003'), 'ready')
const fee = treatmentPrice(wounded, 'F001', 'infirmary')
assert.ok(fee < wounded.brass)
assert.equal(treatmentBlocker(wounded, 'F001', 'infirmary'), null)
const recovered = treatFollower(wounded, 'F001', 'infirmary')
assert.equal(recovered.healed, 4)
assert.equal(injuryDaysLeft(recovered.run, 'F001'), 0)
assert.equal(recovered.run.brass, wounded.brass - fee)
assert.match(
  treatmentBlocker(recovered.run, 'F001', 'infirmary') ?? '',
  /Only the wounded/,
)
const withoutKiyo = {
  ...wounded,
  roster: wounded.roster.map((state) =>
    state.id === 'F003' ? { ...state, injuredUntilDay: 5 } : state,
  ),
}
assert.match(treatmentBlocker(withoutKiyo, 'F001', 'infirmary') ?? '', /Kiyo/)

for (const seed of [1, 9, 47, 113, 1204, 23018]) {
  let run = welcomeCourt(createRun(seed))
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
  assert.equal(seen.size, 49, `seed ${seed}: one surprise after each First Bell`)
  assert.equal(
    offers.size,
    5,
    `seed ${seed}: every hidden traveler has a chance to ask`,
  )
  assert.equal(run.chanceHistory?.length, 49)
}
console.log(
  'Emperor of Dust: 135 chance scenes, five hidden recruits, healing and replay checks passed.',
)
