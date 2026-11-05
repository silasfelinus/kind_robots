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
import { trialForLandV7 } from '../shiftingLands/trialRulesV7'
import { JOURNEY_WORLD, reachableLocations } from '../shiftingLands/journey'
import { AUTHORED_PACK } from '../shiftingLands/authoredJourney'
import { LATER_LAND_PACK } from '../shiftingLands/authoredFiveLands'
import {
  authoredEndingV6,
  endingKindForMarks,
  type EndingKind,
} from '../shiftingLands/endingsV6'

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

// Every land holds the same editorial floor, and no outcome that leaves the
// map alone may promise a shifted road. Each land keeps its own pins below.
const MAP_SHIFT_PROMISE =
  /\b(road|way|route|path|tunnels) ahead( of you)?( now| will have to)? (changes|has changed|shifts|has shifted|bends?|turns|runs|looks|reorders?|rearranges|redraws|opens|is not|no longer)|\bahead (changes|shifts|bends|reorders|rearranges)|changes (your|the) road ahead|across the road ahead|buries the easy road/
const landCards = (landId: string) => {
  const ids = new Set(
    JOURNEY_WORLD.lands
      .find((land) => land.id === landId)!
      .locations.map((place) => place.id),
  )
  return V6_CARDS.filter((card) => ids.has(card.locationId))
}
const v6Card = (cardId: string) => V6_CARDS.find((card) => card.id === cardId)!
const v6Choice = (cardId: string, choiceId: string) =>
  v6Card(cardId).choices.find((choice) => choice.id === choiceId)!
const trialChoice = (landId: string, choiceId: string) =>
  trialForLand(landId)!.choices.find((choice) => choice.id === choiceId)!
const v7Choice = (landId: string, choiceId: string) =>
  trialForLandV7(landId)!.choices.find((choice) => choice.id === choiceId)!
for (const land of JOURNEY_WORLD.lands) {
  const cards = landCards(land.id)
  assert.equal(cards.length, 24, `${land.id} has eight cards per location`)
  for (const card of cards) {
    assert.ok(card.flavor.length >= 130, `${card.id}: keep the scene specific`)
    for (const choice of card.choices) {
      assert.ok(choice.risk.length >= 20, `${card.id}: keep the risk legible`)
      assert.ok(
        choice.success.text.length >= 80,
        `${card.id}: keep the consequence authored`,
      )
      if (choice.failure)
        assert.ok(
          choice.failure.text.length >= 80,
          `${card.id}: keep the failure consequential`,
        )
      for (const effect of [choice.success, choice.failure])
        if (effect && effect.map_effect === 'none')
          assert.doesNotMatch(
            effect.text,
            MAP_SHIFT_PROMISE,
            `${card.id}/${choice.id}: prose must not promise a map shift the state never records`,
          )
    }
  }
}
assert.match(
  v6Choice('the-cooling-stones', 'mark-the-unsafe-seam').success.text,
  MAP_SHIFT_PROMISE,
  'the map-shift detector still recognizes a recorded shift',
)

// Homestead
assert.ok(
  landCards('homestead').filter((card) => /\b(you|your)\b/i.test(card.flavor))
    .length >= 12,
  'the reader remains directly addressed in the Homestead',
)
assert.match(
  v6Choice('the-last-seed', 'shield-shoot').success.text,
  /food she had saved for planting week/,
  'seed sacrifice has a visible cost rather than an arbitrary treasure find',
)
assert.match(
  LATER_LAND_PACK.encounters.find(
    (card) => card.id === 'three-cups-on-the-table',
  )!.flavor,
  /three cups of broth/,
  'the Three Cups prose names its visible, countable props',
)
assert.match(
  trialForLand('homestead')!.flavor,
  /her guards keep the corridor behind her barred/,
  'the guards and the bar the confront route breaks are in the scene',
)
assert.match(
  trialForLand('homestead')!.flavor,
  /children's dormitory/,
  'the dormitory and the missing children are set up before a route names them',
)
assert.equal(
  trialChoice('homestead', 'parley').label,
  'Demand an accounting before witnesses',
  'the label matches the accounting the success delivers',
)
assert.match(
  v7Choice('homestead', 'tribute').label,
  /record keeper/,
  'the bribe label names who takes the ration',
)

// Dustwater
assert.match(
  v6Choice('one-too-many-aboard', 'question-the-pilots-count').success.text,
  /eleventh seat the hull can carry/,
  'the pilot reveal must explain why eleven can safely cross',
)
assert.match(
  v6Choice('a-dam-of-broken-wagons', 'break-the-dam-open').success.text,
  /squatters' children/,
  'returning water downstream must acknowledge who loses their pond',
)
assert.match(
  v6Choice('the-smugglers-mirror', 'sell-the-plan-to-the-toll-men').success
    .text,
  /landing's ovens stay cold/,
  'the betrayal must acknowledge the hungry people at the landing',
)
assert.match(
  trialForLand('dustwater')!.flavor,
  /jammed mechanism/,
  'the jam the confront label names is in the scene',
)
assert.match(
  trialForLand('dustwater')!.flavor,
  /the one channel the book calls safe/,
  'the keeper admits only one safe channel, so a hidden one can be proved',
)
assert.doesNotMatch(
  v7Choice('dustwater', 'witness').success,
  /rescued boat crews/,
  'the crews are still stranded when they testify',
)

// Tablelands
assert.match(
  v6Card('six-tally-sticks').flavor,
  /lay it against the foreman's/,
  "Pell's stick is compared with the foreman's half, not her own",
)
assert.match(
  v6Choice('the-banner-in-the-wind', 'ask-why-the-rider-left').success.text,
  /^You say aloud/,
  'deed-told-truth is earned by what the player says',
)
assert.equal(
  v6Choice('the-raider-beneath-the-arch', 'ask-about-the-missing-caravans')
    .label,
  'Ask who he really rides for',
  'the label matches what the intent and the answer are about',
)
assert.match(
  v6Choice('the-bell-in-the-sealed-adit', 'call-in-what-you-are-owed').success
    .text,
  /Five of the six/,
  'calling in help visibly saves more cutters than digging alone',
)
assert.doesNotMatch(
  trialForLand('tablelands')!.flavor,
  /you know that/,
  'the trial does not assume clues the player may never have found',
)

// Deep Cave
for (const card of landCards('cave'))
  for (const choice of card.choices)
    for (const effect of [choice.success, choice.failure])
      if (effect && effect.map_effect === 'none')
        assert.doesNotMatch(
          effect.text,
          /(road|way|tunnels) ahead/,
          `${card.id}/${choice.id}: no unshifted cave outcome talks about the way ahead`,
        )
assert.match(
  v6Card('feathers-in-the-draft').flavor,
  /who you are and what you want below/,
  'the storm-reader asks the question the first choice answers',
)
assert.match(
  v6Card('the-third-shadow').flavor,
  /what her brother owes/,
  "the brother's debt is set up before a choice offers to pay it",
)
assert.match(
  v6Choice('no-fever-past-the-rope', 'brew-a-fever-draught').failure!.text,
  /the last of your herbs/,
  'the failed draught spends deed-carries-medicine (t-049), so the herbs are gone',
)
for (const [cardId, choiceId, owed] of [
  [
    'the-red-vial',
    'brew-him-a-sleeping-draught',
    /swears he will pay the rest/,
  ],
  [
    'the-fortieth-stone',
    'open-the-old-wind-shaft',
    /owes you her child's life/,
  ],
  ['the-creditors-ledger', 'broker-new-terms', /owes you more than wool/],
] as const)
  assert.match(
    v6Choice(cardId, choiceId).success.text,
    owed,
    `${cardId}: deed-owed-favor is spoken by someone who owes it`,
  )
assert.match(
  v6Choice('salt-for-the-burial', 'feed-the-children-quietly').success.text,
  /the little ones/,
  'the eldest of three children does not thank you for "both"',
)
assert.doesNotMatch(
  v6Choice('the-surveyors-tally-book', 'let-the-families-decide').success.text,
  /twenty stay hidden/,
  'sixty-one people are not split into forty and twenty',
)
assert.match(
  trialForLand('cave')!.flavor,
  /chalk circle/,
  'the circle the confront route breaks is in the scene',
)
assert.doesNotMatch(
  trialChoice('cave', 'evidence').intent,
  /in the hollow and at the crossroads/,
  'evidence opens on any one clue, so the intent does not assume both',
)
assert.match(
  v7Choice('cave', 'solidarity').success,
  /outside the candle ring/,
  'the solidarity scene names who the court ignored',
)

// Verge
assert.match(
  v6Choice('ashes-at-the-border', 'repair-the-signal-horn').success.text,
  /sounds the all-clear/,
  'the horn sounds the all-clear the intent promised',
)
assert.match(
  v6Card('the-last-watchfire').flavor,
  /guide raiders in/,
  'the reason nobody lights the beacon is set up before a choice lights it',
)
assert.doesNotMatch(
  v6Choice('the-closed-infirmary', 'calm-the-waiting-guards').success.text,
  /clean supplies on the wagon/,
  'the only bandages are inside, so the wagon cannot already hold them',
)
assert.match(
  v6Card('the-deserters-cage').flavor,
  /lone patrol rider/,
  'every outcome follows one rider, so the flavor shows one',
)
assert.match(
  v6Choice('two-cots-one-draught', 'open-your-own-medicine').success.text,
  /Your pouch is empty now/,
  'the dose spends deed-carries-medicine (t-049), so the pouch is empty',
)
assert.doesNotMatch(
  v6Choice('two-cots-one-draught', 'open-your-own-medicine').risk,
  /Most of what/,
  'the risk does not promise medicine left over once the pouch is spent',
)
assert.doesNotMatch(
  v6Choice('the-creditors-tally-sticks', 'sign-over-a-debt-owed-you').risk,
  /owed nothing/,
  'the trade spends deed-owed-favor (t-049); the risk names whose debt it becomes',
)
assert.doesNotMatch(
  v6Choice('a-promise-kept', 'help-search-for-its-owner').failure!.text,
  /your last meal/,
  'one lost provision is a day of food, not the last of it',
)
assert.match(
  v6Choice('the-smugglers-side-door', 'pay-for-the-family-instead').success
    .text,
  /three days' food lighter/,
  'the three-provision price is named, not "almost nothing left"',
)
assert.match(
  trialForLand('verge')!.flavor,
  /sealed door/,
  'the seal the confront route cuts is in the scene',
)
assert.doesNotMatch(
  trialForLand('verge')!.flavor,
  /promises you chose to keep/,
  'the finale does not assume a merciful road',
)
assert.match(
  trialChoice('verge', 'evidence').intent,
  /gatepost carvings, the messenger's waystone, the negotiator's own admission/,
  'the evidence intent names each card that can open it',
)
assert.doesNotMatch(
  trialChoice('verge', 'evidence').success,
  /promise/,
  'carvings, a waystone or an admission can open the route, so the success assumes no promise',
)

// Final voice audit: a stock phrase may be a refrain across the deck, but not
// a tic inside one land, where a single run reads three of its cards.
const STOCK_PHRASES: Array<[RegExp, number, string]> = [
  [/road ahead/gi, 5, 'the road-ahead refrain'],
  [/without a word/gi, 4, '"without a word"'],
  [
    /\bpress(es)?\b[^.]{0,50}\b(into your (hand|hands|palm)|on you)\b/gi,
    4,
    'a gift pressed into your hand',
  ],
]
for (const land of JOURNEY_WORLD.lands) {
  const trial = trialForLand(land.id)!
  const prose = [
    ...landCards(land.id).flatMap((card) => [
      card.flavor,
      ...card.choices.flatMap((choice) => [
        choice.label,
        choice.intent,
        choice.risk,
        choice.success.text,
        choice.failure?.text ?? '',
      ]),
    ]),
    trial.flavor,
    ...trial.choices.flatMap((choice) => [
      choice.label,
      choice.intent,
      choice.success,
      choice.failure,
    ]),
  ].join('\n')
  for (const [pattern, cap, name] of STOCK_PHRASES) {
    const count = prose.match(pattern)?.length ?? 0
    assert.ok(count <= cap, `${land.id}: ${name} ${count} times, cap ${cap}`)
  }
}

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

const endingCases: Array<{
  kind: EndingKind
  marks: Partial<ReturnType<typeof newJourneyV6>['marks']>
}> = [
  { kind: 'shared-well', marks: { mercy: 3, honesty: 3 } },
  { kind: 'open-door', marks: { mercy: 3, courage: 3 } },
  { kind: 'masked-rule', marks: { cunning: 3, ruthlessness: 3 } },
  { kind: 'scarred-witness', marks: { honesty: 3, ruthlessness: 3 } },
  { kind: 'last-loaf', marks: { mercy: 4 } },
  { kind: 'unsealed-book', marks: { honesty: 4 } },
  { kind: 'bell-again', marks: { courage: 4 } },
  { kind: 'unmarked-ford', marks: { cunning: 4 } },
  { kind: 'salt-crown', marks: { ruthlessness: 4 } },
  { kind: 'unnamed-road', marks: {} },
]
const endingSeed = newJourneyV6(5656)
const endingsSeen = new Set<EndingKind>()
for (const example of endingCases) {
  const marks = { ...endingSeed.marks, ...example.marks }
  assert.equal(endingKindForMarks(marks), example.kind)
  const headings = new Set<string>()
  for (const phase of ['complete', 'fallen', 'retired'] as const) {
    const candidate = {
      ...endingSeed,
      marks,
      journey: { ...endingSeed.journey, phase },
    }
    const untouched = JSON.stringify(candidate)
    const ending = authoredEndingV6(candidate, [])
    assert.equal(ending?.kind, example.kind)
    assert.ok(ending && ending.paragraphs.length >= 2)
    assert.ok(ending.paragraphs[1]!.length >= 90)
    headings.add(ending.paragraphs[1]!)
    assert.equal(JSON.stringify(candidate), untouched, 'ending is a pure read')
    endingsSeen.add(ending.kind)
  }
  assert.equal(headings.size, 3, 'survival, loss and retreat read differently')
}
assert.equal(endingsSeen.size, 10, 'ten distinct ledger ending narratives')
assert.equal(
  endingKindForMarks({
    mercy: 3,
    honesty: 3,
    courage: 3,
    cunning: 3,
    ruthlessness: 3,
  }),
  'unnamed-road',
  'five tied moral marks do not imply a uniquely merciful journey',
)
assert.equal(authoredEndingV6(endingSeed, []), null, 'no premature ending')
const finalState = {
  ...endingSeed,
  flags: ['deed-shared-bread'],
  marks: { ...endingSeed.marks, mercy: 4 },
  journey: { ...endingSeed.journey, phase: 'complete' as const },
}
const trialMemory = {
  landId: 'homestead',
  bossId: 'abbess-gate',
  choiceId: 'evidence',
  turn: 4,
  roll: {
    landId: 'homestead',
    locationId: 'abbess-gate',
    dice: [5, 6] as [number, number],
    skill: 'insight' as const,
    modifier: 2,
    difficulty: 8,
    total: 13,
    success: true,
  },
  resultText: 'The locked door opens.',
  hpChange: 0,
  provisionChange: 0,
}
const rememberedEnding = authoredEndingV6(finalState, [trialMemory])
assert.ok(
  rememberedEnding?.paragraphs.some((line) => line.includes('bread was eaten')),
)
assert.ok(
  rememberedEnding?.paragraphs.some((line) => line.includes('Abbess')),
  'the ending recalls the actual successful trial approach',
)
assert.ok(
  !authoredEndingV6(finalState, [])?.paragraphs.some((line) =>
    line.includes('Abbess'),
  ),
  'a trial that was not completed is never invented',
)

const failedTrial = {
  ...trialMemory,
  choiceId: 'confront',
  roll: { ...trialMemory.roll, success: false },
}
const fallenAfterTrial = {
  ...finalState,
  journey: { ...finalState.journey, phase: 'fallen' as const },
}
assert.ok(
  authoredEndingV6(fallenAfterTrial, [
    trialMemory,
    failedTrial,
  ])?.paragraphs.some((line) =>
    line.includes('last trial still holds its gate'),
  ),
  'a fatal failed trial takes precedence over an earlier evidence victory',
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
