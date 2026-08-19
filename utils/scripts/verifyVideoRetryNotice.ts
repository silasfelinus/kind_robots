// /utils/scripts/verifyVideoRetryNotice.ts
//
// Regression guard -- a failing video job used to spin a "processing" wheel in
// total silence.
//
// server/api/art/queue/[id]/complete.post.ts returns a failed job to PENDING
// with its error recorded, retrying until `attempts` hits MAX_ATTEMPTS. Both
// stores that poll that endpoint read `error` only after the job reached a
// terminal state, so every retry in between looked identical to a freshly
// queued job. 2026-08-19: an LTX webp animation was rejected by ComfyUI at
// submission time (`value_not_in_list` on `ckpt_name`), burned its whole retry
// budget, and the page said "Queued — waiting for the studio engine to pick it
// up…" the entire time, while the ArtJob row had carried the exact ComfyUI
// rejection since the first attempt.
//
// Two halves, both asserted here because either alone leaves the bug:
//   1. artJobRetryNotice() decides correctly WHEN there is a failure to report
//      (behavioural -- run against real inputs, not grepped).
//   2. videoStore + the video-generator page actually route that decision to
//      the screen (textual, in the narrow style of this project's other
//      template guards -- see verifyDaVinciNarratingStatusGuard.ts).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { artJobRetryNotice } from '../artJobRetryNotice'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/videoStore.ts')
const PAGE_PATH = join(repositoryRoot, 'pages/play/video-generator.vue')

export function checkRetryNoticeBehaviour(): string[] {
  const errors: string[] = []

  const check = (label: string, run: () => void): void => {
    try {
      run()
    } catch (error) {
      errors.push(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  check('a retrying job reports its last failure', () => {
    const notice = artJobRetryNotice({
      status: 'PENDING',
      attempts: 1,
      error: 'ComfyUI /prompt returned HTTP 400: ckpt_name not in list',
    })
    // Plain throws rather than assert.ok() for the null check: TypeScript only
    // narrows through an assertion signature when the callee is declared with
    // an explicit type annotation, which an imported `assert` is not.
    if (!notice)
      throw new Error('a PENDING job that already failed reported nothing')
    assert.equal(notice.attempts, 1)
    assert.match(notice.error, /HTTP 400/)
  })

  check('a job re-claimed after a failure still reports it', () => {
    // The relay picks the job back up, so it reads RUNNING while still
    // carrying the previous attempt's error. That is the longest stretch of
    // the retry cycle and the one the spinner covered up.
    const notice = artJobRetryNotice({
      status: 'RUNNING',
      attempts: 2,
      error: 'ComfyUI POST /prompt failed',
    })
    if (!notice)
      throw new Error('a RUNNING job carrying an error reported nothing')
    assert.equal(notice.attempts, 2)
  })

  check('a healthy queued job reports nothing', () => {
    assert.equal(artJobRetryNotice({ status: 'PENDING', attempts: 0 }), null)
    assert.equal(
      artJobRetryNotice({ status: 'RUNNING', attempts: 1, error: null }),
      null,
    )
    assert.equal(artJobRetryNotice(null), null)
  })

  check('terminal jobs are left to the fatal path', () => {
    // FAILED/CANCELLED raise through the caller's own error handling, and DONE
    // has had `error` cleared. A notice here would double-report or, worse,
    // show a warning next to a finished clip.
    for (const status of ['FAILED', 'CANCELLED', 'DONE'] as const) {
      assert.equal(
        artJobRetryNotice({ status, attempts: 3, error: 'boom' }),
        null,
        `${status} should not produce a retry notice`,
      )
    }
  })

  check('an error with no attempt count is not reported', () => {
    assert.equal(
      artJobRetryNotice({ status: 'PENDING', error: 'boom' }),
      null,
      'without an attempt count there is no honest number to show',
    )
  })

  check('whitespace-only errors are not reported', () => {
    assert.equal(
      artJobRetryNotice({ status: 'PENDING', attempts: 1, error: '   ' }),
      null,
    )
  })

  return errors
}

export function checkStoreWiring(content: string): string[] {
  const errors: string[] = []

  if (!content.includes('artJobRetryNotice')) {
    errors.push(
      'videoStore no longer calls artJobRetryNotice() -- its poll loop is ' +
        'back to reading `error` only at the terminal state, which is the ' +
        'silent-spinner bug.',
    )
  }

  for (const field of ['attemptError', 'attempts']) {
    if (!content.includes(`state.${field} =`)) {
      errors.push(
        `videoStore no longer assigns state.${field} -- the page has ` +
          'nothing to render while the queue retries.',
      )
    }
  }

  // The store's `attempts` field must include the ArtJob column, or the poll
  // loop silently reads undefined and never reports a thing.
  if (!/attempts\??:/.test(content)) {
    errors.push(
      "videoStore's QueuedJob type no longer declares `attempts` -- the " +
        'retry count would be dropped from the polled payload.',
    )
  }

  return errors
}

export function checkPageWiring(content: string): string[] {
  const errors: string[] = []

  if (!content.includes('videoStore.state.attemptError')) {
    errors.push(
      'video-generator.vue no longer renders videoStore.state.attemptError ' +
        '-- a job that has already failed shows only the spinner again.',
    )
    return errors
  }

  const index = content.indexOf('videoStore.state.attemptError')
  const blockStart = content.lastIndexOf('<div', index)
  const blockEnd = content.indexOf('</div>', index)
  const block =
    blockStart === -1 || blockEnd === -1
      ? ''
      : content.slice(blockStart, blockEnd)

  if (!block.includes('role="status"')) {
    errors.push(
      'The retry notice no longer carries role="status" -- it appears while ' +
        'the run is still live, so assistive tech gets no announcement, ' +
        "matching this app's busy-state convention.",
    )
  }

  if (!block.includes('alert-warning')) {
    errors.push(
      'The retry notice is no longer styled as a warning -- it must read as ' +
        'distinct from the fatal alert-error block, since the job is still ' +
        'running.',
    )
  }

  return errors
}

function main(): void {
  const errors = [
    ...checkRetryNoticeBehaviour(),
    ...checkStoreWiring(readFileSync(STORE_PATH, 'utf8')),
    ...checkPageWiring(readFileSync(PAGE_PATH, 'utf8')),
  ]

  if (errors.length) {
    console.error('Video retry-notice contract failed:')
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Video retry-notice contract passed: a queued clip that has already ' +
      'failed an attempt reports the failure while it retries, instead of ' +
      'spinning a wheel that says "processing".',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
