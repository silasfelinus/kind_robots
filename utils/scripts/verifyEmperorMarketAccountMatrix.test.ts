import assert from 'node:assert/strict'
import {
  audienceScene,
  audiencesToday,
  chooseAudienceOption,
  createRun,
  optionBlockers,
  optionVisible,
} from '../emperorOfDust/fortress/engine'
import { MARKET_ACCOUNT_AUDIENCES } from '../emperorOfDust/fortress/marketAccount'
import { epilogueFor } from '../emperorOfDust/fortress/epilogue'
import { decodeBook, encodeBook } from '../emperorOfDust/fortress/saves'
import type { FortressRun } from '../emperorOfDust/fortress/types'

const starts = [
  'd08-blankets-restored',
  'd08-blankets-leased',
  'd08-blankets-evicted',
] as const
const branches = [
  {
    day28: 'reserve-yard',
    flag28: 'd28-sellers-yard',
    day37: ['escort', 'leave'],
    flags37: ['d37-sellers-escorted', 'd37-sellers-left'],
  },
  {
    day28: 'open-warrants',
    flag28: 'd28-sellers-warrants',
    day37: ['hide-copy', 'post-copy'],
    flags37: ['d37-sellers-records-saved', 'd37-sellers-names-exposed'],
  },
  {
    day28: 'muster-sellers',
    flag28: 'd28-sellers-mustered',
    day37: ['redeem-pay', 'sell-claims'],
    flags37: ['d37-sellers-bonds-redeemed', 'd37-sellers-claims-sold'],
  },
] as const
const conclusions = [
  ['food', 'd46-sellers-fed'],
  ['record', 'd46-sellers-recorded'],
  ['burn', 'd46-sellers-warrants-burned'],
] as const

const onDay = (
  day: number,
  flags: readonly string[],
  brass = 100,
): FortressRun => {
  const fresh = createRun(20261121)
  return {
    ...fresh,
    day,
    brass,
    flags: [...fresh.flags, ...flags],
    audiencesHeard: [],
    dayAudiences: undefined,
    audienceBeats: undefined,
  }
}

const hearing = (run: FortressRun, id: string) => {
  const audience = audiencesToday(run).find((entry) => entry.id === id)
  assert.ok(audience, 'missing earned hearing ' + id)
  return audienceScene(run, audience)
}

const option = (run: FortressRun, id: string, choice: string) => {
  const result = hearing(run, id).options.find((entry) => entry.id === choice)
  assert.ok(result, id + '/' + choice)
  return result
}

const settle = (run: FortressRun, id: string, choice: string) => {
  const selected = option(run, id, choice)
  assert.ok(optionVisible(run, selected), id + '/' + choice + ' invisible')
  assert.deepEqual(optionBlockers(run, selected), [])
  return chooseAudienceOption(run, id, choice).run
}

let paths = 0
const outcomes = new Set<string>()
for (const opening of starts) {
  for (const branch of branches) {
    const day28 = settle(onDay(28, [opening]), 'd28-market-bill', branch.day28)
    assert.ok(day28.flags.includes(branch.flag28))
    for (const [index, wartimeChoice] of branch.day37.entries()) {
      const day37 = onDay(37, day28.flags)
      const available = hearing(day37, 'd37-market-bill')
        .options.filter((candidate) => optionVisible(day37, candidate))
        .map((candidate) => candidate.id)
      assert.deepEqual(
        [...available].sort(),
        [...branch.day37].sort(),
        'Day 37 must offer exactly the two earned wartime alternatives',
      )
      const wartime = settle(day37, 'd37-market-bill', wartimeChoice)
      assert.ok(wartime.flags.includes(branch.flags37[index]!))
      for (const [finalChoice, finalFlag] of conclusions) {
        const day46 = onDay(46, wartime.flags)
        const finished = settle(day46, 'd46-market-bill', finalChoice)
        assert.ok(finished.flags.includes(finalFlag))
        const text = epilogueFor(finished, 'open-roads').find(
          (entry) => entry.subject.id === 'market-account',
        )?.variant.text
        assert.ok(text && text.length > 50, 'missing earned market epilogue')
        const book = {
          version: 3 as const,
          current: finished,
          dawns: Array.from({ length: finished.day }, (_, i) =>
            onDay(
              i + 1,
              i + 1 < 28
                ? []
                : i + 1 < 37
                  ? [opening]
                  : i + 1 < 46
                    ? day28.flags
                    : wartime.flags,
            ),
          ),
        }
        assert.deepEqual(decodeBook(encodeBook(book))?.current, finished)
        outcomes.add(
          [opening, branch.day28, wartimeChoice, finalChoice].join('/'),
        )
        paths++
      }
    }
  }
}
assert.equal(
  paths,
  54,
  '3 origins x 3 wartime policies x 2 exile routes x 3 resolutions',
)
assert.equal(outcomes.size, paths)

for (const branch of branches) {
  const run = onDay(37, [branch.flag28])
  for (const other of branches) {
    if (other.day28 === branch.day28) continue
    for (const id of other.day37) {
      assert.equal(
        optionVisible(run, option(run, 'd37-market-bill', id)),
        false,
      )
    }
  }
}

for (const day of [28, 37, 46] as const) {
  const audience = MARKET_ACCOUNT_AUDIENCES[day]?.[0]
  assert.ok(audience)
  assert.ok(
    !audiencesToday(onDay(day, [])).some((entry) => entry.id === audience.id),
  )
  for (const candidate of audience.options) {
    const cost = candidate.requires?.cost ?? 0
    if (cost <= 0) continue
    const earned =
      day === 28
        ? [starts[0]]
        : day === 37
          ? [branches[0].flag28]
          : [branches[0].flags37[0]]
    const broke = onDay(day, earned, cost - 1)
    const selected = option(broke, audience.id, candidate.id)
    if (!optionVisible(broke, selected)) continue
    assert.ok(
      optionBlockers(broke, selected).length > 0,
      audience.id + '/' + candidate.id + ' must not be free when broke',
    )
  }
}
console.log(
  'Emperor market-account adversarial matrix: 54 unique earned paths, save roundtrips, branch exclusivity, low-brass gates and epilogues verified.',
)
