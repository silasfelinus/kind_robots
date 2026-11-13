import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  FENNEC_SIBLINGS,
  JEFFERY_MITTENS,
  POINT_BUY_TOTAL,
  PREMADE_CHARACTERS,
  SPECIES,
  ZUZU,
  characterFromSnapshot,
  customCharacterProblems,
  makeCustomCharacter,
  skillTotal,
  type ShiftingCharacter,
} from '../shiftingLands/characters'
import {
  CAST_CARDS_V10,
  V6_CARDS,
  activeV6Card,
  choiceLock,
  drawV6Card,
  newJourneyV6,
  stepJourneyV6,
  v6Pool,
  validateDeckV6,
} from '../shiftingLands/deckV6'
import {
  cameoPool,
  cardCast,
  drawForCharacter,
  meetsSelf,
  rulesForCharacter,
  v10Pool,
  validateCastCardsV10,
} from '../shiftingLands/castDeckV10'
import {
  JOURNEY_WORLD,
  readCheck,
  reachableLocations,
} from '../shiftingLands/journey'
import {
  canChooseTrialV7,
  canPrepareTrialV7,
} from '../shiftingLands/trialRulesV7'
import { trialForLandV8 } from '../shiftingLands/trialRulesV8'
import { trialSuccessPercent } from '../shiftingLands/trialOdds'
import {
  kitchenNoviceOptionsV9,
  newJourneyLedgerV9,
  restoreJourneyLedgerV9,
  stepJourneyLedgerV9,
  v9CharacterSheet,
  type JourneyActionV9,
  type JourneyLedgerV9,
} from '../shiftingLands/saveLedgerV9'
import {
  journeyCharacter,
  newJourneyLedgerV10,
  readCheckFor,
  restoreJourneyLedgerV10,
  stepJourneyLedgerV10,
  v10CharacterSheet,
  type JourneyLedgerV10,
} from '../shiftingLands/saveLedgerV10'

// zuzu-shifting-lands/t-052 (Silas, 2026-11-11 PT): design a character and
// adjust stats; Zuzu and Jeffery Mittens are playable; encounters change with
// who is playing, so you never meet yourself on the road.

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
const LOCATIONS: string[] = JOURNEY_WORLD.lands.flatMap((land) =>
  (land.locations as Array<{ id: string }>).map((location) => location.id),
)
const rng = (seed: number) => {
  let state = seed >>> 0 || 1
  return (n: number) => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0
    return state % n
  }
}

// 1. Characters: Zuzu is exactly the table every earlier reducer adds.
const BASE = {
  steel: 3,
  awareness: 2,
  wits: 2,
  bearing: 2,
  resolve: 2,
  insight: 2,
}
assert.deepEqual(ZUZU.skills, BASE, 'Zuzu keeps the original skill table')
assert.equal(ZUZU.startProvisions, 2)
assert.deepEqual(ZUZU.signatureFlags, [])
assert.equal(newJourneyLedgerV9(1).current.journey.provisions, 2)
for (const character of PREMADE_CHARACTERS) {
  assert.equal(skillTotal(character.skills), POINT_BUY_TOTAL, character.id)
  assert.deepEqual(characterFromSnapshot(clone(character)), character)
  assert.ok(character.identity.length, `${character.id} has an identity`)
}
assert.ok(PREMADE_CHARACTERS.some((entry) => entry.name === 'Jeffery Mittens'))
assert.equal(JEFFERY_MITTENS.species, 'raccoon')
assert.deepEqual(JEFFERY_MITTENS.signatureFlags, ['deed-knows-old-roads'])
assert.deepEqual(FENNEC_SIBLINGS.signatureFlags, ['deed-shared-bread'])

const custom = {
  name: 'Willa Thorn',
  species: 'otter' as const,
  pronouns: 'they' as const,
  skills: {
    steel: 0,
    awareness: 4,
    wits: 3,
    bearing: 2,
    resolve: 2,
    insight: 2,
  },
}
const willa = makeCustomCharacter(custom)!
assert.ok(willa, 'a 13-point custom traveler is valid')
assert.equal(willa.id, 'custom')
assert.deepEqual(willa.identity, [], 'a custom traveler is nobody from canon')
assert.deepEqual(willa.signatureFlags, [])
assert.equal(willa.startProvisions, 2)
assert.deepEqual(characterFromSnapshot(clone(willa)), willa)
const problems = (change: Partial<typeof custom>) =>
  customCharacterProblems({ ...custom, ...change })
assert.deepEqual(problems({}), [])
assert.ok(problems({ name: '' }).length, 'a name is required')
assert.ok(problems({ name: 'x'.repeat(25) }).length, 'names are capped')
assert.ok(problems({ name: '<b>Willa</b>' }).length, 'no markup in names')
assert.ok(problems({ name: 'Zuzu' }).length, 'canon names are reserved')
assert.ok(problems({ name: 'jeffery mittens' }).length)
assert.ok(problems({ species: 'dragon' as never }).length, 'approved species')
assert.ok(problems({ pronouns: 'it' as never }).length)
assert.ok(
  problems({ skills: { ...custom.skills, steel: 1 } }).length,
  '14 points is too many',
)
assert.ok(
  problems({ skills: { ...custom.skills, awareness: 3 } }).length,
  '12 points is too few',
)
assert.ok(
  problems({
    skills: {
      steel: 5,
      awareness: 0,
      wits: 2,
      bearing: 2,
      resolve: 2,
      insight: 2,
    },
  }).length,
  'no skill above 4',
)
assert.ok(
  problems({
    skills: {
      steel: -1,
      awareness: 4,
      wits: 4,
      bearing: 2,
      resolve: 2,
      insight: 2,
    },
  }).length,
  'no skill below 0',
)
assert.ok(
  problems({ skills: { ...custom.skills, steel: 0.5, awareness: 3.5 } }).length,
  'whole numbers only',
)
assert.equal(SPECIES.length >= 8, true)

// Tampered snapshots are refused: stats, provisions, deeds and identity are
// part of the character, not free fields on a save.
const tampered: Array<[string, unknown]> = [
  ['raised Zuzu steel', { ...ZUZU, skills: { ...ZUZU.skills, steel: 4 } }],
  ['extra provisions', { ...JEFFERY_MITTENS, startProvisions: 9 }],
  ['borrowed deed', { ...ZUZU, signatureFlags: ['deed-owed-favor'] }],
  ['renamed premade', { ...JEFFERY_MITTENS, name: 'Jeff' }],
  ['custom with identity', { ...willa, identity: ['fennec-siblings'] }],
  ['custom over budget', { ...willa, skills: { ...willa.skills, steel: 1 } }],
  ['custom extra provisions', { ...willa, startProvisions: 3 }],
  ['custom deeds', { ...willa, signatureFlags: ['deed-knows-old-roads'] }],
  ['unknown id', { ...willa, id: 'the-abbess' }],
  ['not an object', 'zuzu'],
]
for (const [label, value] of tampered)
  assert.equal(characterFromSnapshot(value), null, label)
assert.equal(
  characterFromSnapshot({ ...ZUZU, luck: 9 }),
  null,
  'no stray fields',
)
// Portrait and blurb are presentation: a newly painted portrait never turns an
// existing save away, and the restored traveler takes the current one.
assert.deepEqual(
  characterFromSnapshot({
    ...JEFFERY_MITTENS,
    portrait: '/an/older/plate.webp',
    blurb: 'Older words.',
  }),
  JEFFERY_MITTENS,
)

// 2. Cameo content meets the deck's own floor and leaves the V6 deck alone.
assert.deepEqual(validateDeckV6(), [], 'V6 deck contract unchanged')
assert.deepEqual(validateCastCardsV10(), [], 'cast cameo contract')
assert.equal(V6_CARDS.length, 120, 'cameos never join the V6 deck')
for (const location of LOCATIONS)
  assert.equal(v6Pool(location).length, 8, `${location} V6 pool untouched`)
const castOf = (id: string) => CAST_CARDS_V10.find((card) => card.id === id)!
assert.ok(
  CAST_CARDS_V10.some((card) => card.cast.includes('jeffery-mittens')),
  'Jeffery Mittens appears on the road',
)
assert.ok(
  CAST_CARDS_V10.some((card) => card.cast.includes('fennec-siblings')),
  'the fennec siblings appear on the road',
)
assert.deepEqual(cardCast('a-tithe-basket-at-the-gate'), [])
assert.deepEqual(cardCast('the-raider-beneath-the-arch'), [])
assert.deepEqual(cardCast('a-crust-for-the-road'), ['the-abbess'])

// 3. V6-V9 are byte-for-byte the rules they were. This digest is the same
// seeded V9 policy run on origin/main before t-052 (fcce6f10...), projected
// onto actions, dice, routes, flags, marks, health, trials and followers.
function playV9(seed: number): JourneyLedgerV9 {
  const roll = rng(seed * 7 + 3)
  let ledger = newJourneyLedgerV9(seed)
  for (let turn = 0; turn < 160; turn++) {
    const state = ledger.current
    const journey = state.journey
    if (['complete', 'fallen', 'retired'].includes(journey.phase)) break
    let action: JourneyActionV9
    const followers = kitchenNoviceOptionsV9(ledger)
    if (followers.length && roll(2) === 0)
      action = {
        type: 'FOLLOWER',
        choiceId: followers[roll(followers.length)]!.id,
      }
    else if (journey.phase === 'boss') {
      const land = JOURNEY_WORLD.lands[journey.landIndex]!
      if (canPrepareTrialV7(state, ledger.prepared) && roll(3) === 0)
        action = { type: 'PREPARE' }
      else {
        const open = trialForLandV8(land.id)!.choices.filter((choice) =>
          canChooseTrialV7(choice, state, ledger.prepared),
        )
        action = { type: 'TRIAL', choiceId: open[roll(open.length)]!.id }
      }
    } else if (journey.active) {
      const card = activeV6Card(state)!
      const open = card.choices.filter((choice) => !choiceLock(state, choice))
      action = { type: 'CHOOSE', choiceId: open[roll(open.length)]!.id }
    } else {
      const open = reachableLocations(journey).filter(
        (id) => !journey.resolved.some((result) => result.locationId === id),
      )
      action = { type: 'TRAVEL', locationId: open[roll(open.length)]! }
    }
    const next = stepJourneyLedgerV9(ledger, action)
    if (next === ledger) break
    ledger = next
  }
  return ledger
}
const project = (ledger: JourneyLedgerV9 | JourneyLedgerV10) => {
  const s = ledger.current
  return JSON.stringify([
    ledger.actions,
    s.outcomes.map((o) => [
      o.encounterId,
      o.choiceId,
      o.roll?.dice ?? null,
      o.roll?.total ?? null,
      o.success,
      o.hpChange,
      o.provisionChange,
      o.flags,
    ]),
    s.flags,
    s.marks,
    s.journey.hp,
    s.journey.provisions,
    s.journey.phase,
    s.journey.layouts,
    ledger.trialResults.map((t) => [
      t.landId,
      t.choiceId,
      t.roll.dice,
      t.roll.total,
      t.roll.success,
    ]),
    ledger.followerHistory.map((f) => f.choiceId),
  ])
}
const v9Runs: JourneyLedgerV9[] = []
const digest = createHash('sha256')
for (let seed = 1; seed <= 300; seed++) {
  const run = playV9(seed)
  v9Runs.push(run)
  digest.update(project(run))
}
assert.equal(
  digest.digest('hex'),
  'fcce6f10c620d36ce0b9db3ab9d1b0b3c5dce57aab987e9ebe3f8b347c1e7436',
  'V9 replays exactly as it did before characters existed',
)

// A V9 save restores unchanged and is Zuzu's journey.
for (const run of v9Runs.slice(0, 60)) {
  const restored = restoreJourneyLedgerV9(clone(run))
  assert.deepEqual(restored && project(restored), project(run))
  assert.deepEqual(journeyCharacter(run), ZUZU)
  assert.deepEqual(v9CharacterSheet(run).skills.steel >= 2, true)
}

// 4. Zuzu on V10 deals the V9 card everywhere a cameo does not interrupt, and
// plays the V9 run exactly when no cameo was dealt.
let interrupts = 0
for (let seed = 1; seed <= 500; seed++)
  for (const location of LOCATIONS) {
    const dealt = drawForCharacter(seed, location, ZUZU)!
    const base = drawV6Card(seed, location)!
    if (dealt.id === base.id) continue
    interrupts++
    assert.ok(
      cameoPool(location).some((card) => card.id === dealt.id),
      `${seed}/${location}: only a cameo replaces Zuzu's V9 card`,
    )
  }
assert.ok(interrupts > 0, 'cameos do reach Zuzu')
assert.ok(interrupts < 500 * LOCATIONS.length * 0.1, 'cameos stay occasional')

let identical = 0
for (const v9 of v9Runs) {
  let v10 = newJourneyLedgerV10(v9.seed, ZUZU)
  let diverged = false
  for (const action of v9.actions) {
    const next = stepJourneyLedgerV10(v10, action)
    if (next === v10) {
      diverged = true
      break
    }
    v10 = next
  }
  const met = Object.values(v10.current.drawn).some((id) =>
    CAST_CARDS_V10.some((card) => card.id === id),
  )
  if (diverged || met) continue
  identical++
  assert.equal(project(v10), project(v9), `seed ${v9.seed}: Zuzu V10 == V9`)
  assert.deepEqual(v10.current, v9.current)
  assert.deepEqual(v10.trialResults, v9.trialResults)
  assert.deepEqual(v10.followerHistory, v9.followerHistory)
  assert.deepEqual(v10CharacterSheet(v10), v9CharacterSheet(v9))
}
assert.ok(identical >= 40, `${identical} cameo-free Zuzu runs match V9`)

// 5. Nobody meets themselves: every playable, seeds 1-500, every location.
const PLAYABLE: ShiftingCharacter[] = [...PREMADE_CHARACTERS, willa]
const dealtTo = new Map<string, Set<string>>()
for (const character of PLAYABLE) {
  const seen = new Set<string>()
  for (const location of LOCATIONS) {
    const pool = v10Pool(location, character)
    assert.ok(pool.length >= 8, `${character.id}/${location}: pool stays full`)
    for (const card of pool)
      assert.equal(meetsSelf(card.id, character), false, card.id)
    for (let seed = 1; seed <= 500; seed++) {
      const card = drawForCharacter(seed, location, character)
      assert.ok(card, `${character.id}/${location}/${seed}: a card is dealt`)
      assert.equal(card!.locationId, location)
      assert.equal(
        meetsSelf(card!.id, character),
        false,
        `${character.id} met ${card!.id} at ${location} (seed ${seed})`,
      )
      assert.ok(pool.some((entry) => entry.id === card!.id))
      seen.add(card!.id)
    }
  }
  dealtTo.set(character.id, seen)
}
const met = (who: string, card: string) => dealtTo.get(who)!.has(card)
for (const card of CAST_CARDS_V10.filter((entry) => !entry.variantOnly)) {
  assert.ok(met('zuzu', card.id), `Zuzu can meet ${card.id}`)
  assert.ok(met('custom', card.id), `a custom traveler can meet ${card.id}`)
}
assert.equal(met('jeffery-mittens', 'boots-on-a-string'), false)
assert.equal(met('jeffery-mittens', 'a-scout-on-the-rocks'), false)
assert.ok(met('jeffery-mittens', 'the-barefoot-line'), 'Jeffery gets his own')
assert.ok(met('jeffery-mittens', 'two-small-shadows'))
assert.equal(met('fennec-siblings', 'two-small-shadows'), false)
assert.equal(met('fennec-siblings', 'the-hungry-hour'), false)
assert.ok(met('fennec-siblings', 'apples-on-a-stone'), 'the siblings meet him')
assert.ok(met('fennec-siblings', 'the-price-of-a-loaf'))
assert.ok(met('fennec-siblings', 'boots-on-a-string'))
for (const variant of CAST_CARDS_V10.filter((entry) => entry.variantOnly)) {
  const owners = PLAYABLE.filter((who) => met(who.id, variant.id))
  const original = CAST_CARDS_V10.find(
    (card) => card.selfVariant === variant.id,
  )!
  assert.deepEqual(
    owners.map((who) => who.id),
    PLAYABLE.filter((who) => meetsSelf(original.id, who)).map((who) => who.id),
    `${variant.id} is only for whoever ${original.id} features`,
  )
}
assert.deepEqual(castOf('apples-on-a-stone').cast, ['zuzu'])
assert.equal(met('zuzu', 'apples-on-a-stone'), false)

// 6. Full V10 journeys for every playable: exact replay, no self-encounter,
// signature deeds and starting provisions, tamper rejection.
function playV10(seed: number, character: ShiftingCharacter): JourneyLedgerV10 {
  const roll = rng(seed * 13 + character.id.length)
  let ledger = newJourneyLedgerV10(seed, character)
  for (let turn = 0; turn < 160; turn++) {
    const state = ledger.current
    const journey = state.journey
    if (['complete', 'fallen', 'retired'].includes(journey.phase)) break
    let action: JourneyActionV9
    if (journey.phase === 'boss') {
      const land = JOURNEY_WORLD.lands[journey.landIndex]!
      const open = trialForLandV8(land.id)!.choices.filter((choice) =>
        canChooseTrialV7(choice, state, ledger.prepared),
      )
      action = { type: 'TRIAL', choiceId: open[roll(open.length)]!.id }
    } else if (journey.active) {
      const card = activeV6Card(state)!
      assert.equal(meetsSelf(card.id, character), false)
      const open = card.choices.filter((choice) => !choiceLock(state, choice))
      assert.ok(open.length, `${card.id} leaves a way through`)
      action = { type: 'CHOOSE', choiceId: open[roll(open.length)]!.id }
    } else {
      const open = reachableLocations(journey).filter(
        (id) => !journey.resolved.some((result) => result.locationId === id),
      )
      action = { type: 'TRAVEL', locationId: open[roll(open.length)]! }
    }
    const next = stepJourneyLedgerV10(ledger, action)
    assert.notStrictEqual(next, ledger, `${character.id} ${seed} never stalls`)
    ledger = next
  }
  return ledger
}
let cameoOutcomes = 0
for (const character of PLAYABLE) {
  const fresh = newJourneyLedgerV10(77, character)
  assert.equal(fresh.current.journey.provisions, character.startProvisions)
  assert.deepEqual(fresh.current.flags, character.signatureFlags)
  assert.deepEqual(journeyCharacter(fresh), character)
  assert.deepEqual(v10CharacterSheet(fresh).skills, character.skills)
  for (let seed = 1; seed <= 40; seed++) {
    const run = playV10(seed, character)
    cameoOutcomes += run.current.outcomes.filter((outcome) =>
      CAST_CARDS_V10.some((card) => card.id === outcome.encounterId),
    ).length
    for (const outcome of run.current.outcomes)
      assert.equal(meetsSelf(outcome.encounterId, character), false)
    for (const roll of run.current.outcomes.flatMap((o) =>
      o.roll ? [o.roll] : [],
    ))
      assert.equal(
        roll.modifier - character.skills[roll.skill],
        roll.total - roll.dice[0] - roll.dice[1] - character.skills[roll.skill],
      )
    for (const trial of run.trialResults)
      assert.equal(trial.roll.modifier, character.skills[trial.roll.skill])
    const saved = clone(run)
    assert.deepEqual(restoreJourneyLedgerV10(saved), run, 'exact replay')
    if (seed > 3) continue
    assert.equal(
      restoreJourneyLedgerV10({
        ...saved,
        character: {
          ...saved.character,
          skills: {
            ...saved.character.skills,
            // Augustin already starts at steel 4, so lower his instead.
            steel: saved.character.skills.steel === 4 ? 3 : 4,
          },
        },
      }),
      null,
      'changed stats are refused',
    )
    assert.equal(
      restoreJourneyLedgerV10({
        ...saved,
        character: willa.id === character.id ? ZUZU : willa,
      }),
      null,
      'swapping who played is refused',
    )
    assert.equal(
      restoreJourneyLedgerV10({ ...saved, castDeckVersion: 99 }),
      null,
    )
    assert.equal(restoreJourneyLedgerV10({ ...saved, version: 9 }), null)
    if (saved.current.outcomes.some((outcome) => outcome.roll)) {
      const forged = clone(saved)
      const outcome = forged.current.outcomes.find((entry) => entry.roll)!
      outcome.roll!.dice = [6, 6]
      assert.equal(restoreJourneyLedgerV10(forged), null, 'forged dice')
    }
    assert.equal(
      restoreJourneyLedgerV9(saved),
      null,
      'a V10 save is never read as Zuzu V9',
    )
  }
}
assert.ok(cameoOutcomes > 0, 'cameos are played, not only dealt')

// Signature deeds open existing routes from the first step.
const oldRoads = V6_CARDS.flatMap((card) =>
  card.choices
    .filter((choice) =>
      choice.requires?.anyFlags.includes('deed-knows-old-roads'),
    )
    .map((choice) => ({ card, choice })),
)
assert.ok(oldRoads.length >= 5)
const jefferyStart = newJourneyLedgerV10(5, JEFFERY_MITTENS).current
const zuzuStart = newJourneyLedgerV10(5, ZUZU).current
for (const { choice } of oldRoads) {
  if (choice.cost) continue
  assert.equal(choiceLock(jefferyStart, choice), null)
  assert.match(choiceLock(zuzuStart, choice) ?? '', /^Opens only if /)
}

// 7. Stats change the odds and flip real checks.
const awarenessTrial = trialForLandV8('homestead')!.choices.find(
  (choice) => choice.skill === 'awareness',
)!
assert.ok(
  trialSuccessPercent(awarenessTrial, JEFFERY_MITTENS.skills) >
    trialSuccessPercent(awarenessTrial),
  'Jeffery reads the scouting route better than Zuzu',
)
assert.equal(
  trialSuccessPercent(awarenessTrial, ZUZU.skills),
  trialSuccessPercent(awarenessTrial),
)
assert.equal(
  readCheckFor(JEFFERY_MITTENS, 'steel', 10).need,
  readCheck('steel', 10).need + 2,
  'the chip reads the traveler, not the default table',
)
assert.deepEqual(readCheckFor(ZUZU, 'wits', 9, 1), readCheck('wits', 9, 1))
assert.match(
  readCheckFor(JEFFERY_MITTENS, 'insight', 9).explain,
  /add Insight \+3/,
)
// The sheet shows the traveler's own table; a custom 0 never goes negative.
const zeroSteel = makeCustomCharacter({
  ...custom,
  skills: {
    steel: 0,
    awareness: 3,
    wits: 3,
    bearing: 3,
    resolve: 2,
    insight: 2,
  },
})!
assert.equal(
  v10CharacterSheet(newJourneyLedgerV10(9, zeroSteel)).skills.steel,
  0,
)
let flipped: string | null = null
for (let seed = 1; seed <= 400 && !flipped; seed++) {
  for (const location of reachableLocations(newJourneyV6(seed).journey)) {
    const opened = stepJourneyV6(newJourneyV6(seed), {
      type: 'TRAVEL',
      locationId: location,
    })
    const card = activeV6Card(opened)
    const choice = card?.choices.find(
      (entry) =>
        entry.roll?.skill === 'awareness' && !entry.requires && !entry.cost,
    )
    if (!card || !choice) continue
    const asZuzu = stepJourneyV6(
      opened,
      { type: 'CHOOSE', choiceId: choice.id },
      rulesForCharacter(ZUZU),
    )
    const asJeffery = stepJourneyV6(
      opened,
      { type: 'CHOOSE', choiceId: choice.id },
      rulesForCharacter(JEFFERY_MITTENS),
    )
    const zuzuRoll = asZuzu.outcomes.at(-1)!.roll!
    const jefferyRoll = asJeffery.outcomes.at(-1)!.roll!
    assert.deepEqual(zuzuRoll.dice, jefferyRoll.dice, 'same seed, same dice')
    assert.equal(jefferyRoll.total, zuzuRoll.total + 1)
    if (!zuzuRoll.success && jefferyRoll.success)
      flipped = `${seed}/${card.id}/${choice.id}`
  }
}
assert.ok(flipped, 'a point of awareness turns a failure into a success')

// 8. The board asks who is walking on a first visit and on every new journey,
// and the rail, tab, ledger and ending plate name that traveler.
const store = read('../../stores/shiftingLandsJourneyStore.ts')
const board = read('../../components/shifting-lands-journey-board.vue')
const rail = read('../../components/shifting-lands-character-rail.vue')
const creator = read('../../components/shifting-lands-character-creator.vue')
const workflow = read('../../.github/workflows/shifting-lands-gameplay.yml')
assert.match(store, /const SAVE_KEY = 'kr\.shiftingLands\.journeyLedger\.v10'/)
assert.match(store, /restoreJourneyLedgerV10\(JSON\.parse\(saved\)\)/)
assert.match(store, /stepJourneyLedgerV10\(active, action as JourneyActionV9\)/)
assert.match(
  store,
  /newJourneyLedgerV10\(Date\.now\(\) % 2147483647, traveler\)/,
)
assert.match(store, /needsCharacter\.value = true/)
assert.match(store, /journeyCharacter\(ledger\.value\)/)
assert.match(board, /<ShiftingLandsCharacterCreator/)
assert.match(board, /v-if="creatorOpen \|\| game\.needsCharacter"/)
assert.match(board, /game\.fresh\(traveler\)/)
assert.match(board, /:character="game\.character"/)
assert.match(board, /characterPortrait\(game\.character\)/)
assert.match(board, /label: game\.character\.name/)
assert.doesNotMatch(board, /Zuzu's travels|label: 'Zuzu'/)
assert.doesNotMatch(rail, /Zuzu/, 'the rail names whoever is walking')
assert.match(rail, /character\.name/)
assert.match(creator, /makeCustomCharacter\(draft\)/)
assert.match(creator, /\$emit\('start', chosen\)/)
assert.doesNotMatch(creator, /localStorage|\$fetch|fetch\(|Math\.random/)
assert.match(workflow, /verifyShiftingCharacterCreator\.test\.ts/)
assert.match(workflow, /components\/shifting-lands-character-creator\.vue/)

console.log(
  `Shifting Lands character creator passed: ${PLAYABLE.length} playable travelers x 500 seeds x ${LOCATIONS.length} locations with no self-encounter; ${CAST_CARDS_V10.length} cast cameo cards; V9 digest pinned; ${identical} cameo-free Zuzu V10 runs equal V9; ${interrupts} cameo interrupts; stat flip at ${flipped}`,
)
