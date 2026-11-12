import assert from 'node:assert/strict'
import { playVoyage, type Driver } from './spaceCouchTraceHarness'
import {
  COUCH_SHIELD_FULL,
  MISSION_RETURN_SUPPLIES,
  missionReturnSupplyDelta,
  rechargeCouchShield,
  startVoyage,
  type CaptainId,
  type CrewId,
  type VoyageRun,
} from '../gameOfCaptains/rules'
import {
  ALIEN_CHOICES,
  emptyAlienGuide,
  maySeeAlien,
  nextAlienSighting,
  resolveAlienSighting,
  type AlienChoice,
  type AlienGuide,
  type AlienSighting,
} from '../gameOfCaptains/alienFieldGuide'
import {
  nextCollectorIncident,
  resolveCollectorIncident,
} from '../gameOfCaptains/alienMilestones'
import { ALIEN_SPECIES_STORIES } from '../gameOfCaptains/alienSpeciesStories'
import { ALIEN_CHOICE_STORIES } from '../gameOfCaptains/alienChoiceStories'
import { endingFamilyTitle } from '../gameOfCaptains/artSlots'

assert.deepEqual(
  [
    missionReturnSupplyDelta(0, 'disaster'),
    missionReturnSupplyDelta(1, 'disaster'),
    missionReturnSupplyDelta(2, 'disaster'),
    missionReturnSupplyDelta(3, 'disaster'),
    missionReturnSupplyDelta(0, 'costly'),
    missionReturnSupplyDelta(0, 'success'),
    missionReturnSupplyDelta(3, 'flawless'),
  ],
  [0, -1, -2, -2, 0, 1, 2],
  'mission receipt shows actual crate movement, never imaginary negative inventory',
)

type Player = {
  name: string
  driver: Driver
  contact: 'none' | 'greet' | 'observe' | 'improvise' | 'cycle'
}

const PLAYERS: Player[] = [
  {
    name: 'curious completionist',
    driver: {
      name: 'curious-completionist',
      order: (run) => (run.chapter % 3 === 0 ? 'observe' : 'aid'),
      episode: (run) => (run.chapter % 2 ? 'ask' : 'document'),
      authoredChoices: true,
      sideQuests: true,
      resupply: () => true,
      trio: () => 0,
      romance: (_run, choices) => choices[0] ?? null,
      finale: 'protect',
    },
    contact: 'cycle',
  },
  {
    name: 'impatient skipper',
    driver: {
      name: 'impatient-skipper',
      order: (run) => (run.chapter % 3 === 0 ? 'miss' : 'aid'),
      episode: () => 'ask',
      sideQuests: false,
      trio: () => null,
      finale: 'protect',
    },
    contact: 'none',
  },
  {
    name: 'chaos captain',
    driver: {
      name: 'chaos-captain',
      order: () => 'intervene',
      episode: () => 'override',
      redshirtsFirst: true,
      authoredChoices: true,
      finale: 'compromise',
    },
    contact: 'improvise',
  },
  {
    name: 'cautious observer',
    driver: {
      name: 'cautious-observer',
      order: () => 'observe',
      episode: () => 'document',
      sideQuests: false,
      finale: 'compromise',
    },
    contact: 'observe',
  },
  {
    name: 'reckless helper',
    driver: {
      name: 'reckless-helper',
      order: () => 'aid',
      episode: () => 'ask',
      redshirtsFirst: true,
      resupply: () => true,
      finale: 'protect',
    },
    contact: 'greet',
  },
]

const CAPTAINS: CaptainId[] = ['fluke', 'vale', 'solace', 'rex', 'quill']
const PARTIES: CrewId[][] = [
  ['pell', 'mox', 'rue'],
  ['vela', 'taal', 'omi'],
  ['sora', 'kivo', 'tess'],
  ['brin', 'jex', 'fen'],
  ['rue', 'vela', 'mox'],
]

const chooseContact = (
  style: Player['contact'],
  sighting: AlienSighting,
  index: number,
): AlienChoice =>
  style === 'greet'
    ? 'approach'
    : style === 'observe'
      ? 'observe'
      : style === 'improvise'
        ? 'improvise'
        : style === 'cycle'
          ? ALIEN_CHOICES[index % ALIEN_CHOICES.length]!.id
          : sighting.mood === 'wary'
            ? 'observe'
            : sighting.mood === 'playful'
              ? 'approach'
              : 'improvise'

type ContactStats = {
  attempts: number
  recorded: number
  friends: number
  chaos: number
  retreats: number
  milestones: number[]
  sceneWords: number[]
  escapes: number
  returns: number
  longestWait: number
  escapedAt: Map<string, number>
}

function encounter(
  run: VoyageRun,
  guide: AlienGuide,
  style: Player['contact'] | 'oracle',
  stats: ContactStats,
): AlienGuide {
  assert.equal(run.phase, 'expedition')
  assert.ok(maySeeAlien(run, guide))
  const sighting = nextAlienSighting(run, guide)!
  const choice = chooseContact(
    style === 'oracle' ? 'none' : style,
    sighting,
    stats.attempts,
  )
  const outcome = resolveAlienSighting(guide, sighting, choice)
  const story = ALIEN_SPECIES_STORIES[sighting.species.id]
  assert.ok(story, sighting.species.id + ' must have an authored encounter')
  const expected =
    story.outcomes[
      sighting.mood === 'wary'
        ? choice === 'observe'
          ? 'bond'
          : choice === 'approach'
            ? 'retreat'
            : 'chaos'
        : sighting.mood === 'playful'
          ? choice === 'approach'
            ? 'bond'
            : choice === 'observe'
              ? 'chaos'
              : 'retreat'
          : choice === 'improvise'
            ? 'bond'
            : choice === 'approach'
              ? 'chaos'
              : 'retreat'
    ]
  assert.ok(
    outcome.text.startsWith(
      ALIEN_CHOICE_STORIES[sighting.species.id]?.[sighting.mood]?.[choice] ??
        expected,
    ),
    sighting.species.name +
      ': chosen action leads to its own original response',
  )
  const fledAt = stats.escapedAt.get(sighting.species.id)
  assert.equal(
    sighting.returning === true,
    fledAt !== undefined,
    sighting.species.name + ': near-miss callback only for an escaped alien',
  )
  if (fledAt !== undefined) {
    stats.returns++
    stats.longestWait = Math.max(stats.longestWait, stats.attempts - fledAt)
    assert.ok(sighting.scene.startsWith('Second chance: the '))
  }
  stats.attempts++
  stats.sceneWords.push(sighting.scene.trim().split(/\s+/).length)
  if (outcome.recorded) stats.recorded++
  const result = outcome.guide.lastContact?.outcome
  if (fledAt !== undefined) {
    assert.ok(outcome.recorded, 'a second chance always files a record')
    stats.escapedAt.delete(sighting.species.id)
  } else if (result === 'retreat') {
    stats.escapes++
    stats.escapedAt.set(sighting.species.id, stats.attempts)
  }
  if (result === 'bond') stats.friends++
  if (result === 'chaos') stats.chaos++
  if (result === 'retreat') stats.retreats++
  let next = outcome.guide
  const milestone = nextCollectorIncident(next)
  if (milestone) {
    const result = resolveCollectorIncident(next, milestone.at, 'b')
    assert.ok(result)
    next = result.guide
    stats.milestones.push(milestone.at)
  }
  return next
}

const blankStats = (): ContactStats => ({
  attempts: 0,
  recorded: 0,
  friends: 0,
  chaos: 0,
  retreats: 0,
  milestones: [],
  sceneWords: [],
  escapes: 0,
  returns: 0,
  longestWait: 0,
  escapedAt: new Map(),
})

// Real complete voyages. The optional alien overlay is invoked at the same
// expedition-phase point as the Store's 'look for alien' button.
for (const player of PLAYERS) {
  const endings = new Map<string, number>()
  const stepsPerVoyage: number[] = []
  const uniqueIncidents = new Set<string>()
  const sample: string[] = []
  const stats = blankStats()
  let guide = emptyAlienGuide()
  let depleted = 0
  let casualties = 0
  for (let i = 0; i < 5; i++) {
    const captain = CAPTAINS[i]!
    const crew = PARTIES[i]!
    const seed = 47011 + i * 123
    const trace = playVoyage(captain, crew, seed, player.driver, {
      onStep: (label, before, after) => {
        if (
          label === 'arrive' &&
          after.phase === 'expedition' &&
          player.contact !== 'none' &&
          maySeeAlien(after, guide)
        ) {
          const sighting = nextAlienSighting(after, guide)!
          uniqueIncidents.add(sighting.species.id)
          if (sample.length < 2)
            sample.push(
              sighting.species.name + ': ' + sighting.scene.slice(0, 185),
            )
          guide = encounter(after, guide, player.contact, stats)
        }
        if (before.phase === 'decision' && sample.length < 3)
          sample.push('Decision ' + label + ': ' + after.scene.slice(0, 185))
      },
    })
    assert.equal(trace.run.phase, 'ending')
    const family = endingFamilyTitle(trace.run.ending!)
    endings.set(family, (endings.get(family) ?? 0) + 1)
    stepsPerVoyage.push(trace.steps.length)
    if (trace.run.supplies === 0) depleted++
    casualties += trace.run.redshirtFallen?.length ?? 0
  }
  assert.equal(stepsPerVoyage.length, 5)
  if (player.contact !== 'none') assert.ok(stats.attempts >= 25)
  console.log(
    'SPACE COUCH FUN PILOT ' +
      player.name +
      ': ' +
      '5 complete voyages, ' +
      stepsPerVoyage.join('/') +
      ' steps, ' +
      endings.size +
      ' ending families, ' +
      stats.attempts +
      ' optional alien contacts, ' +
      uniqueIncidents.size +
      ' unique creatures, ' +
      depleted +
      '/5 empty holds, ' +
      casualties +
      ' fallen redshirts',
  )
  for (const line of sample) console.log('  STORY SNAPSHOT: ' + line)
}

// Companion collector playthroughs continue across complete voyages. The
// oracle is a theoretical upper bound, not something the visible UI reveals.
for (const strategy of ['greet', 'cycle', 'oracle'] as const) {
  const stats = blankStats()
  let guide = emptyAlienGuide()
  let voyages = 0
  for (; voyages < 40 && guide.discovered.length < 101; voyages++) {
    const seed = 73001 + voyages * 17
    const captain = CAPTAINS[voyages % CAPTAINS.length]!
    const crew = PARTIES[voyages % PARTIES.length]!
    const driver = PLAYERS[0]!.driver
    playVoyage(captain, crew, seed, driver, {
      inspectEvery: false,
      onStep: (label, _before, after) => {
        if (
          label === 'arrive' &&
          after.phase === 'expedition' &&
          maySeeAlien(after, guide)
        )
          guide = encounter(after, guide, strategy, stats)
      },
    })
  }
  assert.equal(guide.discovered.length, 101, strategy + ': all 101 reachable')
  assert.deepEqual(stats.milestones, [5, 12, 25, 50, 75, 100])
  assert.equal(stats.attempts, stats.friends + stats.chaos + stats.retreats)
  assert.equal(stats.escapedAt.size, 0, strategy + ': every runaway came back')
  assert.equal(
    stats.returns,
    stats.escapes,
    strategy + ': each first escape gets exactly one second chance',
  )
  assert.ok(
    stats.longestWait <= 10,
    strategy +
      ': a runaway returns within about one voyage of stops, saw ' +
      stats.longestWait,
  )
  assert.ok(
    voyages <= 18,
    strategy +
      ': merciful second chances keep the full collection within 18 voyages, saw ' +
      voyages,
  )
  const avgWords = Math.round(
    stats.sceneWords.reduce((sum, words) => sum + words, 0) /
      stats.sceneWords.length,
  )
  console.log(
    'SPACE COUCH COLLECTOR ' +
      strategy +
      ': ' +
      voyages +
      ' actual complete voyages, ' +
      stats.attempts +
      ' meetings, ' +
      stats.recorded +
      ' captures, ' +
      stats.friends +
      ' friendships, ' +
      stats.chaos +
      ' chaos, ' +
      stats.retreats +
      ' escaped, ' +
      stats.returns +
      ' near-miss returns (longest wait ' +
      stats.longestWait +
      ' sightings), ' +
      avgWords +
      ' average scene words, ' +
      stats.milestones.length +
      ' collector events',
  )
}

// Supply curve: careful and kind captains finish with a thin but stocked
// hold, reckless helpers still feel the squeeze, and an empty hold remains
// possible. Seeded and replayable, so a drift in any drain shows up here.
const recharged = rechargeCouchShield({
  ...startVoyage('fluke', ['pell', 'mox', 'rue'], 41),
  shieldCharge: 0,
})
assert.equal(recharged.shieldCharge, COUCH_SHIELD_FULL)
assert.equal(recharged.supplies, 6, 'one supply refills the whole bubble')
assert.deepEqual(MISSION_RETURN_SUPPLIES, {
  flawless: 2,
  success: 1,
  costly: -1,
  disaster: -2,
})
const SUPPLY_SEEDS = 24
const supplyCurves = new Map<
  string,
  { ends: number[]; emptyStops: number; shortfalls: number }
>()
for (const player of PLAYERS) {
  const curve = { ends: [] as number[], emptyStops: 0, shortfalls: 0 }
  for (let i = 0; i < SUPPLY_SEEDS; i++) {
    const trace = playVoyage(
      CAPTAINS[i % CAPTAINS.length]!,
      PARTIES[i % PARTIES.length]!,
      47011 + i * 123,
      player.driver,
      {
        inspectEvery: false,
        onStep: (label, before, after) => {
          if (
            (label === 'next' || label.startsWith('finish:')) &&
            before.supplies === 0
          )
            curve.emptyStops++
          if (
            before.phase === 'decision' &&
            (after.worldFlags ?? []).some(
              (flag) =>
                flag.startsWith('supply-shortfall:') &&
                !(before.worldFlags ?? []).includes(flag),
            )
          )
            curve.shortfalls++
        },
      },
    )
    assert.equal(trace.run.phase, 'ending')
    curve.ends.push(trace.run.supplies)
  }
  supplyCurves.set(player.name, curve)
  const sorted = [...curve.ends].sort((a, b) => a - b)
  const mean = curve.ends.reduce((sum, n) => sum + n, 0) / SUPPLY_SEEDS
  console.log(
    'SPACE COUCH SUPPLY CURVE ' +
      player.name +
      ': ' +
      curve.ends.filter((n) => n > 0).length +
      '/' +
      SUPPLY_SEEDS +
      ' voyages end stocked, end hold min/median/max ' +
      sorted[0] +
      '/' +
      sorted[Math.floor(SUPPLY_SEEDS / 2)] +
      '/' +
      sorted.at(-1) +
      ', mean ' +
      mean.toFixed(1) +
      ', ' +
      (curve.emptyStops / SUPPLY_SEEDS).toFixed(1) +
      ' empty chapter ends per voyage, ' +
      curve.shortfalls +
      ' underfunded orders',
  )
}
const supplyCurve = (name: string) => {
  const curve = supplyCurves.get(name)!
  return {
    ...curve,
    stocked: curve.ends.filter((n) => n > 0).length / SUPPLY_SEEDS,
    mean: curve.ends.reduce((sum, n) => sum + n, 0) / SUPPLY_SEEDS,
    emptyStopsPerVoyage: curve.emptyStops / SUPPLY_SEEDS,
  }
}
const observer = supplyCurve('cautious observer')
assert.ok(observer.stocked >= 0.6, 'a careful captain usually keeps a hold')
assert.ok(observer.mean <= 7, 'a careful captain’s hold stays thin')
const completionist = supplyCurve('curious completionist')
assert.ok(
  completionist.stocked >= 0.35,
  'a kind completionist often finishes with crates left',
)
assert.ok(completionist.mean <= 4, 'kindness still spends the hold down')
assert.ok(
  completionist.emptyStopsPerVoyage <= 3,
  'a kind captain is not stranded for half the voyage',
)
const reckless = supplyCurve('reckless helper')
assert.ok(reckless.stocked <= 0.5, 'reckless generosity still runs dry')
assert.ok(reckless.shortfalls > 0, 'reckless helpers still arrive empty-handed')
assert.ok(
  [...supplyCurves.values()].some((curve) => curve.ends.includes(0)),
  'an empty hold remains possible',
)

console.log(
  'Space Couch independent fun playtests: five player styles, 25 full voyages plus complete collector arcs OK',
)
