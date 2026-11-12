// Shifting Desks achievements (conductor shifting-desks t-050): a completion
// is judged once, when its receipt is filed in play, and every code it can
// earn is in the catalog.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { achievementsForGame } from '../achievements/gameAchievements'
import {
  ENDING_ACHIEVEMENTS,
  MILESTONE_ACHIEVEMENTS,
  completionAchievements,
  instantAchievements,
} from '../shiftingDesks/achievements'
import { dailySeed } from '../shiftingDesks/daily'
import {
  MILESTONES,
  emptyRewardArchive,
  type RewardArchive,
  type RunReceipt,
} from '../shiftingDesks/rewards'
import { ENDINGS, JOB_TITLES } from '../shiftingDesks/rules'

const catalog = new Set(
  achievementsForGame('shifting-desks').map((entry) => entry.code),
)
assert.ok(catalog.size >= 12, 'Shifting Desks carries at least 12.')

const receipt = (id: string, jobTitle = 'Intern') =>
  ({ id, jobTitle, endingId: 'early-retirement' }) as RunReceipt
const archive = (
  runs: RunReceipt[],
  milestones: Record<string, string> = {},
): RewardArchive => ({ ...emptyRewardArchive(), runs, milestones })

// A newly filed run earns the milestones the archive now holds.
const before = archive([])
const after = archive([receipt('r1')], { 'first-ending': 't' })
assert.deepEqual(
  completionAchievements(before, after, 'r1', ['early-retirement'], {
    seed: 'abc',
  }),
  ['shifting-desks-first-ending'],
)
// A run already filed (a reload, or the same completion again) earns nothing.
assert.deepEqual(
  completionAchievements(after, after, 'r1', ['early-retirement'], {
    seed: 'abc',
  }),
  [],
)
assert.deepEqual(
  completionAchievements(before, before, 'r1', [], { seed: 'abc' }),
  [],
)

// Endings, the whole file, the Daily Memo and every job.
const every = ENDINGS.map((ending) => ending.id)
const jobs = JOB_TITLES.map((job, i) => receipt(`j${i}`, job.title))
const full = completionAchievements(
  archive(jobs.slice(0, -1)),
  archive(jobs),
  jobs.at(-1)!.id,
  every,
  { seed: dailySeed(new Date('2026-11-12T12:00:00Z')) },
)
for (const code of [
  ...Object.values(ENDING_ACHIEVEMENTS),
  'shifting-desks-all-endings',
  'shifting-desks-daily-memo',
  'shifting-desks-every-job',
])
  assert.ok(full.includes(code), `${code} is earned.`)
assert.ok(
  !completionAchievements(archive([]), archive([receipt('x')]), 'x', [], {
    seed: 'plain-run',
  }).includes('shifting-desks-daily-memo'),
)

// Spending the mutation or a Society favor counts at once.
const idle = { mutationUsed: false, societyRecord: {} }
assert.deepEqual(
  instantAchievements(idle, {
    mutationUsed: true,
    societyRecord: { lodge: 'met' },
  } as never),
  ['shifting-desks-mutation-used', 'shifting-desks-society-agent'],
)
assert.deepEqual(instantAchievements(idle as never, idle as never), [])

// Every milestone code names a real milestone, and the catalog matches what
// the game awards.
for (const id of Object.keys(MILESTONE_ACHIEVEMENTS))
  assert.ok(
    MILESTONES.some((milestone) => milestone.id === id),
    id,
  )
for (const id of Object.keys(ENDING_ACHIEVEMENTS))
  assert.ok(every.includes(id), id)
assert.deepEqual(
  [
    ...new Set([
      ...Object.values(MILESTONE_ACHIEVEMENTS),
      ...Object.values(ENDING_ACHIEVEMENTS),
      'shifting-desks-all-endings',
      'shifting-desks-daily-memo',
      'shifting-desks-every-job',
      'shifting-desks-survived-review',
      'shifting-desks-sub-level-zero',
      'shifting-desks-faced-the-board',
    ]),
  ].sort(),
  [...catalog].sort(),
)

// The store judges completions only in play: load() restores silently.
const store = readFileSync('stores/shiftingDesksStore.ts', 'utf8')
assert.match(store, /if \(announce\) \{[\s\S]{0,300}completionAchievements\(/)
assert.match(store, /recordEnding\(true\)/)
assert.doesNotMatch(
  store.slice(
    store.indexOf('function load('),
    store.indexOf('function start('),
  ),
  /recordEnding\(true\)|award\(/,
)
assert.match(store, /award\(instantAchievements\(before, run\.value\)\)/)

console.log(`Shifting Desks achievements passed: ${catalog.size} achievements.`)
