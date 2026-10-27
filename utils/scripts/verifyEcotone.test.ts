import './verifyEcotoneClarityRecovery.test'
import './verifyEcotoneAdversarial.test'
import './verifyEcotoneCausalForest.test'
import './verifyEcotoneCausalQuiet.test'
import './verifyEcotoneCausalKinetic.test'
import './verifyEcotoneSoloRepair.test'
import './verifyEcotonePerks.test'
import './verifyEcotoneSceneOffers.test'
import './verifyEcotoneJuniperAgency.test'
import './verifyEcotonePlaystyles.test'
import './verifyEcotoneEditorial.test'
import './verifyEcotoneOnboarding.test'
import './verifyEcotoneEnsemble.test'
import './verifyEcotoneHangouts.test'
import './verifyEcotoneAtlas.test'
import './verifyEcotoneArtPrompts.test'
import { ART_REVIEW_ROUNDS } from '../ecotone/artReview'
import {
  isEcotoneReviewHeldArt,
  isEcotoneReviewHeldArtSubject,
} from '../ecotone/reviewHold'
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
  checkBonus,
  chooseBeat,
  chooseCrossroads,
  chooseEvent,
  chooseFork,
  chooseSubstanceMoment,
  computeEnding,
  createRun,
  drawFork,
  encounterEligible,
  fillText,
  findCard,
  mulberry32,
  restoreRun,
  rollDice,
  type RunState,
} from '../ecotone/engine'
import { philosophyNeedles, VALUE_AXES } from '../ecotone/valueNeedles'
import { QUEST_CARDS } from '../ecotone/questExpansion'
import {
  SUBSTANCE_CHOICES,
  momentPerspective,
  substanceEpilogue,
  substanceSceneLine,
  substanceSummary,
} from '../ecotone/substanceArc'
import { REGIONAL_SCRIPTS } from '../ecotone/regionalQuestFactory'
import { REGIONAL_REVISIONS } from '../ecotone/regionalSecondDraft'
import { REGIONAL_LENS_VOICES } from '../ecotone/regionalLensVoices'
import { FORMER_GUIDE_QUESTS } from '../ecotone/formerGuideQuests'
import {
  OPENING_LENS_ADDITIONS,
  availableOpeningLenses,
  openingLensChoices,
} from '../ecotone/openingLensChoices'
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

// The Wiyot/Tuluwat pre-consultation hold must fail closed everywhere a
// reviewer or player might see unreviewed material. Independent fiction stays.
assert.ok(!ENCOUNTERS.some((card) => card.id === 'WH-121'))
assert.equal(findCard('WH-121'), null)
assert.ok(ENCOUNTERS.some((card) => card.id === 'WH-037'))
assert.ok(
  !/tribal|reservation|grant/i.test(
    COMPANIONS.find((c) => c.id === 'mara')!.bio,
  ),
)
for (const key of [
  'cards/wh-121',
  'outcomes/wh-121/reading-success',
  'encounters/wh-121-latitude-argument',
  'companions/mara',
  'endings/mara-sober-hope',
  'endings/ecotopia-mdma-dark',
  'cards/kn-1',
  'outcomes/kn-1/flash-success',
]) {
  assert.ok(isEcotoneReviewHeldArt(key), `${key} is held`)
  assert.equal(ecotoneArtSrc(key, 'krea2'), null)
  assert.equal(artUrl(key), null)
}
assert.ok(
  ART_REVIEW_ROUNDS.every((round) =>
    round.subjects.every((subject) => !isEcotoneReviewHeldArtSubject(subject)),
  ),
  'review gallery cannot display held prompts or preview jobs',
)
const heldBase = advance(chooseEvent(createRun(5, 'local'), 'kinetic'))
const historicSave = {
  ...heldBase,
  phase: 'beat' as const,
  step: 4,
  card: 'WH-121',
  offered: ['WH-121'],
  played: ['WH-121'],
  flags: ['mad_river_peace'],
  evidence: ['A latitude from another county'],
  log: [
    {
      source: 'WH-121',
      title: 'The Latitude Argument',
      choice: 'Help him take the reading',
      roll: null,
      text: 'You held the horizon for the expedition',
      effects: {},
    },
  ],
}
const heldRestored = restoreRun(historicSave)
assert.ok(
  heldRestored,
  'older saves advance past the held scene rather than being discarded',
)
assert.notEqual(heldRestored.card, 'WH-121')
assert.ok(!heldRestored.offered.includes('WH-121'))
assert.ok(!heldRestored.played.includes('WH-121'))
assert.ok(!heldRestored.log.some((entry) => entry.source === 'WH-121'))
assert.ok(!heldRestored.flags.includes('mad_river_peace'))
assert.ok(!heldRestored.evidence.includes('A latitude from another county'))

// Sixth pass: eight independent civic and comic encounters. All base outcomes
// remain distinct, and the six reading kits must use the same authored copy.
const sixthPassScenes = [
  'WH-017',
  'WH-022',
  'WH-044',
  'WH-045',
  'WH-069',
  'WH-084',
  'WH-103',
  'WH-109',
]
for (const id of sixthPassScenes) {
  const script = REGIONAL_SCRIPTS.find((entry) => entry.id === id)!
  assert.ok(script, `${id} sixth-pass encounter exists`)
  assert.ok(
    script.pressure.length > 270 &&
      script.success.length > 260 &&
      script.failure.length > 260 &&
      script.helpOutcome.length > 260,
    `${id} has a full conflict, earned win, genuine loss and care consequence`,
  )
  assert.notEqual(script.success, script.failure)
  assert.notEqual(script.helpOutcome, script.success)
  assert.notEqual(script.helpOutcome, script.failure)
}
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
// Every regional encounter must match its live script and editor-facing manuscript.
// Coverage includes all 111 regional cards, not just the first three batches.
for (const script of REGIONAL_SCRIPTS) {
  const id = script.id
  const chapter = String(script.chapter).padStart(2, '0')
  const manuscript = readFileSync(
    `docs/ecotone/text-kit/chapter-${chapter}.md`,
    'utf8',
  )
  const playable = findCard(id)!
  assert.deepEqual(
    playable.body,
    [script.premise, script.pressure],
    `${id} still has the two authored beats after editing`,
  )
  for (const line of [
    script.pressure,
    script.investigate,
    script.help,
    script.success,
    script.failure,
    script.helpOutcome,
  ])
    assert.ok(
      manuscript.includes(line),
      `${id} playable choice/outcome text is mirrored in the editor's reading kit`,
    )
}
const legacyLensCard = findCard('WH-021')!
assert.equal(
  openLenses.filter((lens) => Boolean(legacyLensCard.lensLines?.[lens])).length,
  7,
  'Moonstone picnic must support every voluntary opening lens',
)
const redlineLensCards = [
  'WH-005',
  'WH-028',
  'WH-047',
  'WH-065',
  'WH-086',
  'WH-107',
  'WH-008',
  'WH-033',
  'WH-053',
  'WH-076',
  'WH-095',
  'WH-115',
]
assert.deepEqual(
  new Set(Object.keys(REGIONAL_LENS_VOICES)),
  new Set(redlineLensCards),
)
for (const id of redlineLensCards) {
  const card = findCard(id)!
  const voices = card.lensLines!
  const rendered = openLenses.map((lens) => voices[lens]!)
  assert.ok(rendered.every((line) => line.length >= 60))
  assert.equal(new Set(rendered).size, openLenses.length)
  assert.deepEqual(voices, REGIONAL_LENS_VOICES[id])
  assert.equal(card.choices[0]?.id, 'investigate')
  assert.equal(card.choices[1]?.id, 'care')
  assert.ok(
    rendered.every((line) => !line.includes('you are morally')),
    `${id} never uses lens identity as a moral verdict`,
  )
}
assert.equal(FORMER_GUIDE_QUESTS.length, 5)
const reunionBase = createRun(101, 'reporter')
for (const card of FORMER_GUIDE_QUESTS) {
  assert.ok(findCard(card.id), `${card.id} is a live, illustrated encounter`)
  assert.ok(
    Object.values(ROUTES).some((route) =>
      route.some(
        (step, index) =>
          step.kind === 'fork' &&
          step.pools.includes(card.chapter) &&
          route
            .slice(0, index)
            .some((earlier) => earlier.kind === 'crossroads'),
      ),
    ),
    `${card.id} can be drawn after a crossroads, not only before its gate unlocks`,
  )
  if (card.requiresFormerGuide) {
    const guide = card.requiresFormerGuide
    const nextGuide = COMPANIONS.find((c) => c.id !== guide)!.id
    assert.equal(
      encounterEligible(card, reunionBase),
      false,
      `${card.id} cannot appear before meeting ${guide}`,
    )
    assert.equal(
      encounterEligible(card, { ...reunionBase, meetingOrder: [guide] }),
      false,
      `${card.id} cannot invent a past following relationship`,
    )
    const switched = {
      ...reunionBase,
      meetingOrder: [guide, nextGuide],
      activeLead: nextGuide,
      followHistory: [{ day: 3, from: guide, to: nextGuide, choice: 'follow' }],
    }
    assert.ok(
      encounterEligible(card, switched),
      `${card.id} reappears after an actual companion change`,
    )
    assert.equal(
      encounterEligible(card, { ...switched, activeLead: guide }),
      false,
      `${card.id} is not a former-guide scene while still together`,
    )
    assert.equal(
      encounterEligible(card, { ...switched, played: [card.id] }),
      false,
      `${card.id} cannot repeat inside one run`,
    )
  } else {
    assert.equal(card.id, 'FR-ASSEMBLY-01')
    assert.equal(encounterEligible(card, reunionBase), false)
    assert.equal(
      encounterEligible(card, { ...reunionBase, meetingOrder: ['mara'] }),
      false,
    )
    assert.ok(
      encounterEligible(card, {
        ...reunionBase,
        meetingOrder: ['mara', 'kit'],
      }),
      'two previously met companions make the nonmandatory potluck possible',
    )
    for (const lens of openLenses)
      assert.ok(card.lensLines?.[lens], `potluck has ${lens} narration`)
  }
}
assert.equal(Object.keys(REGIONAL_REVISIONS).length, 19)
const fifthPassScenes = [
  'WH-001',
  'WH-008',
  'WH-010',
  'WH-023',
  'WH-028',
  'WH-037',
  'WH-041',
  'WH-051',
  'WH-057',
  'WH-065',
  'WH-071',
  'WH-075',
  'WH-082',
  'WH-096',
  'WH-115',
  'WH-120',
]
for (const id of fifthPassScenes) {
  const scene = REGIONAL_SCRIPTS.find((entry) => entry.id === id)!
  assert.ok(scene, `${id} fifth-pass scene is playable`)
  assert.ok(
    scene.pressure.length > 230 && /['“]/.test(scene.pressure),
    `${id} has specific narrated conflict and audible character voices`,
  )
  assert.ok(
    scene.success.length > 150 &&
      scene.failure.length > 150 &&
      scene.helpOutcome.length > 150,
    `${id} has substantial distinct outcomes for wins, losses and care`,
  )
  assert.notEqual(scene.success, scene.failure)
  assert.notEqual(scene.success, scene.helpOutcome)
  assert.notEqual(scene.failure, scene.helpOutcome)
}
const companionVoices = ['mara', 'kit', 'juniper', 'cedar'] as const
for (const id of ['WH-008', 'WH-023', 'WH-065', 'WH-082']) {
  const card = findCard(id)!
  const lines = companionVoices.map((companion) =>
    cardAsides(card, {
      ...createRun(10, 'reporter'),
      activeLead: companion,
    }).join(' '),
  )
  assert.ok(
    lines.every((line) => line.length > 60),
    `${id} each actual guide has a written point of view`,
  )
  assert.equal(
    new Set(lines).size,
    4,
    `${id} four companions disagree or act in distinct voices`,
  )
  assert.equal(
    cardAsides(card, createRun(10, 'reporter')).length,
    0,
    `${id} does not invent a companion when the player travels alone`,
  )
}
const costlyThirdWays = [
  'WH-008',
  'WH-023',
  'WH-041',
  'WH-065',
  'WH-082',
  'WH-096',
]
for (const id of costlyThirdWays) {
  const option = REGIONAL_REVISIONS[id]?.choices[0]
  assert.ok(option && option.cost, `${id} has a stated sacrifice`)
  assert.ok(option.success.effects.flag, `${id} has durable cause and effect`)
  assert.ok(
    (option.success.effects.nerve ?? 0) < 0 || option.failure?.effects.nerve,
    `${id} third way has a real price rather than a free extra reward`,
  )
  if (option.check)
    assert.ok(
      option.failure &&
        option.failure.effects.flag !== option.success.effects.flag,
      `${id} check can fail without granting the winning flag`,
    )
}
assert.match(
  cardAsides(findCard('WH-041')!, {
    ...createRun(7, 'reporter'),
    flags: ['wh_008_crew_veto'],
  }).join(' '),
  /theatre crew/,
  'the tenant remembers the earlier crew veto when it occurred',
)
assert.match(
  cardAsides(findCard('WH-096')!, {
    ...createRun(7, 'reporter'),
    flags: ['wh_065_camera_truce'],
  }).join(' '),
  /potluck photographer/,
  'the scarecrow remembers a real earlier privacy commitment',
)
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
      lines?.[lens] && lines[lens]!.length > 42,
      `${id} has a concise, meaningful scene aside for ${lens}`,
    )
  assert.equal(
    new Set(openLenses.map((lens) => lines?.[lens])).size,
    openLenses.length,
    `${id} seven focalizations are individually authored`,
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
  40,
  'forty precise optional regional payoffs, including both creek-monitoring results',
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
const failureEchoes = [
  ['WH-014', 'sign the failed test log'],
  ['WH-026', 'seven uncertain marks'],
  ['WH-052', 'fuel bill for taking the long way'],
  ['WH-074', 'write a correction request'],
  ['WH-094', 'both unverified tallies'],
  ['WH-114', 'Both losses remain losses'],
] as const
for (const [id, earnedDetail] of failureEchoes) {
  const card = findCard(id)!
  const investigate = card.choices.find(
    (choice) => choice.id === 'investigate',
  )!
  const failure = investigate.failure!
  const flag = `${id.toLowerCase().replaceAll('-', '_')}_partial`
  assert.ok(
    failure.text.includes(earnedDetail),
    `${id} failure must remain a specific, playable scene`,
  )
  assert.equal(failure.effects.flag, flag)
  assert.ok(
    !failure.effects.evidence,
    `${id} loss never grants verified evidence`,
  )
  const callback = REGIONAL_CALLBACKS.find(
    (entry) => entry.id === id && entry.choice === 'investigate-failure',
  )
  assert.equal(callback?.flag, flag, `${id} must remember its failed roll`)
  assert.ok(
    earnedQuestCallbacks([flag], [id]).includes(callback!.text),
    `${id} failed choice has its own truthful finale payoff`,
  )
  assert.ok(
    !earnedQuestCallbacks([], [id]).includes(callback!.text),
    `${id} cannot invent a loss not actually rolled`,
  )
  const pitch = allPitchByKey.get(
    `callbacks/${id.toLowerCase()}/investigate-failure`,
  )
  assert.equal(pitch?.action, callback!.artMoment)
  assert.ok(
    pitch?.mustNotImply.some((line) =>
      line.includes('This investigation failed'),
    ),
    `${id} art brief must not depict the winning resolution`,
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
  const prerequisites = [
    null,
    ...new Set(
      card.choices.flatMap((choice) =>
        choice.requiresFlag ? [choice.requiresFlag] : [],
      ),
    ),
  ]
  for (const prerequisite of prerequisites) {
    const playable = card.choices.filter(
      (choice) =>
        !choice.locked &&
        (!choice.requiresFlag || choice.requiresFlag === prerequisite),
    )
    assert.ok(
      playable.length >= 2 && playable.length <= 4,
      `${card.id} offers 2-4 choices with prerequisite ${prerequisite ?? 'none'}`,
    )
  }
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
    const playable = card.choices.filter(
      (c) =>
        !c.locked && (!c.requiresFlag || state.flags.includes(c.requiresFlag)),
    )
    const choice =
      (card.choices.some((c) => c.prospect) ? card.choices[plan.area] : null) ??
      openingLensChoices(card).find((c) => c.lens === plan.lens) ??
      card.choices.find((c) => c.meet === plan.accept) ??
      playable[pick(playable.length)]
    state = advance(chooseBeat(state, choice?.id ?? ''))
  }
  return state
}

for (const event of ['GR-2', 'KN-2', 'QW-2']) {
  const opening = findCard(event)!
  assert.equal(
    openingLensChoices(opening).length,
    7,
    `${event} visibly offers exactly seven lenses`,
  )
  assert.deepEqual(availableOpeningLenses(opening), openLenses)
  for (const extra of OPENING_LENS_ADDITIONS[event]!) {
    assert.ok(extra.success.text.length >= 80)
    assert.ok(extra.failure?.text.length)
    assert.ok(
      ecotoneArtSlots().outcomes.includes(
        outcomeArtKey(event, extra.id, 'failure'),
      ),
      `${event}/${extra.id} has a unique failure picture slot`,
    )
    assert.ok(
      allPitchByKey.has(outcomeArtKey(event, extra.id, 'success')),
      `${event}/${extra.id} has a proposed success picture`,
    )
    assert.ok(
      allPitchByKey.has(outcomeArtKey(event, extra.id, 'failure')),
      `${event}/${extra.id} has a proposed failure picture`,
    )
  }
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

// Simulated human personas: experimentation, escalation, recovery and mixing.
const momentBase: RunState = {
  ...createRun(129, 'dealer'),
  phase: 'beat',
  event: 'green-ribbon',
  card: 'WH-003',
  openingState: 'sober',
  currentState: 'sober',
}
const singleDrink = chooseSubstanceMoment(momentBase, ['alcohol'])
assert.equal(
  singleDrink.openingState,
  'sober',
  'an interlude never rewrites the opening',
)
assert.equal(singleDrink.substanceMoments.length, 1)
assert.equal(substanceSummary(singleDrink.substanceMoments).alcoholStreak, 1)
assert.match(
  substanceSceneLine(singleDrink.substanceMoments, 1) ?? '',
  /drink loosens/,
)
assert.equal(
  substanceSceneLine(singleDrink.substanceMoments, 1, 'WH-004'),
  null,
  'substance prose does not repeat verbatim in every subsequent scene',
)
assert.equal(
  chooseSubstanceMoment(singleDrink, ['alcohol']),
  singleDrink,
  'a scene permits only one optional interlude',
)
const rejected = { ...singleDrink, card: 'WH-004' }
assert.equal(
  chooseSubstanceMoment(rejected, ['alcohol', 'cannabis', 'coffee']),
  rejected,
)
assert.equal(chooseSubstanceMoment(rejected, ['coffee', 'coffee']), rejected)
let frequent = momentBase
for (const card of ['WH-003', 'WH-004', 'WH-005', 'WH-006', 'WH-007']) {
  frequent = chooseSubstanceMoment({ ...frequent, card }, ['alcohol'])
  if (substanceSummary(frequent.substanceMoments).alcoholStreak === 3)
    assert.match(
      substanceSceneLine(frequent.substanceMoments, 1) ?? '',
      /bridgebridge/,
    )
}
assert.equal(substanceSummary(frequent.substanceMoments).alcoholStreak, 5)
assert.equal(
  frequent.clarity,
  0,
  'sustained excess affects clarity, not consent or options',
)
assert.match(
  substanceSceneLine(frequent.substanceMoments, 1) ?? '',
  /rrriver|rrriver|rrriver|rrriver/,
)
assert.equal(frequent.openingState, 'sober')
assert.equal(
  checkBonus(frequent, { skill: 'psyche', target: 7 }),
  momentBase.skills.psyche,
  'extreme drinking does not earn an uncanny insight bonus',
)
assert.equal(
  checkBonus(
    { ...momentBase, currentState: 'tripping_balls', clarity: 1 },
    { skill: 'psyche', target: 7 },
  ),
  momentBase.skills.psyche + 1,
  'the authored uncanny lens retains its existing 2d6 trade-off',
)
let dailyHabit = momentBase
for (const day of [1, 2, 3, 4]) {
  dailyHabit = chooseSubstanceMoment(
    { ...dailyHabit, day, card: `WH-00${day + 2}` },
    ['alcohol'],
  )
}
assert.equal(
  substanceSummary(dailyHabit.substanceMoments).counts.alcohol,
  4,
  'daily repetition is a recorded habit',
)
assert.equal(
  substanceSummary(dailyHabit.substanceMoments).maxAlcoholStreak,
  1,
  'one drink on separate days is not acute overindulgence',
)
assert.doesNotMatch(
  substanceSceneLine(dailyHabit.substanceMoments, 4) ?? '',
  /bridgebridge|rrriver/,
)

assert.equal(computeEnding(frequent).id, computeEnding(momentBase).id)
const nextCard = findCard('WH-008')!
const impairedScene = { ...frequent, card: nextCard.id }
const intactChoices = openingLensChoices(nextCard).map((choice) => choice.id)
const afterChoice = chooseBeat(impairedScene, intactChoices[0]!)
assert.equal(
  afterChoice.log.at(-1)?.choice,
  fillText(openingLensChoices(nextCard)[0]!.label, impairedScene),
  'even when dialogue is garbled, the selected action remains readable',
)
assert.deepEqual(
  openingLensChoices(nextCard).map((choice) => choice.id),
  intactChoices,
  'interludes never mutate scene choice IDs',
)
const pausing = chooseSubstanceMoment({ ...frequent, card: 'WH-008' }, [])
assert.equal(pausing.clarity, 2, 'one break begins gradual recovery')
const temperate = chooseSubstanceMoment({ ...pausing, card: 'WH-009' }, [])
assert.equal(temperate.clarity, 3, 'a second voluntary break restores clarity')
assert.match(
  substanceEpilogue(temperate.substanceMoments) ?? '',
  /choosing water/,
)
const mixed = chooseSubstanceMoment(momentBase, ['coffee', 'cannabis'])
assert.deepEqual(mixed.substanceMoments[0]?.selected, ['coffee', 'cannabis'])
assert.equal(momentPerspective(mixed.substanceMoments).lens, 'stoned')
assert.equal(substanceSummary(mixed.substanceMoments).hippieSpeedball, true)
assert.match(
  substanceSceneLine(mixed.substanceMoments, 1) ?? '',
  /hippie speedball/,
)
assert.match(
  substanceEpilogue(mixed.substanceMoments) ?? '',
  /hippie speedball/,
)
const fastSidequest = QUEST_CARDS.find((card) => card.id === 'LX-FAST-01')!
assert.equal(
  encounterEligible(fastSidequest, momentBase),
  false,
  'a sober opening alone does not grant a stimulant-specific scene',
)
const laterFast = chooseSubstanceMoment(momentBase, ['cocaine'])
assert.equal(
  encounterEligible(fastSidequest, laterFast),
  true,
  'a later voluntary experience can unlock the matching personal scene',
)
assert.equal(laterFast.openingState, 'sober')
const mixedFast = chooseSubstanceMoment(momentBase, ['cannabis', 'cocaine'])
assert.equal(encounterEligible(fastSidequest, mixedFast), true)

assert.deepEqual(restoreRun(JSON.parse(JSON.stringify(temperate))), temperate)
const { substanceMoments: oldMoments, ...legacyMomentSave } = temperate
assert.equal(oldMoments.length, 7)
assert.ok(
  restoreRun(legacyMomentSave)?.substanceMoments.length,
  'older version-four saves retain their initial narrative memory',
)
assert.equal(
  restoreRun({ ...temperate, substanceMoments: [{ selected: ['fake'] }] }),
  null,
)

// A philosophy is a weighted question, not a chemical diagnosis or moral fate.
const philosophyBase = createRun(16180, 'reporter')
const neutralValues = philosophyNeedles(philosophyBase)
assert.equal(neutralValues.length, 4)
assert.deepEqual(
  VALUE_AXES.map((axis) => axis.id),
  ['autonomy', 'continuity', 'ecology', 'agency'],
)
assert.ok(neutralValues.every((value) => value.chemistry === 0))
const momentsFor = (
  substance:
    | 'alcohol'
    | 'cannabis'
    | 'coffee'
    | 'psychedelic'
    | 'cocaine'
    | 'meth'
    | 'mdma',
  count: number,
) =>
  Array.from({ length: count }, (_, index) => ({
    source: 'sample-' + index,
    day: index + 1,
    selected: [substance],
  }))
const oneDrinkValues = philosophyNeedles({
  ...philosophyBase,
  substanceMoments: momentsFor('alcohol', 1),
})
const habitualValues = philosophyNeedles({
  ...philosophyBase,
  substanceMoments: momentsFor('alcohol', 3),
})
const excessiveValues = philosophyNeedles({
  ...philosophyBase,
  substanceMoments: momentsFor('alcohol', 8),
})
assert.equal(oneDrinkValues[0]?.chemistry, 1)
assert.equal(habitualValues[0]?.chemistry, 2)
assert.equal(
  excessiveValues[0]?.chemistry,
  2,
  'overindulgence cannot farm ideological power',
)
const cannabisOnly = philosophyNeedles({
  ...philosophyBase,
  substanceMoments: momentsFor('cannabis', 1),
})
const hippySpeedball = philosophyNeedles({
  ...philosophyBase,
  substanceMoments: [
    { source: 'sample-0', day: 1, selected: ['coffee', 'cannabis'] },
  ],
})
assert.equal(cannabisOnly[2]?.chemistry, -1)
assert.equal(
  hippySpeedball[2]?.chemistry,
  0,
  'coffee and cannabis offer countervailing questions',
)
assert.equal(hippySpeedball[3]?.chemistry, -1)
const returnedToTemperance = philosophyNeedles({
  ...philosophyBase,
  substanceMoments: [
    ...momentsFor('alcohol', 3),
    { source: 'sample-3', day: 4, selected: [] },
    { source: 'sample-4', day: 4, selected: [] },
  ],
})
assert.equal(returnedToTemperance[3]?.chemistry, -2)
assert.equal(
  philosophyNeedles({
    ...philosophyBase,
    substanceMoments: [{ source: 'opening', day: 1, selected: [] }],
  })[3]?.chemistry,
  0,
  'choosing sober at the beginning is not a recovery score',
)
const volunteerChoice = {
  step: 1,
  day: 1,
  source: 'WH-001',
  title: 'The Human Statue',
  choice: 'Give them a break',
  roll: null,
  text: 'They get water',
  effects: { flag: 'wh_001_care' },
}
const helpingValues = philosophyNeedles({
  ...philosophyBase,
  log: [volunteerChoice],
})
assert.equal(helpingValues[0]?.decisions, 1)
const hurriedClosure = philosophyNeedles({
  ...philosophyBase,
  log: [{ ...volunteerChoice, effects: { flag: 'juniper_closed_path' } }],
})
assert.equal(hurriedClosure[0]?.decisions, -2)
assert.ok(
  SUBSTANCE_CHOICES.every((choice) =>
    philosophyNeedles({
      ...philosophyBase,
      substanceMoments: momentsFor(choice.id, 1),
    }).some((value) => value.chemistry !== 0),
  ),
  'every authored perspective must tug at at least one axis',
)
// Probability changes are not ideological locks. Every chemical lens still
// permits opposing conclusions on the axes it touches, depending on 2d6.
for (const chemical of SUBSTANCE_CHOICES) {
  const first = philosophyNeedles({
    ...philosophyBase,
    substanceMoments: momentsFor(chemical.id, 1),
  })
  for (const [index, value] of first.entries()) {
    if (value.chemistry === 0) continue
    const outcomes = new Set(
      Array.from(
        { length: 160 },
        (_, seed) =>
          philosophyNeedles({
            ...philosophyBase,
            seed: seed + 1,
            substanceMoments: momentsFor(chemical.id, 1),
          })[index]?.outcome,
      ),
    )
    assert.ok(outcomes.has(value.left), `${chemical.id} can roll ${value.left}`)
    assert.ok(
      outcomes.has(value.right),
      `${chemical.id} can roll ${value.right}`,
    )
  }
}
for (const value of hippySpeedball) {
  assert.ok(value.dice.every((die) => die >= 1 && die <= 6))
  assert.equal(value.total, value.dice[0] + value.dice[1] + value.pull)
  assert.ok(value.position >= 8 && value.position <= 92)
}
assert.deepEqual(
  philosophyNeedles({
    ...philosophyBase,
    substanceMoments: momentsFor('cannabis', 3),
  }),
  philosophyNeedles({
    ...philosophyBase,
    substanceMoments: momentsFor('cannabis', 3),
  }),
  'philosophical rolls are reproducible for seeded saves',
)
assert.equal(
  computeEnding({ ...momentBase, substanceMoments: momentsFor('alcohol', 3) })
    .id,
  computeEnding(momentBase).id,
  'philosophical pressures never make hope or darkness a drug verdict',
)

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
  // Invitation-only interludes are verified independently with explicit
  // together-choice seeded journeys, never through the random fork picker.
  if (quest?.requiresInvitation) continue
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

// Second-draft campaign audit: 8,400 deterministic end-to-end campaigns using
// all seven voluntary lenses, all events, all companions and changing forks.
const eventLensOptions = new Map<EventId, LensId[]>(
  (['green-ribbon', 'kinetic', 'quiet'] as EventId[]).map((event) => {
    const opening = ROUTES[event]
      .filter((step) => step.kind === 'beat')
      .map((step) => findCard(step.id))
      .find((card) => card?.choices.some((choice) => choice.lens))
    const choices = opening ? availableOpeningLenses(opening) : []
    assert.ok(choices.length > 0, `${event} must offer an opening`)
    return [event, choices]
  }),
)
const auditEndingIds = new Set<string>()
const auditLensFates = new Set<string>()
const auditGuideFates = new Set<string>()
const auditChapters = new Set<number>()
const auditChoices = new Set<string>()
const auditCounts = new Map<string, number>()
let auditedFailureArt = 0
let auditedCallbacks = 0
let minDecisions = Infinity
let maxDecisions = 0
for (let index = 0; index < 8400; index += 1) {
  const seed = 50000 + index
  const rng = mulberry32(seed * 17)
  const event = (['green-ribbon', 'kinetic', 'quiet'] as EventId[])[index % 3]!
  const availableLenses = eventLensOptions.get(event)!
  const lens = availableLenses[Math.floor(index / 3) % availableLenses.length]!
  const plan: Plan = {
    event,
    lens,
    area: Math.floor(rng() * (event === 'quiet' ? 3 : 2)) as Plan['area'],
    accept: rng() > 0.36,
    follow: rng() > 0.48,
    pick: (n) => Math.floor(rng() * n),
  }
  const run = play(seed, plan)
  const ending = computeEnding(run)
  assert.equal(run.ending, ending.id, `seed ${seed} ending is reproducible`)
  assert.ok(
    ENDING_IDS.includes(ending.id),
    `seed ${seed} has a collectible slot`,
  )
  assert.equal(run.openingState, lens, `seed ${seed} keeps its chosen lens`)
  assert.equal(new Set(run.played).size, run.played.length)
  assert.equal(new Set(run.meetingOrder).size, run.meetingOrder.length)
  assert.ok(run.meetingOrder.every((id) => COMPANIONS.some((c) => c.id === id)))
  assert.ok(run.log.length >= 6 && run.log.length <= 22, 'bounded narrative')
  minDecisions = Math.min(minDecisions, run.log.length)
  maxDecisions = Math.max(maxDecisions, run.log.length)
  for (const entry of run.log) {
    if (!entry.art) continue
    const card = findCard(entry.source)
    assert.ok(card, `seed ${seed} logged a real card`)
    assert.ok(
      openingLensChoices(card).some(
        (choice) =>
          entry.art === outcomeArtKey(card.id, choice.id, 'success') ||
          (choice.failure &&
            entry.art === outcomeArtKey(card.id, choice.id, 'failure')),
      ),
      `seed ${seed} cannot show an unearned outcome image: ${entry.art}`,
    )
    if (entry.roll?.success === false) {
      auditedFailureArt += 1
      assert.match(entry.art, /-failure$/, 'a failed check uses failure art')
    }
    if (entry.effects.flag)
      assert.ok(
        run.flags.includes(entry.effects.flag),
        'choice effects persist',
      )
    if (entry.effects.evidence)
      assert.ok(
        run.evidence.includes(entry.effects.evidence),
        'recorded evidence persists',
      )
    auditChapters.add(card.chapter)
    auditChoices.add(`${card.id}/${entry.art}`)
  }
  for (const log of run.followHistory) {
    assert.ok(
      log.from === null || run.meetingOrder.includes(log.from),
      'former companions must first have been met',
    )
    assert.ok(
      log.to === null || run.meetingOrder.includes(log.to),
      'new companions must first have been met',
    )
  }
  const callbacks = earnedQuestCallbacks(run.flags, run.played)
  assert.ok(
    callbacks.length <= 2,
    'the montage uses no more than two callbacks',
  )
  auditedCallbacks += callbacks.length
  for (const callback of REGIONAL_CALLBACKS) {
    if (!callbacks.includes(callback.text)) continue
    assert.ok(
      run.flags.includes(callback.flag),
      'regional memory needs its flag',
    )
    assert.ok(
      run.played.includes(callback.id),
      'regional memory needs its scene',
    )
  }
  const restored = restoreRun(JSON.parse(JSON.stringify(run)))
  assert.deepEqual(restored, run, `seed ${seed} survives a save round-trip`)
  auditEndingIds.add(ending.id)
  auditLensFates.add(`${ending.lens}.${ending.fate}`)
  auditGuideFates.add(`${ending.lead}.${ending.fate}`)
  auditCounts.set(event, (auditCounts.get(event) ?? 0) + 1)
}
assert.equal(auditCounts.size, 3)
assert.deepEqual(
  new Set([...eventLensOptions.values()].flat()),
  new Set(openLenses),
  'all seven lenses can begin at least one regional route',
)
for (const [event, lenses] of eventLensOptions)
  assert.deepEqual(
    lenses,
    openLenses,
    `${event} offers all seven voluntary lenses`,
  )
assert.equal(auditChapters.size, 6, 'all six regional chapters appear in runs')
assert.equal(auditLensFates.size, 14, 'each opening can earn hope or darkness')
for (const lead of ['mara', 'kit', 'juniper', 'cedar', 'alone'])
  for (const fate of ['hope', 'dark'])
    assert.ok(
      auditGuideFates.has(`${lead}.${fate}`),
      `${lead} has a reachable ${fate} ending`,
    )
assert.ok(
  auditChoices.size >= 130,
  'campaigns vary their story and outcome art',
)
assert.ok(auditedFailureArt > 100, 'failure and recovery paths were exercised')
assert.ok(auditedCallbacks > 0, 'earned callbacks reach played runs')
console.info(
  `Ecotone audit: 8,400 seeded campaigns; ${auditEndingIds.size}/${ENDING_IDS.length} ending slots observed; ${auditChoices.size} distinct card/outcome images; ${auditedFailureArt} failed checks; ${auditedCallbacks} callbacks; ${minDecisions}-${maxDecisions} recorded decisions`,
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
function wildRun(seed: number, wild: boolean, lens: LensId = 'sober') {
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
      const open = openingLensChoices(card).filter(
        (c) =>
          !c.locked &&
          (!c.requiresFlag || state.flags.includes(c.requiresFlag)),
      )
      const pickChoice =
        open.find((c) => c.lens === lens) ??
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
for (const lens of openLenses) {
  const optimistic = wildRun(200 + openLenses.indexOf(lens), true, lens)
  const bittersweet = wildRun(300 + openLenses.indexOf(lens), false, lens)
  assert.equal(optimistic.ending, `ecotopia.${lens}.hope`)
  assert.equal(bittersweet.ending, `ecotopia.${lens}.dark`)
  assert.equal(optimistic.openingState, lens)
  assert.equal(bittersweet.openingState, lens)
  auditEndingIds.add(optimistic.ending!)
  auditEndingIds.add(bittersweet.ending!)
}
assert.deepEqual(
  auditEndingIds,
  new Set(ENDING_IDS),
  'all 84 endings have real fully played deterministic witnesses',
)
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
const assembly = findCard('FR-ASSEMBLY-01')
assert.ok(assembly?.meetingLines)
for (const [firstGuide, secondGuide] of [
  ['mara', 'kit'],
  ['juniper', 'cedar'],
  ['cedar', 'mara'],
] as const) {
  const actual = cardAsides(assembly, {
    ...base,
    meetingOrder: [firstGuide, secondGuide],
    activeLead: null,
  })
  assert.equal(actual.length, 2, 'the potluck includes only the two met people')
  assert.match(actual[0]!, new RegExp(firstGuide, 'i'))
  assert.match(actual[1]!, new RegExp(secondGuide, 'i'))
}
const ensemble = cardAsides(assembly, {
  ...base,
  meetingOrder: ['mara', 'kit', 'juniper', 'cedar'],
  flags: ['slug_sank'],
  activeLead: 'juniper',
})
assert.equal(
  ensemble.length,
  3,
  'the last two met companions and the sinking echo',
)
assert.match(ensemble[2]!, /waterlogged race number/)
assert.equal(
  cardAsides(assembly, { ...base, meetingOrder: [] }).length,
  0,
  'a saved meeting cannot conjure people the player has not met',
)
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
// Version 4 predates the 120-card atlas. Old chemical quest IDs collided with
// newly canonical WH-004, WH-037 and WH-058. Titles in completed logs are
// trustworthy discriminators; bare offered/current IDs are NOT.
for (const { oldId, title, replacement } of [
  {
    oldId: 'WH-004',
    title: 'A Fast Hour in a Bottle',
    replacement: 'LX-FAST-01',
  },
  {
    oldId: 'WH-037',
    title: 'The River Does Not Sleep',
    replacement: 'LX-NIGHT-01',
  },
  {
    oldId: 'WH-058',
    title: 'The Peacock Has a Warrant',
    replacement: 'LX-HEART-01',
  },
]) {
  const oldEntry = {
    ...first.log.find((entry) => entry.art)!,
    source: oldId,
    title,
    art: outcomeArtKey(oldId, 'terms', 'success'),
  }
  const historical = {
    ...saved,
    played: [...saved.played, oldId],
    log: [...saved.log, oldEntry],
    pending: { entry: oldEntry, nextStep: 3 },
    card: oldId,
  }
  const migrated = restoreRun(historical)!
  assert.ok(migrated.played.includes(replacement), `${oldId} remains played`)
  assert.equal(migrated.card, replacement)
  assert.equal(migrated.log.at(-1)?.source, replacement)
  assert.equal(migrated.pending?.entry.source, replacement)
  assert.equal(
    migrated.log.at(-1)?.art,
    outcomeArtKey(replacement, 'terms', 'success'),
    'historical outcome art follows the migrated card ID',
  )
  assert.deepEqual(restoreRun(JSON.parse(JSON.stringify(migrated))), migrated)
  const newCanonical = {
    ...historical,
    log: [...saved.log, { ...oldEntry, title: findCard(oldId)!.title }],
    pending: null,
  }
  const preserved = restoreRun(newCanonical)!
  assert.ok(preserved.played.includes(oldId), 'modern WH ID stays canonical')
  assert.equal(
    preserved.card,
    oldId,
    'ambiguous active card is never rewritten',
  )
  const uncertain = restoreRun({
    ...historical,
    log: saved.log,
    pending: null,
    offered: [oldId],
  })!
  assert.equal(uncertain.card, oldId, 'no log means no inferred migration')
  assert.ok(
    uncertain.offered.includes(oldId),
    'ambiguous offers are not aliased',
  )
}
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
