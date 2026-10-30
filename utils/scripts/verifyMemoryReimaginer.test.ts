import assert from 'node:assert/strict'
import { restoreMemoryCampaignProgress } from '../memoryDungeon/campaignPersistence'
import {
  MEMORY_EARLY_ORDER,
  MEMORY_FINALE_ORDER,
  MEMORY_FINALE_PHASES,
  MEMORY_MIDDLE_PAIRS,
  MEMORY_REALITY_EXPERIENCES,
  MEMORY_REALITY_PAIRS,
  MEMORY_PAIR_ENDINGS,
  MEMORY_SCYLLA_DEPARTURE_CHOICES,
  chooseMemoryPairEnding,
  chooseMemoryScyllaDeparture,
  memoryCharFate,
  memoryPairWorldFlags,
  scyllaOpeningForMemory,
  MEMORY_WORLD_CONCEPTS,
  MEMORY_WISH_ANCHORS,
  availableMemoryExperiences,
  commitToMemoryFinale,
  completeMemoryExperience,
  newMemoryCampaignProgress,
  rememberMemoryWish,
  validateMemoryReimaginerCampaign,
} from '../memoryDungeon/reimaginerCampaign'

assert.deepEqual(validateMemoryReimaginerCampaign(), [])
assert.equal(MEMORY_WORLD_CONCEPTS.length, 8)
assert.equal(MEMORY_REALITY_EXPERIENCES.length, 16)
assert.equal(
  MEMORY_REALITY_EXPERIENCES.reduce(
    (total, experience) =>
      total + experience.gallery.local + experience.gallery.collaborations,
    0,
  ),
  512,
  'Each of sixteen experiences requires its own 30+2 image gallery; plans are not delivered art',
)
assert.equal(
  new Set(MEMORY_REALITY_EXPERIENCES.map((experience) => experience.id)).size,
  16,
)

for (const concept of MEMORY_WORLD_CONCEPTS) {
  const variants = MEMORY_REALITY_EXPERIENCES.filter(
    (experience) => experience.concept === concept.id,
  )
  assert.equal(
    variants.length,
    2,
    `${concept.id} supports two interpretable incarnations`,
  )
  assert.notEqual(variants[0]!.title, variants[1]!.title)
  assert.ok(
    variants[1]!.changeDimensions.length >= 3,
    'A dark variant cannot be merely a dark palette',
  )
}

assert.equal(MEMORY_REALITY_EXPERIENCES[0]!.id, 'e01')
assert.equal(MEMORY_REALITY_EXPERIENCES[0]!.concept, 'briar')
assert.equal(MEMORY_REALITY_EXPERIENCES[2]!.viewpoint, 'morrow')
assert.equal(MEMORY_REALITY_EXPERIENCES[2]!.ontology, 'mundane')
assert.equal(MEMORY_REALITY_EXPERIENCES[3]!.ontology, 'enchanted-earth')
assert.equal(MEMORY_REALITY_EXPERIENCES[4]!.viewpoint, 'scylla')
assert.equal(MEMORY_REALITY_EXPERIENCES[4]!.ontology, 'underwater')
assert.equal(MEMORY_REALITY_EXPERIENCES[5]!.ontology, 'underwater')
assert.equal(MEMORY_REALITY_EXPERIENCES[5]!.state, 'dark-reflection')
assert.equal(MEMORY_WISH_ANCHORS['char-possible-future'].source, 'e06')
assert.match(
  MEMORY_WISH_ANCHORS['char-possible-future'].meaning,
  /may be lost or alive/i,
)

let campaign = newMemoryCampaignProgress()
assert.deepEqual(availableMemoryExperiences(campaign), ['e01'])
assert.throws(
  () => completeMemoryExperience(campaign, 'e04'),
  /not currently reachable/,
)
assert.throws(
  () => rememberMemoryWish(campaign, 'morrow-magic-attempt'),
  /must be experienced/,
)
assert.throws(() => commitToMemoryFinale(campaign), /not been earned/)

campaign = completeMemoryExperience(campaign, 'e01')
campaign = completeMemoryExperience(campaign, 'e02')
campaign = completeMemoryExperience(campaign, 'e03')
assert.deepEqual(
  availableMemoryExperiences(campaign),
  [],
  'Morrow wish evidence is not silently manufactured',
)
campaign = rememberMemoryWish(campaign, 'morrow-magic-attempt')
assert.equal(
  rememberMemoryWish(campaign, 'morrow-magic-attempt'),
  campaign,
  'A repeated wish cannot duplicate rewards',
)
assert.deepEqual(availableMemoryExperiences(campaign), ['e04'])
assert.throws(
  () => completeMemoryExperience(campaign, 'e04'),
  /world-pair ending requires/i,
)
const beforeWorldFour = campaign
for (const [decision, expectedFate] of [
  ['open-the-tide-gate', 'lost'],
  ['seal-the-tide-gate', 'alive'],
  ['divert-the-current', 'alive'],
] as const) {
  const chosen = chooseMemoryPairEnding(beforeWorldFour, 'e04', decision)
  assert.equal(memoryCharFate(chosen), expectedFate)
  assert.ok(memoryPairWorldFlags(chosen).length > 0)
  assert.equal(availableMemoryExperiences(chosen)[0], 'e04')
  assert.throws(
    () => chooseMemoryPairEnding(chosen, 'e04', decision),
    /already resolved/,
  )
  const afterCity = completeMemoryExperience(chosen, 'e04')
  assert.equal(availableMemoryExperiences(afterCity)[0], 'e05')
  assert.match(
    scyllaOpeningForMemory(afterCity, 'e05'),
    /years earlier|younger body/,
  )
  for (const choice of MEMORY_SCYLLA_DEPARTURE_CHOICES) {
    const past = chooseMemoryScyllaDeparture(afterCity, choice.id)
    assert.equal(past.scyllaDeparture, choice.id)
    assert.ok(memoryPairWorldFlags(past).includes(choice.worldFlag))
    assert.match(
      scyllaOpeningForMemory(past, 'e06'),
      /court|escape|timeline|palace|sea/,
    )
    assert.throws(
      () => chooseMemoryScyllaDeparture(past, choice.id),
      /unchosen past/,
    )
    const pastWish = rememberMemoryWish(past, 'scylla-home-wish')
    let next = completeMemoryExperience(pastWish, 'e05')
    assert.deepEqual(availableMemoryExperiences(next), ['e06'])
    next = chooseMemoryPairEnding(next, 'e06', 'publish-twin-testimony')
    next = completeMemoryExperience(next, 'e06')
    assert.deepEqual(availableMemoryExperiences(next), ['e07'])
    assert.equal(memoryCharFate(next), expectedFate)
    assert.deepEqual(
      restoreMemoryCampaignProgress(JSON.parse(JSON.stringify(next))),
      next,
      'All nine World Four/World Five routes survive save and replay',
    )
  }
}
assert.match(
  MEMORY_PAIR_ENDINGS.e04[0]!.publicResult,
  /Scylla sees Char.*die/,
  'The player witnesses the present death on the chosen costly route',
)
campaign = chooseMemoryPairEnding(campaign, 'e04', 'open-the-tide-gate')
campaign = completeMemoryExperience(campaign, 'e04')
assert.throws(
  () => completeMemoryExperience(campaign, 'e05'),
  /repeat the escape/,
)
campaign = chooseMemoryScyllaDeparture(campaign, 'tell-char')
campaign = completeMemoryExperience(campaign, 'e05')
assert.deepEqual(
  availableMemoryExperiences(campaign),
  [],
  'Scylla home wish is an authored event',
)
campaign = rememberMemoryWish(campaign, 'scylla-home-wish')
assert.throws(
  () => completeMemoryExperience(campaign, 'e06'),
  /world-pair ending requires/i,
)
campaign = chooseMemoryPairEnding(campaign, 'e06', 'publish-twin-testimony')
campaign = completeMemoryExperience(campaign, 'e06')
assert.deepEqual(availableMemoryExperiences(campaign), ['e07'])
assert.throws(
  () => completeMemoryExperience(campaign, 'e09'),
  /not currently reachable/,
  'A later overworld cannot interrupt its predecessor’s twisted variant',
)
let linear = campaign
for (const [base, twisted] of MEMORY_REALITY_PAIRS.slice(3, 6)) {
  assert.deepEqual(
    availableMemoryExperiences(linear),
    [base],
    'Every new place starts with its original reality',
  )
  linear = completeMemoryExperience(linear, base)
  assert.deepEqual(
    availableMemoryExperiences(linear),
    [twisted],
    'A completed overworld must lead directly into its distorted version',
  )
  linear = chooseMemoryPairEnding(
    linear,
    twisted,
    MEMORY_PAIR_ENDINGS[twisted][0]!.id,
  )
  linear = completeMemoryExperience(linear, twisted)
}
assert.deepEqual(linear.completed.slice(-6), [
  'e07',
  'e08',
  'e09',
  'e10',
  'e11',
  'e12',
])
assert.deepEqual(
  availableMemoryExperiences(linear),
  [],
  'Scylla’s earned memory evidence is necessary for the Archive reveal',
)
linear = rememberMemoryWish(linear, 'char-possible-future')
assert.deepEqual(availableMemoryExperiences(linear), ['e13'])
assert.throws(
  () => completeMemoryExperience(linear, 'e13'),
  /explicit commitment/,
)
let finale = commitToMemoryFinale(linear)
for (const id of MEMORY_FINALE_ORDER) {
  assert.deepEqual(availableMemoryExperiences(finale), [id])
  if (id === 'e14' || id === 'e16')
    finale = chooseMemoryPairEnding(finale, id, MEMORY_PAIR_ENDINGS[id][0]!.id)
  finale = completeMemoryExperience(finale, id)
}
assert.deepEqual(availableMemoryExperiences(finale), [])
assert.equal(finale.completed.length, 16)

assert.equal(MEMORY_FINALE_PHASES.length, 6)
assert.equal(Object.keys(MEMORY_PAIR_ENDINGS).length, 8)
assert.ok(
  Object.values(MEMORY_PAIR_ENDINGS).every((choices) => choices.length >= 2),
  'Every one of the eight pairs requires a major world-altering decision',
)
assert.equal(MEMORY_SCYLLA_DEPARTURE_CHOICES.length, 3)

for (let i = 1; i < MEMORY_FINALE_PHASES.length; i++) {
  const prev = MEMORY_FINALE_PHASES[i - 1]!
  const next = MEMORY_FINALE_PHASES[i]!
  const changed = [
    prev.ontology !== next.ontology,
    prev.perspective !== next.perspective,
    prev.terrain !== next.terrain,
  ].filter(Boolean)
  assert.ok(
    changed.length >= 2,
    `Finale phase ${next.id} must be more than a color shift`,
  )
  assert.ok(
    next.playableCrisis.length > 25,
    'Every reality phase contains an authored playable crisis',
  )
}

assert.deepEqual(MEMORY_EARLY_ORDER, ['e01', 'e02', 'e03', 'e04', 'e05', 'e06'])
assert.deepEqual(MEMORY_MIDDLE_PAIRS, [
  ['e07', 'e08'],
  ['e09', 'e10'],
  ['e11', 'e12'],
])
assert.deepEqual(MEMORY_FINALE_ORDER, ['e13', 'e14', 'e15', 'e16'])

assert.deepEqual(MEMORY_REALITY_PAIRS, [
  ['e01', 'e02'],
  ['e03', 'e04'],
  ['e05', 'e06'],
  ['e07', 'e08'],
  ['e09', 'e10'],
  ['e11', 'e12'],
  ['e13', 'e14'],
  ['e15', 'e16'],
])
assert.equal(
  MEMORY_REALITY_PAIRS.flat().join(','),
  MEMORY_REALITY_EXPERIENCES.map((entry) => entry.id).join(','),
)
assert.equal(
  MEMORY_REALITY_EXPERIENCES.find((entry) => entry.id === 'e05')!.concept,
  MEMORY_REALITY_EXPERIENCES.find((entry) => entry.id === 'e06')!.concept,
)
console.log(
  'Memory Reimaginer: 8 original/twisted pairs, all 16 sequential realities, earned witness memory and protected finale verified',
)
