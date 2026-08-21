// /utils/scripts/verifyArtQueuePollFailureGuard.test.ts
//
// Regression test for checkArtQueuePollFailureGuard() in
// verifyArtQueuePollFailureGuard.ts (model-builder/t-029, cycle 37).
// Exercises the real check against synthetic waitForQueuedArtJob-shaped
// fixtures: the pre-fix shape (a null/failed status fetch falls through to
// the same unbounded retry as a genuine PENDING/RUNNING status), the fixed
// shape (bounded consecutive-failure counter with a real throw), and partial
// fixtures missing one piece of the fix each.
import assert from 'node:assert/strict'

import {
  checkArtQueuePollFailureGuard,
  extractWaitForQueuedArtJobBody,
} from './verifyArtQueuePollFailureGuard.js'

const BUGGY_FIXTURE = `
  async function waitForQueuedArtJob(jobId: number): Promise<QueuedArtJob> {
    while (true) {
      const response = await performFetch<{ job: QueuedArtJob }>(
        \`/api/art/queue/\${jobId}\`,
        { method: 'GET' },
        2,
        20_000,
      )
      const job = response.success ? response.data?.job : null
      if (
        job?.status === 'DONE' ||
        job?.status === 'FAILED' ||
        job?.status === 'CANCELLED'
      ) {
        return job
      }
      if (job?.status === 'PENDING' || job?.status === 'RUNNING') {
        state.queueState = job.status === 'RUNNING' ? 'rendering' : 'queued'
      }
      await queueSleep(ART_QUEUE_POLL_MS)
    }
  }
`

const FIXED_FIXTURE = `
  async function waitForQueuedArtJob(jobId: number): Promise<QueuedArtJob> {
    let consecutivePollFailures = 0
    while (true) {
      const response = await performFetch<{ job: QueuedArtJob }>(
        \`/api/art/queue/\${jobId}\`,
        { method: 'GET' },
        2,
        20_000,
      )
      const job = response.success ? response.data?.job : null
      if (
        job?.status === 'DONE' ||
        job?.status === 'FAILED' ||
        job?.status === 'CANCELLED'
      ) {
        return job
      }
      if (job?.status === 'PENDING' || job?.status === 'RUNNING') {
        state.queueState = job.status === 'RUNNING' ? 'rendering' : 'queued'
        consecutivePollFailures = 0
      } else {
        consecutivePollFailures += 1
        if (consecutivePollFailures >= MAX_CONSECUTIVE_QUEUE_POLL_FAILURES) {
          throw new Error(
            \`Lost track of art job \${jobId} after \${consecutivePollFailures} failed status checks.\`,
          )
        }
      }
      await queueSleep(ART_QUEUE_POLL_MS)
    }
  }
`

const MISSING_THROW_FIXTURE = `
  async function waitForQueuedArtJob(jobId: number): Promise<QueuedArtJob> {
    let consecutivePollFailures = 0
    while (true) {
      const job = await pollOnce(jobId)
      if (job?.status === 'PENDING' || job?.status === 'RUNNING') {
        consecutivePollFailures = 0
      } else {
        consecutivePollFailures += 1
        if (consecutivePollFailures >= MAX_CONSECUTIVE_QUEUE_POLL_FAILURES) {
          return job
        }
      }
      await queueSleep(ART_QUEUE_POLL_MS)
    }
  }
`

function run(): void {
  // --- extraction sanity ---
  assert.equal(extractWaitForQueuedArtJobBody('no such function here'), null)
  assert.ok(
    extractWaitForQueuedArtJobBody(FIXED_FIXTURE)?.startsWith(
      'async function waitForQueuedArtJob(',
    ),
  )

  // --- buggy fixture: no counter, no threshold, no throw ---
  const buggyErrors = checkArtQueuePollFailureGuard(BUGGY_FIXTURE)
  assert.ok(
    buggyErrors.some((e) => e.includes('consecutive-failure counter')),
    `expected the buggy fixture to flag the missing counter, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(
    buggyErrors.some((e) => e.includes('MAX_CONSECUTIVE_QUEUE_POLL_FAILURES')),
    `expected the buggy fixture to flag the missing threshold, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(
    buggyErrors.some((e) => e.includes('throw new Error')),
    `expected the buggy fixture to flag the missing throw, got: ${JSON.stringify(buggyErrors)}`,
  )

  // --- fixed fixture: passes clean ---
  const fixedErrors = checkArtQueuePollFailureGuard(FIXED_FIXTURE)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  // --- partial fixture: counter exists but never actually throws ---
  const missingThrowErrors = checkArtQueuePollFailureGuard(
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
  const missingAnchorErrors = checkArtQueuePollFailureGuard('const x = 1')
  assert.equal(missingAnchorErrors.length, 1)
  assert.match(missingAnchorErrors[0]!, /Could not find/)

  console.log(
    'Art queue poll-failure guard self-test passed: buggy fixture fails on ' +
      'the missing counter/threshold/throw, fixed fixture passes, a ' +
      'never-throws partial fixture fails, missing-anchor fixture fails ' +
      'clearly.',
  )
}

run()
