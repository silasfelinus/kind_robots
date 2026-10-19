import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  ARCHETYPES,
  CHAPTERS,
  COMPANIONS,
  COMPANION_INTROS,
  CROSSROADS,
  ECOTONE_ART,
  ENCOUNTERS,
  ENDING_IDS,
  LENSES,
  SKILLS,
  artUrl,
} from '../ecotone/content'
import {
  CHAPTER_DRAWS,
  CROSSROADS_CHAPTER,
  buildDeck,
  cardAsides,
  LEAD_BONUS,
  advance,
  chanceToSucceed,
  chooseCrossroads,
  chooseEncounter,
  chooseIntro,
  chooseLens,
  createRun,
  restoreRun,
  rollDice,
  type RunState,
} from '../ecotone/engine'

for (const archetype of ARCHETYPES) {
  const values = SKILLS.map((skill) => archetype.skills[skill.id])
  assert.equal(
    values.reduce((sum, value) => sum + value, 0),
    6,
    `${archetype.id} spends six skill points`,
  )
  assert.ok(
    values.every((value) => value >= 0 && value <= 3),
    `${archetype.id} skills stay 0-3`,
  )
}

assert.equal(COMPANIONS.length, 4)
const openLenses = LENSES.filter((lens) => lens.open)
assert.deepEqual(
  openLenses.map((lens) => [lens.id, lens.companion]),
  [
    ['sober', 'mara'],
    ['tipsy', 'kit'],
    ['stoned', 'juniper'],
    ['tripping_balls', 'cedar'],
  ],
  'the four festival lenses introduce Mara, Kit, Juniper and Cedar',
)
assert.equal(
  LENSES.length,
  7,
  'seven opening lenses, three still being written',
)

assert.equal(ENDING_IDS.length, 56)
assert.equal(new Set(ENDING_IDS).size, 56)
assert.equal(ENDING_IDS.filter((id) => id.endsWith('.hope')).length, 28)
for (const companion of COMPANIONS) {
  assert.equal(
    ENDING_IDS.filter((id) => id.startsWith(`${companion.id}.`)).length,
    14,
  )
  assert.ok(COMPANION_INTROS[companion.id].length > 0)
  assert.ok(CROSSROADS[companion.id].length > 0)
  assert.ok(LEAD_BONUS[companion.id])
}

assert.equal(CHAPTERS.length, 6)
for (const card of ENCOUNTERS) {
  assert.ok(
    card.choices.length >= 2 && card.choices.length <= 4,
    `${card.id} offers 2-4 choices`,
  )
  assert.ok(card.provenance.length > 0, `${card.id} names its provenance`)
  for (const choice of card.choices) {
    if (choice.check) {
      assert.ok(
        [7, 9, 11].includes(choice.check.target),
        `${card.id}/${choice.id} targets 7, 9 or 11`,
      )
      assert.ok(choice.failure, `${card.id}/${choice.id} authors its failure`)
    }
  }
}

assert.deepEqual(rollDice(42, 0), rollDice(42, 0), 'dice are seeded')
for (let i = 0; i < 200; i += 1) {
  const [a, b] = rollDice(7, i)
  assert.ok(a >= 1 && a <= 6 && b >= 1 && b <= 6)
}
assert.equal(Math.round(chanceToSucceed(7) * 36), 21)
assert.equal(
  Math.round(chanceToSucceed(13) * 36),
  1,
  'boxcars always leaves a chance',
)
assert.equal(
  Math.round(chanceToSucceed(1) * 36),
  35,
  'snake eyes always leaves a risk',
)

function play(
  seed: number,
  lens: RunState['openingState'],
  accept: boolean,
  follow: boolean,
) {
  let state = createRun(seed, 'reporter')
  state = advance(chooseLens(state, lens as NonNullable<typeof lens>))
  assert.equal(state.phase, 'intro')
  state = advance(chooseIntro(state, accept))
  assert.equal(state.phase, 'encounter')
  while (state.phase === 'encounter') {
    const card = ENCOUNTERS.find(
      (c) => c.id === state.deck[state.encounterIndex],
    )
    assert.ok(
      (card?.chapter ?? 0) < CROSSROADS_CHAPTER,
      'the crossroads comes before the first chapter-3 card',
    )
    state = advance(chooseEncounter(state, card?.choices[0]?.id ?? ''))
  }
  assert.equal(state.phase, 'crossroads')
  state = advance(chooseCrossroads(state, follow))
  while (state.phase === 'encounter') {
    const card = ENCOUNTERS.find(
      (c) => c.id === state.deck[state.encounterIndex],
    )
    state = advance(chooseEncounter(state, card?.choices[1]?.id ?? ''))
  }
  return state
}

const first = play(2026, 'sober', true, true)
const again = play(2026, 'sober', true, true)
assert.deepEqual(first, again, 'same seed and choices reproduce the same run')
assert.equal(first.phase, 'end')
assert.equal(first.openingState, 'sober')
assert.equal(first.introCompanion, 'mara')
assert.equal(first.meetingOrder.length, 2)
assert.equal(first.meetingOrder[0], 'mara')
assert.notEqual(
  first.activeLead,
  'mara',
  'following the newcomer changes the guide',
)
assert.equal(first.followHistory.length, 2)
assert.equal(
  first.log.length,
  2 + Object.values(CHAPTER_DRAWS).reduce((sum, n) => sum + n, 0) + 1,
  'prologue, meeting, every drawn card and the crossroads are logged',
)

const seen = new Set<string>()
for (let seed = 1; seed < 200; seed += 1) {
  const deck = buildDeck(seed)
  assert.deepEqual(deck, buildDeck(seed), 'decks are seeded')
  assert.equal(new Set(deck).size, deck.length, 'no card repeats in a run')
  const chapters = deck.map(
    (id) => ENCOUNTERS.find((card) => card.id === id)?.chapter ?? 0,
  )
  assert.deepEqual(
    chapters,
    [...chapters].sort((a, b) => a - b),
    'cards run in chapter order',
  )
  for (const [chapter, count] of Object.entries(CHAPTER_DRAWS)) {
    assert.equal(
      chapters.filter((c) => c === Number(chapter)).length,
      count,
      `chapter ${chapter} draws ${count}`,
    )
  }
  deck.forEach((id) => seen.add(id))
}
assert.equal(seen.size, ENCOUNTERS.length, 'every card turns up across seeds')

for (const id of ['WH-121', 'WH-122', 'WH-123', 'WH-124', 'WH-125', 'WH-126']) {
  assert.ok(
    ENCOUNTERS.some((card) => card.id === id),
    `${id} is in the deck`,
  )
}
const friends = ENCOUNTERS.find((card) => card.id === 'WH-124')
assert.ok(friends?.presence, 'the zoo tribute knows whether you have met Kit')
assert.match(
  friends?.provenance ?? '',
  /appear only as actors/,
  'past zoo animals appear only as performance',
)
for (const lens of ['sober', 'tipsy', 'stoned', 'tripping_balls'] as const) {
  assert.ok(friends?.lensLines?.[lens], `the tribute reads differently ${lens}`)
}
const base = createRun(9, 'reporter')
if (friends) {
  assert.match(cardAsides(friends, base)[0] ?? '', /Someone calls her Kit/)
  assert.match(
    cardAsides(friends, {
      ...base,
      activeLead: 'kit',
      meetingOrder: ['kit'],
    })[0] ?? '',
    /I put this together/,
  )
  assert.match(
    cardAsides(friends, {
      ...base,
      activeLead: 'mara',
      meetingOrder: ['mara', 'kit'],
    })[0] ?? '',
    /waves with an otter paw/,
  )
}
const marsh = ENCOUNTERS.find((card) => card.id === 'WH-122')
if (marsh) {
  assert.match(
    cardAsides(marsh, {
      ...base,
      activeLead: 'cedar',
      meetingOrder: ['cedar'],
    })[0] ?? '',
    /grew feathers/,
  )
  assert.equal(cardAsides(marsh, base).length, 0, 'no guide, no aside')
}

const alone = play(2026, 'tripping_balls', false, false)
assert.equal(
  alone.activeLead,
  null,
  'declining and staying keeps the player alone',
)
assert.equal(alone.clarity, 1)
assert.equal(alone.introCompanion, 'cedar')

const newcomers = new Set<string>()
for (let seed = 1; seed < 60; seed += 1) {
  const run = play(seed, 'stoned', true, false)
  assert.ok(!run.newcomerOrder.includes('juniper'))
  assert.equal(new Set(run.newcomerOrder).size, 3)
  newcomers.add(run.meetingOrder[1] ?? '')
  assert.equal(run.activeLead, 'juniper')
}
assert.equal(
  newcomers.size,
  3,
  'different seeds bring different companions to the crossroads',
)

const mid = createRun(5, 'local')
const lensed = chooseLens(mid, 'tipsy')
assert.ok(lensed.pending, 'a choice waits on Continue')
assert.equal(
  chooseLens(lensed, 'sober'),
  lensed,
  'a pending result cannot be rerolled',
)
assert.equal(
  chooseLens(mid, 'mdma'),
  mid,
  'unwritten roads cannot be chosen yet',
)

const saved = JSON.parse(JSON.stringify(first))
assert.deepEqual(restoreRun(saved), first, 'saves round-trip')
assert.equal(restoreRun({ ...saved, version: 99 }), null)
assert.equal(restoreRun({ ...saved, deck: ['WH-999'] }), null)
assert.equal(restoreRun({ ...saved, activeLead: 'glenn' }), null)
assert.equal(restoreRun(null), null)

for (const asset of ECOTONE_ART) {
  assert.ok(existsSync(`public/ecotone/${asset}.webp`), `${asset} exists`)
}
assert.equal(
  artUrl('chapters/missing'),
  null,
  'unlisted art falls back to the drawn scene',
)

const page = readFileSync('pages/play/ecotone.vue', 'utf8')
assert.match(page, /<EcotoneBoard \/>/)
const tab = readFileSync('content/channels/arcade/ecotone.md', 'utf8')
assert.match(tab, /\nchannelKey: arcade\n/)
assert.match(tab, /\nroute: \/play\/ecotone\n/)
const placements = readFileSync('utils/projectPlacements.ts', 'utf8')
assert.match(
  placements,
  /'weird-humboldt': \{\s+channelKey: 'arcade',\s+tabKey: 'ecotone',\s+route: '\/play\/ecotone',/,
)
const board = readFileSync('components/ecotone-board.vue', 'utf8')
assert.ok(
  !/localStorage|\$fetch/.test(board),
  'the board leaves storage to the store',
)

console.log('Ecotone contract passed')
