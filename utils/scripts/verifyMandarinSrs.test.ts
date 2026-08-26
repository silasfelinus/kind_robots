// /utils/scripts/verifyMandarinSrs.test.ts
//
// Regression test for mandarin-tutor/t-015's SM-2-lite scheduler
// (server/utils/mandarinSrs.ts). Pure functions only -- no prisma, no database, no
// Nuxt/H3 runtime -- same discipline as utils/scripts/verifyCreatorEarnings.test.ts.
import assert from 'node:assert/strict'

import {
  MANDARIN_SRS_INITIAL_STATE,
  nextMandarinSrsSchedule,
  summarizeMandarinStudyDiagnostics,
  type MandarinProgressLite,
  type MandarinReviewEventLite,
} from '../../server/utils/mandarinSrs.js'

const NOW = new Date('2026-08-26T00:00:00Z')

// --- nextMandarinSrsSchedule: the standard SM-2 interval ladder -------------

{
  // First-ever "good" recall: repetitions 0 -> 1, interval -> 1 day.
  const first = nextMandarinSrsSchedule(MANDARIN_SRS_INITIAL_STATE, 'good', NOW)
  assert.equal(first.repetitions, 1)
  assert.equal(first.intervalDays, 1)
  assert.equal(first.lapsed, false)
  assert.deepEqual(first.dueAt, new Date('2026-08-27T00:00:00Z'))

  // Second "good" recall in a row: repetitions 1 -> 2, interval -> 6 days (the fixed
  // SM-2 second step, independent of ease factor).
  const second = nextMandarinSrsSchedule(
    {
      repetitions: first.repetitions,
      intervalDays: first.intervalDays,
      easeFactor: first.easeFactor,
    },
    'good',
    NOW,
  )
  assert.equal(second.repetitions, 2)
  assert.equal(second.intervalDays, 6)

  // Third "good" recall: interval now scales by ease factor (previousInterval * ease),
  // not another fixed step.
  const third = nextMandarinSrsSchedule(
    {
      repetitions: second.repetitions,
      intervalDays: second.intervalDays,
      easeFactor: second.easeFactor,
    },
    'good',
    NOW,
  )
  assert.equal(third.repetitions, 3)
  assert.equal(
    third.intervalDays,
    Math.round(second.intervalDays * second.easeFactor),
    'third+ repetition interval must be previousInterval * easeFactor, the standard SM-2 growth step',
  )
}

console.log(
  '✅ nextMandarinSrsSchedule: SM-2 interval ladder (1 -> 6 -> ease-scaled) correct',
)

// --- nextMandarinSrsSchedule: "again" resets progress but never destroys ease floor ---

{
  const strong = { repetitions: 5, intervalDays: 40, easeFactor: 2.6 }
  const failed = nextMandarinSrsSchedule(strong, 'again', NOW)
  assert.equal(
    failed.repetitions,
    0,
    'a failed recall resets repetitions to restart the ladder',
  )
  assert.equal(
    failed.intervalDays,
    1,
    'a failed recall drops the interval back to 1 day',
  )
  assert.equal(failed.lapsed, true)
  assert.ok(
    failed.easeFactor < strong.easeFactor,
    'a failed recall must lower the ease factor (harder card, review sooner in future)',
  )

  // Repeated failures never push ease factor below the SM-2 floor.
  let ease = { repetitions: 0, intervalDays: 0, easeFactor: 1.35 }
  for (let i = 0; i < 20; i++) {
    const step = nextMandarinSrsSchedule(ease, 'again', NOW)
    ease = {
      repetitions: step.repetitions,
      intervalDays: step.intervalDays,
      easeFactor: step.easeFactor,
    }
  }
  assert.ok(
    ease.easeFactor >= 1.3,
    `ease factor must never drop below the 1.3 floor, got ${ease.easeFactor}`,
  )
}

console.log(
  '✅ nextMandarinSrsSchedule: "again" resets the ladder and floors the ease factor at 1.3',
)

// --- nextMandarinSrsSchedule: "easy" grows ease faster than "hard" ----------------

{
  const base = { repetitions: 2, intervalDays: 6, easeFactor: 2.5 }
  const hard = nextMandarinSrsSchedule(base, 'hard', NOW)
  const good = nextMandarinSrsSchedule(base, 'good', NOW)
  const easy = nextMandarinSrsSchedule(base, 'easy', NOW)

  assert.ok(
    hard.easeFactor < good.easeFactor,
    '"hard" must lower ease factor relative to "good", even though both are passes',
  )
  assert.ok(
    easy.easeFactor > good.easeFactor,
    '"easy" must raise ease factor above "good"',
  )
  assert.ok(
    easy.intervalDays >= good.intervalDays &&
      good.intervalDays >= hard.intervalDays,
    'higher-confidence ratings must never schedule a sooner review than lower-confidence ones from the same state',
  )
}

console.log(
  '✅ nextMandarinSrsSchedule: rating ordering (easy > good > hard) holds for both ease and interval',
)

// --- summarizeMandarinStudyDiagnostics --------------------------------------

function progress(
  overrides: Partial<MandarinProgressLite> & { cardKey: string },
): MandarinProgressLite {
  return {
    cardKey: overrides.cardKey,
    dueAt: overrides.dueAt ?? NOW,
    repetitions: overrides.repetitions ?? 1,
    lapses: overrides.lapses ?? 0,
    lastRating: overrides.lastRating ?? 'good',
  }
}

function event(
  overrides: Partial<MandarinReviewEventLite> & {
    cardKey: string
    rating: string
  },
): MandarinReviewEventLite {
  return {
    cardKey: overrides.cardKey,
    rating: overrides.rating,
    ratedAt: overrides.ratedAt ?? NOW,
  }
}

{
  // No tracked cards at all -- an honest empty summary, not an error or a fake 100%.
  const empty = summarizeMandarinStudyDiagnostics([], [], NOW)
  assert.deepEqual(empty, {
    totalTracked: 0,
    dueCount: 0,
    retentionRate: null,
    weakCardKeys: [],
  })
}

console.log(
  '✅ summarizeMandarinStudyDiagnostics: a learner with no history gets an honest empty summary',
)

{
  const rows = [
    progress({ cardKey: 'a', dueAt: new Date('2026-08-25T00:00:00Z') }), // due (past)
    progress({ cardKey: 'b', dueAt: new Date('2026-08-27T00:00:00Z') }), // not due yet
    progress({ cardKey: 'c', dueAt: NOW }), // due exactly now
    progress({ cardKey: 'weak-1', dueAt: NOW, lapses: 3, repetitions: 1 }),
    progress({ cardKey: 'weak-2', dueAt: NOW, lapses: 3, repetitions: 4 }),
    progress({ cardKey: 'weak-3', dueAt: NOW, lapses: 1, repetitions: 2 }),
    progress({
      cardKey: 'never-failed',
      dueAt: NOW,
      lapses: 0,
      repetitions: 9,
    }),
  ]
  const events = [
    event({ cardKey: 'a', rating: 'good' }),
    event({ cardKey: 'a', rating: 'again' }),
    event({ cardKey: 'b', rating: 'easy' }),
    event({ cardKey: 'c', rating: 'again' }),
  ]

  const summary = summarizeMandarinStudyDiagnostics(rows, events, NOW)
  assert.equal(summary.totalTracked, 7)
  assert.equal(
    summary.dueCount,
    6,
    'due includes the past-due row plus every row due exactly now (c, weak-1, weak-2, weak-3, never-failed)',
  )
  assert.equal(
    summary.retentionRate,
    0.5,
    '2 of 4 recent events were not "again" -> 50% retention',
  )
  assert.deepEqual(
    summary.weakCardKeys,
    ['weak-1', 'weak-2', 'weak-3'],
    'weak cards are lapses-first (ties broken by fewer repetitions = shakier mastery), and never-lapsed cards are excluded entirely',
  )
}

console.log(
  '✅ summarizeMandarinStudyDiagnostics: due count, rolling retention, and weak-card ranking correct',
)

{
  // Retention window is capped -- an old, unrelated review from before the window
  // must not dilute a currently-strong streak.
  const manyGood: MandarinReviewEventLite[] = Array.from(
    { length: 30 },
    (_, i) => event({ cardKey: `x${i}`, rating: 'good' }),
  )
  const oldFailure = event({
    cardKey: 'ancient',
    rating: 'again',
    ratedAt: new Date('2020-01-01'),
  })
  const summary = summarizeMandarinStudyDiagnostics(
    [],
    [...manyGood, oldFailure],
    NOW,
  )
  assert.equal(
    summary.retentionRate,
    1,
    'the 31st (oldest) event must fall outside the 30-event retention window and not drag the rate down',
  )
}

console.log(
  '✅ summarizeMandarinStudyDiagnostics: retention window caps at the most recent 30 events',
)

console.log('✅ verifyMandarinSrs: all assertions passed')
