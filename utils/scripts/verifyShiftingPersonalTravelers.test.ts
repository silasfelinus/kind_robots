import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  FENNEC_SIBLINGS,
  JEFFERY_MITTENS,
  PREMADE_CHARACTERS,
  ZUZU,
  characterFromSnapshot,
  makeCustomCharacter,
  type ShiftingCharacter,
} from '../shiftingLands/characters'
import {
  PERSONAL_CARDS_V10,
  V6_CARDS,
  activeV6Card,
  choiceLock,
  v6Card,
  validateDeckV6,
  type V6Choice,
} from '../shiftingLands/deckV6'
import {
  drawForCharacter,
  meetsSelf,
  validateCastCardsV10,
} from '../shiftingLands/castDeckV10'
import {
  IDENTITY_DEEDS,
  PERSONAL_CARDS,
  PERSONAL_DECK_VERSION,
  PERSONAL_OPTIONS,
  drawPersonal,
  identityDeed,
  personalCardLookup,
  personalCardsFor,
  personalOptionsFor,
  personalPool,
  validatePersonalDeckV10,
  type PersonalCard,
} from '../shiftingLands/personalDeckV10'
import {
  ALL_PERSONAL_ENDINGS,
  PERSONAL_ROAD_IDS,
  SHIPPED_PERSONAL_ENDING_PLATES,
  emptyPersonalEndingsRecord,
  personalEndingPlatePath,
  personalEndingV10,
  personalEndingsFor,
  personalScrapbook,
  personalThreadFlags,
  personalTone,
  readPersonalEndingsRecord,
  withPersonalEnding,
  type PersonalTone,
} from '../shiftingLands/personalEndings'
import { authoredEndingV7 } from '../shiftingLands/endingsV7'
import { JOURNEY_WORLD, reachableLocations } from '../shiftingLands/journey'
import { canChooseTrialV7 } from '../shiftingLands/trialRulesV7'
import { trialForLandV8 } from '../shiftingLands/trialRulesV8'
import type { JourneyActionV9 } from '../shiftingLands/saveLedgerV9'
import {
  activeCardV10,
  newJourneyLedgerV10,
  onPersonalRoad,
  restoreJourneyLedgerV10,
  stepJourneyLedgerV10,
  type JourneyLedgerV10,
} from '../shiftingLands/saveLedgerV10'

// zuzu-shifting-lands/t-053 (Silas, 2026-11-12 PT): "Shifting lands
// Characters can still have special character only events, cards, or options
// ... there's zero reason they can't be personalized to them." and "We might
// as well have custom endings for each character. Great thing for the
// scrapbook." Every premade gets its own cards, its own choices on shared
// cards, a personal thread and three endings; V10 saves from before replay
// unchanged; nobody meets themselves or sees anyone else's road.

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
const publicFile = (url: string) =>
  existsSync(fileURLToPath(new URL('../../public' + url, import.meta.url)))
const LOCATIONS: string[] = JOURNEY_WORLD.lands.flatMap((land) =>
  (land.locations as Array<{ id: string }>).map((location) => location.id),
)
const landOf = (locationId: string) =>
  JOURNEY_WORLD.lands.find((land) =>
    (land.locations as Array<{ id: string }>).some(
      (location) => location.id === locationId,
    ),
  )!.id
const rng = (seed: number) => {
  let state = seed >>> 0 || 1
  return (n: number) => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0
    return state % n
  }
}
const willa = makeCustomCharacter({
  name: 'Willa Thorn',
  species: 'otter',
  pronouns: 'they',
  skills: {
    steel: 0,
    awareness: 4,
    wits: 3,
    bearing: 2,
    resolve: 2,
    insight: 2,
  },
})!
const PLAYABLE: ShiftingCharacter[] = [...PREMADE_CHARACTERS, willa]

// 1. Content contracts, and the shape of every premade's own road.
assert.deepEqual(validateDeckV6(), [], 'V6 deck contract unchanged')
assert.deepEqual(validateCastCardsV10(), [], 'cast cameo contract unchanged')
assert.deepEqual(validatePersonalDeckV10(), [], 'personal deck contract')
assert.equal(V6_CARDS.length, 120, 'own cards never join the V6 deck')
assert.equal(PERSONAL_CARDS, PERSONAL_CARDS_V10)
assert.ok(PREMADE_CHARACTERS.length <= 13, 'the roster stays at 13 or fewer')
assert.deepEqual(
  [...PERSONAL_ROAD_IDS].sort(),
  PREMADE_CHARACTERS.map((entry) => entry.id).sort(),
  'every premade has its own road',
)
for (const character of PREMADE_CHARACTERS) {
  const cards = personalCardsFor(character.id)
  const options = personalOptionsFor(character.id)
  assert.ok(cards.length >= 3 && cards.length <= 5, `${character.id} cards`)
  assert.ok(options.length >= 2 && options.length <= 4, `${character.id} opts`)
  assert.ok(
    new Set(cards.map((card) => landOf(card.locationId))).size >= 3,
    `${character.id}'s cards span their signature lands`,
  )
  const endings = personalEndingsFor(character.id)
  assert.deepEqual(
    endings.map((ending) => ending.tone),
    ['hopeful', 'bittersweet', 'dark'],
  )
  for (const ending of endings) {
    for (const text of [
      ending.opening,
      ending.complete,
      ending.fallen,
      ending.retired,
    ])
      assert.ok(text.length >= 120, `${ending.id} reads like an ending`)
    assert.match(ending.id, /^[a-z0-9-]+$/)
  }
  assert.ok(identityDeed(character.id), `${character.id} has an identity deed`)
  for (const option of options)
    assert.deepEqual(option.choice.requires?.anyFlags, [
      identityDeed(character.id),
    ])
}
assert.deepEqual(personalCardsFor('custom'), [])
assert.deepEqual(personalOptionsFor('custom'), [])
assert.deepEqual(personalEndingsFor('custom'), [])
assert.equal(identityDeed('custom'), null)
assert.equal(
  new Set(ALL_PERSONAL_ENDINGS.map((ending) => ending.id)).size,
  ALL_PERSONAL_ENDINGS.length,
)
const identityFlags = Object.values(IDENTITY_DEEDS).map((deed) => deed.flag)
for (const card of V6_CARDS)
  for (const choice of card.choices)
    for (const effect of [choice.success, choice.failure])
      for (const flag of effect?.add_flags ?? [])
        assert.ok(!identityFlags.includes(flag), `${card.id} grants ${flag}`)

// 2. Ling and Bao: the series-bible names, with the old id and saves intact.
assert.equal(FENNEC_SIBLINGS.id, 'fennec-siblings')
assert.equal(FENNEC_SIBLINGS.name, 'Ling and Bao')
assert.match(FENNEC_SIBLINGS.blurb, /\bLing\b/)
assert.match(FENNEC_SIBLINGS.blurb, /\bBao\b/)
assert.deepEqual(
  characterFromSnapshot({ ...FENNEC_SIBLINGS, name: 'The fennec siblings' }),
  FENNEC_SIBLINGS,
  'a save made under the old display name still loads',
)
for (const name of ['Ling', 'The fennec sisters', 'Bao and Ling'])
  assert.equal(characterFromSnapshot({ ...FENNEC_SIBLINGS, name }), null)
assert.equal(
  characterFromSnapshot({ ...JEFFERY_MITTENS, name: 'The fennec siblings' }),
  null,
  'a former name belongs to its own premade only',
)

// 3. Legacy V10 is byte-for-byte what it was. This digest is the same policy
// run on origin/main before t-053 (2b2a1bc7), every playable, seeds 1-60.
function playLegacy(seed: number, character: ShiftingCharacter) {
  const roll = rng(seed * 17 + character.id.length)
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
      const open = card.choices.filter((choice) => !choiceLock(state, choice))
      action = { type: 'CHOOSE', choiceId: open[roll(open.length)]!.id }
    } else {
      const open = reachableLocations(journey).filter(
        (id) => !journey.resolved.some((result) => result.locationId === id),
      )
      action = { type: 'TRAVEL', locationId: open[roll(open.length)]! }
    }
    const next = stepJourneyLedgerV10(ledger, action)
    if (next === ledger) break
    ledger = next
  }
  return ledger
}
const legacyDigest = createHash('sha256')
const legacyRuns: JourneyLedgerV10[] = []
for (const character of PLAYABLE)
  for (let seed = 1; seed <= 60; seed++) {
    const run = playLegacy(seed, character)
    if (seed <= 6) legacyRuns.push(run)
    assert.equal('personalDeckVersion' in run, false)
    for (const outcome of run.current.outcomes)
      assert.ok(
        !PERSONAL_CARDS.some((card) => card.id === outcome.encounterId),
        'a legacy V10 journey never deals an own card',
      )
    legacyDigest.update(
      JSON.stringify([
        run.actions,
        run.current,
        run.trialResults,
        run.followerHistory,
        run.prepared,
        run.usedRewards,
      ]),
    )
  }
assert.equal(
  legacyDigest.digest('hex'),
  '4b255f67f29ba41eadc12856b3e6700b4160148881cb68c1e8c6a904541fe76a',
  'V10 journeys without a personal road replay exactly as before t-053',
)
for (const run of legacyRuns) {
  assert.deepEqual(restoreJourneyLedgerV10(clone(run)), run)
  assert.equal(
    restoreJourneyLedgerV10({
      ...clone(run),
      personalDeckVersion: PERSONAL_DECK_VERSION,
    }) === null,
    run.character.id !== 'custom',
    'a legacy premade save cannot be relabelled onto a personal road',
  )
}
const oldFennec = clone(
  legacyRuns.find((run) => run.character.id === 'fennec-siblings')!,
)
oldFennec.character.name = 'The fennec siblings'
assert.equal(
  restoreJourneyLedgerV10(oldFennec)?.character.name,
  'Ling and Bao',
  'a pre-rename fennec save restores as Ling and Bao',
)

// 4. The personal draw: own cards three times in four at their location, the
// identity-aware V10 draw everywhere else, and never anyone else's road.
const dealt = new Map<string, Set<string>>()
for (const character of PLAYABLE) {
  const seen = new Set<string>()
  for (const location of LOCATIONS) {
    const own = PERSONAL_CARDS.find(
      (card) => card.owner === character.id && card.locationId === location,
    )
    const pool = personalPool(location, character)
    let ownDeals = 0
    for (let seed = 1; seed <= 500; seed++) {
      const card = drawPersonal(seed, location, character)!
      assert.ok(card, `${character.id}/${location}/${seed}`)
      assert.equal(card.locationId, location)
      assert.equal(meetsSelf(card.id, character), false)
      assert.ok(pool.some((entry) => entry.id === card.id))
      const owner = (card as { owner?: string }).owner
      assert.ok(owner === undefined || owner === character.id, card.id)
      if (own && card.id === own.id) ownDeals++
      else
        assert.equal(
          card.id,
          drawForCharacter(seed, location, character)!.id,
          'otherwise the V10 draw is untouched',
        )
      seen.add(card.id)
    }
    if (own) {
      assert.ok(ownDeals > 300 && ownDeals < 450, `${own.id}: ${ownDeals}/500`)
    } else assert.equal(ownDeals, 0)
  }
  dealt.set(character.id, seen)
}
for (const card of PERSONAL_CARDS)
  for (const character of PLAYABLE)
    assert.equal(
      dealt.get(character.id)!.has(card.id),
      character.id === card.owner,
      `${card.id} is dealt to ${card.owner} only`,
    )

// Own choices: the owner sees them on the shared card; nobody else does.
for (const option of PERSONAL_OPTIONS)
  for (const character of PLAYABLE) {
    const card = personalCardLookup(option.cardId, character)!
    assert.equal(
      card.choices.some((choice) => choice.id === option.choice.id),
      character.id === option.owner,
      `${option.cardId}/${option.choice.id} for ${character.id}`,
    )
    assert.equal(
      v6Card(option.cardId)!.choices.some((c) => c.id === option.choice.id),
      false,
      'the shared card itself never carries an own choice',
    )
  }
for (const card of PERSONAL_CARDS)
  for (const character of PLAYABLE)
    assert.equal(
      personalCardLookup(card.id, character) !== null,
      character.id === card.owner,
    )

// 5. Full personal journeys: exact replay, the identity deed from the first
// step, every own card and own choice reached in play, and all three endings.
type Lean = 'random' | 'kind' | 'dark'
const threads = PERSONAL_ROAD_IDS.map((id) => personalThreadFlags(id)!)
const hopefulFlags = new Set(threads.flatMap((thread) => thread.hopeful))
const darkFlags = new Set(threads.flatMap((thread) => thread.dark))
// Every thread flag is one an own card or own choice can actually grant.
const granted = new Set(
  [
    ...PERSONAL_CARDS.flatMap((card) => card.choices),
    ...PERSONAL_OPTIONS.map((option) => option.choice),
  ].flatMap((choice) => [
    ...choice.success.add_flags,
    ...(choice.failure?.add_flags ?? []),
  ]),
)
for (const thread of threads)
  for (const flag of [...thread.hopeful, ...thread.dark, ...thread.redeems])
    assert.ok(granted.has(flag), `${flag} is granted on the personal road`)
assert.equal(darkFlags.size, 3)
const leaning = (choice: V6Choice, lean: Lean): boolean =>
  choice.success.add_flags.some((flag) =>
    lean === 'kind' ? hopefulFlags.has(flag) : darkFlags.has(flag),
  )
function playPersonal(
  seed: number,
  character: ShiftingCharacter,
  lean: Lean,
): JourneyLedgerV10 {
  const roll = rng(seed * 29 + character.id.length + lean.length)
  let ledger = newJourneyLedgerV10(seed, character, true)
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
      const safe = open.filter(
        (choice) =>
          lean === 'random' ||
          (choice.id !== 'coerce' && choice.id !== 'tribute'),
      )
      const from = safe.length ? safe : open
      action = { type: 'TRIAL', choiceId: from[roll(from.length)]!.id }
    } else if (journey.active) {
      const card = activeCardV10(ledger)!
      assert.equal(meetsSelf(card.id, character), false)
      const open = card.choices.filter((choice) => !choiceLock(state, choice))
      assert.ok(open.length, `${card.id} leaves a way through`)
      const own = open.filter((choice) =>
        choice.requires?.anyFlags.includes(identityDeed(character.id) ?? '-'),
      )
      const leaned =
        lean === 'random' ? [] : open.filter((choice) => leaning(choice, lean))
      const from =
        own.length && roll(2) === 0 ? own : leaned.length ? leaned : open
      action = { type: 'CHOOSE', choiceId: from[roll(from.length)]!.id }
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

const playedCards = new Set<string>()
const playedOptions = new Set<string>()
const tones = new Map<string, Set<PersonalTone>>()
let personalRuns = 0
for (const character of PLAYABLE) {
  const fresh = newJourneyLedgerV10(77, character, true)
  assert.equal(fresh.personalDeckVersion, PERSONAL_DECK_VERSION)
  assert.deepEqual(onPersonalRoad(newJourneyLedgerV10(77, character)), fresh)
  const underWay = playLegacy(3, character)
  assert.equal(onPersonalRoad(underWay), underWay, 'a started road stays put')
  const identity = identityDeed(character.id)
  assert.deepEqual(fresh.current.flags, [
    ...character.signatureFlags,
    ...(identity ? [identity] : []),
  ])
  for (const lean of ['random', 'kind', 'dark'] as const)
    for (let seed = 1; seed <= 70; seed++) {
      const run = playPersonal(seed, character, lean)
      personalRuns++
      for (const outcome of run.current.outcomes) {
        assert.equal(meetsSelf(outcome.encounterId, character), false)
        const own: PersonalCard | undefined = PERSONAL_CARDS.find(
          (card) => card.id === outcome.encounterId,
        )
        if (own) {
          assert.equal(own.owner, character.id)
          playedCards.add(own.id)
        }
        const option = PERSONAL_OPTIONS.find(
          (entry) =>
            entry.cardId === outcome.encounterId &&
            entry.choice.id === outcome.choiceId,
        )
        if (option) {
          assert.equal(option.owner, character.id)
          playedOptions.add(`${option.cardId}/${option.choice.id}`)
        }
      }
      if (seed <= 8) {
        const saved = clone(run)
        assert.deepEqual(restoreJourneyLedgerV10(saved), run, 'exact replay')
        assert.equal(
          restoreJourneyLedgerV10({ ...saved, personalDeckVersion: 99 }),
          null,
          'an unknown personal deck is refused',
        )
        if (character.id !== 'custom') {
          const { personalDeckVersion: _drop, ...unmarked } = saved
          assert.equal(
            restoreJourneyLedgerV10(unmarked),
            null,
            'a personal road cannot be replayed as a legacy one',
          )
          assert.equal(
            restoreJourneyLedgerV10({
              ...saved,
              character: character.id === 'zuzu' ? JEFFERY_MITTENS : ZUZU,
            }),
            null,
            'nobody walks another traveler’s road',
          )
        }
      }
      const phase = run.current.journey.phase
      if (!['complete', 'fallen', 'retired'].includes(phase)) continue
      const ending = personalEndingV10(
        character.id,
        run.current,
        run.trialResults,
      )
      if (character.id === 'custom') {
        assert.equal(ending, null, 'a custom traveler keeps the shared endings')
        continue
      }
      const shared = authoredEndingV7(run.current, run.trialResults)!
      assert.ok(ending, `${character.id} ${seed} ends on its own ending`)
      assert.equal(
        ending!.personal.tone,
        personalTone(character.id, run.current.flags),
      )
      const copy = personalEndingsFor(character.id).find(
        (entry) => entry.id === ending!.personal.endingId,
      )!
      assert.equal(ending!.title, copy.title)
      assert.equal(ending!.paragraphs[0], copy.opening)
      assert.equal(ending!.paragraphs.at(-1), copy[phase as 'complete'])
      assert.deepEqual(
        ending!.paragraphs.slice(1, -1),
        shared.paragraphs.slice(2),
        'the road’s own memory stays in the ending',
      )
      if (!tones.has(character.id)) tones.set(character.id, new Set())
      tones.get(character.id)!.add(ending!.personal.tone)
    }
}
for (const card of PERSONAL_CARDS)
  assert.ok(playedCards.has(card.id), `${card.owner} plays ${card.id}`)
for (const option of PERSONAL_OPTIONS)
  assert.ok(
    playedOptions.has(`${option.cardId}/${option.choice.id}`),
    `${option.owner} plays ${option.cardId}/${option.choice.id}`,
  )
for (const character of PREMADE_CHARACTERS)
  assert.deepEqual(
    [...(tones.get(character.id) ?? [])].sort(),
    ['bittersweet', 'dark', 'hopeful'],
    `${character.id} reaches all three of their endings in play`,
  )

// The tone rules themselves: dark unless redeemed, hopeful from three good
// turns, bittersweet otherwise.
assert.equal(personalTone('custom', []), null)
assert.equal(personalTone('zuzu', []), 'bittersweet')
assert.equal(
  personalTone('zuzu', [
    'zuzu-gave-the-blade',
    'zuzu-closed-the-snow-door',
    'zuzu-sang-for-the-dead',
  ]),
  'hopeful',
)
assert.equal(
  personalTone('zuzu', [
    'zuzu-gave-the-blade',
    'zuzu-closed-the-snow-door',
    'zuzu-sang-for-the-dead',
    'zuzu-took-the-snow-road',
  ]),
  'dark',
)
assert.equal(personalTone('jeffery-mittens', ['jeffery-crew-rejoined']), 'dark')
assert.equal(
  personalTone('jeffery-mittens', [
    'jeffery-crew-rejoined',
    'jeffery-crew-turned',
  ]),
  'bittersweet',
  'turning the crew redeems a night on the wall',
)
assert.equal(
  personalTone('fennec-siblings', ['ling-followed-the-voice']),
  'dark',
)

// 6. The scrapbook record: per traveler, survives new journeys, never trusts
// what storage hands it.
let record = emptyPersonalEndingsRecord()
assert.deepEqual(record, { version: 1, found: {} })
const pages = personalScrapbook(record)
assert.deepEqual(
  pages.map((page) => [page.characterId, page.name, page.found, page.total]),
  PREMADE_CHARACTERS.map((entry) => [entry.id, entry.name, 0, 3]),
)
assert.ok(pages.some((page) => page.name === 'Ling and Bao'))
record = withPersonalEnding(record, 'zuzu', 'zuzu-the-road-home-collects')
record = withPersonalEnding(record, 'zuzu', 'zuzu-a-peg-by-another-door')
assert.equal(
  withPersonalEnding(record, 'zuzu', 'zuzu-a-peg-by-another-door'),
  record,
  'a found ending is found once',
)
assert.equal(
  withPersonalEnding(record, 'zuzu', 'ling-two-bowls-both-full'),
  record,
)
assert.equal(withPersonalEnding(record, 'custom', 'anything'), record)
assert.deepEqual(record.found.zuzu, [
  'zuzu-a-peg-by-another-door',
  'zuzu-the-road-home-collects',
])
const zuzuPage = personalScrapbook(record).find(
  (p) => p.characterId === 'zuzu',
)!
assert.equal(zuzuPage.found, 2)
assert.deepEqual(
  zuzuPage.endings.map((ending) => ending.found),
  [true, false, true],
)
assert.deepEqual(readPersonalEndingsRecord(clone(record)), record)
for (const junk of [null, 'x', [], { version: 2, found: {} }, { version: 1 }])
  assert.deepEqual(
    readPersonalEndingsRecord(junk),
    emptyPersonalEndingsRecord(),
  )
assert.deepEqual(
  readPersonalEndingsRecord({
    version: 1,
    found: {
      zuzu: ['zuzu-two-countries-no-map', 'not-an-ending', 7],
      'jeffery-mittens': 'jeffery-one-pair-short',
      stranger: ['jeffery-one-pair-short'],
      __proto__: ['x'],
    },
  }),
  { version: 1, found: { zuzu: ['zuzu-two-countries-no-map'] } },
)

// 7. Art: every own card shows a shipped plate today; painted ending plates
// load from the path the ROUND-9-PERSONAL ledger exports to.
for (const card of PERSONAL_CARDS) {
  assert.ok(card.art && !card.art.startsWith('/images/'), card.id)
  assert.ok(publicFile(card.art!), `${card.art} is shipped`)
}
for (const id of SHIPPED_PERSONAL_ENDING_PLATES)
  assert.ok(publicFile(personalEndingPlatePath(id)), `${id} plate is shipped`)
assert.equal(
  personalEndingPlatePath('ling-two-bowls-both-full'),
  '/shifting-lands/endings/ling-two-bowls-both-full.webp',
)

// 8. The store owns storage; the board and creator only read it.
const store = read('../../stores/shiftingLandsJourneyStore.ts')
const board = read('../../components/shifting-lands-journey-board.vue')
const creator = read('../../components/shifting-lands-character-creator.vue')
const workflow = read('../../.github/workflows/shifting-lands-gameplay.yml')
assert.match(
  store,
  /const PERSONAL_ENDINGS_KEY = 'kr\.shiftingLands\.personalEndings\.v1'/,
)
assert.match(
  store,
  /onPersonalRoad\(\s*newJourneyLedgerV10\(Date\.now\(\) % 2147483647, traveler\),?\s*\)/,
)
assert.match(
  store,
  /notePersonalEnding\(\)\s*persist\(\)\s*awardJourneyDeeds\(active, next, action\)/,
)
assert.match(store, /readPersonalEndingsRecord\(/)
assert.match(store, /activeCardV10\(ledger\.value\)/)
assert.match(
  board,
  /:src="game\.endingPlate \?\? characterPortrait\(game\.character\)"/,
)
assert.match(board, /game\.personalScrapbookPage/)
for (const source of [board, creator])
  assert.doesNotMatch(source, /localStorage/)
assert.match(creator, /personalCardsFor\(id\)/)
assert.match(workflow, /verifyShiftingPersonalTravelers\.test\.ts/)

console.log(
  `Shifting Lands personal travelers passed: ${PERSONAL_CARDS.length} own cards, ${PERSONAL_OPTIONS.length} own choices and ${ALL_PERSONAL_ENDINGS.length} own endings for ${PREMADE_CHARACTERS.length} premades; legacy V10 digest pinned; ${personalRuns} personal journeys replayed with every own card, choice and ending reached`,
)
