// /utils/scripts/verifyVideoJobPollFailureGuard.test.ts
//
// Regression test for checkVideoJobPollFailureGuard() in
// verifyVideoJobPollFailureGuard.ts (model-builder/t-029, cycle 38).
// Exercises the real check against synthetic waitForJob-shaped fixtures: the
// pre-fix shape (a null/failed status fetch falls through to the same
// unbounded retry as a genuine PENDING/RUNNING status), the fixed shape
// (bounded consecutive-failure counter with a real throw), and partial
// fixtures missing one piece of the fix each.
import assert from 'node:assert/strict'

import {
  checkVideoJobPollFailureGuard,
  extractWaitForJobBody,
} from './verifyVideoJobPollFailureGuard.js'

const BUGGY_FIXTURE = `
  async function waitForJob(jobId: number): Promise<QueuedJob> {
    while (true) {
      const res = await performFetch<{ job: QueuedJob }>(
        \`/api/art/queue/\${jobId}\`,
        { method: 'GET' },
        2,
        20_000,
      )

      const job = res.success ? res.data?.job : null

      if (
        job?.status === 'DONE' ||
        job?.status === 'FAILED' ||
        job?.status === 'CANCELLED'
      ) {
        return job
      }

      if (job?.status === 'RUNNING') {
        state.status = 'rendering'
      } else if (job?.status === 'PENDING') {
        state.status = 'queued'
      }

      await sleep(POLL_MS)
    }
  }
`

const FIXED_FIXTURE = `
  async function waitForJob(jobId: number): Promise<QueuedJob> {
    let consecutivePollFailures = 0
    while (true) {
      const res = await performFetch<{ job: QueuedJob }>(
        \`/api/art/queue/\${jobId}\`,
        { method: 'GET' },
        2,
        20_000,
      )

      const job = res.success ? res.data?.job : null

      if (
        job?.status === 'DONE' ||
        job?.status === 'FAILED' ||
        job?.status === 'CANCELLED'
      ) {
        return job
      }

      if (job?.status === 'RUNNING' || job?.status === 'PENDING') {
        consecutivePollFailures = 0
      } else {
        consecutivePollFailures += 1
        if (consecutivePollFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
          throw new Error(
            \`Lost track of video job \${jobId} after \${consecutivePollFailures} failed status checks.\`,
          )
        }
      }

      if (job?.status === 'RUNNING') {
        state.status = 'rendering'
      } else if (job?.status === 'PENDING') {
        state.status = 'queued'
      }

      await sleep(POLL_MS)
    }
  }
`

const MISSING_THROW_FIXTURE = `
  async function waitForJob(jobId: number): Promise<QueuedJob> {
    let consecutivePollFailures = 0
    while (true) {
      const job = await pollOnce(jobId)
      if (job?.status === 'PENDING' || job?.status === 'RUNNING') {
        consecutivePollFailures = 0
      } else {
        consecutivePollFailures += 1
        if (consecutivePollFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
          return job
        }
      }
      await sleep(POLL_MS)
    }
  }
`

function run(): void {
  // --- extraction sanity ---
  assert.equal(extractWaitForJobBody('no such function here'), null)
  assert.ok(
    extractWaitForJobBody(FIXED_FIXTURE)?.startsWith(
      'async function waitForJob(',
    ),
  )

  // --- buggy fixture: no counter, no threshold, no throw ---
  const buggyErrors = checkVideoJobPollFailureGuard(BUGGY_FIXTURE)
  assert.ok(
    buggyErrors.some((e) => e.includes('consecutive-failure counter')),
    `expected the buggy fixture to flag the missing counter, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(
    buggyErrors.some((e) => e.includes('MAX_CONSECUTIVE_POLL_FAILURES')),
    `expected the buggy fixture to flag the missing threshold, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(
    buggyErrors.some((e) => e.includes('throw new Error')),
    `expected the buggy fixture to flag the missing throw, got: ${JSON.stringify(buggyErrors)}`,
  )

  // --- fixed fixture: passes clean ---
  const fixedErrors = checkVideoJobPollFailureGuard(FIXED_FIXTURE)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  // --- partial fixture: counter exists but never actually throws ---
  const missingThrowErrors = checkVideoJobPollFailureGuard(
    MISSING_THROW_FIXTURE,
  )
  assert.ok(
    missingThrowErrors.length > 0,
    'expected the missing-throw fixture (counter present, but the failure ' +
      'branch never throws) to fail',
  )
  assert.ok(
    missingThrowErrors.some((e) => e.includes('throw new Error')),
    `expected a throw-related error, got: ${JSON.stringify(missingThrowErrors)}`,
  )

  // --- missing-anchor fixture ---
  const missingAnchorErrors = checkVideoJobPollFailureGuard('const x = 1')
  assert.equal(missingAnchorErrors.length, 1)
  assert.match(missingAnchorErrors[0]!, /Could not find/)

  console.log(
    'Video job poll-failure guard self-test passed: buggy fixture fails on ' +
      'the missing counter/threshold/throw, fixed fixture passes, a ' +
      'never-throws partial fixture fails, missing-anchor fixture fails ' +
      'clearly.',
  )
}

run()
