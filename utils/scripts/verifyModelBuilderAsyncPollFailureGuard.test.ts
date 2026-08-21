// /utils/scripts/verifyModelBuilderAsyncPollFailureGuard.test.ts
//
// Regression test for checkAsyncPollFailureGuard() in
// verifyModelBuilderAsyncPollFailureGuard.ts (model-builder/t-029, cycle 36).
// Exercises the real check against synthetic pollAsyncArtJob-shaped fixtures:
// the pre-fix shape (unbounded `!job` retry, the exact bug found by the
// read-only bug-hunt pass), the fixed shape (bounded consecutive-failure
// counter with a real exit), and partial fixtures missing one piece of the
// fix each.
import assert from 'node:assert/strict'

import {
  checkAsyncPollFailureGuard,
  extractPollAsyncArtJobBody,
} from './verifyModelBuilderAsyncPollFailureGuard.js'

const BUGGY_FIXTURE = `
  async function pollAsyncArtJob(
    item: BuildItem,
    jobId: number,
    runId: string,
  ): Promise<void> {
    const artStore = useArtStore()

    while (item.artJobId === jobId) {
      const job: QueuedArtJob | null = await artStore.getArtJobStatus(jobId)

      if (item.artJobId !== jobId) return

      if (!job || job.status === 'PENDING' || job.status === 'RUNNING') {
        item.queueState = job?.status === 'RUNNING' ? 'rendering' : 'queued'
        finishGenerateAssets(item, {
          status: 'in-progress',
          note: item.queueState,
        })
        await new Promise((resolve) => setTimeout(resolve, ASYNC_ART_POLL_MS))
        continue
      }

      item.artJobId = null
      item.queueState = null
      return
    }
  }
`

const FIXED_FIXTURE = `
  async function pollAsyncArtJob(
    item: BuildItem,
    jobId: number,
    runId: string,
  ): Promise<void> {
    const artStore = useArtStore()
    let consecutivePollFailures = 0

    while (item.artJobId === jobId) {
      const job: QueuedArtJob | null = await artStore.getArtJobStatus(jobId)

      if (item.artJobId !== jobId) return

      if (!job) {
        consecutivePollFailures += 1
        if (consecutivePollFailures < MAX_CONSECUTIVE_POLL_FAILURES) {
          item.queueState = 'queued'
          finishGenerateAssets(item, {
            status: 'in-progress',
            note: item.queueState,
          })
          await new Promise((resolve) => setTimeout(resolve, ASYNC_ART_POLL_MS))
          continue
        }
        item.artJobId = null
        item.queueState = null
        item.error = \`Lost track of art job \${jobId}.\`
        finishGenerateAssets(item, { status: 'ready', note: item.error })
        setStatusForRun(runId, 'error', item.error)
        pushItem(item, { error: item.error })
        return
      }
      consecutivePollFailures = 0

      if (job.status === 'PENDING' || job.status === 'RUNNING') {
        item.queueState = job.status === 'RUNNING' ? 'rendering' : 'queued'
        finishGenerateAssets(item, {
          status: 'in-progress',
          note: item.queueState,
        })
        await new Promise((resolve) => setTimeout(resolve, ASYNC_ART_POLL_MS))
        continue
      }

      item.artJobId = null
      item.queueState = null
      return
    }
  }
`

const MISSING_RETURN_FIXTURE = `
  async function pollAsyncArtJob(
    item: BuildItem,
    jobId: number,
    runId: string,
  ): Promise<void> {
    const artStore = useArtStore()
    let consecutivePollFailures = 0

    while (item.artJobId === jobId) {
      const job: QueuedArtJob | null = await artStore.getArtJobStatus(jobId)

      if (!job) {
        consecutivePollFailures += 1
        if (consecutivePollFailures < MAX_CONSECUTIVE_POLL_FAILURES) {
          continue
        }
        item.artJobId = null
      }
      consecutivePollFailures = 0
    }
  }
`

function run(): void {
  // --- extraction sanity ---
  assert.equal(extractPollAsyncArtJobBody('no such function here'), null)
  assert.ok(
    extractPollAsyncArtJobBody(FIXED_FIXTURE)?.startsWith(
      'async function pollAsyncArtJob(',
    ),
  )

  // --- buggy fixture: unbounded retry, no counter, no threshold ---
  const buggyErrors = checkAsyncPollFailureGuard(BUGGY_FIXTURE)
  assert.ok(
    buggyErrors.some((e) => e.includes('retry forever')),
    `expected the buggy fixture to flag the unbounded-retry shape, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(
    buggyErrors.some((e) => e.includes('consecutivePollFailures')),
    `expected the buggy fixture to flag the missing counter, got: ${JSON.stringify(buggyErrors)}`,
  )

  // --- fixed fixture: passes clean ---
  const fixedErrors = checkAsyncPollFailureGuard(FIXED_FIXTURE)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  // --- partial fixture: counter exists but never actually exits the loop ---
  const missingReturnErrors = checkAsyncPollFailureGuard(MISSING_RETURN_FIXTURE)
  assert.ok(
    missingReturnErrors.length > 0,
    'expected the missing-return fixture (counter present, but the failure ' +
      'block never returns) to fail',
  )
  assert.ok(
    missingReturnErrors.some(
      (e) =>
        e.includes('return') || e.includes('MAX_CONSECUTIVE_POLL_FAILURES'),
    ),
    `expected a return/threshold-related error, got: ${JSON.stringify(missingReturnErrors)}`,
  )

  // --- missing-anchor fixture ---
  const missingAnchorErrors = checkAsyncPollFailureGuard('const x = 1')
  assert.equal(missingAnchorErrors.length, 1)
  assert.match(missingAnchorErrors[0]!, /Could not find/)

  console.log(
    'Model Builder async poll-failure guard self-test passed: buggy fixture ' +
      'fails on the unbounded-retry shape, fixed fixture passes, a ' +
      'never-exits partial fixture fails, missing-anchor fixture fails clearly.',
  )
}

run()
