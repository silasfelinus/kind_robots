// /utils/scripts/verifyBuildBenchPollFailureGuard.ts
//
// Regression guard (model-builder/t-029, cycle 39). stores/buildBenchStore.ts's
// pollJob() polls a queued Build Bench ArtJob's status every POLL_MS via a
// direct performFetch call, which resolves to a null job for BOTH "the job
// hasn't reached a terminal status yet" and "the status fetch itself failed"
// -- performFetch never throws; a network blip, an expired session's 401,
// the store-wide circuit breaker being open, or a genuine 404 all collapse
// to the same null.
//
// Before this fix, the loop only special-cased a terminal status
// (DONE/FAILED/CANCELLED, which returns) -- any other outcome, including a
// null job from a persistently failing fetch, fell straight through to
// `await sleep(POLL_MS)` and looped again with no retry cap and no timeout.
// Concrete failure: this function backs runSide(), Build Bench's only
// render path -- a persistent status-fetch failure left the awaited promise
// never resolving or rejecting, so runSide's own try/catch never ran,
// nothing was ever surfaced to the user, and the bench side sat stuck at
// 'rendering' forever. Same defect class as pollAsyncArtJob
// (modelBuilderStore.ts, cycle 36), waitForQueuedArtJob (artStore.ts, cycle
// 37), and waitForJob (videoStore.ts, cycle 38), just in Build Bench's own
// poll loop.
//
// Fixed by counting consecutive non-terminal, non-PENDING/RUNNING outcomes
// (i.e. a null/failed status fetch) separately from genuine PENDING/RUNNING
// statuses and, past a bounded threshold (MAX_CONSECUTIVE_POLL_FAILURES),
// throwing instead of looping forever -- the thrown error propagates into
// runSide's existing catch block, the same error-surfacing path a genuine
// FAILED job already uses.
//
// This checks pollJob's source text for: (1) a per-call failure counter,
// (2) the counter being compared against a threshold constant, and (3) a
// `throw` reachable from the failure branch (proof the loop can actually
// exit on persistent failure, not just retry forever).
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/buildBenchStore.ts')

const FUNCTION_ANCHOR = 'async function pollJob('

/**
 * Extracts pollJob's full function body (from its `async function` anchor
 * through the balancing closing brace), so the checks below are robust to
 * reformatting/comment changes elsewhere in the file. Mirrors
 * extractWaitForJobBody's brace-balancing approach
 * (verifyVideoJobPollFailureGuard.ts), including skipping over
 * string/template literals so a `${jobId}`-style interpolation in the real
 * fix's error message can't desync the brace-depth count.
 */
export function extractPollJobBody(content: string): string | null {
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

  // pollJob's return type is an object literal (`Promise<{ status: ... }>`),
  // which contains its own braces before the real function body opens. Scan
  // for the body-opening brace by tracking angle-bracket depth instead of
  // naively taking the first `{` after the params close -- any `{`/`}`
  // encountered while still inside the generic's `< >` is part of the
  // return-type annotation, not the function body.
  let angleDepth = 0
  let bodyOpen = -1
  for (let i = paramsClose; i < content.length; i++) {
    const char = content[i]
    if (char === "'" || char === '"' || char === '`') {
      i += 1
      while (i < content.length && content[i] !== char) {
        if (content[i] === '\\') i += 1
        i += 1
      }
      continue
    }
    if (char === '<') angleDepth++
    else if (char === '>') {
      if (angleDepth > 0) angleDepth--
    } else if (char === '{' && angleDepth === 0) {
      bodyOpen = i
      break
    }
  }
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

export function checkBuildBenchPollFailureGuard(content: string): string[] {
  const errors: string[] = []

  const body = extractPollJobBody(content)
  if (body === null) {
    errors.push(
      `Could not find \`${FUNCTION_ANCHOR}\` in buildBenchStore.ts -- has ` +
        'pollJob been renamed, removed, or restructured? If so, this ' +
        'guard (and the infinite-retry bug it protects against) needs to ' +
        'move with it.',
    )
    return errors
  }

  const counterDeclared = /let\s+consecutivePollFailures\s*=\s*0/.test(body)
  if (!counterDeclared) {
    errors.push(
      'pollJob no longer declares a consecutive-failure counter ' +
        '(expected `let consecutivePollFailures = 0`) -- without one, a ' +
        'persistent status-fetch failure has no way to be distinguished ' +
        'from a transient one.',
    )
  }

  if (!/consecutivePollFailures\s*\+=\s*1/.test(body)) {
    errors.push(
      'pollJob never increments consecutivePollFailures -- the failure ' +
        'count would never advance, so the threshold check below it could ' +
        'never trigger.',
    )
  }

  if (!/consecutivePollFailures\s*=\s*0/.test(body)) {
    errors.push(
      'pollJob never resets consecutivePollFailures back to 0 on a ' +
        'genuine PENDING/RUNNING status -- a transient blip followed by ' +
        'recovery would keep counting toward the threshold instead of ' +
        'clearing.',
    )
  }

  if (!/MAX_CONSECUTIVE_POLL_FAILURES/.test(body)) {
    errors.push(
      'pollJob does not reference MAX_CONSECUTIVE_POLL_FAILURES -- ' +
        'there is no bounded threshold past which a persistent ' +
        'status-fetch failure stops being retried.',
    )
  }

  if (!/throw new Error/.test(body)) {
    errors.push(
      'pollJob has no `throw new Error` reachable from the ' +
        'failure-handling branch -- there is no path by which persistent ' +
        'status-fetch failures actually exit the poll loop; it would retry ' +
        'forever regardless of any counter.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkBuildBenchPollFailureGuard(content)

  if (errors.length) {
    console.error(
      'Build Bench poll-failure guard contract failed for stores/buildBenchStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Build Bench poll-failure guard contract passed: pollJob caps ' +
      'consecutive status-fetch failures and throws instead of retrying ' +
      'forever.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
