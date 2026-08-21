// /utils/scripts/verifyArtQueuePollFailureGuard.ts
//
// Regression guard (model-builder/t-029, cycle 37). stores/artStore.ts's
// waitForQueuedArtJob() polls a queued art job's status every
// ART_QUEUE_POLL_MS via a direct performFetch call, which resolves to a null
// job for BOTH "the job hasn't started yet" and "the status fetch itself
// failed" -- performFetch never throws; a network blip, an expired
// session's 401, the store-wide circuit breaker being open, or a genuine 404
// all collapse to the same null.
//
// Before this fix, the loop only special-cased a terminal status
// (DONE/FAILED/CANCELLED, which returns) and a genuine PENDING/RUNNING
// status (which just sets state.queueState) -- any other outcome, including
// a null job from a persistently failing fetch, fell straight through to
// `await queueSleep(...)` and looped again with no retry cap and no
// timeout. Concrete failure: this function backs enqueueAndRenderArtImage,
// the actual synchronous rendering path behind generateArt/
// generateCurrentArt/generateItemAsset -- a persistent status-fetch failure
// (e.g. the user's JWT expiring mid-render) left the awaited promise never
// resolving or rejecting, so generateArt's own try/catch never ran, nothing
// was ever surfaced to the user, and the whole call sat hung indefinitely.
// Same defect class as pollAsyncArtJob in modelBuilderStore.ts (cycle 36),
// just in the shared art store's own synchronous-wait sibling instead of
// model-builder's async poll loop.
//
// Fixed by counting consecutive non-terminal, non-PENDING/RUNNING outcomes
// (i.e. a null/failed status fetch) separately from genuine PENDING/RUNNING
// statuses and, past a bounded threshold
// (MAX_CONSECUTIVE_QUEUE_POLL_FAILURES), throwing instead of looping
// forever -- the thrown error propagates through enqueueAndRenderArtImage
// into generateArt's existing catch block, the same error-surfacing path a
// genuine FAILED job already uses.
//
// This checks waitForQueuedArtJob's source text for: (1) a per-call failure
// counter, (2) the counter being compared against a threshold constant, and
// (3) a `throw` reachable from the failure branch (proof the loop can
// actually exit on persistent failure, not just retry forever).
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/artStore.ts')

const FUNCTION_ANCHOR = 'async function waitForQueuedArtJob('

/**
 * Extracts waitForQueuedArtJob's full function body (from its `async
 * function` anchor through the balancing closing brace), so the checks
 * below are robust to reformatting/comment changes elsewhere in the file.
 * Mirrors extractPollAsyncArtJobBody's brace-balancing approach
 * (verifyModelBuilderAsyncPollFailureGuard.ts), including skipping over
 * string/template literals so a `${jobId}`-style interpolation in the real
 * fix's error message can't desync the brace-depth count.
 */
export function extractWaitForQueuedArtJobBody(content: string): string | null {
  const anchorIndex = content.indexOf(FUNCTION_ANCHOR)
  if (anchorIndex === -1) return null

  const paramsOpen = anchorIndex + FUNCTION_ANCHOR.length - 1 // the '(' itself
  let parenDepth = 0
  let paramsClose = -1
  for (let i = paramsOpen; i < content.length; i++) {
    if (content[i] === '(') parenDepth++
    else if (content[i] === ')') {
      parenDepth--
      if (parenDepth === 0) {
        paramsClose = i
        break
      }
    }
  }
  if (paramsClose === -1) return null

  const bodyOpen = content.indexOf('{', paramsClose)
  if (bodyOpen === -1) return null

  let depth = 0
  let i = bodyOpen
  for (; i < content.length; i++) {
    const char = content[i]

    if (char === "'" || char === '"' || char === '`') {
      i += 1
      while (i < content.length && content[i] !== char) {
        if (content[i] === '\\') i += 1
        i += 1
      }
      continue
    }

    if (char === '{') depth++
    else if (char === '}') {
      depth--
      if (depth === 0) break
    }
  }
  if (depth !== 0) return null

  return content.slice(anchorIndex, i + 1)
}

export function checkArtQueuePollFailureGuard(content: string): string[] {
  const errors: string[] = []

  const body = extractWaitForQueuedArtJobBody(content)
  if (body === null) {
    errors.push(
      `Could not find \`${FUNCTION_ANCHOR}\` in artStore.ts -- has ` +
        'waitForQueuedArtJob been renamed, removed, or restructured? If so, ' +
        'this guard (and the infinite-retry bug it protects against) needs ' +
        'to move with it.',
    )
    return errors
  }

  const counterDeclared = /let\s+consecutivePollFailures\s*=\s*0/.test(body)
  if (!counterDeclared) {
    errors.push(
      'waitForQueuedArtJob no longer declares a consecutive-failure counter ' +
        '(expected `let consecutivePollFailures = 0`) -- without one, a ' +
        'persistent status-fetch failure has no way to be distinguished ' +
        'from a transient one.',
    )
  }

  if (!/consecutivePollFailures\s*\+=\s*1/.test(body)) {
    errors.push(
      'waitForQueuedArtJob never increments consecutivePollFailures -- the ' +
        'failure count would never advance, so the threshold check below it ' +
        'could never trigger.',
    )
  }

  const zeroAssignmentCount = (
    body.match(/consecutivePollFailures\s*=\s*0/g) ?? []
  ).length
  if (zeroAssignmentCount < 2) {
    errors.push(
      'waitForQueuedArtJob never resets consecutivePollFailures back to 0 on ' +
        'a genuine PENDING/RUNNING status (only the initial declaration was ' +
        'found) -- a transient blip followed by recovery would keep counting ' +
        'toward the threshold instead of clearing.',
    )
  }

  if (!/MAX_CONSECUTIVE_QUEUE_POLL_FAILURES/.test(body)) {
    errors.push(
      'waitForQueuedArtJob does not reference ' +
        'MAX_CONSECUTIVE_QUEUE_POLL_FAILURES -- there is no bounded ' +
        'threshold past which a persistent status-fetch failure stops being ' +
        'retried.',
    )
  }

  if (!/throw new Error/.test(body)) {
    errors.push(
      'waitForQueuedArtJob has no `throw new Error` reachable from the ' +
        'failure-handling branch -- there is no path by which persistent ' +
        'status-fetch failures actually exit the poll loop; it would retry ' +
        'forever regardless of any counter.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkArtQueuePollFailureGuard(content)

  if (errors.length) {
    console.error(
      'Art queue poll-failure guard contract failed for stores/artStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Art queue poll-failure guard contract passed: waitForQueuedArtJob caps ' +
      'consecutive status-fetch failures and throws instead of retrying ' +
      'forever.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
