import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  DECK_V6,
  DEED_FLAGS,
  V6_CARDS,
  activeV6Card,
  choiceLock,
  newJourneyV6,
  stepJourneyV6,
  v6Pool,
  validateDeckV6,
  type V6Card,
} from '../shiftingLands/deckV6'
import {
  newJourneyLedgerV6,
  restoreJourneyLedgerV6,
  stepJourneyLedgerV6,
  type JourneyLedgerV6,
} from '../shiftingLands/saveLedgerV6'
import { trialForLand, canChooseTrial } from '../shiftingLands/authoredBosses'
import { JOURNEY_WORLD, reachableLocations } from '../shiftingLands/journey'
import { AUTHORED_PACK } from '../shiftingLands/authoredJourney'
import { LATER_LAND_PACK } from '../shiftingLands/authoredFiveLands'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

assert.deepEqual(validateDeckV6(), [], 'V6 deck content contract')
for (const land of JOURNEY_WORLD.lands) {
  const count = land.locations.reduce(
    (sum, location) => sum + v6Pool(location.id).length,
    0,
  )
  assert.equal(count, 24, `${land.id} holds 24 cards, like a Desks floor`)
}
assert.equal(V6_CARDS.length, 120)

const homesteadIds = new Set(JOURNEY_WORLD.lands[0]!.locations.map((p) => p.id))
const homesteadCards = V6_CARDS.filter((card) =>
  homesteadIds.has(card.locationId),
)
assert.equal(homesteadCards.length, 24, 'both Homestead deck generations')
assert.ok(
  homesteadCards.filter((card) => /\b(you|your)\b/i.test(card.flavor))
    .length >= 12,
  'the reader remains directly addressed in the Homestead',
)
for (const card of homesteadCards) {
  for (const choice of card.choices) {
    assert.ok(choice.risk.length >= 20, `${card.id}: risk stays readable`)
    assert.ok(choice.success.text.length >= 40, `${card.id}: success is authored`)
    if (choice.failure)
      assert.ok(choice.failure.text.length >= 40, `${card.id}: failure is authored`)
  }
}
assert.match(
  homesteadCards.find((card) => card.id === 'the-last-seed')!
    .choices.find((choice) => choice.id === 'shield-shoot')!.success.text,
  /food she had saved for planting week/,
  'seed sacrifice has a visible cost rather than an arbitrary treasure find',
)
assert.match(
  LATER_LAND_PACK.encounters.find((card) => card.id === 'three-cups-on-the-table')!
    .flavor,
  /three cups of broth/,
  'the Three Cups prose names its visible, countable props',
)

const choices = V6_CARDS.flatMap((card) => card.choices)
const certainCards = V6_CARDS.filter((card) =>
  card.choices.some((choice) => !choice.roll),
)
const gatedCards = V6_CARDS.filter((card) =>
  card.choices.some((choice) => choice.requires),
)
assert.ok(choices.length / V6_CARDS.length >= 3, 'three or more choices')
assert.ok(certainCards.length >= 48, 'certain sacrifice/refusal routes')
assert.ok(gatedCards.length >= 30, 'routes earned by earlier deeds')
for (const flag of Object.keys(DEED_FLAGS)) {
  assert.ok(
    choices.some((choice) =>
      [choice.success, choice.failure].some((effect) =>
        effect?.add_flags.includes(flag),
      ),
    ),
    `deed flag ${flag} is granted somewhere`,
  )
}

const baseCards = [...AUTHORED_PACK.encounters, ...LATER_LAND_PACK.encounters]
for (const base of baseCards) {
  const card = V6_CARDS.find((item) => item.id === base.id)!
  assert.deepEqual(
    card.choices.slice(0, base.choices.length).map((choice) => choice.id),
    base.choices.map((choice) => choice.id),
    `${base.id} keeps its original choices first`,
  )
}

const rules = createHash('sha1')
  .update(
    JSON.stringify(
      V6_CARDS.map((card: V6Card) => ({
        id: card.id,
        locationId: card.locationId,
        weight: card.weight,
        choices: card.choices.map((choice) => ({
          id: choice.id,
          requires: choice.requires,
          cost: choice.cost,
          roll: choice.roll,
          effects: [choice.success, choice.failure].map(
            (effect) =>
              effect && {
                hp: effect.hp_delta,
                provisions: effect.provisions_delta,
                flags: effect.add_flags,
                map: effect.map_effect,
                marks: effect.marks ?? {},
              },
          ),
        })),
      })),
    ),
  )
  .digest('hex')
const PINNED: Record<number, string> = {
  1: '6a982ad2ac50f701d22c28bea6e57e49217bd84a',
}
assert.equal(
  rules,
  PINNED[DECK_V6.schemaVersion],
  'V6 deck rules changed: bump authoredDecksV6.json schemaVersion and pin the new fingerprint (saves replay against the old draw pools)',
)

const fresh = newJourneyV6(4242)
const gated = V6_CARDS.flatMap((card) =>
  card.choices
    .filter((choice) => choice.requires)
    .map((choice) => ({ card, choice })),
)[0]!
assert.match(choiceLock(fresh, gated.choice) ?? '', /^Opens only if /)
assert.equal(
  choiceLock(
    { ...fresh, flags: [...gated.choice.requires!.anyFlags] },
    gated.choice,
  ),
  null,
)
const costly = choices.find((choice) => (choice.cost?.provisions ?? 0) < 0)!
assert.match(
  choiceLock(
    { ...fresh, journey: { ...fresh.journey, provisions: 0 } },
    costly,
  ) ?? '',
  /^Costs /,
)

type Policy = 'first' | 'certain' | 'bold' | 'random'
const policies: Policy[] = ['first', 'certain', 'bold', 'random']
let completed = 0
let fallen = 0
let certainChosen = 0
let gatedChosen = 0
let costsPaid = 0
const seenCards = new Set<string>()
for (let seed = 1; seed <= 320; seed++) {
  const policy = policies[seed % policies.length]!
  let ledger: JourneyLedgerV6 = newJourneyLedgerV6(seed)
  for (let step = 0; step < 400; step++) {
    const journey = ledger.current.journey
    if (['fallen', 'complete', 'retired'].includes(journey.phase)) break
    const before = ledger
    if (journey.phase === 'boss') {
      const trial = trialForLand(JOURNEY_WORLD.lands[journey.landIndex]!.id)!
      const open = trial.choices.filter((choice) =>
        canChooseTrial(choice, ledger.current.flags, journey.provisions),
      )
      ledger = stepJourneyLedgerV6(ledger, {
        type: 'TRIAL',
        choiceId: open[open.length - 1]!.id,
      })
    } else if (!journey.active) {
      const next = reachableLocations(journey).find(
        (id) => !journey.resolved.some((result) => result.locationId === id),
      )!
      ledger = stepJourneyLedgerV6(ledger, { type: 'TRAVEL', locationId: next })
    } else {
      const card = activeV6Card(ledger.current)!
      seenCards.add(card.id)
      const open = card.choices.filter(
        (choice) => !choiceLock(ledger.current, choice),
      )
      assert.ok(open.length >= 1, `${card.id} always leaves a way through`)
      for (const locked of card.choices.filter((choice) =>
        choiceLock(ledger.current, choice),
      ))
        assert.equal(
          stepJourneyLedgerV6(ledger, { type: 'CHOOSE', choiceId: locked.id }),
          ledger,
          'a locked route cannot be taken',
        )
      const pick =
        policy === 'certain'
          ? (open.find((choice) => !choice.roll) ?? open[0]!)
          : policy === 'bold'
            ? (open.find((choice) => choice.requires) ?? open[open.length - 1]!)
            : policy === 'random'
              ? open[(seed * 7 + step) % open.length]!
              : open[0]!
      const rngBefore = ledger.current.drawRng
      const hpBefore = journey.hp
      ledger = stepJourneyLedgerV6(ledger, {
        type: 'CHOOSE',
        choiceId: pick.id,
      })
      const result = ledger.current.outcomes.at(-1)!
      assert.equal(result.choiceId, pick.id)
      if (!pick.roll) {
        certainChosen++
        assert.equal(result.roll, null)
        assert.equal(result.success, true)
        assert.equal(ledger.current.drawRng, rngBefore, 'no dice for certain')
      }
      if (pick.requires) gatedChosen++
      if (pick.cost) {
        costsPaid++
        const effect = result.success ? pick.success : pick.failure!
        assert.equal(
          ledger.current.journey.hp,
          Math.max(
            0,
            Math.min(8, hpBefore + (pick.cost.hp ?? 0) + effect.hp_delta),
          ),
        )
      }
    }
    assert.notEqual(ledger, before, `seed ${seed} never stalls`)
  }
  if (ledger.current.journey.phase === 'complete') completed++
  if (ledger.current.journey.phase === 'fallen') fallen++
  const restored = restoreJourneyLedgerV6(clone(ledger))
  assert.deepEqual(restored, ledger, 'replay rebuilds the exact run')
  const reworded = JSON.parse(
    JSON.stringify(ledger, (key, value) =>
      ['text', 'reason', 'resultText'].includes(key) ? 'older wording' : value,
    ),
  )
  assert.deepEqual(restoreJourneyLedgerV6(reworded), ledger)
  const rolled = ledger.current.outcomes.find((result) => result.roll)
  if (rolled) {
    const forged = clone(ledger)
    forged.current.outcomes.find((result) => result.roll)!.roll!.dice[0] = 7
    assert.equal(restoreJourneyLedgerV6(forged), null, 'forged dice rejected')
  }
  const marked = clone(ledger)
  marked.current.marks.mercy += 5
  assert.equal(restoreJourneyLedgerV6(marked), null, 'forged ledger rejected')
}
assert.ok(completed > 0, 'some seeded runs cross all five lands')
assert.ok(fallen > 0, 'the road can still kill')
assert.ok(certainChosen > 100 && gatedChosen > 10 && costsPaid > 20)
assert.ok(
  seenCards.size > 100,
  `runs reach most of the deck (${seenCards.size})`,
)

assert.equal(
  stepJourneyV6(newJourneyV6(9), { type: 'CHOOSE', choiceId: 'anything' })
    .outcomes.length,
  0,
)
assert.equal(
  restoreJourneyLedgerV6({ ...newJourneyLedgerV6(3), deckVersion: 0 }),
  null,
)

console.log(
  `Shifting Lands V6 passed: 120 cards (24 per land), ${choices.length} choices, ${certainCards.length} cards with a certain route, ${gatedCards.length} with a deed-gated route; ${completed}/320 seeded runs complete, exact replay, prose-tolerant and forgery-proof saves`,
)
