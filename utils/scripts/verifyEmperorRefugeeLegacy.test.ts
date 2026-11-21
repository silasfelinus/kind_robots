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
import {
  decodeBook,
  encodeBook,
  newBook,
} from '../emperorOfDust/fortress/saves'
import type { FortressRun } from '../emperorOfDust/fortress/types'

const onDay = (day: number, flags: readonly string[] = []): FortressRun => {
  const fresh = createRun(1839)
  return {
    ...fresh,
    day,
    brass: 120,
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

const routes = [
  {
    day18: 'wagon-escort',
    earlyFlag: 'd18-refugee-wagons',
    congress: 'account-water-carts',
    congressFlag: 'd39-refugee-carts-audited',
    final: 'record-refugee-water',
    finalFlag: 'd49-refugee-water-record',
    epilogue: /water receipts|water-cart/,
    rival: 'account-watch-escort',
  },
  {
    day18: 'watch-escort',
    earlyFlag: 'd18-refugee-watch',
    congress: 'account-watch-escort',
    congressFlag: 'd39-refugee-watch-accounted',
    final: 'record-refugee-watch',
    finalFlag: 'd49-refugee-watch-record',
    epilogue: /empty sentry posts|vacant Watch/,
    rival: 'account-water-carts',
  },
] as const

for (const route of routes) {
  const starting = onDay(18)
  const first = chooseAudienceOption(starting, 'd18-strangers', route.day18).run
  assert.ok(first.flags.includes(route.earlyFlag))
  assert.ok(first.board.some((entry) => entry.questId === 'q-d18-refugee-road'))

  const congress = onDay(39, first.flags)
  const choice = optionFor(congress, 'd39-congress', route.congress)
  assert.ok(optionVisible(congress, choice))
  assert.deepEqual(optionBlockers(congress, choice), [])
  const opposite = optionFor(congress, 'd39-congress', route.rival)
  assert.ok(
    !optionVisible(congress, opposite),
    'The opposite escort cannot be invented late in the reign',
  )
  const accounted = chooseAudienceOption(
    congress,
    'd39-congress',
    route.congress,
  ).run
  assert.equal(accounted.brass, congress.brass - 12)
  assert.ok(accounted.flags.includes(route.congressFlag))
  assert.equal(accounted.local.lamplight, congress.local.lamplight + 2)

  const lastFire = onDay(49, accounted.flags)
  const finalOption = optionFor(lastFire, 'd49-the-record', route.final)
  assert.ok(optionVisible(lastFire, finalOption))
  assert.deepEqual(optionBlockers(lastFire, finalOption), [])
  const recorded = chooseAudienceOption(
    lastFire,
    'd49-the-record',
    route.final,
  ).run
  assert.ok(recorded.flags.includes(route.finalFlag))
  const actual = epilogueFor(recorded, 'open-roads').find(
    (entry) => entry.subject.id === 'refugee-road-record',
  )
  assert.ok(actual, route.final + ': the epilogue must remember the choice')
  assert.match(actual.variant.text, route.epilogue)
  assert.deepEqual(
    decodeBook(encodeBook(newBook(recorded)))?.current,
    recorded,
    route.final + ': authored records survive save/reload',
  )

  const recordedWithoutCopy = epilogueFor(accounted, 'open-roads').find(
    (entry) => entry.subject.id === 'refugee-road-record',
  )
  assert.ok(recordedWithoutCopy)
  assert.notEqual(
    recordedWithoutCopy.variant.text,
    actual.variant.text,
    'The archive-only and publicly delivered records have different endings',
  )
  assert.ok(
    !epilogueFor(first, 'open-roads').some(
      (entry) => entry.subject.id === 'refugee-road-record',
    ),
    'An initial escort without later accountability cannot claim a public record',
  )
  assert.ok(
    !epilogueFor(recorded, 'long-night').some(
      (entry) => entry.subject.id === 'refugee-road-record',
    ),
    'A collapsed kingdom cannot claim its peaceful archive survived',
  )
}

console.log(
  'Emperor refugee legacy: both earned Day 18 -> Day 39 -> Day 49 routes, ' +
    'costs, blocked rival, saved flags and distinct postwar ledgers verified.',
)
