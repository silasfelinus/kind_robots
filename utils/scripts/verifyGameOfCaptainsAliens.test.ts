import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ALIEN_SPECIES } from '../gameOfCaptains/alienSpecies'
import { ALIEN_SPECIES_STORIES } from '../gameOfCaptains/alienSpeciesStories'
import { ALIEN_CHOICE_STORIES } from '../gameOfCaptains/alienChoiceStories'
import {
  ALIEN_CHOICES,
  ALIEN_MILESTONES,
  alienEvidence,
  alienObservation,
  alienOutcome,
  emptyAlienGuide,
  normalizeAlienGuide,
  maySeeAlien,
  nextAlienSighting,
  resolveAlienSighting,
} from '../gameOfCaptains/alienFieldGuide'
import {
  COLLECTOR_INCIDENTS,
  nextCollectorIncident,
  resolveCollectorIncident,
  collectorEcho,
} from '../gameOfCaptains/alienMilestones'
import { startVoyage } from '../gameOfCaptains/rules'

assert.equal(ALIEN_SPECIES.length, 101)
assert.equal(new Set(ALIEN_SPECIES.map((species) => species.id)).size, 101)
assert.equal(new Set(ALIEN_SPECIES.map((species) => species.artKey)).size, 101)
assert.deepEqual(
  ['zodiac', 'hybrid', 'cosmic', 'social', 'ecology', 'legendary'].map(
    (group) =>
      ALIEN_SPECIES.filter((species) => species.category === group).length,
  ),
  [12, 24, 20, 20, 15, 10],
)
assert.ok(new Set(ALIEN_SPECIES.map((species) => species.palette)).size >= 6)
assert.ok(new Set(ALIEN_SPECIES.map((species) => species.social)).size >= 6)
assert.deepEqual(
  ALIEN_CHOICES.map((choice) => choice.id),
  ['approach', 'observe', 'improvise'],
)
assert.deepEqual(
  ALIEN_MILESTONES.map((item) => item.at),
  [5, 12, 25, 50, 75, 100],
)
const base = startVoyage('vale', ['pell', 'mox', 'rue'], 414414)
const run = { ...base, chapter: 2, phase: 'expedition' as const }
const empty = emptyAlienGuide()
assert.equal(maySeeAlien({ ...run, chapter: 1 }, empty), false)
assert.equal(maySeeAlien(run, empty), true)
const first = nextAlienSighting(run, empty)!
assert.ok(first)
assert.equal(first.species.id, nextAlienSighting(run, empty)!.species.id)
assert.deepEqual(nextAlienSighting(run, empty), first)

// A fair three-by-three emotional matrix: no action is consistently safe,
// and no scene telegraphs the retreat outcome on its buttons.
const moods = ['wary', 'playful', 'protective'] as const
const outcomes = ['retreat', 'chaos', 'bond'] as const
for (const mood of moods) {
  const actual = ALIEN_CHOICES.map((choice) => alienOutcome(mood, choice.id))
  assert.deepEqual([...actual].sort(), [...outcomes].sort())
}
for (const choice of ALIEN_CHOICES) {
  const actual = moods.map((mood) => alienOutcome(mood, choice.id))
  assert.deepEqual([...actual].sort(), [...outcomes].sort())
  assert.doesNotMatch(
    choice.label + ' ' + choice.hint,
    /run away|flee|retreat|friend|chaos|record|unlock|discover/i,
  )
}
const observed = alienEvidence(first.species.category, first.mood)
const firstPersonal = ALIEN_SPECIES_STORIES[first.species.id]
assert.ok(first.scene.includes(firstPersonal?.incident ?? observed.incident))
assert.ok(
  first.scene.includes(
    firstPersonal?.evidence[first.mood] ?? observed.evidence,
  ),
)
assert.equal(
  first.scene,
  `${firstPersonal!.incident} ${firstPersonal!.evidence[first.mood]}`,
  'show the conflict and readable clue, not a redundant field-guide recitation',
)
const allScenes = new Set<string>()
for (const category of [
  'zodiac',
  'hybrid',
  'cosmic',
  'social',
  'ecology',
  'legendary',
] as const) {
  for (const mood of moods) {
    const clue = alienEvidence(category, mood)
    assert.ok(
      clue.incident.length >= 65,
      category + ' incident needs a readable situation',
    )
    assert.ok(
      clue.evidence.length >= 65,
      category + ' evidence needs buried detail',
    )
    assert.doesNotMatch(
      clue.incident + ' ' + clue.evidence,
      /\\b(wary|playful|protective|bond|friendship|retreat|flee|guaranteed)\\b/i,
    )
    allScenes.add(clue.incident + clue.evidence)
  }
}
assert.equal(
  allScenes.size,
  18,
  'different ecology and emotions require different authored clues',
)
assert.ok(first.scene.length >= 150, 'the scene keeps its specific dramatic stakes')
assert.equal(first.mood, nextAlienSighting(run, empty)!.mood)

assert.deepEqual(
  Object.keys(ALIEN_SPECIES_STORIES).sort(),
  ALIEN_SPECIES.map((species) => species.id).sort(),
  'all 101 creatures must have original species-specific encounters',
)
const authoredLines = new Set<string>()
const sceneWords: number[] = []
for (const species of ALIEN_SPECIES) {
  const story = ALIEN_SPECIES_STORIES[species.id]!
  assert.ok(story.incident.length >= 110, species.name + ' needs a real scene')
  authoredLines.add(story.incident)
  const onlyThisSpeciesMissing = {
    ...empty,
    discovered: ALIEN_SPECIES.filter((alien) => alien.id !== species.id).map(
      (alien) => alien.id,
    ),
  }
  const sighting = nextAlienSighting(run, onlyThisSpeciesMissing)!
  assert.equal(sighting.species.id, species.id)
  assert.ok(sighting.scene.includes(story.incident))
  assert.ok(sighting.scene.includes(story.evidence[sighting.mood]))
  assert.equal(sighting.scene, `${story.incident} ${story.evidence[sighting.mood]}`)
  sceneWords.push(sighting.scene.trim().split(/\s+/).length)
  for (const mood of moods) {
    const clue = story.evidence[mood]
    assert.ok(clue.length >= 80, species.name + ' needs a readable cue')
    authoredLines.add(clue)
    for (const outcome of outcomes) {
      const choice = ALIEN_CHOICES.find(
        (item) => alienOutcome(mood, item.id) === outcome,
      )!.id
      const text = story.outcomes[outcome]
      assert.ok(
        text.length >= 80,
        species.name + ' needs a distinct ' + outcome + ' result',
      )
      authoredLines.add(text)
      const report = resolveAlienSighting(empty, { ...sighting, mood }, choice)
      const actionStory = ALIEN_CHOICE_STORIES[species.id]?.[mood]?.[choice]
      assert.ok(
        report.text.startsWith(actionStory ?? text),
        species.name + ' must lead with its authored cause and consequence',
      )
      assert.equal(report.recorded, outcome !== 'retreat')
    }
  }
}
assert.equal(
  authoredLines.size,
  101 * 7,
  '101 incidents, 303 mood cues and 303 aftermaths must be unique',
)

const averageSceneWords = Math.round(
  sceneWords.reduce((total, count) => total + count, 0) / sceneWords.length,
)
assert.ok(
  averageSceneWords <= 80,
  'alien scene setup must stay within a readable budget: ' +
    averageSceneWords +
    ' average words',
)
assert.equal(
  Object.keys(ALIEN_CHOICE_STORIES).length,
  6,
  'one complete nine-way encounter from each alien family',
)
const actionProse = new Set<string>()
for (const [id, moodStories] of Object.entries(ALIEN_CHOICE_STORIES)) {
  assert.ok(ALIEN_SPECIES.some((species) => species.id === id))
  for (const mood of moods) {
    const outcomeStories = moodStories[mood]
    for (const choice of ALIEN_CHOICES) {
      const prose = outcomeStories[choice.id]
      assert.ok(prose.length >= 125, id + ' must explain each interaction')
      assert.match(prose, /^You /, id + ' must credit the chosen action')
      assert.ok(!actionProse.has(prose), id + ' repeated an authored reaction')
      actionProse.add(prose)
    }
  }
}
assert.equal(actionProse.size, 54)
console.log('Space Couch alien scene budget: ' + averageSceneWords + ' average words and 54 causal branches')

const choiceFor = (
  mood: typeof first.mood,
  outcome: 'retreat' | 'chaos' | 'bond',
) =>
  ALIEN_CHOICES.find((choice) => alienOutcome(mood, choice.id) === outcome)!.id
const fleeing = resolveAlienSighting(
  empty,
  first,
  choiceFor(first.mood, 'retreat'),
)
assert.equal(fleeing.recorded, false)
assert.equal(fleeing.guide.discovered.length, 0)
assert.equal(maySeeAlien(run, fleeing.guide), false)
assert.equal(maySeeAlien({ ...run, chapter: 3 }, fleeing.guide), true)
const chaos = resolveAlienSighting(empty, first, choiceFor(first.mood, 'chaos'))
assert.equal(chaos.recorded, true)
assert.equal(chaos.guide.discovered.length, 1)
assert.equal(chaos.guide.friends.length, 0)
const friend = resolveAlienSighting(empty, first, choiceFor(first.mood, 'bond'))
assert.equal(friend.recorded, true)
assert.deepEqual(friend.guide.discovered, chaos.guide.discovered)
assert.deepEqual(friend.guide.friends, [first.species.id])
assert.deepEqual(
  resolveAlienSighting(friend.guide, first, choiceFor(first.mood, 'chaos'))
    .guide,
  friend.guide,
  'the same chapter cannot award twice',
)
assert.equal(chaos.guide.lastContact?.outcome, 'chaos')
assert.equal(friend.guide.lastContact?.outcome, 'bond')
assert.equal(friend.guide.lastContact?.choice, choiceFor(first.mood, 'bond'))
assert.equal(friend.guide.fieldReports?.length, 1)
assert.equal(friend.guide.fieldReports?.[0]?.speciesId, first.species.id)
assert.match(alienObservation(friend.guide.fieldReports![0]!), /We tried/)
assert.match(
  alienObservation(friend.guide.fieldReports![0]!),
  /It chose to stay/,
)
assert.ok(
  alienObservation(friend.guide.fieldReports![0]!).includes(
    firstPersonal?.evidence[first.mood] ?? observed.evidence,
  ),
)
assert.equal(fleeing.guide.lastContact?.outcome, 'retreat')
const restoredGuide = normalizeAlienGuide(
  JSON.parse(JSON.stringify(friend.guide)),
)
assert.equal(restoredGuide.lastContact?.outcome, 'bond')
assert.deepEqual(restoredGuide.fieldReports, friend.guide.fieldReports)
assert.deepEqual(
  normalizeAlienGuide({
    fieldReports: [
      { speciesId: 'invented', mood: 'wary', outcome: 'bond' },
      { speciesId: first.species.id, mood: 'fake', outcome: 'bond' },
    ],
  }).fieldReports,
  undefined,
)
const followup = nextAlienSighting({ ...run, chapter: 3 }, friend.guide)!
assert.ok(
  !followup.scene.includes('A previous new friend'),
  'prior reports appear in the scrapbook, not every new intro',
)
assert.notEqual(followup.species.id, first.species.id)

assert.deepEqual(
  normalizeAlienGuide({
    discovered: [first.species.id, first.species.id, 'not-a-species'],
    friends: [first.species.id, 'not-a-species'],
    attempted: ['bad', '414414:2', '414414:2'],
    milestoneSeen: [5, -2, 5, 999],
  }),
  {
    version: 1,
    discovered: [first.species.id],
    friends: [first.species.id],
    attempted: ['414414:2'],
    milestoneSeen: [5],
  },
)
const legacyNarrationOnly = {
  ...emptyAlienGuide(),
  discovered: ALIEN_SPECIES.slice(0, 5).map((alien) => alien.id),
  milestoneSeen: [5],
}
assert.equal(
  nextCollectorIncident(legacyNarrationOnly)?.at,
  5,
  'old milestone narration cannot consume a newly playable incident',
)
const legacyReplayed = resolveCollectorIncident(legacyNarrationOnly, 5, 'a')!
assert.deepEqual(legacyReplayed.guide.milestoneSeen, [5])
assert.equal(legacyReplayed.guide.milestoneDecisions?.['5'], 'a')
assert.equal(COLLECTOR_INCIDENTS.length, 6)
assert.equal(
  new Set(COLLECTOR_INCIDENTS.map((event) => event.illustrationKey)).size,
  6,
)
assert.equal(COLLECTOR_INCIDENTS.flatMap((event) => event.options).length, 18)
for (const count of [5, 12, 25, 50, 75, 100]) {
  const guide = {
    ...emptyAlienGuide(),
    discovered: ALIEN_SPECIES.slice(0, count).map((alien) => alien.id),
    milestoneSeen: ALIEN_MILESTONES.filter((event) => event.at < count).map(
      (event) => event.at,
    ),
    milestoneDecisions: Object.fromEntries(
      ALIEN_MILESTONES.filter((event) => event.at < count).map((event) => [
        String(event.at),
        'a' as const,
      ]),
    ),
  }
  const incident = nextCollectorIncident(guide)!
  assert.equal(incident.at, count)
  assert.equal(incident.options.length, 3)
  assert.ok(incident.scene.length > 100)
  assert.ok(incident.complication.length > 70)
  assert.deepEqual(
    incident.options.map((option) => option.id),
    ['a', 'b', 'c'],
  )
  assert.deepEqual(
    [...new Set(incident.options.map((option) => option.ending))].sort(),
    ['bond', 'chaos', 'retreat'],
  )
  const sighting = nextAlienSighting(run, guide)!
  assert.ok(sighting)
  assert.equal(
    'milestone' in sighting,
    false,
    'normal sightings never consume a collector incident',
  )
  const plain = resolveAlienSighting(
    guide,
    sighting,
    choiceFor(sighting.mood, 'retreat'),
  )
  assert.equal(
    nextCollectorIncident(plain.guide)?.at,
    count,
    'alien contact cannot silently use a milestone',
  )
  assert.equal(resolveCollectorIncident(guide, count + 1, 'a'), null)
  for (const option of incident.options) {
    const result = resolveCollectorIncident(guide, count, option.id)!
    assert.equal(result.ending, option.ending)
    assert.equal(result.text, option.consequence)
    assert.ok(result.guide.milestoneSeen.includes(count))
    assert.equal(result.guide.milestoneDecisions?.[String(count)], option.id)
    assert.equal(nextCollectorIncident(result.guide), null)
    assert.equal(collectorEcho(result.guide), option.echo)
    assert.equal(resolveCollectorIncident(result.guide, count, option.id), null)
    const restored = normalizeAlienGuide(
      JSON.parse(JSON.stringify(result.guide)),
    )
    assert.equal(restored.milestoneDecisions?.[String(count)], option.id)
    assert.equal(collectorEcho(restored), option.echo)
  }
}
assert.deepEqual(
  normalizeAlienGuide({
    milestoneSeen: [5],
    milestoneDecisions: { '5': 'a', '12': 'b', '100': 'evil' },
  }).milestoneDecisions,
  { '5': 'a' },
)

let guide = emptyAlienGuide()
for (let i = 0; i < 101; i++) {
  const trip = { ...run, seed: 414414 + i, chapter: 2 + (i % 8) }
  const sighting = nextAlienSighting(trip, guide)
  assert.ok(sighting, 'a remaining undiscovered alien stays reachable')
  guide = resolveAlienSighting(
    guide,
    sighting!,
    choiceFor(sighting!.mood, 'chaos'),
  ).guide
}
assert.equal(guide.discovered.length, 101)
assert.equal(new Set(guide.discovered).size, 101)
assert.equal(maySeeAlien(run, guide), false)
assert.equal(nextAlienSighting(run, guide), null)

const projectRoot = new URL('../../', import.meta.url)
const page = readFileSync(
  new URL('pages/play/game-of-captains.vue', projectRoot),
  'utf8',
)
const store = readFileSync(
  new URL('stores/gameOfCaptainsStore.ts', projectRoot),
  'utf8',
)
const encounter = readFileSync(
  new URL('components/gameOfCaptains/alien-encounter.vue', projectRoot),
  'utf8',
)
const scrapbook = readFileSync(
  new URL('components/gameOfCaptains/alien-scrapbook.vue', projectRoot),
  'utf8',
)
const collector = readFileSync(
  new URL('components/gameOfCaptains/alien-milestone.vue', projectRoot),
  'utf8',
)
assert.match(page, /space-couch-alien-signal/)
assert.match(page, /space-couch-open-alien-scrapbook/)
assert.match(encounter, /v-for="choice in ALIEN_CHOICES"/)
assert.match(encounter, /space-couch-alien-emotional-cue/)
assert.match(encounter, /space-couch-alien-prior-field-note/)
assert.match(scrapbook, /space-couch-alien-scrapbook-field-note/)
assert.match(scrapbook, /v-for="\(alien, index\) in ALIEN_SPECIES"/)
assert.match(store, /game-of-captains-alien-scrapbook-v1/)
assert.match(store, /normalizeAlienGuide/)
assert.match(collector, /testid-prefix="space-couch-collector-option"/)
assert.match(collector, /emit\('choose', choice\.id as CollectorChoice\)/)
assert.match(scrapbook, /space-couch-collector-from-scrapbook/)
assert.match(page, /space-couch-collector-signal/)
assert.match(page, /SpaceCouchAlienMilestone/)
assert.match(store, /resolveCollectorIncident/)
assert.match(store, /collectorEcho/)
console.log(
  'Space Couch aliens: 101 species, 3 choices, six milestones, persistence and reachable collection OK',
)
