// /utils/scripts/verifyBrainstormArtPollFailureGuard.test.ts
//
// Regression test for checkBrainstormArtPollFailureGuard() in
// verifyBrainstormArtPollFailureGuard.ts (model-builder/t-029, cycle 39).
// Exercises the real check against synthetic generateArtForCandidate-shaped
// fixtures: the pre-fix shape (a null status fetch falls through to the
// same unbounded retry as a genuine PENDING status), the fixed shape
// (bounded consecutive-failure counter with a real throw), and partial
// fixtures missing one piece of the fix each.
import assert from 'node:assert/strict'

import {
  checkBrainstormArtPollFailureGuard,
  extractGenerateArtForCandidateBody,
} from './verifyBrainstormArtPollFailureGuard.js'

const BUGGY_FIXTURE = `
  async function generateArtForCandidate(
    candidate: BrainstormCandidate,
  ): Promise<{ success: boolean; message?: string }> {
    const artStore = useArtStore()
    try {
      let jobId = await enqueue(candidate)

      while (true) {
        const job = await artStore.getArtJobStatus(jobId)
        if (!job || job.status === 'PENDING') {
          await artQueueSleep(ART_JOB_POLL_MS)
          continue
        }
        if (job.status === 'RUNNING') {
          markCandidateArtProcessing(candidate)
          await artQueueSleep(ART_JOB_POLL_MS)
          continue
        }

        const finalized = await artStore.finalizeQueuedArtImage(job, generateData)
        if (!finalized.success || !finalized.data) {
          return { success: false, message: finalized.message }
        }
        return { success: true }
      }
    } catch (error) {
      return { success: false, message: String(error) }
    }
  }
`

const FIXED_FIXTURE = `
  async function generateArtForCandidate(
    candidate: BrainstormCandidate,
  ): Promise<{ success: boolean; message?: string }> {
    const artStore = useArtStore()
    try {
      let jobId = await enqueue(candidate)

      let consecutivePollFailures = 0
      while (true) {
        const job = await artStore.getArtJobStatus(jobId)
        if (!job) {
          consecutivePollFailures += 1
          if (consecutivePollFailures >= MAX_CONSECUTIVE_ART_JOB_POLL_FAILURES) {
            throw new Error(\`Lost track of art job \${jobId} after \${consecutivePollFailures} failed status checks.\`)
          }
          await artQueueSleep(ART_JOB_POLL_MS)
          continue
        }
        if (job.status === 'PENDING') {
          consecutivePollFailures = 0
          await artQueueSleep(ART_JOB_POLL_MS)
          continue
        }
        if (job.status === 'RUNNING') {
          consecutivePollFailures = 0
          markCandidateArtProcessing(candidate)
          await artQueueSleep(ART_JOB_POLL_MS)
          continue
        }

        const finalized = await artStore.finalizeQueuedArtImage(job, generateData)
        if (!finalized.success || !finalized.data) {
          return { success: false, message: finalized.message }
        }
        return { success: true }
      }
    } catch (error) {
      return { success: false, message: String(error) }
    }
  }
`

const MISSING_THROW_FIXTURE = `
  async function generateArtForCandidate(
    candidate: BrainstormCandidate,
  ): Promise<{ success: boolean; message?: string }> {
    let consecutivePollFailures = 0
    while (true) {
      const job = await artStore.getArtJobStatus(jobId)
      if (!job) {
        consecutivePollFailures += 1
        if (consecutivePollFailures >= MAX_CONSECUTIVE_ART_JOB_POLL_FAILURES) {
          return { success: false, message: 'gave up' }
        }
        continue
      }
      consecutivePollFailures = 0
    }
  }
`

function run(): void {
  // --- extraction sanity ---
  assert.equal(
    extractGenerateArtForCandidateBody('no such function here'),
    null,
  )
  assert.ok(
    extractGenerateArtForCandidateBody(FIXED_FIXTURE)?.startsWith(
      'async function generateArtForCandidate(',
    ),
  )

  // --- buggy fixture: no counter, no threshold, no throw ---
  const buggyErrors = checkBrainstormArtPollFailureGuard(BUGGY_FIXTURE)
  assert.ok(
    buggyErrors.some((e) => e.includes('consecutive-failure counter')),
    `expected the buggy fixture to flag the missing counter, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(
    buggyErrors.some((e) =>
      e.includes('MAX_CONSECUTIVE_ART_JOB_POLL_FAILURES'),
    ),
    `expected the buggy fixture to flag the missing threshold, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(
    buggyErrors.some((e) => e.includes('throw new Error')),
    `expected the buggy fixture to flag the missing throw, got: ${JSON.stringify(buggyErrors)}`,
  )

  // --- fixed fixture: passes clean ---
  const fixedErrors = checkBrainstormArtPollFailureGuard(FIXED_FIXTURE)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  // --- partial fixture: counter exists but never actually throws ---
  const missingThrowErrors = checkBrainstormArtPollFailureGuard(
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
  const missingAnchorErrors = checkBrainstormArtPollFailureGuard('const x = 1')
  assert.equal(missingAnchorErrors.length, 1)
  assert.match(missingAnchorErrors[0]!, /Could not find/)

  console.log(
    'Brainstorm art poll-failure guard self-test passed: buggy fixture ' +
      'fails on the missing counter/threshold/throw, fixed fixture passes, ' +
      'a never-throws partial fixture fails, missing-anchor fixture fails ' +
      'clearly.',
  )
}

run()
