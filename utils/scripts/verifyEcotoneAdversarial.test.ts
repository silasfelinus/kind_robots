import assert from 'node:assert/strict'
import {
  ARCHETYPES,
  ENCOUNTERS,
  ENDING_IDS,
  type EventId,
  type LensId,
} from '../ecotone/content'
import {
  advance,
  chooseBeat,
  chooseCrossroads,
  chooseEvent,
  chooseFork,
  computeEnding,
  createRun,
  findCard,
  restoreRun,
  rollDice,
  type RunState,
} from '../ecotone/engine'
import { BEATS, EVENTS } from '../ecotone/story'
import { openingLensChoices } from '../ecotone/openingLensChoices'
import {
  allConceptArtPitches,
  eventArtPitches,
} from '../ecotone/conceptArtPitches'
import {
  cardArtKey,
  ecotoneArtSlots,
  eventArtKey,
  outcomeArtKey,
} from '../ecotone/artSlots'
import { REGIONAL_CALLBACKS } from '../ecotone/regionalCallbacks'
import { earnedQuestCallbacks } from '../ecotone/finaleExpansion'

const artPitches = allConceptArtPitches()
const byArtKey = new Map(artPitches.map((pitch) => [pitch.key, pitch]))
assert.equal(byArtKey.size, artPitches.length, 'art keys must be unique')
assert.equal(eventArtPitches().length, EVENTS.length)
const artSlots = ecotoneArtSlots()
assert.deepEqual(
  new Set(artSlots.events),
  new Set(EVENTS.map((event) => eventArtKey(event.id))),
  'each opening destination has a distinct picture slot',
)
for (const event of EVENTS) {
  const pitch = byArtKey.get(eventArtKey(event.id))
  assert.ok(pitch, event.id + ' needs an illustrated event-choice result')
  assert.ok(pitch.sourceConditions.includes('chosen-event:' + event.id))
  assert.ok(pitch.visibleEvidence.includes(event.blurb))
  assert.ok(pitch.mustNotImply.length >= 2)
}

const diceSeed = (face: number): number => {
  for (let seed = 0; seed < 10000; seed++) {
    const [a, b] = rollDice(seed, 0)
    if (a === face && b === face) return seed
  }
  throw new Error('Cannot force an extreme 2d6 roll')
}

const snakeEyes = diceSeed(1)
const boxcars = diceSeed(6)
const allCards = [...BEATS, ...ENCOUNTERS]
let branchesChecked = 0
let failedRollsChecked = 0
const effectParity: string[] = []

for (const card of allCards) {
  const cardPitch = byArtKey.get(cardArtKey(card.id))
  assert.ok(cardPitch, card.id + ' has an opening picture brief')
  assert.ok(cardPitch.sourceConditions.includes('seen:' + card.id))
  const choices = openingLensChoices(card).filter((choice) => !choice.locked)
  const ids = choices.map((choice) => choice.id)
  assert.equal(
    new Set(ids).size,
    ids.length,
    card.id + ' has unique choice IDs',
  )
  for (const choice of choices) {
    const successKey = outcomeArtKey(card.id, choice.id, 'success')
    const successPitch = byArtKey.get(successKey)
    assert.ok(successPitch, card.id + '/' + choice.id + ' success needs art')
    assert.equal(successPitch.action, choice.success.text)
    assert.ok(successPitch.sourceConditions.includes('result:success'))
    assert.ok(
      successPitch.sourceConditions.includes(
        'chosen:' + card.id + ':' + choice.id,
      ),
    )
    const base: RunState = {
      ...createRun(boxcars, 'reporter'),
      phase: 'beat',
      event: card.event ?? 'green-ribbon',
      card: card.id,
      prospect: 'kit',
      openingState: 'sober',
      currentState: 'sober',
    }
    const passed = chooseBeat(base, choice.id)
    const win = passed.pending?.entry
    assert.ok(win, card.id + '/' + choice.id + ' must resolve')
    assert.equal(win.art, successKey, 'success has the correct result picture')
    assert.equal(win.roll?.success ?? true, true)
    assert.ok(
      win.text.trim().length > 12,
      'success reads as a scene, not a verdict',
    )
    branchesChecked++
    if (!choice.check) continue

    assert.ok(choice.failure, card.id + '/' + choice.id + ' lacks failed prose')
    const failKey = outcomeArtKey(card.id, choice.id, 'failure')
    const failPitch = byArtKey.get(failKey)
    assert.ok(failPitch, card.id + '/' + choice.id + ' failure needs art')
    assert.ok(artSlots.outcomes.includes(failKey))
    assert.equal(failPitch.action, choice.failure.text)
    assert.ok(failPitch.sourceConditions.includes('result:failure'))
    assert.ok(
      failPitch.sourceConditions.includes(
        'chosen:' + card.id + ':' + choice.id,
      ),
    )
    assert.notEqual(
      choice.failure.text.trim(),
      choice.success.text.trim(),
      card.id + '/' + choice.id + ' failure cannot be the win text',
    )
    const failed = chooseBeat(
      {
        ...base,
        seed: snakeEyes,
      },
      choice.id,
    )
    const loss = failed.pending?.entry
    assert.ok(loss?.roll && !loss.roll.success, 'snake eyes must really fail')
    assert.equal(loss.art, failKey)
    assert.ok(loss.text.trim().length > 12, 'failure needs its own scene')
    if (
      JSON.stringify(choice.success.effects) ===
      JSON.stringify(choice.failure.effects)
    ) {
      effectParity.push(card.id + '/' + choice.id)
    }
    failedRollsChecked++
    branchesChecked++
  }
}

type Persona = {
  event: EventId
  lens: LensId
  area: number
  accept: boolean
  follow: boolean
  strategy: number
  archetype: string
  seed: number
}

function playPersona(plan: Persona): RunState {
  let state = advance(
    chooseEvent(createRun(plan.seed, plan.archetype), plan.event),
  )
  let turns = 0
  while (state.phase !== 'end') {
    assert.ok(++turns < 100, 'no stalled journey: ' + JSON.stringify(plan))
    if (state.phase === 'fork') {
      assert.ok(state.offered.length >= 2)
      assert.equal(new Set(state.offered).size, state.offered.length)
      const pick = (plan.seed + plan.strategy + turns) % state.offered.length
      state = chooseFork(state, state.offered[pick]!)
      continue
    }
    if (state.phase === 'crossroads') {
      state = advance(chooseCrossroads(state, plan.follow))
      continue
    }
    const card = findCard(state.card)
    assert.ok(card, 'route must resolve an authored beat')
    const areaChoices = card.choices.filter((choice) => choice.prospect)
    const lensChoice = openingLensChoices(card).find(
      (choice) => choice.lens === plan.lens,
    )
    const meetChoice = card.choices.find(
      (choice) => choice.meet === plan.accept,
    )
    const playable = openingLensChoices(card).filter((choice) => !choice.locked)
    const pick = (plan.seed + plan.strategy * 3 + turns) % playable.length
    const choice = areaChoices.length
      ? areaChoices[plan.area % areaChoices.length]
      : (lensChoice ?? meetChoice ?? playable[pick])
    assert.ok(choice && !choice.locked, 'personas cannot take locked options')
    const pending = chooseBeat(state, choice.id)
    assert.ok(pending.pending, 'choice must resolve, never silently do nothing')
    assert.equal(
      pending.pending.entry.art,
      outcomeArtKey(
        card.id,
        choice.id,
        pending.pending.entry.roll?.success === false ? 'failure' : 'success',
      ),
      'each actual result must point to its own art slot',
    )
    state = advance(pending)
  }
  assert.ok(state.ending && ENDING_IDS.includes(state.ending))
  assert.equal(state.ending, computeEnding(state).id)
  assert.equal(state.openingState, plan.lens, 'a lens is remembered, not fate')
  assert.equal(new Set(state.played).size, state.played.length)
  assert.ok(state.log.some((entry) => entry.source === 'EVENT'))
  assert.ok(state.log.some((entry) => entry.source !== 'EVENT'))
  for (const callback of REGIONAL_CALLBACKS) {
    if (!state.flags.includes(callback.flag)) continue
    assert.ok(
      state.log.some(
        (entry) =>
          entry.source === callback.id && entry.effects.flag === callback.flag,
      ),
      'future callback must have an earned source: ' + callback.flag,
    )
  }
  const shownCallbacks = earnedQuestCallbacks(state.flags, state.played)
  assert.ok(shownCallbacks.length <= 2, 'finale displays no more than two echoes')
  for (const text of shownCallbacks) {
    const regional = REGIONAL_CALLBACKS.find((candidate) => candidate.text === text)
    if (!regional) continue
    assert.ok(state.flags.includes(regional.flag))
    assert.ok(state.played.includes(regional.id))
    assert.ok(
      state.log.some(
        (entry) =>
          entry.source === regional.id &&
          entry.effects.flag === regional.flag,
      ),
      'every displayed callback must come from a witnessed choice',
    )
  }
  const restored = restoreRun(JSON.parse(JSON.stringify(state)))
  assert.deepEqual(restored, state, 'adversarial histories survive save/load')
  return state
}

let journeys = 0
let withFailedChecks = 0
let withSuccessfulChecks = 0
const allFates = new Set<string>()
const witnessed = new Set<string>()
for (const event of EVENTS) {
  for (const lens of [
    'sober',
    'tipsy',
    'stoned',
    'tripping_balls',
    'cocaine',
    'meth',
    'mdma',
  ] as LensId[]) {
    for (const archetype of ARCHETYPES) {
      for (const area of [0, 1]) {
        for (const strategy of [0, 1, 2, 3, 4, 5]) {
          const seed = 119 + journeys * 17
          const plan: Persona = {
            event: event.id,
            lens,
            archetype: archetype.id,
            area,
            strategy,
            seed,
            accept: strategy % 3 !== 0,
            follow: strategy % 3 === 2,
          }
          const state = playPersona(plan)
          if (journeys % 17 === 0) {
            assert.deepEqual(
              state,
              playPersona(plan),
              'same player decisions and seed are deterministic',
            )
          }
          journeys++
          const rolls = state.log.flatMap((entry) =>
            entry.roll ? [entry.roll] : [],
          )
          withFailedChecks += rolls.filter((roll) => !roll.success).length
          withSuccessfulChecks += rolls.filter((roll) => roll.success).length
          allFates.add(state.ending!.split('.').at(-1)!)
          witnessed.add(event.id + ':' + lens)
        }
      }
    }
  }
}
assert.equal(witnessed.size, EVENTS.length * 7)
assert.deepEqual(allFates, new Set(['hope', 'dark']))
assert.ok(withFailedChecks > 0 && withSuccessfulChecks > 0)
assert.ok(journeys >= 1000)
console.log(
  'Ecotone adversarial QA: ' +
    journeys +
    ' completed seeded player journeys; ' +
    branchesChecked +
    ' tested result branches (' +
    failedRollsChecked +
    ' forced failures); ' +
    withSuccessfulChecks +
    ' actual successful rolls and ' +
    withFailedChecks +
    ' actual failed rolls; ' +
    artPitches.length +
    ' unique art briefs.',
)
if (effectParity.length)
  console.log(
    'Editorial follow-up: ' +
      effectParity.length +
      ' checks share an effects signature between win/loss: ' +
      effectParity.slice(0, 25).join(', '),
  )
