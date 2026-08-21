// /utils/scripts/verifyVideoJobPollFailureGuard.ts
//
// Regression guard (model-builder/t-029, cycle 38). stores/videoStore.ts's
// waitForJob() polls a queued video job's status every POLL_MS via a direct
// performFetch call, which resolves to a null job for BOTH "the job hasn't
// started yet" and "the status fetch itself failed" -- performFetch never
// throws; a network blip, an expired session's 401, the store-wide circuit
// breaker being open, or a genuine 404 all collapse to the same null.
//
// Before this fix, the loop only special-cased a terminal status
// (DONE/FAILED/CANCELLED, which returns) and a genuine PENDING/RUNNING
// status (which just updated state.status/state.message) -- any other
// outcome, including a null job from a persistently failing fetch, fell
// straight through to `await sleep(POLL_MS)` and looped again with no retry
// cap and no timeout. Concrete failure: this function backs generate(), the
// video-generator page's only entry point -- a persistent status-fetch
// failure (e.g. the user's JWT expiring mid-render) left the awaited promise
// never resolving or rejecting, so generate's own try/catch never ran,
// nothing was ever surfaced to the user, and state.status sat stuck at
// 'queued'/'rendering' forever. Same defect class as pollAsyncArtJob
// (modelBuilderStore.ts, cycle 36) and waitForQueuedArtJob (artStore.ts,
// cycle 37), just in the video store's own poll loop.
//
// Fixed by counting consecutive non-terminal, non-PENDING/RUNNING outcomes
// (i.e. a null/failed status fetch) separately from genuine PENDING/RUNNING
// statuses and, past a bounded threshold (MAX_CONSECUTIVE_POLL_FAILURES),
// throwing instead of looping forever -- the thrown error propagates into
// generate's existing catch block, the same error-surfacing path a genuine
// FAILED job already uses.
//
// This checks waitForJob's source text for: (1) a per-call failure counter,
// (2) the counter being compared against a threshold constant, and (3) a
// `throw` reachable from the failure branch (proof the loop can actually
// exit on persistent failure, not just retry forever).
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/videoStore.ts')

const FUNCTION_ANCHOR = 'async function waitForJob('

/**
 * Extracts waitForJob's full function body (from its `async function`
 * anchor through the balancing closing brace), so the checks below are
 * robust to reformatting/comment changes elsewhere in the file. Mirrors
 * extractWaitForQueuedArtJobBody's brace-balancing approach
 * (verifyArtQueuePollFailureGuard.ts), including skipping over
 * string/template literals so a `${jobId}`-style interpolation in the real
 * fix's error message can't desync the brace-depth count.
 */
export function extractWaitForJobBody(content: string): string | null {
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

export function checkVideoJobPollFailureGuard(content: string): string[] {
  const errors: string[] = []

  const body = extractWaitForJobBody(content)
  if (body === null) {
    errors.push(
      `Could not find \`${FUNCTION_ANCHOR}\` in videoStore.ts -- has ` +
        'waitForJob been renamed, removed, or restructured? If so, this ' +
        'guard (and the infinite-retry bug it protects against) needs to ' +
        'move with it.',
    )
    return errors
  }

  const counterDeclared = /let\s+consecutivePollFailures\s*=\s*0/.test(body)
  if (!counterDeclared) {
    errors.push(
      'waitForJob no longer declares a consecutive-failure counter ' +
        '(expected `let consecutivePollFailures = 0`) -- without one, a ' +
        'persistent status-fetch failure has no way to be distinguished ' +
        'from a transient one.',
    )
  }

  if (!/consecutivePollFailures\s*\+=\s*1/.test(body)) {
    errors.push(
      'waitForJob never increments consecutivePollFailures -- the failure ' +
        'count would never advance, so the threshold check below it could ' +
        'never trigger.',
    )
  }

  const zeroAssignmentCount = (
    body.match(/consecutivePollFailures\s*=\s*0/g) ?? []
  ).length
  if (zeroAssignmentCount < 2) {
    errors.push(
      'waitForJob never resets consecutivePollFailures back to 0 on a ' +
        'genuine PENDING/RUNNING status (only the initial declaration was ' +
        'found) -- a transient blip followed by recovery would keep ' +
        'counting toward the threshold instead of clearing.',
    )
  }

  if (!/MAX_CONSECUTIVE_POLL_FAILURES/.test(body)) {
    errors.push(
      'waitForJob does not reference MAX_CONSECUTIVE_POLL_FAILURES -- ' +
        'there is no bounded threshold past which a persistent ' +
        'status-fetch failure stops being retried.',
    )
  }

  if (!/throw new Error/.test(body)) {
    errors.push(
      'waitForJob has no `throw new Error` reachable from the ' +
        'failure-handling branch -- there is no path by which persistent ' +
        'status-fetch failures actually exit the poll loop; it would retry ' +
        'forever regardless of any counter.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkVideoJobPollFailureGuard(content)

  if (errors.length) {
    console.error(
      'Video job poll-failure guard contract failed for stores/videoStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Video job poll-failure guard contract passed: waitForJob caps ' +
      'consecutive status-fetch failures and throws instead of retrying ' +
      'forever.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
