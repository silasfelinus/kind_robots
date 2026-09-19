// /utils/scripts/verifyMandarinPoints.test.ts
//
// Regression test for mandarin-tutor/t-023's scoring model
// (server/utils/mandarinPoints.ts). Pure functions only -- no prisma, no database, no
// Nuxt/H3 runtime -- same discipline as utils/scripts/verifyMandarinSrs.test.ts.
//
// The assertions that matter are the ones about INCENTIVES, not arithmetic. Silas asked
// for a system that rewards learning rather than clicking, so the tests that earn their
// keep here are the grinding exploit, the lapsed-card payoff, and the fact that an
// honest "Again" is never punished.
import assert from 'node:assert/strict'

import {
  MANDARIN_LESSON_POINTS,
  MANDARIN_POINTS_NEW_CARD,
  awardForRecall,
  dueFactor,
  lapseFactor,
  maturityFactor,
  type MandarinPointsCardState,
} from '../../server/utils/mandarinPoints.js'

const NOW = new Date('2026-09-19T12:00:00Z')

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 86_400_000)
}

function state(
  overrides: Partial<MandarinPointsCardState> = {},
): MandarinPointsCardState {
  return { ...MANDARIN_POINTS_NEW_CARD, ...overrides }
}

// --- the anti-grinding rule ------------------------------------------------

{
  // A mature card rated the instant after its last review. This is the exploit any
  // points system bolted onto an SRS trainer has to answer for.
  const justRated = state({
    repetitions: 8,
    intervalDays: 30,
    lapses: 0,
    lastReviewedAt: new Date(NOW.getTime() - 1_000),
  })

  assert.ok(
    dueFactor(justRated, NOW) < 0.01,
    'a card reviewed one second after its last review has essentially none of its interval elapsed',
  )

  const award = awardForRecall('easy', justRated, NOW)
  assert.equal(
    award.points,
    1,
    'grinding one easy card pays the floor of 1, not its full mature value',
  )
  assert.ok(
    award.reason.includes('reviewed early'),
    'the ledger note must say WHY the award was small, or the learner just thinks it is broken',
  )

  // Same card, same rating, actually due.
  const due = state({
    repetitions: 8,
    intervalDays: 30,
    lapses: 0,
    lastReviewedAt: daysAgo(30),
  })
  const dueAward = awardForRecall('easy', due, NOW)
  assert.ok(
    dueAward.points > award.points * 2,
    'waiting for the card to actually come due must be worth substantially more than grinding it',
  )
}

console.log(
  '✅ anti-grinding: re-drilling a card that is not due pays the floor, not its full value',
)

{
  // Halfway through the interval pays roughly half. Linear and inspectable on purpose.
  const half = state({
    repetitions: 5,
    intervalDays: 10,
    lapses: 0,
    lastReviewedAt: daysAgo(5),
  })
  assert.ok(Math.abs(dueFactor(half, NOW) - 0.5) < 0.01)
}

console.log(
  '✅ dueFactor: scales linearly with how much of the interval actually elapsed',
)

{
  // Late review caps at 1 rather than paying a bonus -- an uncapped factor would reward
  // abandoning the deck and coming back.
  const late = state({
    repetitions: 5,
    intervalDays: 10,
    lapses: 0,
    lastReviewedAt: daysAgo(400),
  })
  assert.equal(dueFactor(late, NOW), 1)
}

console.log(
  '✅ dueFactor: a very late review caps at 1 and never pays a neglect bonus',
)

{
  // A brand-new card has no interval to be early against; the first honest recall counts.
  assert.equal(dueFactor(MANDARIN_POINTS_NEW_CARD, NOW), 1)
  assert.ok(awardForRecall('good', MANDARIN_POINTS_NEW_CARD, NOW).points >= 4)
}

console.log('✅ dueFactor: a new card scores fully on its first review')

// --- effort is what pays ---------------------------------------------------

{
  const due = state({
    repetitions: 4,
    intervalDays: 10,
    lapses: 0,
    lastReviewedAt: daysAgo(10),
  })

  const hard = awardForRecall('hard', due, NOW).points
  const good = awardForRecall('good', due, NOW).points
  const easy = awardForRecall('easy', due, NOW).points

  assert.ok(
    hard > good && good > easy,
    'a card recalled with effort was closer to being forgotten, so pulling it back is worth more than one that was effortless',
  )
}

console.log(
  '✅ ratings: hard > good > easy, because effort is where the learning is',
)

{
  const due = state({
    repetitions: 4,
    intervalDays: 10,
    lapses: 2,
    lastReviewedAt: daysAgo(10),
  })

  const failed = awardForRecall('again', due, NOW)
  assert.equal(failed.points, 0, 'a failed recall earns nothing')
  assert.ok(
    failed.points >= 0,
    'nothing is ever DEDUCTED -- punishing an honest "Again" teaches people to press "Good" instead',
  )
  assert.ok(failed.reason.includes('Nothing is deducted'))
}

console.log('✅ ratings: a failed recall earns zero and is never penalised')

// --- the lapsed card pays off ----------------------------------------------

{
  const clean = state({
    repetitions: 4,
    intervalDays: 10,
    lapses: 0,
    lastReviewedAt: daysAgo(10),
  })
  const struggled = state({
    repetitions: 4,
    intervalDays: 10,
    lapses: 3,
    lastReviewedAt: daysAgo(10),
  })

  assert.ok(
    awardForRecall('good', struggled, NOW).points >
      awardForRecall('good', clean, NOW).points,
    'Silas: "genuine recall of a lapsed card earns a lot"',
  )
  assert.equal(lapseFactor(struggled), 1.75)
  assert.equal(
    lapseFactor(state({ lapses: 99 })),
    1.75,
    'the lapse bonus caps at 3 so a chronically failed card cannot become a points farm',
  )
}

console.log(
  '✅ lapses: a card you have forgotten before pays more when you finally hold it, but the bonus caps',
)

{
  assert.equal(maturityFactor(state({ intervalDays: 0 })), 1)
  assert.equal(maturityFactor(state({ intervalDays: 60 })), 1.5)
  assert.equal(
    maturityFactor(state({ intervalDays: 3650 })),
    1.5,
    'maturity saturates at 60 days rather than running away',
  )
}

console.log(
  '✅ maturity: recalling after a long interval is worth more, saturating at 60 days',
)

// --- misc ------------------------------------------------------------------

{
  assert.ok(
    MANDARIN_LESSON_POINTS > 0,
    'reading a lesson through must be worth something, or nobody reads the lessons',
  )

  const due = state({
    repetitions: 4,
    intervalDays: 10,
    lapses: 0,
    lastReviewedAt: daysAgo(10),
  })
  assert.ok(
    MANDARIN_LESSON_POINTS > awardForRecall('good', due, NOW).points,
    'one lesson is worth more than one ordinary review -- understanding is the scarce thing here, and it is awarded only once per card',
  )
}

console.log(
  '✅ lesson award: reading a lesson outweighs a single ordinary review, and is once per card',
)

{
  // A clock skew or a lastReviewedAt in the future must not mint points or crash.
  const future = state({
    repetitions: 3,
    intervalDays: 5,
    lapses: 0,
    lastReviewedAt: new Date(NOW.getTime() + 86_400_000),
  })
  assert.equal(dueFactor(future, NOW), 0)
  assert.equal(
    awardForRecall('good', future, NOW).points,
    0,
    'an impossible timestamp earns nothing rather than the 1-point floor: the floor exists for a learner who genuinely reviewed early, and negative elapsed time is a data anomaly, not early review',
  )

  // A corrupt row with a zero interval falls back to full credit rather than dividing by zero.
  const zeroInterval = state({
    repetitions: 3,
    intervalDays: 0,
    lapses: 0,
    lastReviewedAt: daysAgo(1),
  })
  assert.equal(dueFactor(zeroInterval, NOW), 1)
  assert.ok(Number.isFinite(awardForRecall('good', zeroInterval, NOW).points))
}

console.log(
  '✅ edge cases: future timestamps and zero intervals neither crash nor mint points',
)

console.log('✅ verifyMandarinPoints: all assertions passed')
