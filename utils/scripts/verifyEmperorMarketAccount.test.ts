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
import { MARKET_ACCOUNT_AUDIENCES } from '../emperorOfDust/fortress/marketAccount'
import { decodeBook, encodeBook } from '../emperorOfDust/fortress/saves'
import type { FortressRun } from '../emperorOfDust/fortress/types'

const onDay = (day: number, flags: readonly string[] = []): FortressRun => {
  const fresh = createRun(4628)
  return {
    ...fresh,
    day,
    brass: 130,
    flags: [...fresh.flags, ...flags],
    audiencesHeard: [],
    dayAudiences: undefined,
    audienceBeats: undefined,
  }
}

const choice = (run: FortressRun, audienceId: string, optionId: string) => {
  const audience = audiencesToday(run).find((entry) => entry.id === audienceId)
  assert.ok(audience, audienceId + ' should be available')
  const option = audienceScene(run, audience).options.find(
    (entry) => entry.id === optionId,
  )
  assert.ok(option, audienceId + '/' + optionId)
  return option
}

for (const day of [28, 37, 46] as const) {
  const audiences = MARKET_ACCOUNT_AUDIENCES[day] ?? []
  assert.equal(audiences.length, 1, 'one earned market hearing per day')
  const audience = audiences[0]!
  const expectedVariants = day === 46 ? 6 : 3
  assert.equal(audience.variants?.length, expectedVariants)
  for (const variant of audience.variants ?? []) {
    assert.equal(
      variant.lines.length,
      audience.lines.length,
      'every variant must retain the scene beat count',
    )
    assert.ok(variant.flags?.length, 'each market variant is earned')
  }
}

const routes = [
  {
    first: 'buy-back',
    firstFlag: 'd08-blankets-restored',
    day28: 'reserve-yard',
    day28Flag: 'd28-sellers-yard',
    day28Cost: 20,
    day37: 'escort',
    day37Flag: 'd37-sellers-escorted',
    day37Cost: 15,
    day46: 'food',
    lastFlag: 'd46-sellers-fed',
    lastCost: 15,
  },
  {
    first: 'lease-week',
    firstFlag: 'd08-blankets-leased',
    day28: 'open-warrants',
    day28Flag: 'd28-sellers-warrants',
    day28Cost: 0,
    day37: 'post-copy',
    day37Flag: 'd37-sellers-names-exposed',
    day37Cost: 0,
    day46: 'record',
    lastFlag: 'd46-sellers-recorded',
    lastCost: 0,
  },
  {
    first: 'enforce-charter',
    firstFlag: 'd08-blankets-evicted',
    day28: 'muster-sellers',
    day28Flag: 'd28-sellers-mustered',
    day28Cost: -16,
    day37: 'sell-claims',
    day37Flag: 'd37-sellers-claims-sold',
    day37Cost: -15,
    day46: 'burn',
    lastFlag: 'd46-sellers-warrants-burned',
    lastCost: 0,
  },
] as const

for (const route of routes) {
  let day8 = onDay(8, ['market-charter'])
  if (route.first === 'lease-week') {
    day8 = chooseAudienceOption(day8, 'd08-blanket-evictions', 'ask-rent').run
  }
  const opening = chooseAudienceOption(
    day8,
    'd08-blanket-evictions',
    route.first,
  ).run
  assert.ok(opening.flags.includes(route.firstFlag))

  const day28 = onDay(28, opening.flags)
  const firstBill = choice(day28, 'd28-market-bill', route.day28)
  assert.ok(optionVisible(day28, firstBill))
  assert.deepEqual(optionBlockers(day28, firstBill), [])
  const answered = chooseAudienceOption(
    day28,
    'd28-market-bill',
    route.day28,
  ).run
  assert.ok(answered.flags.includes(route.day28Flag))
  assert.equal(answered.brass, day28.brass - route.day28Cost)
  const wrongDay28 = onDay(28)
  assert.ok(!audiencesToday(wrongDay28).some((a) => a.id === 'd28-market-bill'))

  const day37 = onDay(37, answered.flags)
  const secondBill = choice(day37, 'd37-market-bill', route.day37)
  assert.ok(optionVisible(day37, secondBill))
  assert.deepEqual(optionBlockers(day37, secondBill), [])
  const wartime = chooseAudienceOption(
    day37,
    'd37-market-bill',
    route.day37,
  ).run
  assert.ok(wartime.flags.includes(route.day37Flag))
  assert.equal(wartime.brass, day37.brass - route.day37Cost)
  for (const rival of routes) {
    if (rival.day28 === route.day28) continue
    assert.equal(
      optionVisible(day37, choice(day37, 'd37-market-bill', rival.day37)),
      false,
      'another market contract cannot settle this one',
    )
  }

  const day46 = onDay(46, wartime.flags)
  const final = choice(day46, 'd46-market-bill', route.day46)
  assert.deepEqual(optionBlockers(day46, final), [])
  const settled = chooseAudienceOption(
    day46,
    'd46-market-bill',
    route.day46,
  ).run
  assert.ok(settled.flags.includes(route.lastFlag))
  assert.equal(settled.brass, day46.brass - route.lastCost)
  const page = (run: FortressRun, ending: 'open-roads' | 'long-night') =>
    epilogueFor(run, ending).find(
      (entry) => entry.subject.id === 'market-account',
    )?.variant.text
  assert.ok(page(settled, 'open-roads'))
  assert.notEqual(page(opening, 'open-roads'), page(settled, 'open-roads'))
  assert.notEqual(page(wartime, 'open-roads'), page(settled, 'open-roads'))
  if (route.lastFlag === 'd46-sellers-fed') {
    assert.notEqual(page(settled, 'open-roads'), page(settled, 'long-night'))
  }
  const book = {
    version: 3 as const,
    current: settled,
    dawns: Array.from({ length: 46 }, (_, index) => ({
      ...createRun(4628),
      day: index + 1,
    })),
  }
  assert.deepEqual(decodeBook(encodeBook(book))?.current, settled)
}

for (const route of routes) {
  const prequel = onDay(28, [route.firstFlag])
  assert.equal(
    optionVisible(prequel, choice(prequel, 'd28-market-bill', 'open-warrants')),
    true,
  )
}
console.log(
  'Emperor market accounts: three Day 8 -> 28 -> 37 -> 46 routes, ' +
    'wartime tradeoffs, exclusive gates, brass, saves and epilogues verified.',
)
