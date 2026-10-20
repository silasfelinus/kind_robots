import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  ARCHETYPES,
  CHAPTERS,
  COMPANIONS,
  CROSSROADS,
  ECOTONE_ART,
  ENCOUNTERS,
  ENDING_IDS,
  ENDING_LEADS,
  LENSES,
  SKILLS,
  artUrl,
  type EventId,
  type LensId,
} from '../ecotone/content'
import {
  ALL_CARDS,
  LEAD_BONUS,
  advance,
  cardAsides,
  cardBody,
  chanceToSucceed,
  chooseBeat,
  chooseCrossroads,
  chooseEvent,
  chooseFork,
  computeEnding,
  createRun,
  fillText,
  findCard,
  mulberry32,
  restoreRun,
  rollDice,
  type RunState,
} from '../ecotone/engine'
import {
  BEATS,
  EVENTS,
  FUTURES,
  LENS_CODAS,
  ROUTES,
  SIGNATURES,
} from '../ecotone/story'

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

// Two events, two companions apiece, and the lenses each one offers.
assert.equal(COMPANIONS.length, 4)
assert.deepEqual(
  EVENTS.map((event) => [event.id, event.companions]),
  [
    ['green-ribbon', ['kit', 'juniper']],
    ['kinetic', ['cedar', 'mara']],
  ],
  'the fair leads to Kit and Juniper, the race to Cedar and Mara',
)
for (const companion of COMPANIONS) {
  const home = EVENTS.find((event) => event.id === companion.event)
  assert.ok(home?.companions.includes(companion.id), `${companion.id} home`)
  assert.ok(companion.meetAt.length > 0)
  assert.ok(CROSSROADS[companion.id].length > 0)
  assert.ok(LEAD_BONUS[companion.id])
}
assert.equal(
  LENSES.length,
  7,
  'seven opening lenses, three still being written',
)
const openLenses = LENSES.filter((lens) => lens.open).map((lens) => lens.id)
assert.deepEqual(openLenses, ['sober', 'tipsy', 'stoned', 'tripping_balls'])

// Endings: four companions plus going alone, seven lenses, two fates.
assert.deepEqual(ENDING_LEADS, ['mara', 'kit', 'juniper', 'cedar', 'alone'])
assert.equal(ENDING_IDS.length, 70)
assert.equal(new Set(ENDING_IDS).size, 70)
assert.equal(ENDING_IDS.filter((id) => id.endsWith('.hope')).length, 35)
for (const lead of ENDING_LEADS) {
  assert.equal(ENDING_IDS.filter((id) => id.startsWith(`${lead}.`)).length, 14)
  assert.ok(FUTURES[lead].hope.length && FUTURES[lead].dark.length)
  for (const lens of openLenses) {
    const signature = SIGNATURES[`${lead}.${lens}`]
    assert.ok(signature?.hope.title && signature.dark.title, `${lead}.${lens}`)
  }
}
for (const lens of openLenses) assert.ok(LENS_CODAS[lens], `${lens} coda`)

// Every card and beat is at least a binary choice with honest provenance.
assert.equal(new Set(ALL_CARDS.map((c) => c.id)).size, ALL_CARDS.length)
assert.equal(CHAPTERS.length, 6)
for (const card of ALL_CARDS) {
  const playable = card.choices.filter((choice) => !choice.locked)
  assert.ok(
    playable.length >= 2 && card.choices.length <= 4,
    `${card.id} offers 2-4 choices, at least two playable`,
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
for (const card of ENCOUNTERS) assert.equal(card.kind, 'encounter')
for (const beat of BEATS) {
  assert.equal(beat.kind, 'spine')
  assert.ok(beat.event && beat.day, `${beat.id} belongs to a route day`)
  for (const key of Object.keys(beat.variants ?? {})) {
    assert.ok(
      key === 'alone' || COMPANIONS.some((c) => c.id === key),
      `${beat.id} variant ${key}`,
    )
  }
}

for (const event of EVENTS) {
  const route = ROUTES[event.id]
  const beats = route.flatMap((step) =>
    step.kind === 'beat' ? [findCard(step.id)] : [],
  )
  assert.ok(
    beats.every((beat) => beat?.event === event.id),
    event.id,
  )
  const [area, offer, meeting] = beats
  assert.deepEqual(
    area?.choices.map((c) => c.prospect),
    event.companions,
    `${event.id}: the area choice comes first and picks the companion`,
  )
  assert.deepEqual(
    offer?.choices.map((c) => c.lens),
    event.lenses,
    `${event.id}: then the offer`,
  )
  assert.deepEqual(
    meeting?.choices.map((c) => c.meet),
    [true, false],
    `${event.id}: then meet them, or go alone`,
  )
  assert.equal(route[route.length - 1]?.kind, 'finale')
  assert.equal(route.filter((s) => s.kind === 'crossroads').length, 1)
  assert.ok(route.filter((s) => s.kind === 'fork').length >= 3)
}
assert.deepEqual(
  ROUTES.kinetic.flatMap((s) => (s.kind === 'beat' ? [s.id] : [])).slice(3),
  ['KN-4', 'KN-5', 'KN-6'],
  'the race conscripts you, crosses the bay and finishes in Ferndale',
)

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

type Plan = {
  event: EventId
  area: 0 | 1
  lens: LensId
  accept: boolean
  follow: boolean
  pick?: (n: number) => number
}

function play(seed: number, plan: Plan) {
  const pick = plan.pick ?? (() => 0)
  let state: RunState = createRun(seed, 'reporter')
  assert.equal(state.phase, 'event')
  state = advance(chooseEvent(state, plan.event))
  let guard = 0
  while (state.phase !== 'end') {
    assert.ok((guard += 1) < 100, 'runs finish')
    if (state.phase === 'fork') {
      assert.ok(state.offered.length >= 2, 'every fork offers two or more')
      assert.ok(state.offered.length <= 3)
      assert.equal(new Set(state.offered).size, state.offered.length)
      assert.ok(state.offered.every((id) => !state.played.includes(id)))
      state = chooseFork(state, state.offered[pick(state.offered.length)]!)
      continue
    }
    if (state.phase === 'crossroads') {
      state = advance(chooseCrossroads(state, plan.follow))
      continue
    }
    const card = findCard(state.card)
    assert.ok(card, 'a beat is in play')
    const choice =
      card.choices.find((c) => c.prospect && c === card.choices[plan.area]) ??
      card.choices.find((c) => c.lens === plan.lens) ??
      card.choices.find((c) => c.meet === plan.accept) ??
      card.choices.filter((c) => !c.locked)[
        pick(card.choices.filter((c) => !c.locked).length)
      ]
    state = advance(chooseBeat(state, choice?.id ?? ''))
  }
  return state
}

const fair: Plan = {
  event: 'green-ribbon',
  area: 0,
  lens: 'stoned',
  accept: true,
  follow: false,
}
const first = play(2026, fair)
assert.deepEqual(first, play(2026, fair), 'same seed and choices, same run')
assert.equal(first.prospect, 'kit', 'the acro lawn leads to Kit')
assert.equal(first.activeLead, 'kit')
assert.equal(first.openingState, 'stoned', 'the opening lens stays all run')
assert.equal(first.meetingOrder.length, 2)
assert.equal(first.ending, computeEnding(first).id)
assert.match(first.ending ?? '', /^kit\.stoned\.(hope|dark)$/)
assert.equal(new Set(first.played).size, first.played.length, 'no repeats')

const tripper = play(7, { ...fair, area: 1, lens: 'tripping_balls' })
assert.equal(tripper.prospect, 'juniper', 'the drum circle leads to Juniper')
assert.equal(tripper.openingState, 'tripping_balls')
assert.equal(tripper.clarity, 1, 'a psychedelic weekend stays psychedelic')

const loner = play(11, { ...fair, accept: false, follow: false })
assert.equal(loner.activeLead, null)
assert.match(loner.ending ?? '', /^alone\.stoned\./, 'going alone has endings')

const race: Plan = {
  event: 'kinetic',
  area: 0,
  lens: 'tipsy',
  accept: true,
  follow: true,
}
const racer = play(3, race)
assert.equal(racer.prospect, 'cedar', 'pit row leads to Cedar')
for (const id of ['KN-4', 'KN-5', 'KN-6'])
  assert.ok(racer.played.includes(id), `every race run reaches ${id}`)
assert.notEqual(racer.activeLead, 'cedar', 'following changes the guide')
assert.equal(racer.followHistory.length, 2)
assert.equal(play(3, { ...race, area: 1 }).prospect, 'mara')

// The race's party lenses are still being written.
let party = advance(chooseEvent(createRun(5, 'local'), 'kinetic'))
party = advance(chooseBeat(party, 'pit'))
assert.equal(party.card, 'KN-2')
assert.equal(chooseBeat(party, 'fast-track'), party, 'locked roads stay shut')
const drink = chooseBeat(party, 'tipsy')
assert.ok(drink.pending, 'a choice waits on Continue')
assert.equal(chooseBeat(drink, 'sober'), drink, 'no rerolling a result')

// Variants follow the companion the opening led you toward.
const gr2 = findCard('GR-2')
const kitSide = { ...createRun(1, 'reporter'), prospect: 'kit' as const }
assert.ok(gr2)
assert.notDeepEqual(
  cardBody(gr2, kitSide),
  cardBody(gr2, { ...kitSide, prospect: 'juniper' }),
)
assert.equal(fillText('Travel with {companion}', kitSide), 'Travel with Kit')

const newcomers = new Set<string>()
const reached = new Set<string>()
const fates = new Set<string>()
for (let seed = 1; seed < 1500; seed += 1) {
  const next = mulberry32(seed)
  const plan: Plan = {
    event: seed % 2 ? 'kinetic' : 'green-ribbon',
    area: seed % 4 < 2 ? 0 : 1,
    lens: (seed % 2
      ? ['sober', 'tipsy']
      : ['sober', 'stoned', 'tripping_balls'])[
      (seed % 3) % (seed % 2 ? 2 : 3)
    ] as LensId,
    accept: next() < 0.6,
    follow: next() < 0.5,
    pick: (n) => Math.floor(next() * n),
  }
  const run = play(seed, plan)
  assert.ok(run.prospect && !run.newcomerOrder.includes(run.prospect))
  newcomers.add(run.meetingOrder[1] ?? '')
  run.played.forEach((id) => reached.add(id))
  reached.add(run.ending ?? '')
  fates.add(`${run.event}.${run.ending?.split('.')[2]}`)
}
assert.equal(newcomers.size, 4, 'different seeds bring different newcomers')
for (const card of ALL_CARDS)
  assert.ok(reached.has(card.id), `${card.id} turns up in play`)
for (const fate of [
  'green-ribbon.hope',
  'green-ribbon.dark',
  'kinetic.hope',
  'kinetic.dark',
])
  assert.ok(fates.has(fate), `${fate} is reachable`)
const written = ENDING_LEADS.flatMap((lead) =>
  openLenses.flatMap((lens) => [
    `${lead}.${lens}.hope`,
    `${lead}.${lens}.dark`,
  ]),
)
const missing = written.filter((id) => !reached.has(id))
assert.ok(
  missing.length <= 4,
  `written endings are reachable; missed ${missing}`,
)

// Asides know who you are traveling with.
const base = createRun(9, 'reporter')
const friends = findCard('WH-124')
assert.ok(friends?.presence, 'the zoo tribute knows whether you have met Kit')
assert.match(
  friends.provenance,
  /appear only as actors/,
  'past zoo animals appear only as performance',
)
for (const lens of openLenses)
  assert.ok(friends.lensLines?.[lens], `the tribute reads differently ${lens}`)
assert.match(cardAsides(friends, base)[0] ?? '', /Someone calls her Kit/)
assert.match(
  cardAsides(friends, {
    ...base,
    activeLead: 'kit',
    meetingOrder: ['kit'],
  })[0] ?? '',
  /I put this together/,
)
const marsh = findCard('WH-122')
assert.ok(marsh)
assert.match(
  cardAsides(marsh, {
    ...base,
    activeLead: 'cedar',
    meetingOrder: ['cedar'],
  })[0] ?? '',
  /grew feathers/,
)
assert.equal(cardAsides(marsh, base).length, 0, 'no guide, no aside')
const conscripted = findCard('KN-4')
assert.ok(conscripted)
assert.match(cardAsides(conscripted, base)[0] ?? '', /strangers adopts you/)

const saved = JSON.parse(JSON.stringify(first))
assert.deepEqual(restoreRun(saved), first, 'saves round-trip')
assert.equal(restoreRun({ ...saved, version: 2 }), null, 'old saves restart')
assert.equal(restoreRun({ ...saved, played: ['WH-999'] }), null)
assert.equal(restoreRun({ ...saved, activeLead: 'glenn' }), null)
assert.equal(restoreRun({ ...saved, event: 'burning-man' }), null)
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
