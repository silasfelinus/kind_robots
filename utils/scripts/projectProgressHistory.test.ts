import assert from 'node:assert/strict'
import {
  completedDelta,
  isProjectProgressHistory,
  progressPercent,
} from '../projectProgressHistory'

// Distinguishes missing points, zero scope and completed scope.
assert.equal(progressPercent(null), null)
assert.equal(progressPercent({ done: 0, total: 0 }), null)
assert.equal(progressPercent({ done: 3, total: 4 }), 75)
assert.equal(completedDelta([null, { done: 3, total: 4 }]), null)
assert.equal(
  completedDelta([
    { done: 2, total: 4 },
    { done: 3, total: 6 },
  ]),
  1,
)

// Validates alignment and rejects impossible task counts.
const base = {
  sourceCommitSha: 'a'.repeat(40),
  dates: ['2026-11-24', '2026-11-25'],
  series: { game: [null, { done: 1, total: 2 }] },
}
assert.equal(isProjectProgressHistory(base), true)
assert.equal(
  isProjectProgressHistory({
    ...base,
    series: { game: [{ done: 3, total: 2 }, null] },
  }),
  false,
)
assert.equal(
  isProjectProgressHistory({ ...base, series: { game: [null] } }),
  false,
)

console.log('project progress history: ALL PASS')
