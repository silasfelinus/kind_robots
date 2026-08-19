// /utils/scripts/verifyVideoRetryNotice.test.ts
//
// Regression test for the textual halves of verifyVideoRetryNotice.ts. The
// behavioural half (checkRetryNoticeBehaviour) runs the real artJobRetryNotice
// against real inputs and needs no fixture, so it is exercised directly; the
// two source checkers are fed pre-fix and post-fix shapes to prove they fail
// on the shape that actually shipped the bug rather than on nothing.
import assert from 'node:assert/strict'

import {
  checkPageWiring,
  checkRetryNoticeBehaviour,
  checkStoreWiring,
} from './verifyVideoRetryNotice.js'

// The store as it looked while the bug was live: it polls, it distinguishes
// queued from rendering, and it never looks at `error` until the job is
// terminal.
const STORE_BEFORE = `
type QueuedJob = {
  id: number
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'CANCELLED'
  artImageId?: number | null
  error?: string | null
}

      if (job?.status === 'RUNNING') {
        state.status = 'rendering'
        state.message = 'The studio engine is rendering your clip…'
      } else if (job?.status === 'PENDING') {
        state.status = 'queued'
        state.message = 'Queued — waiting for the studio engine to pick it up…'
      }
`

const STORE_AFTER = `
type QueuedJob = {
  id: number
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'CANCELLED'
  artImageId?: number | null
  error?: string | null
  attempts?: number | null
}

      const notice = artJobRetryNotice(job)
      if (notice) {
        state.attempts = notice.attempts
        state.attemptError = notice.error
      }
`

function page(attrs: string): string {
  return `
<template>
        <div
          v-if="videoStore.state.attemptError && videoStore.isBusy"
          ${attrs}
        >
          <span>
            Attempt {{ videoStore.state.attempts }} failed, retrying:
            {{ videoStore.state.attemptError }}
          </span>
        </div>
</template>
`
}

const PAGE_AFTER = page(
  'class="alert alert-warning text-sm"\n          role="status"',
)
const PAGE_NO_NOTICE = `
<template>
        <div v-if="videoStore.state.error" class="alert alert-error" role="alert">
          {{ videoStore.state.error }}
        </div>
</template>
`

function run(): void {
  // Behaviour: the real decision function, real inputs, no fixtures.
  const behaviourErrors = checkRetryNoticeBehaviour()
  assert.deepEqual(
    behaviourErrors,
    [],
    `artJobRetryNotice misbehaved: ${behaviourErrors.join('; ')}`,
  )

  // Store: the pre-fix source must fail, and on the specific grounds that it
  // never consults artJobRetryNotice.
  const storeBeforeErrors = checkStoreWiring(STORE_BEFORE)
  assert.ok(
    storeBeforeErrors.length >= 3,
    'the pre-fix store should fail the notice, state, and attempts checks',
  )
  assert.ok(storeBeforeErrors.some((e) => /artJobRetryNotice/.test(e)))
  assert.ok(storeBeforeErrors.some((e) => /state\.attemptError/.test(e)))
  assert.ok(storeBeforeErrors.some((e) => /QueuedJob type/.test(e)))

  assert.deepEqual(checkStoreWiring(STORE_AFTER), [])

  // Page: no notice block at all is the pre-fix shape.
  const pageMissingErrors = checkPageWiring(PAGE_NO_NOTICE)
  assert.equal(pageMissingErrors.length, 1)
  assert.ok(pageMissingErrors.some((e) => /no longer renders/.test(e)))

  assert.deepEqual(checkPageWiring(PAGE_AFTER), [])

  // Each rendering requirement must fail on its own, so a partial regression
  // is not masked by the others passing.
  const noRoleErrors = checkPageWiring(page('class="alert alert-warning"'))
  assert.equal(noRoleErrors.length, 1)
  assert.ok(noRoleErrors.some((e) => /role="status"/.test(e)))

  const noWarningErrors = checkPageWiring(
    page('class="alert alert-error"\n          role="status"'),
  )
  assert.equal(noWarningErrors.length, 1)
  assert.ok(noWarningErrors.some((e) => /styled as a warning/.test(e)))

  console.log(
    'Video retry-notice guard self-test passed: artJobRetryNotice behaves ' +
      'on real inputs, the pre-fix store and page fixtures fail, and the ' +
      'missing-role and missing-warning regressions each fail on their own.',
  )
}

run()
