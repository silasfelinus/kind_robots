import assert from 'node:assert/strict'
import {
  DEFAULT_ECOTONE_ART_STYLE,
  ECOTONE_ART_STYLES,
  STYLE_RENDERS,
  ecotoneArtFirst,
  ecotoneArtSrc,
  normalizeEcotoneArtStyle,
} from '../ecotone/artStyles'
import { PLAYBOOK_ART_LANES } from '../playbook/artLanes'
import {
  cardArtKey,
  ecotoneArtSlots,
  endingArtKey,
  outcomeArtKey,
} from '../ecotone/artSlots'
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
  drawFork,
  fillText,
  findCard,
  mulberry32,
  restoreRun,
  rollDice,
  type RunState,
} from '../ecotone/engine'
import { QUEST_CARDS } from '../ecotone/questExpansion'
import { REGIONAL_SCRIPTS } from '../ecotone/regionalQuestFactory'
import { REGIONAL_REVISIONS } from '../ecotone/regionalSecondDraft'
import { REGIONAL_CALLBACKS } from '../ecotone/regionalCallbacks'
import { earnedQuestCallbacks } from '../ecotone/finaleExpansion'
import {
  allConceptArtPitches,
  encounterArtPitches,
  endingArtPitches,
} from '../ecotone/conceptArtPitches'
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
    ['quiet', ['juniper', 'kit']],
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
assert.equal(LENSES.length, 7, 'seven fully authored voluntary opening lenses')
const openLenses = LENSES.filter((lens) => lens.open).map((lens) => lens.id)
const establishedLenses: LensId[] = [
  'sober',
  'tipsy',
  'stoned',
  'tripping_balls',
]
assert.deepEqual(openLenses, [
  'sober',
  'tipsy',
  'stoned',
  'tripping_balls',
  'cocaine',
  'meth',
  'mdma',
])

// Endings: four companions plus going alone, seven lenses, two fates.
assert.deepEqual(ENDING_LEADS, [
  'mara',
  'kit',
  'juniper',
  'cedar',
  'alone',
  'ecotopia',
])
assert.equal(ENDING_IDS.length, 84)
assert.equal(new Set(ENDING_IDS).size, 84)
assert.equal(ENDING_IDS.filter((id) => id.endsWith('.hope')).length, 42)
for (const lead of ENDING_LEADS) {
  assert.equal(ENDING_IDS.filter((id) => id.startsWith(`${lead}.`)).length, 14)
  assert.ok(FUTURES[lead].hope.length && FUTURES[lead].dark.length)
  for (const lens of openLenses) {
    const signature = SIGNATURES[`${lead}.${lens}`]
    assert.ok(signature?.hope.title && signature.dark.title, `${lead}.${lens}`)
  }
}
for (const lens of openLenses) assert.ok(LENS_CODAS[lens], `${lens} coda`)

// Full regional manuscript: 120 canonical seed IDs, every choice and result written.
const canonical = ENCOUNTERS.filter(
  (c) => /^WH-\d{3}$/.test(c.id) && Number(c.id.slice(3)) <= 120,
)
assert.equal(
  canonical.length,
  120,
  'all 120 canonical regional quests exist as cards',
)
assert.equal(new Set(canonical.map((c) => c.id)).size, 120)
assert.equal(REGIONAL_SCRIPTS.length, 111, '111 expanded regional manuscripts')
assert.equal(Object.keys(REGIONAL_REVISIONS).length, 13)
const secondDraftLensCards = [
  'WH-014',
  'WH-026',
  'WH-052',
  'WH-074',
  'WH-094',
  'WH-114',
]
for (const [id, revision] of Object.entries(REGIONAL_REVISIONS)) {
  const card = findCard(id)
  assert.ok(card, `${id} second draft preserves the original encounter`)
  assert.equal(
    card.choices.length,
    2 + revision.choices.length,
    `${id} adds a genuine alternative rather than replacing a base choice`,
  )
  assert.ok(card.choices.length <= 4)
  for (const added of revision.choices) {
    assert.ok(
      card.choices.some((choice) => choice.id === added.id),
      `${id}/${added.id} is playable`,
    )
    assert.ok(added.success.effects.flag, `${id}/${added.id} is remembered`)
    if (added.check)
      assert.ok(
        added.failure?.text && added.failure.effects.flag,
        `${id}/${added.id} has an authored, remembered failure`,
      )
  }
}
for (const id of secondDraftLensCards) {
  const lines = findCard(id)?.lensLines
  for (const lens of openLenses)
    assert.ok(
      lines?.[lens] && lines[lens]!.length > 75,
      `${id} has a distinct scene aside for ${lens}`,
    )
}
assert.match(
  cardAsides(findCard('WH-115')!, {
    ...createRun(18, 'reporter'),
    flags: ['wh_052_buoy_contract'],
  }).join(' '),
  /laminated copy of the buoy contract/,
  'the later ballot remembers the earlier labor bargain',
)
assert.match(
  cardAsides(findCard('WH-120')!, {
    ...createRun(18, 'reporter'),
    flags: ['wh_114_waterline_warning'],
  }).join(' '),
  /bright waterline tape/,
  'the county future remembers the earlier warning',
)
for (const card of canonical) {
  assert.ok(
    card.body.length >= 2,
    `${card.id} has a playable illustrated scene`,
  )
  assert.ok(card.choices.length >= 2, `${card.id} has a real dilemma`)
  for (const choice of card.choices) {
    assert.ok(choice.label.length > 15, `${card.id} has an actionable choice`)
    assert.ok(
      choice.success.text.length > 30,
      `${card.id} has a written outcome`,
    )
    if (choice.check)
      assert.ok(
        choice.failure?.text.length,
        `${card.id} has an authored failed check`,
      )
  }
}
const allPitchEntries = allConceptArtPitches()
const allPitchKeys = allPitchEntries.map((p) => p.key)
assert.equal(
  new Set(allPitchKeys).size,
  allPitchKeys.length,
  'art brief keys are unique',
)
const allPitchByKey = new Map(allPitchEntries.map((p) => [p.key, p]))
for (const card of ALL_CARDS) {
  assert.ok(
    allPitchByKey.has(cardArtKey(card.id)),
    `${card.id} has an intro brief`,
  )
  for (let index = 1; index < card.body.length; index++)
    assert.ok(
      allPitchByKey.has(`paragraphs/${card.id.toLowerCase()}/${index + 1}`),
      `${card.id} has concept art for body paragraph ${index + 1}`,
    )
  for (const choice of card.choices.filter((choice) => !choice.locked)) {
    assert.ok(
      allPitchByKey.has(outcomeArtKey(card.id, choice.id, 'success')),
      `${card.id}/${choice.id} has a success image brief`,
    )
    if (choice.failure)
      assert.ok(
        allPitchByKey.has(outcomeArtKey(card.id, choice.id, 'failure')),
        `${card.id}/${choice.id} has a failure image brief`,
      )
  }
}
for (const id of ENDING_IDS) {
  assert.ok(allPitchByKey.has(endingArtKey(id)), `${id} has ending concept art`)
  for (const span of ['one-year', 'ten-year', 'thirty-year'])
    assert.ok(
      allPitchByKey.has(`epilogues/${id.replaceAll('.', '-')}/${span}`),
      `${id} has its ${span} illustration brief`,
    )
}
assert.ok(encounterArtPitches().length > 500)
assert.equal(endingArtPitches().length, ENDING_IDS.length * 4)
assert.equal(
  REGIONAL_CALLBACKS.length,
  26,
  'twenty-six precise optional regional payoffs',
)
for (const callback of REGIONAL_CALLBACKS) {
  assert.ok(
    findCard(callback.id)?.choices.some(
      (choice) =>
        choice.success.effects.flag === callback.flag ||
        choice.failure?.effects.flag === callback.flag,
    ),
    `${callback.id}/${callback.choice} is tied to a real outcome flag`,
  )
  assert.ok(
    earnedQuestCallbacks([callback.flag], [callback.id]).includes(
      callback.text,
    ),
    `${callback.id}/${callback.choice} is shown only when earned`,
  )
  assert.ok(
    !earnedQuestCallbacks([callback.flag], []).includes(callback.text),
    `${callback.id}/${callback.choice} cannot be attributed to an unplayed encounter`,
  )
  const pitch = allPitchByKey.get(
    `callbacks/${callback.id.toLowerCase()}/${callback.choice}`,
  )
  assert.ok(
    pitch?.sourceConditions.includes(`flag:${callback.flag}`),
    `${callback.id}/${callback.choice} has a source-grounded art brief`,
  )
}
assert.ok(allPitchEntries.every((p) => p.status === 'editorial-draft'))
assert.ok(
  allPitchEntries.every(
    (p) => p.mustNotImply.length > 0 && p.sourceConditions.length > 0,
  ),
)

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
  assert.ok(
    (area?.choices.length ?? 0) >= 2,
    `${event.id}: the first choice is at least binary`,
  )
  assert.deepEqual(
    area?.choices.flatMap((c) => (c.prospect ? [c.prospect] : [])),
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
  ['KN-4', 'KN-7', 'KN-5', 'KN-8', 'KN-6'],
  'the race conscripts you at the noon whistle, then road, dunes, bay, Table Bluff and the Eel River to Ferndale',
)
assert.deepEqual(
  ['KN-4', 'KN-7', 'KN-5', 'KN-8', 'KN-6'].map((id) => findCard(id)?.scene),
  ['plaza', 'dunes', 'bay', 'highway', 'rivermouth'],
  'over road, over dunes and across water, like the real race',
)
// Sinking is a story, not a punishment: every failed bay crossing sinks the slug and bonds the crew.
for (const choice of findCard('KN-5')?.choices ?? []) {
  assert.equal(choice.failure?.effects.flag, 'slug_sank', choice.id)
  assert.ok((choice.failure?.effects.goodwill ?? 0) >= 1, choice.id)
}
// The race's own sculptures come back all weekend.
for (const float of [
  'Rainbow Shrimp',
  'Fogbreather',
  'Loan Shark',
  'Snerfmobile',
])
  assert.ok(
    BEATS.filter(
      (beat) =>
        beat.event === 'kinetic' && JSON.stringify(beat).includes(float),
    ).length >= 3,
    `${float} returns`,
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
  area: 0 | 1 | 2
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
      (card.choices.some((c) => c.prospect) ? card.choices[plan.area] : null) ??
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
for (const id of ['KN-4', 'KN-7', 'KN-5', 'KN-8', 'KN-6'])
  assert.ok(racer.played.includes(id), `every race run reaches ${id}`)
assert.notEqual(racer.activeLead, 'cedar', 'following changes the guide')
assert.equal(racer.followHistory.length, 2)
assert.equal(play(3, { ...race, area: 1 }).prospect, 'mara')

// Newly authored lenses survive their opening, route and ending without a forced moral fate.
for (const lens of ['cocaine', 'mdma'] as LensId[]) {
  for (const area of [0, 1] as const) {
    const endingRun = play(2100 + area, {
      event: 'kinetic',
      area,
      lens,
      accept: true,
      follow: true,
    })
    assert.equal(endingRun.openingState, lens)
    assert.ok(endingRun.ending?.includes(`.${lens}.`))
  }
}
for (const area of [0, 1] as const) {
  const endingRun = play(2200 + area, {
    event: 'green-ribbon',
    area,
    lens: 'meth',
    accept: true,
    follow: true,
  })
  assert.equal(endingRun.openingState, 'meth')
  assert.ok(endingRun.ending?.includes('.meth.'))
}

// The race's party lenses are playable, and a choice never silently rerolls.
let party = advance(chooseEvent(createRun(5, 'local'), 'kinetic'))
party = advance(chooseBeat(party, 'pit'))
assert.equal(party.card, 'KN-2')
assert.ok(
  chooseBeat(party, 'fast-track').pending,
  'fast-track opening is authored and playable',
)
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
for (let seed = 1; seed < 4000; seed += 1) {
  const next = mulberry32(seed)
  const plan: Plan = {
    event: (['kinetic', 'green-ribbon', 'quiet'] as const)[seed % 3]!,
    area: (seed % 3 === 2
      ? Math.floor(next() * 3)
      : seed % 4 < 2
        ? 0
        : 1) as Plan['area'],
    lens: (seed % 3 === 0
      ? ['sober', 'tipsy']
      : ['sober', 'stoned', 'tripping_balls'])[
      Math.floor(next() * (seed % 3 === 0 ? 2 : 3))
    ] as LensId,
    accept: next() < 0.6,
    follow: next() < 0.5,
    pick: (n) => Math.floor(next() * n),
  }
  const run = play(seed, plan)
  assert.ok(!run.prospect || !run.newcomerOrder.includes(run.prospect))
  newcomers.add(run.meetingOrder[1] ?? '')
  run.played.forEach((id) => reached.add(id))
  reached.add(run.ending ?? '')
  fates.add(`${run.event}.${run.ending?.split('.')[2]}`)
}
newcomers.delete('')
assert.equal(newcomers.size, 4, 'different seeds bring different newcomers')
for (const card of ALL_CARDS) {
  const quest = QUEST_CARDS.find((candidate) => candidate.id === card.id)
  if (quest?.requiresLens && !establishedLenses.includes(quest.requiresLens))
    continue
  assert.ok(reached.has(card.id), `${card.id} turns up in play`)
}
for (const chapter of [1, 2, 3, 4, 5, 6])
  assert.ok(
    Object.values(ROUTES).some((route) =>
      route.some(
        (step) => step.kind === 'fork' && step.pools.includes(chapter),
      ),
    ),
    `chapter ${chapter} has at least one playable seeded route`,
  )
for (const lens of openLenses)
  assert.ok(
    BEATS.some((beat) =>
      beat.choices.some((choice) => choice.lens === lens && !choice.locked),
    ),
    `the ${lens} opening is playable`,
  )
for (const branch of ['cocaine', 'meth', 'mdma'] as LensId[])
  assert.ok(
    QUEST_CARDS.some((card) => card.requiresLens === branch),
    `${branch} has its authored personal quest`,
  )

for (const fate of [
  'green-ribbon.hope',
  'green-ribbon.dark',
  'kinetic.hope',
  'kinetic.dark',
  'quiet.hope',
  'quiet.dark',
])
  assert.ok(fates.has(fate), `${fate} is reachable`)
const written = ENDING_LEADS.flatMap((lead) =>
  ['sober', 'tipsy', 'stoned', 'tripping_balls']
    .filter((lens) => lead !== 'ecotopia' || lens !== 'tipsy')
    .flatMap((lens) => [`${lead}.${lens}.hope`, `${lead}.${lens}.dark`]),
)
const missing = written.filter((id) => !reached.has(id))
assert.ok(
  missing.length <= 4,
  `written endings are reachable; missed ${missing}`,
)

// The Quiet Way: a third, contemplative opening, with the solo path right away.
const trail = play(21, {
  event: 'quiet',
  area: 2,
  lens: 'sober',
  accept: false,
  follow: false,
})
assert.equal(trail.prospect, null, 'the deer trail leads to nobody')
assert.ok(!trail.played.includes('QW-3'), 'no one to meet, so no meeting')
assert.ok(trail.played.includes('QW-4') && trail.played.includes('QW-5'))
assert.match(trail.ending ?? '', /^ecotopia\.sober\.(hope|dark)$/)
assert.ok(trail.meetingOrder.length === 1, 'a loner still meets a newcomer')
const marshRun = play(22, {
  event: 'quiet',
  area: 0,
  lens: 'stoned',
  accept: true,
  follow: false,
})
assert.equal(marshRun.prospect, 'juniper', 'the marsh leads to Juniper')
assert.match(marshRun.ending ?? '', /^juniper\.stoned\./)
assert.equal(play(23, { ...fair, event: 'quiet', area: 1 }).prospect, 'kit')
// With a much bigger regional deck, the quiet route still offers the animal-first
// choices needed for its earned Wild Way ending.
for (let seed = 1; seed < 40; seed += 1) {
  const state: RunState = { ...createRun(seed, 'gardener'), event: 'quiet' }
  for (const [index, step] of ROUTES.quiet.entries()) {
    if (
      step.kind !== 'fork' ||
      !step.pools.some((pool) => pool === 1 || pool === 2)
    )
      continue
    assert.ok(
      drawFork(state, index).some((id) =>
        findCard(id)?.choices.some((choice) => choice.wild),
      ),
      `seed ${seed}, quiet fork ${index} offers a wild choice`,
    )
  }
}

// Keep choosing the animals and the Wild Way is paradise; drift and it is the hermit.
function wildRun(seed: number, wild: boolean) {
  let state = advance(chooseEvent(createRun(seed, 'gardener'), 'quiet'))
  while (state.phase !== 'end') {
    if (state.pending) state = advance(state)
    else if (state.phase === 'fork') {
      const animal = state.offered.find((id) =>
        findCard(id)?.choices.some((c) => c.wild),
      )
      state = chooseFork(
        state,
        wild ? (animal ?? state.offered[0]!) : state.offered[0]!,
      )
    } else if (state.phase === 'crossroads')
      state = chooseCrossroads(state, false)
    else {
      const card = findCard(state.card)!
      const open = card.choices.filter((c) => !c.locked)
      const pickChoice =
        open.find((c) => c.lens === 'sober') ??
        open.find((c) => c.meet === false) ??
        (wild
          ? open.find((c) => c.wild)
          : open.find((c) => !c.wild && !c.prospect)) ??
        open[0]!
      state = chooseBeat(state, pickChoice.id)
    }
  }
  return state
}
for (let seed = 1; seed < 40; seed += 1) {
  const keen = wildRun(seed, true)
  assert.ok(keen.wild >= 4, 'an animal-first run can always reach the target')
  assert.equal(keen.ending, 'ecotopia.sober.hope', 'consistency earns paradise')
  const drifting = wildRun(seed, false)
  assert.equal(drifting.ending, 'ecotopia.sober.dark', 'drifting is the hermit')
}
assert.match(FUTURES.ecotopia.dark.join(' '), /retire to a cabin/)

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
const bluff = findCard('KN-8')
assert.ok(bluff)
assert.equal(cardAsides(bluff, base).length, 0, 'still afloat, nothing to say')
const sunk = { ...base, flags: ['slug_sank'] }
const sunkAsides = cardAsides(bluff, sunk)
assert.match(sunkAsides[0] ?? '', /bailed it with buckets/)
assert.match(sunkAsides[1] ?? '', /Captain Glug/, 'the crew remembers')
assert.match(
  cardAsides(bluff, {
    ...sunk,
    activeLead: 'mara',
    meetingOrder: ['mara'],
  })[1] ?? '',
  /grease pencil/,
  'your guide remembers going under with you',
)

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

// Art styles (t-039): view-only, the Shifting Desks way.
assert.deepEqual(
  ECOTONE_ART_STYLES.map((style) => style.id),
  ['zimage', 'krea2', 'arthemy', 'novacomic', 'storybook'],
  'the four checkpoints Silas picked, plus the drawn Storybook',
)
for (const style of ECOTONE_ART_STYLES)
  if (style.lane)
    assert.ok(
      PLAYBOOK_ART_LANES.some((lane) => lane.key === style.lane),
      `${style.id} has a generation lane`,
    )
assert.equal(DEFAULT_ECOTONE_ART_STYLE, 'zimage')
assert.equal(normalizeEcotoneArtStyle('nonsense'), 'zimage')
assert.equal(normalizeEcotoneArtStyle(null), 'zimage')
assert.equal(
  normalizeEcotoneArtStyle('painted'),
  'zimage',
  'a saved Painted choice keeps Z-Image',
)
assert.equal(
  ecotoneArtSrc('companions/kit', 'novacomic'),
  '/ecotone/companions/kit.webp',
  'a style falls back to the shipped painting until its render lands',
)
assert.equal(
  ecotoneArtSrc('companions/kit', 'storybook'),
  null,
  'Storybook shows the drawn scene',
)
assert.equal(ecotoneArtSrc('chapters/missing', 'zimage'), null)
assert.equal(ecotoneArtSrc(undefined, 'zimage'), null)
for (const [style, renders] of Object.entries(STYLE_RENDERS))
  for (const asset of renders ?? [])
    assert.ok(
      existsSync(`public/ecotone/styles/${style}/${asset}.webp`),
      `${style} ships ${asset}`,
    )
// The art standard (t-042): every card, every outcome and every ending has a slot.
const slots = ecotoneArtSlots()
assert.equal(slots.cards.length, BEATS.length + ENCOUNTERS.length)
assert.equal(slots.endings.length, ENDING_IDS.length)
const allSlots = [...slots.cards, ...slots.outcomes, ...slots.endings]
assert.equal(new Set(allSlots).size, allSlots.length, 'slots are unique')
assert.ok(slots.outcomes.includes(outcomeArtKey('KN-5', 'pedal', 'failure')))
assert.ok(slots.cards.includes(cardArtKey('KN-7')))
assert.equal(endingArtKey('mara.sober.hope'), 'endings/mara-sober-hope')
for (const [style, renders] of Object.entries(STYLE_RENDERS))
  for (const asset of renders ?? [])
    assert.ok(
      allSlots.includes(asset) || ECOTONE_ART.includes(asset),
      `${style} ${asset} is a known picture`,
    )
for (const entry of racer.log.filter((e) => e.source.startsWith('KN-')))
  assert.ok(
    entry.art && slots.outcomes.includes(entry.art),
    `${entry.source} records its outcome picture`,
  )
assert.equal(
  ecotoneArtFirst([cardArtKey('WH-999'), 'companions/kit'], 'krea2'),
  '/ecotone/companions/kit.webp',
  'an unrendered slot falls back to the shared picture',
)
assert.equal(ecotoneArtFirst([cardArtKey('WH-999')], 'zimage'), null)
assert.match(board, /provide\(ECOTONE_ART_STYLE_INJECTION, artStyle\)/)
assert.match(board, /watch\(artStyle, saveEcotoneArtStyle\)/)
assert.match(board, /role="radiogroup"/)
const sceneFile = readFileSync('components/ecotone-scene.vue', 'utf8')
assert.match(sceneFile, /inject<Ref<EcotoneArtStyle>>/)
const playStore = readFileSync('stores/ecotoneStore.ts', 'utf8')
assert.ok(!/artStyle/.test(playStore), 'the style never enters the run')

console.log('Ecotone contract passed')
