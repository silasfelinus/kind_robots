import assert from 'node:assert/strict'
import {
  audienceScene,
  audiencesToday,
  chooseAudienceOption,
  createRun,
  optionBlockers,
  optionVisible,
} from '../emperorOfDust/fortress/engine'
import { epilogueFor } from '../emperorOfDust/fortress/epilogue'
import { decodeBook, encodeBook } from '../emperorOfDust/fortress/saves'
import type { FortressRun } from '../emperorOfDust/fortress/types'

const onDay = (day: number, flags: readonly string[] = []): FortressRun => {
  const fresh = createRun(2901)
  return {
    ...fresh,
    day,
    brass: 125,
    flags: [...fresh.flags, ...flags],
    audiencesHeard: [],
    dayAudiences: undefined,
    audienceBeats: undefined,
  }
}

const optionFor = (run: FortressRun, audienceId: string, optionId: string) => {
  const audience = audiencesToday(run).find((item) => item.id === audienceId)
  assert.ok(audience, audienceId + ': audience is present')
  const option = audienceScene(run, audience).options.find(
    (item) => item.id === optionId,
  )
  assert.ok(option, audienceId + '/' + optionId + ': authored choice exists')
  return option
}

const waterRoutes = [
  {
    first: 'lock',
    firstFlag: 'd12-cistern-locked',
    congress: 'buy-back-cistern-key',
    congressFlag: 'd39-cistern-public-key',
    cost: 25,
    final: 'record-cistern-key',
    finalFlag: 'd49-cistern-public-deed',
    rival: 'pay-tunnel-keepers',
    finalText: /twenty-five brass/,
  },
  {
    first: 'ask-galleries',
    firstFlag: 'd12-cistern-moles',
    prerequisites: ['d07-galleries-found'],
    congress: 'pay-tunnel-keepers',
    congressFlag: 'd39-cistern-keeper-wages',
    cost: 15,
    final: 'record-cistern-keepers',
    finalFlag: 'd49-cistern-keepers-record',
    rival: 'commission-hill-cistern',
    finalText: /no routes/,
  },
  {
    first: 'ask-ash',
    beat: 'new-cistern',
    firstFlag: 'd12-new-cistern',
    costAtDawn: 35,
    congress: 'commission-hill-cistern',
    congressFlag: 'd39-hill-cistern-commission',
    cost: 15,
    final: 'record-hill-cistern',
    finalFlag: 'd49-hill-cistern-record',
    rival: 'buy-back-cistern-key',
    finalText: /thirty-five brass/,
  },
] as const

for (const route of waterRoutes) {
  const starting = onDay(
    12,
    'prerequisites' in route ? route.prerequisites : [],
  )
  const firstOption = optionFor(starting, 'd12-cistern', route.first)
  assert.deepEqual(optionBlockers(starting, firstOption), [])
  const firstStep = chooseAudienceOption(
    starting,
    'd12-cistern',
    route.first,
  ).run
  const water =
    'beat' in route
      ? chooseAudienceOption(firstStep, 'd12-cistern', route.beat).run
      : firstStep
  assert.ok(water.flags.includes(route.firstFlag))
  if ('costAtDawn' in route) {
    assert.equal(water.brass, starting.brass - route.costAtDawn)
  }

  const congress = onDay(39, water.flags)
  const proposed = optionFor(congress, 'd39-congress', route.congress)
  assert.ok(optionVisible(congress, proposed))
  assert.deepEqual(optionBlockers(congress, proposed), [])
  assert.equal(
    optionVisible(congress, optionFor(congress, 'd39-congress', route.rival)),
    false,
  )
  const funded = chooseAudienceOption(
    congress,
    'd39-congress',
    route.congress,
  ).run
  assert.equal(funded.brass, congress.brass - route.cost)
  assert.ok(funded.flags.includes(route.congressFlag))

  const final = onDay(49, funded.flags)
  const lastChoice = optionFor(final, 'd49-the-record', route.final)
  assert.ok(optionVisible(final, lastChoice))
  assert.deepEqual(optionBlockers(final, lastChoice), [])
  const recorded = chooseAudienceOption(
    final,
    'd49-the-record',
    route.final,
  ).run
  assert.ok(recorded.flags.includes(route.finalFlag))
  const text = (run: FortressRun, ending: 'open-roads' | 'long-night') =>
    epilogueFor(run, ending).find(
      (entry) => entry.subject.id === 'yard-water-debt',
    )?.variant.text
  assert.match(text(recorded, 'open-roads') ?? '', route.finalText)
  assert.notEqual(
    text(recorded, 'open-roads'),
    text(funded, 'open-roads'),
    'A congress promise is not the same as a lasting deed',
  )
  assert.notEqual(
    text(water, 'open-roads'),
    text(funded, 'open-roads'),
    'The original water choice must be remembered before redress',
  )
  assert.notEqual(
    text(recorded, 'open-roads'),
    text(recorded, 'long-night'),
    'The Long Night must not silently grant a peaceful water settlement',
  )
  const saved = {
    version: 3 as const,
    current: recorded,
    dawns: Array.from({ length: recorded.day }, (_, index) => ({
      ...createRun(2901),
      day: index + 1,
    })),
  }
  assert.deepEqual(decodeBook(encodeBook(saved))?.current, recorded)
}

console.log(
  'Emperor Yard water debt: three earned Day 12 -> Day 39 -> Day 49 routes, ' +
    'brass costs, rival gates, persistent records and distinct endings verified.',
)
