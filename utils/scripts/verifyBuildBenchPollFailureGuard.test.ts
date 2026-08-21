// /utils/scripts/verifyBuildBenchPollFailureGuard.test.ts
//
// Regression test for checkBuildBenchPollFailureGuard() in
// verifyBuildBenchPollFailureGuard.ts (model-builder/t-029, cycle 39).
// Exercises the real check against synthetic pollJob-shaped fixtures: the
// pre-fix shape (a null/failed status fetch falls through to the same
// unbounded retry as a genuine PENDING/RUNNING status), the fixed shape
// (bounded consecutive-failure counter with a real throw), and partial
// fixtures missing one piece of the fix each.
import assert from 'node:assert/strict'

import {
  checkBuildBenchPollFailureGuard,
  extractPollJobBody,
} from './verifyBuildBenchPollFailureGuard.js'

const BUGGY_FIXTURE = `
  async function pollJob(
    jobId: number,
  ): Promise<{
    status: string
    artImageId: number | null
    error: string | null
    seed: number | null
  }> {
    while (true) {
      const res = await performFetch<{
        job: { status: string; artImageId: number | null; error: string | null }
      }>(\`/api/art/queue/\${jobId}\`, { method: 'GET' }, 2, 20_000)
      const job = res.success ? res.data?.job : null
      if (job && ['DONE', 'FAILED', 'CANCELLED'].includes(job.status)) {
        return {
          status: job.status,
          artImageId: job.artImageId ?? null,
          error: job.error ?? null,
          seed: null,
        }
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_MS))
    }
  }
`

const FIXED_FIXTURE = `
  async function pollJob(
    jobId: number,
  ): Promise<{
    status: string
    artImageId: number | null
    error: string | null
    seed: number | null
  }> {
    let consecutivePollFailures = 0
    while (true) {
      const res = await performFetch<{
        job: { status: string; artImageId: number | null; error: string | null }
      }>(\`/api/art/queue/\${jobId}\`, { method: 'GET' }, 2, 20_000)
      const job = res.success ? res.data?.job : null
      if (job && ['DONE', 'FAILED', 'CANCELLED'].includes(job.status)) {
        return {
          status: job.status,
          artImageId: job.artImageId ?? null,
          error: job.error ?? null,
          seed: null,
        }
      }

      if (job && ['PENDING', 'RUNNING'].includes(job.status)) {
        consecutivePollFailures = 0
      } else {
        consecutivePollFailures += 1
        if (consecutivePollFailures >= MAX_CONSECUTIVE_POLL_FAILURES) {
          throw new Error(
            \`Lost track of Build Bench job \${jobId} after \${consecutivePollFailures} failed status checks.\`,
          )
        }
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_MS))
    }
  }
`

const MISSING_THROW_FIXTURE = `
  async function pollJob(jobId: number) {
    let consecutivePollFailures = 0
    while (true) {
      const job = await pollOnce(jobId)
      if (job && ['PENDING', 'RUNNING'].includes(job.status)) {
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
  assert.equal(extractPollJobBody('no such function here'), null)
  assert.ok(
    extractPollJobBody(FIXED_FIXTURE)?.startsWith('async function pollJob('),
  )

  // --- buggy fixture: no counter, no threshold, no throw ---
  const buggyErrors = checkBuildBenchPollFailureGuard(BUGGY_FIXTURE)
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
  const fixedErrors = checkBuildBenchPollFailureGuard(FIXED_FIXTURE)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  // --- partial fixture: counter exists but never actually throws ---
  const missingThrowErrors = checkBuildBenchPollFailureGuard(
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
  const missingAnchorErrors = checkBuildBenchPollFailureGuard('const x = 1')
  assert.equal(missingAnchorErrors.length, 1)
  assert.match(missingAnchorErrors[0]!, /Could not find/)

  console.log(
    'Build Bench poll-failure guard self-test passed: buggy fixture fails ' +
      'on the missing counter/threshold/throw, fixed fixture passes, a ' +
      'never-throws partial fixture fails, missing-anchor fixture fails ' +
      'clearly.',
  )
}

run()
