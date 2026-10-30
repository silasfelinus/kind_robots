import assert from 'node:assert/strict'
import { restoreMemoryCampaignProgress } from '../memoryDungeon/campaignPersistence'
import {
  MEMORY_COLLISION_FRAGMENTS,
  MEMORY_COLLISION_ORDER,
  MEMORY_EARLY_ORDER,
  MEMORY_FINALE_ORDER,
  MEMORY_FINALE_PHASES,
  MEMORY_LAST_CHOICE,
  MEMORY_PAIR_ENDINGS,
  MEMORY_REALITY_EXPERIENCES,
  MEMORY_REALITY_PAIRS,
  MEMORY_SCYLLA_DEPARTURE_CHOICES,
  MEMORY_WISH_ANCHORS,
  MEMORY_WORLD_CONCEPTS,
  availableMemoryExperiences,
  chooseMemoryLastChoice,
  chooseMemoryPairEnding,
  chooseMemoryScyllaDeparture,
  commitToMemoryFinale,
  completeMemoryExperience,
  memoryCharFate,
  memoryCoreEndingId,
  memoryEndingConsequences,
  memoryPairWorldFlags,
  newMemoryCampaignProgress,
  recoverMemoryCollisionFragment,
  rememberMemoryWish,
  scyllaOpeningForMemory,
  validateMemoryReimaginerCampaign,
  type MemoryCampaignProgress,
  type MemoryPairEndingWorld,
} from '../memoryDungeon/reimaginerCampaign'

assert.deepEqual(validateMemoryReimaginerCampaign(), [])
assert.equal(MEMORY_WORLD_CONCEPTS.length, 4)
assert.equal(MEMORY_REALITY_EXPERIENCES.length, 12)
assert.equal(
  MEMORY_REALITY_EXPERIENCES.reduce(
    (count, entry) =>
      count + entry.gallery.local + entry.gallery.collaborations,
    0,
  ),
  384,
  'Twelve planned 30+2 galleries are not yet actual delivered artwork',
)
assert.equal(
  new Set(MEMORY_REALITY_EXPERIENCES.map((entry) => entry.id)).size,
  12,
)
assert.deepEqual(MEMORY_REALITY_PAIRS, [
  ['e01', 'e02'],
  ['e03', 'e04'],
  ['e05', 'e06'],
  ['e07', 'e08'],
])
assert.deepEqual(MEMORY_EARLY_ORDER, ['e01', 'e02', 'e03', 'e04', 'e05', 'e06'])
assert.deepEqual(MEMORY_COLLISION_ORDER, ['e09', 'e10', 'e11', 'e12'])
assert.match(
  MEMORY_REALITY_EXPERIENCES.find((item) => item.id === 'e07')!.dramaticQuestion,
  /Vesper/,
)
assert.equal(
  MEMORY_REALITY_EXPERIENCES.find((item) => item.id === 'e08')!.state,
  'dark-reflection',
)
assert.match(
  MEMORY_REALITY_EXPERIENCES.find((item) => item.id === 'e08')!.artSubject,
  /cedar bridge/,
)
assert.deepEqual(MEMORY_FINALE_ORDER, MEMORY_COLLISION_ORDER)
assert.deepEqual(
  [...MEMORY_REALITY_PAIRS.flat(), ...MEMORY_COLLISION_ORDER],
  MEMORY_REALITY_EXPERIENCES.map((entry) => entry.id),
)
for (const concept of MEMORY_WORLD_CONCEPTS) {
  const variants = MEMORY_REALITY_EXPERIENCES.filter(
    (entry) => entry.concept === concept.id,
  )
  assert.equal(variants.length, 3)
  assert.equal(variants[2]!.ontology, 'hybrid')
  assert.notEqual(variants[0]!.title, variants[2]!.title)
  assert.ok(variants[2]!.changeDimensions.length >= 4)
}
assert.deepEqual(
  MEMORY_COLLISION_ORDER.map(
    (id) =>
      MEMORY_REALITY_EXPERIENCES.find((entry) => entry.id === id)!.viewpoint,
  ),
  ['pip', 'morrow', 'char', 'vesper'],
)
assert.equal(MEMORY_REALITY_EXPERIENCES[4]!.ontology, 'underwater')
assert.equal(MEMORY_REALITY_EXPERIENCES[5]!.state, 'dark-reflection')
assert.equal(MEMORY_WISH_ANCHORS['char-possible-future'].source, 'e06')
assert.equal(MEMORY_COLLISION_FRAGMENTS.length, 8)
assert.equal(
  new Set(MEMORY_COLLISION_FRAGMENTS.map((fragment) => fragment.id)).size,
  8,
)
assert.ok(
  MEMORY_COLLISION_ORDER.every(
    (id) =>
      MEMORY_COLLISION_FRAGMENTS.filter((part) => part.world === id).length ===
      2,
  ),
)
assert.equal(Object.keys(MEMORY_PAIR_ENDINGS).length, 6)
assert.equal(MEMORY_LAST_CHOICE.length, 2)
assert.equal(MEMORY_SCYLLA_DEPARTURE_CHOICES.length, 3)

let campaign = newMemoryCampaignProgress()
assert.deepEqual(availableMemoryExperiences(campaign), ['e01'])
assert.throws(
  () => completeMemoryExperience(campaign, 'e04'),
  /not currently reachable/,
)
assert.throws(
  () => recoverMemoryCollisionFragment(campaign, 'briar-office-key'),
  /another world/,
)
assert.throws(() => commitToMemoryFinale(campaign), /not been earned/)
campaign = completeMemoryExperience(campaign, 'e01')
campaign = chooseMemoryPairEnding(campaign, 'e02', 'trust-witnesses')
campaign = completeMemoryExperience(campaign, 'e02')
campaign = completeMemoryExperience(campaign, 'e03')
assert.deepEqual(availableMemoryExperiences(campaign), [])
campaign = rememberMemoryWish(campaign, 'morrow-magic-attempt')
assert.deepEqual(availableMemoryExperiences(campaign), ['e04'])
const beforeWorldFour = campaign

for (const [decision, fate] of [
  ['open-the-tide-gate', 'lost'],
  ['seal-the-tide-gate', 'alive'],
  ['divert-the-current', 'alive'],
] as const) {
  const chosen = chooseMemoryPairEnding(beforeWorldFour, 'e04', decision)
  assert.equal(memoryCharFate(chosen), fate)
  assert.ok(memoryPairWorldFlags(chosen).length > 0)
  assert.throws(
    () => chooseMemoryPairEnding(chosen, 'e04', decision),
    /already resolved/,
  )
  const afterEarth = completeMemoryExperience(chosen, 'e04')
  assert.deepEqual(availableMemoryExperiences(afterEarth), ['e05'])
  assert.match(scyllaOpeningForMemory(afterEarth, 'e05'), /Char|Scylla/)
  for (const departure of MEMORY_SCYLLA_DEPARTURE_CHOICES) {
    let past = chooseMemoryScyllaDeparture(afterEarth, departure.id)
    past = rememberMemoryWish(past, 'scylla-home-wish')
    past = completeMemoryExperience(past, 'e05')
    assert.deepEqual(availableMemoryExperiences(past), ['e06'])
    past = chooseMemoryPairEnding(past, 'e06', 'publish-twin-testimony')
    past = completeMemoryExperience(past, 'e06')
    assert.deepEqual(availableMemoryExperiences(past), ['e07'])
    assert.equal(memoryCharFate(past), fate)
    assert.deepEqual(
      restoreMemoryCampaignProgress(JSON.parse(JSON.stringify(past))),
      past,
      'Every Char fate and Scylla second-chance combination saves legally',
    )
  }
}
assert.match(MEMORY_PAIR_ENDINGS.e04[0]!.publicResult, /Scylla sees Char.*die/)
campaign = chooseMemoryPairEnding(campaign, 'e04', 'open-the-tide-gate')
campaign = completeMemoryExperience(campaign, 'e04')
assert.throws(
  () => completeMemoryExperience(campaign, 'e05'),
  /repeat the escape/,
)
campaign = chooseMemoryScyllaDeparture(campaign, 'tell-char')
campaign = completeMemoryExperience(campaign, 'e05')
assert.deepEqual(availableMemoryExperiences(campaign), [])
campaign = rememberMemoryWish(campaign, 'scylla-home-wish')
campaign = chooseMemoryPairEnding(campaign, 'e06', 'publish-twin-testimony')
campaign = completeMemoryExperience(campaign, 'e06')
assert.deepEqual(availableMemoryExperiences(campaign), ['e07'])
campaign = completeMemoryExperience(campaign, 'e07')
campaign = chooseMemoryPairEnding(campaign, 'e08', 'unbar-all-doors')
campaign = completeMemoryExperience(campaign, 'e08')
assert.deepEqual(availableMemoryExperiences(campaign), [])
campaign = rememberMemoryWish(campaign, 'char-possible-future')
assert.deepEqual(availableMemoryExperiences(campaign), ['e09'])
assert.throws(
  () => completeMemoryExperience(campaign, 'e09'),
  /explicit commitment/,
)
assert.throws(() => commitToMemoryFinale(beforeWorldFour), /not been earned/)

let finale = commitToMemoryFinale(campaign)
for (const id of MEMORY_COLLISION_ORDER) {
  assert.deepEqual(availableMemoryExperiences(finale), [id])
  assert.throws(
    () => completeMemoryExperience(finale, id),
    /Recover both misplaced world fragments/,
  )
  const fragments = MEMORY_COLLISION_FRAGMENTS.filter(
    (part) => part.world === id,
  )
  for (const part of fragments) {
    finale = recoverMemoryCollisionFragment(finale, part.id)
    assert.strictEqual(
      recoverMemoryCollisionFragment(finale, part.id),
      finale,
      'Fragments are once-only',
    )
  }
  if (id === 'e10' || id === 'e12') {
    assert.throws(
      () => completeMemoryExperience(finale, id),
      /World-pair ending requires/,
    )
    finale = chooseMemoryPairEnding(
      finale,
      id as MemoryPairEndingWorld,
      MEMORY_PAIR_ENDINGS[id][0]!.id,
    )
  }
  if (id === 'e12') {
    assert.throws(
      () => completeMemoryExperience(finale, id),
      /final world requires/i,
    )
    finale = chooseMemoryLastChoice(finale, 'repair-with-consent')
  }
  finale = completeMemoryExperience(finale, id)
  assert.deepEqual(
    restoreMemoryCampaignProgress(JSON.parse(JSON.stringify(finale))),
    finale,
    'Each crossover map save must contain real recovered fragments and decisions',
  )
}
assert.deepEqual(availableMemoryExperiences(finale), [])
assert.equal(finale.completed.length, 12)
assert.ok(memoryEndingConsequences(finale).includes('briar-office-key'))
assert.ok(memoryCoreEndingId(finale) !== null)
assert.throws(
  () => completeMemoryExperience(finale, 'e13'),
  /not currently reachable/,
)

const families = new Set<number>()
for (let mask = 0; mask < 32; mask++) {
  const finished: MemoryCampaignProgress = {
    ...finale,
    pairDecisions: {
      ...finale.pairDecisions,
      e02: mask & 1 ? 'trust-witnesses' : 'protect-village',
      e04: mask & 2 ? 'open-the-tide-gate' : 'seal-the-tide-gate',
      e06: mask & 4 ? 'publish-twin-testimony' : 'protect-private-memory',
      e08: mask & 8 ? 'unbar-all-doors' : 'keep-shelter-charter',
    },
    lastChoice: mask & 16 ? 'repair-with-consent' : 'let-worlds-separate',
  }
  families.add(memoryCoreEndingId(finished)!)
}
assert.deepEqual(
  [...families].sort((a, b) => a - b),
  Array.from({ length: 32 }, (_, i) => i),
)
assert.equal(MEMORY_FINALE_PHASES.length, 6)
for (let i = 1; i < MEMORY_FINALE_PHASES.length; i++) {
  const a = MEMORY_FINALE_PHASES[i - 1]!
  const b = MEMORY_FINALE_PHASES[i]!
  assert.ok(
    [
      a.ontology !== b.ontology,
      a.perspective !== b.perspective,
      a.terrain !== b.terrain,
    ].filter(Boolean).length >= 2,
  )
}
console.log(
  'Memory Reimaginer: four original/twisted acts, four connected crossover maps, Char POV, eight real fragment gates, nine sea branches, 32 core ending IDs, migration verified',
)
