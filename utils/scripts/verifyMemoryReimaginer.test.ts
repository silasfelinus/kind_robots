import assert from 'node:assert/strict'
import {
  MEMORY_EARLY_ORDER,
  MEMORY_FINALE_ORDER,
  MEMORY_FINALE_PHASES,
  MEMORY_MIDDLE_PAIRS,
  MEMORY_REALITY_EXPERIENCES,
  MEMORY_WORLD_CONCEPTS,
  MEMORY_WISH_ANCHORS,
  availableMemoryExperiences,
  commitToMemoryFinale,
  completeMemoryExperience,
  newMemoryCampaignProgress,
  rememberMemoryWish,
  validateMemoryReimaginerCampaign,
  type ExperienceId,
  type MemoryCampaignProgress,
} from '../memoryDungeon/reimaginerCampaign'

assert.deepEqual(validateMemoryReimaginerCampaign(), [])
assert.equal(MEMORY_WORLD_CONCEPTS.length, 8)
assert.equal(MEMORY_REALITY_EXPERIENCES.length, 16)
assert.equal(
  MEMORY_REALITY_EXPERIENCES.reduce(
    (total, experience) => total + experience.gallery.local + experience.gallery.collaborations,
    0,
  ),
  512,
  'Each of sixteen experiences requires its own 30+2 image gallery; plans are not delivered art',
)
assert.equal(new Set(MEMORY_REALITY_EXPERIENCES.map((experience) => experience.id)).size, 16)

for (const concept of MEMORY_WORLD_CONCEPTS) {
  const variants = MEMORY_REALITY_EXPERIENCES.filter((experience) => experience.concept === concept.id)
  assert.equal(variants.length, 2, `${concept.id} supports two interpretable incarnations`)
  assert.notEqual(variants[0]!.title, variants[1]!.title)
  assert.ok(variants[1]!.changeDimensions.length >= 3, 'A dark variant cannot be merely a dark palette')
}

assert.equal(MEMORY_REALITY_EXPERIENCES[0]!.id, 'e01')
assert.equal(MEMORY_REALITY_EXPERIENCES[0]!.concept, 'briar')
assert.equal(MEMORY_REALITY_EXPERIENCES[2]!.viewpoint, 'morrow')
assert.equal(MEMORY_REALITY_EXPERIENCES[2]!.ontology, 'mundane')
assert.equal(MEMORY_REALITY_EXPERIENCES[3]!.ontology, 'enchanted-earth')
assert.equal(MEMORY_REALITY_EXPERIENCES[4]!.viewpoint, 'scylla')
assert.equal(MEMORY_REALITY_EXPERIENCES[5]!.ontology, 'underwater')
assert.equal(MEMORY_WISH_ANCHORS['char-possible-future'].source, 'e06')
assert.match(
  MEMORY_WISH_ANCHORS['char-possible-future'].meaning,
  /not an unavoidable death/i,
)

let campaign = newMemoryCampaignProgress()
assert.deepEqual(availableMemoryExperiences(campaign), ['e01'])
assert.throws(() => completeMemoryExperience(campaign, 'e04'), /not currently reachable/)
assert.throws(() => rememberMemoryWish(campaign, 'morrow-magic-attempt'), /must be experienced/)
assert.throws(() => commitToMemoryFinale(campaign), /not been earned/)

campaign = completeMemoryExperience(campaign, 'e01')
campaign = completeMemoryExperience(campaign, 'e02')
campaign = completeMemoryExperience(campaign, 'e03')
assert.deepEqual(availableMemoryExperiences(campaign), [], 'Morrow wish evidence is not silently manufactured')
campaign = rememberMemoryWish(campaign, 'morrow-magic-attempt')
assert.equal(rememberMemoryWish(campaign, 'morrow-magic-attempt'), campaign, 'A repeated wish cannot duplicate rewards')
assert.deepEqual(availableMemoryExperiences(campaign), ['e04'])

campaign = completeMemoryExperience(campaign, 'e04')
campaign = completeMemoryExperience(campaign, 'e05')
assert.deepEqual(availableMemoryExperiences(campaign), [], 'Scylla home wish is an authored event')
campaign = rememberMemoryWish(campaign, 'scylla-home-wish')
campaign = completeMemoryExperience(campaign, 'e06')
assert.deepEqual(availableMemoryExperiences(campaign), ['e07', 'e09', 'e11'])

let twoPaths = campaign
twoPaths = completeMemoryExperience(twoPaths, 'e09')
twoPaths = completeMemoryExperience(twoPaths, 'e10')
twoPaths = completeMemoryExperience(twoPaths, 'e07')
twoPaths = completeMemoryExperience(twoPaths, 'e08')
assert.deepEqual(availableMemoryExperiences(twoPaths), ['e11'], 'Finishing two paths does not auto-create Char testimony')
twoPaths = rememberMemoryWish(twoPaths, 'char-possible-future')
assert.deepEqual(
  availableMemoryExperiences(twoPaths),
  ['e11', 'e13'],
  'The optional third middle route remains open alongside earned finale commitment',
)
assert.throws(() => completeMemoryExperience(twoPaths, 'e13'), /explicit commitment/)

let finale = commitToMemoryFinale(twoPaths)
assert.deepEqual(availableMemoryExperiences(finale), ['e13'], 'No unrelated realms interrupt the final odyssey')
for (const id of MEMORY_FINALE_ORDER) {
  assert.deepEqual(availableMemoryExperiences(finale), [id])
  finale = completeMemoryExperience(finale, id)
}
assert.deepEqual(availableMemoryExperiences(finale), [])
assert.equal(finale.completed.filter((id) => MEMORY_FINALE_ORDER.includes(id as typeof MEMORY_FINALE_ORDER[number])).length, 4)
assert.equal(MEMORY_FINALE_PHASES.length, 6)

for (let i = 1; i < MEMORY_FINALE_PHASES.length; i++) {
  const prev = MEMORY_FINALE_PHASES[i - 1]!
  const next = MEMORY_FINALE_PHASES[i]!
  const changed = [
    prev.ontology !== next.ontology,
    prev.perspective !== next.perspective,
    prev.terrain !== next.terrain,
  ].filter(Boolean)
  assert.ok(changed.length >= 2, `Finale phase ${next.id} must be more than a color shift`)
  assert.ok(next.playableCrisis.length > 25, 'Every reality phase contains an authored playable crisis')
}

assert.deepEqual(MEMORY_EARLY_ORDER, ['e01', 'e02', 'e03', 'e04', 'e05', 'e06'])
assert.deepEqual(MEMORY_MIDDLE_PAIRS, [
  ['e07', 'e08'],
  ['e09', 'e10'],
  ['e11', 'e12'],
])
assert.deepEqual(MEMORY_FINALE_ORDER, ['e13', 'e14', 'e15', 'e16'])

function finishAlternativeMiddle(
  chosen: readonly [ExperienceId, ExperienceId],
  other: readonly [ExperienceId, ExperienceId],
): MemoryCampaignProgress {
  let state = rememberMemoryWish(campaign, 'char-possible-future')
  for (const id of [...chosen, ...other]) {
    assert.ok(availableMemoryExperiences(state).includes(id))
    state = completeMemoryExperience(state, id)
  }
  return state
}

for (const [i, first] of MEMORY_MIDDLE_PAIRS.entries()) {
  for (const [j, second] of MEMORY_MIDDLE_PAIRS.entries()) {
    if (i === j) continue
    const state = finishAlternativeMiddle(first, second)
    assert.ok(availableMemoryExperiences(state).includes('e13'))
    assert.deepEqual(availableMemoryExperiences(commitToMemoryFinale(state)), ['e13'])
  }
}

console.log('Memory Reimaginer: eight concepts, sixteen experiences, remembered wishes, branching middle and continuous multi-reality finale pass')
