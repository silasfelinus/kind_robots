// Post-merge adversarial playtest for court recruitment, rewind safety, and
// the full 50-day economy. No mocked quest engine and no play-time LLM.
import assert from 'node:assert/strict'
import {
  audienceScene,
  audiencesToday,
  chooseAudienceOption,
  createRun,
  finishDay,
  optionBlockers,
} from '../emperorOfDust/fortress/engine'
import { endingOf } from '../emperorOfDust/fortress/endings'
import {
  COURT_RECRUITMENT_IDS,
  RANDOM_ARRIVALS,
  RIVAL_ARGUMENTS,
} from '../emperorOfDust/fortress/onboarding'
import {
  decodeBook,
  encodeBook,
  newBook,
  recordDawn,
  rewindTo,
  validateRun,
} from '../emperorOfDust/fortress/saves'
import {
  POLICIES,
  balanceReport,
  playCampaign,
} from '../emperorOfDust/fortress/balance'

const OPENING_SEEDS = 240
const POLICY_SEEDS = 40
const combinations = new Map<string, number>()
const recruited = new Map<string, number>()
let openingBranches = 0
let rewoundDifferent = 0
let maxOpeningQuests = 0

for (let seed = 1; seed <= OPENING_SEEDS; seed += 1) {
  const dawn = createRun(seed)
  assert.equal(dawn.day, 1)
  assert.equal(dawn.roster.length, 0, `seed ${seed}: nobody is free`)
  assert.equal(dawn.dailyEvent, undefined)
  assert.ok(validateRun(dawn))
  const today = audiencesToday(dawn)
  assert.equal(today.length, 4)
  assert.deepEqual(
    audiencesToday(createRun(seed)).map((a) => a.id),
    today.map((a) => a.id),
    `seed ${seed}: the same seed has the same court`,
  )
  const invites = today.filter((a) => COURT_RECRUITMENT_IDS.includes(a.id))
  assert.equal(invites.length, 3)
  const visitor = invites.find((a) => RANDOM_ARRIVALS.some((id) => id === a.id))
  const argument = invites.find((a) =>
    RIVAL_ARGUMENTS.some((id) => id === a.id),
  )
  assert.ok(visitor && argument)
  const identity = `${visitor.id}|${argument.id}`
  combinations.set(identity, (combinations.get(identity) ?? 0) + 1)
  assert.throws(
    () => finishDay(dawn),
    /three recruiting petitions/,
    `seed ${seed}: cannot leave an unstaffed court`,
  )

  for (const choice of argument.options) {
    let run = createRun(seed)
    run = chooseAudienceOption(run, argument.id, choice.id).run
    run = chooseAudienceOption(run, 'd01-kiyo-arrives', 'appoint').run
    run = chooseAudienceOption(run, visitor.id, 'appoint').run
    const aqueduct = seed % 2 ? 'repair' : 'levy'
    run = chooseAudienceOption(run, 'd01-aqueduct', aqueduct).run
    const winners = choice.effects.recruit ?? []
    const expectedSize = choice.id === 'both' ? 4 : 3
    assert.equal(run.roster.length, expectedSize)
    assert.equal(new Set(run.roster.map((f) => f.id)).size, expectedSize)
    assert.ok(run.roster.some((f) => f.id === 'F003'))
    const opponents = argument.options
      .filter((option) => option.id !== 'both')
      .flatMap((option) => option.effects.recruit ?? [])
      .filter((id) => !winners.includes(id))
    assert.ok(winners.length >= 1)
    for (const winner of winners) {
      assert.ok(run.roster.some((f) => f.id === winner))
      recruited.set(winner, (recruited.get(winner) ?? 0) + 1)
    }
    for (const opponent of opponents) {
      assert.ok(!run.roster.some((f) => f.id === opponent))
      assert.ok(run.flags.includes(`court-excluded:${opponent}`))
    }
    if (choice.id === 'both') assert.ok(run.brass <= 10)
    maxOpeningQuests = Math.max(maxOpeningQuests, run.board.length)
    assert.ok(
      run.board.length <= 2,
      `seed ${seed}: ${run.board.length} Day 1 quests`,
    )
    assert.deepEqual(
      decodeBook(encodeBook(newBook(run)))?.current,
      run,
      `seed ${seed}: save retains the chosen recruit`,
    )

    const second = finishDay(run).run
    assert.equal(second.day, 2)
    assert.ok(audiencesToday(second).some((a) => a.id === 'd01-toll'))
    assert.ok(!audiencesToday(second).some((a) => a.id === 'd01-mirefen'))
    const third = finishDay(second).run
    assert.equal(third.day, 3)
    assert.ok(audiencesToday(third).some((a) => a.id === 'd01-mirefen'))

    const book = recordDawn(newBook(createRun(seed)), second)
    const rewound = rewindTo(book, 1)
    const newCourt = audiencesToday(rewound.current)
    assert.equal(rewound.current.roster.length, 0)
    assert.equal(rewound.current.audiencesHeard.length, 0)
    assert.equal(newCourt.length, 4)
    assert.equal(
      newCourt.filter((a) => COURT_RECRUITMENT_IDS.includes(a.id)).length,
      3,
      `seed ${seed}: refreshed recruitment after rewind`,
    )
    assert.ok(decodeBook(encodeBook(rewound)))
    const newInvites = newCourt.filter((a) =>
      COURT_RECRUITMENT_IDS.includes(a.id),
    )
    if (
      newInvites.some((a) => !invites.some((previous) => previous.id === a.id))
    )
      rewoundDifferent += 1
    openingBranches += 1
  }
}

assert.equal(combinations.size, 8, 'all eight visitor/argument pairs appear')
assert.equal(recruited.size, 4, 'each of four disputants is recruitable')
assert.ok(rewoundDifferent > 0, 'rewinds can reroll a different court')

// The last fire cannot inherit military rule from passive Watch popularity.
// It takes a visible Day 47 charter with a real price paid by the court.
const unsigned = createRun(619)
unsigned.day = 47
unsigned.dayAudiences = ['d47-watch-writ']
unsigned.local['gate-watch'] = 12
assert.ok(audiencesToday(unsigned).some((a) => a.id === 'd47-watch-writ'))
const refused = chooseAudienceOption(unsigned, 'd47-watch-writ', 'refuse').run
const signed = chooseAudienceOption(
  unsigned,
  'd47-watch-writ',
  'sign-watch-writ',
).run
assert.ok(refused.flags.includes('watch-writ-refused'))
assert.ok(!refused.flags.includes('watch-writ-signed'))
assert.ok(signed.flags.includes('watch-writ-signed'))
assert.equal(signed.local.yard, unsigned.local.yard - 3)
assert.equal(signed.affinity.freeholds, unsigned.affinity.freeholds - 8)

const onPeaceDay = (run: typeof signed) => ({
  ...run,
  day: 49,
  dayAudiences: ['d49-whose-peace'],
})
const ironChoice = audienceScene(
  onPeaceDay(signed),
  audiencesToday(onPeaceDay(signed)).find((a) => a.id === 'd49-whose-peace')!,
).options.find((option) => option.id === 'iron')!
assert.ok(optionBlockers(onPeaceDay(refused), ironChoice).length > 0)
assert.deepEqual(optionBlockers(onPeaceDay(signed), ironChoice), [])
const chosenIron = chooseAudienceOption(
  onPeaceDay(signed),
  'd49-whose-peace',
  'iron',
).run
assert.equal(
  endingOf({ ...chosenIron, flags: [...chosenIron.flags, 'horror-sealed'] }).id,
  'iron-peace',
)

// Fifty-day campaign bots: 14 policies x 40 seeds. These traverse the real
// assignment, faction, injury, death, bankruptcy and ending rules.
const report = balanceReport(POLICY_SEEDS)
assert.equal(report.length, POLICIES.length)
assert.equal(
  report.find((policy) => policy.policy === 'spurn-all')?.endings[
    'iron-peace'
  ] ?? 0,
  0,
  'a ruler who rejects every faction must not silently inherit Iron Peace',
)
assert.equal(
  report.find((policy) => policy.policy === 'spurn-all')?.endings[
    'witchwater-throne'
  ] ?? 0,
  0,
  'Mire Mother loyalty must count as taking a faction side',
)
assert.ok(
  (report.find((policy) => policy.policy === 'marshal')?.endings[
    'iron-peace'
  ] ?? 0) > 0,
  'an explicit Watch mandate must still reach Iron Peace',
)
const allEndings = new Set(report.flatMap((p) => Object.keys(p.endings)))
assert.ok(allEndings.size >= 4, 'campaign paths reach varied ending families')
const fullRuns = report.length * POLICY_SEEDS
const allDeaths = report.reduce((sum, p) => sum + p.deaths, 0)
const allLoans = report.reduce((sum, p) => sum + p.loans, 0)
const allHeavyLosses = report.reduce((sum, p) => sum + p.heavyLosses, 0)
const allWipedFactions = report.reduce((sum, p) => sum + p.wipedOut, 0)

// Extra dawn-by-dawn invariants over multiple policies and seeds. An
// excluded rival may never silently return during a fifty-day campaign.
const probedPolicies = POLICIES.filter((p) =>
  ['greedy', 'reckless', 'idle', 'patron:moles'].includes(p.id),
)
let observedDawns = 0
for (const policy of probedPolicies) {
  for (let seed = 1; seed <= 8; seed += 1) {
    let previousDay = 0
    playCampaign(policy, seed, (run) => {
      assert.ok(validateRun(run), `${policy.id}/${seed}: invalid dawn`)
      assert.equal(run.day, previousDay + 1)
      previousDay = run.day
      observedDawns += 1
      assert.equal(
        new Set(run.roster.map((state) => state.id)).size,
        run.roster.length,
      )
      for (const flag of run.flags) {
        if (!flag.startsWith('court-excluded:')) continue
        const rejected = flag.slice('court-excluded:'.length)
        assert.ok(
          !run.roster.some((f) => f.id === rejected),
          `${policy.id}/${seed}: rejected ${rejected} returned`,
        )
      }
    })
    assert.equal(previousDay, 51, 'all 50 days finish')
  }
}

console.log(
  'EMPEROR_ADVERSARIAL_RESULT ' +
    JSON.stringify({
      openingSeeds: OPENING_SEEDS,
      openingBranches,
      combinations: Object.fromEntries(combinations),
      rivalWinners: Object.fromEntries(recruited),
      rewoundDifferent,
      maxOpeningQuests,
      campaignRuns: fullRuns + probedPolicies.length * 8,
      campaignDays: (fullRuns + probedPolicies.length * 8) * 50,
      observedDawns,
      endingFamilies: [...allEndings].sort(),
      deaths: allDeaths,
      heavyLosses: allHeavyLosses,
      loans: allLoans,
      wipedFactions: allWipedFactions,
      policyReport: report,
    }),
)
