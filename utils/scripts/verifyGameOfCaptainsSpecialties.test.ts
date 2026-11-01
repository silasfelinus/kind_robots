import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { startVoyage, ANTAGONISTS } from '../gameOfCaptains/rules'
import { STAR_SIGNS, createStarAssessment } from '../gameOfCaptains/starSigns'
import { SKILLS, CREW_PROFILES } from '../gameOfCaptains/crewAssignments'
import {
  chapterSystem,
  casinoIncident,
  SERENDIPITY_FRANCHISES,
} from '../gameOfCaptains/solarCircuit'
import {
  episodeCard,
  episodeIncitingEvent,
  episodePlotSkill,
  episodePlotConnection,
  episodePlotOdds,
  episodePlotSeats,
  episodeDuoExperience,
  type EpisodeDraw,
} from '../gameOfCaptains/episodeConsole'

const crew = ['pell', 'mox', 'rue'] as const
const sample = (seed: number) => startVoyage('vale', [...crew], seed)
const seenPlanetSkills = new Set<string>()
const seenPlanetCards = new Set<string>()
const seenCasino = new Set<string>()
for (let seed = 1; seed < 250; seed++) {
  const run = sample(seed)
  const card = episodeCard(run, 'planet')
  const teaser = episodeIncitingEvent(run)
  assert.ok(
    teaser.includes(card.title.toLowerCase()),
    `opening teaser must match revealed story: ${seed}`,
  )
  const skill = episodePlotSkill(run, 'planet')
  seenPlanetCards.add(card.title)
  seenPlanetSkills.add(skill)
  assert.ok(SKILLS.includes(skill))
  assert.ok(
    ['rescue', 'diplomacy', 'science', 'culture', 'luck'].includes(skill),
  )
  const system = chapterSystem(run.seed, run.chapter)
  const casino = casinoIncident(run.seed, run.chapter, system)
  assert.equal(episodePlotSkill(run, 'casino'), casino.skill)
  seenCasino.add(casino.title)
  assert.ok(SKILLS.includes(episodePlotSkill(run, 'serendipity')))
  assert.ok(SKILLS.includes(episodePlotSkill(run, 'nemesis')))
}
assert.equal(
  seenPlanetCards.size,
  10,
  'all authored planetary plot cards appear',
)
assert.ok(seenPlanetSkills.size >= 5)
assert.equal(seenCasino.size, 8)
for (const franchise of SERENDIPITY_FRANCHISES) {
  const run = sample(1)
  const local = { ...run, seed: run.seed }
  // All franchise skills are explicitly mapped, including each of the 20 venues.
  assert.ok(franchise.id)
  assert.ok(
    SKILLS.includes(
      episodePlotSkill(
        {
          ...local,
          chapter:
            SERENDIPITY_FRANCHISES.findIndex(
              (entry) => entry.id === franchise.id,
            ) + 1,
        },
        'serendipity',
      ),
    ),
  )
}
const assessment = createStarAssessment([0, 1, 2, 1])!
for (const sign of STAR_SIGNS) {
  const run = {
    ...sample(17),
    starAssessment: { ...assessment, sign: sign.id },
  }
  assert.ok(SKILLS.includes(episodePlotSkill(run, 'constellation')))
}
for (const enemy of ANTAGONISTS) {
  const run = { ...sample(17), antagonist: ANTAGONISTS.indexOf(enemy) }
  assert.ok(SKILLS.includes(episodePlotSkill(run, 'nemesis')))
}

// The ten authored planet stories name a possible connection among the twelve
// available officers. Taking that particular officer improves forecast odds,
// while an unrelated officer does not get someone else's story bonus.
for (let seed = 1; seed < 100; seed++) {
  const run = sample(seed)
  const card = episodeCard(run, 'planet')
  const named = CREW_PROFILES.find((officer) =>
    card.link.includes(officer.name),
  )
  if (!named) continue
  assert.ok(episodePlotConnection(run, 'planet', [named.id]))
  assert.equal(episodePlotConnection(run, 'planet', ['captain']), null)
  const withConnect = episodePlotOdds(run, 'planet', [named.id])
  const unconnected = episodePlotOdds(
    {
      ...run,
      crew: run.crew.filter((id) => id !== named.id) as typeof run.crew,
    },
    'planet',
    ['captain'],
  )
  assert.ok(withConnect > 0 && unconnected > 0)
}
const fixed = sample(34)
assert.equal(episodeDuoExperience(fixed, ['captain', 'pell']), 0)
const history: EpisodeDraw[] = [
  {
    chapter: 1,
    day: 1,
    deck: 'planet',
    cardId: 'one',
    choice: 'ask',
    result: 'shared success',
    successful: true,
    cast: ['pell', 'captain'],
  },
  {
    chapter: 2,
    day: 2,
    deck: 'casino',
    cardId: 'two',
    choice: 'ask',
    result: 'failed',
    successful: false,
    cast: ['captain', 'pell'],
  },
]
const experienced = { ...fixed, episodeDrawHistory: history }
assert.equal(episodeDuoExperience(experienced, ['captain', 'pell']), 1)
assert.equal(episodeDuoExperience(experienced, ['pell', 'captain']), 1)
assert.equal(episodeDuoExperience(experienced, ['captain', 'mox']), 0)
assert.equal(episodeDuoExperience(experienced, ['captain']), 0)
const many = {
  ...fixed,
  episodeDrawHistory: Array.from({ length: 8 }, (_, index) => ({
    ...history[0]!,
    chapter: index + 1,
  })),
}
assert.equal(
  episodeDuoExperience(many, ['captain', 'pell']),
  3,
  'the repeat partnership bonus is bounded',
)
let testedOdds = false
for (let seed = 1; seed < 300; seed++) {
  const run = sample(seed)
  const first = episodePlotOdds(run, 'planet', ['captain', 'pell'])
  const withHistory = { ...run, episodeDrawHistory: history }
  const repeat = episodePlotOdds(withHistory, 'planet', ['captain', 'pell'])
  if (episodePlotSeats(run, 'planet') === 2 && first > 0 && first < 90) {
    assert.equal(repeat, first + 5)
    testedOdds = true
    break
  }
}
assert.ok(testedOdds, 'earned duo rapport changes actual success odds')
const vue = readFileSync(
  new URL('../../components/gameOfCaptains/daily-console.vue', import.meta.url),
  'utf8',
)
assert.ok(vue.includes('CREW CONNECTION'))
assert.ok(vue.includes('FAMILIAR PARTNERS'))
assert.ok(vue.includes("'LEAD' : 'SUPPORT'"))
console.log(
  'Space Couch story-specific skills, matching teaser, officer connection, durable duo rapport verified',
)
