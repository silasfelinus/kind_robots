// /utils/scripts/verifyBrainstormArtPollFailureGuard.ts
//
// Regression guard (model-builder/t-029, cycle 39). stores/brainstormStore.ts's
// generateArtForCandidate() polls a queued ArtJob's status every
// ART_JOB_POLL_MS via artStore.getArtJobStatus(), which resolves to `null`
// for BOTH "job not started yet" and "the status fetch itself failed" --
// getArtJobStatus() never throws; a network blip, an expired session's 401,
// the store-wide circuit breaker being open, or a genuine 404 all collapse
// to the same null.
//
// Before this fix, the loop treated a null job identically to a genuine
// PENDING status: sleep ART_JOB_POLL_MS and continue, with no retry cap and
// no timeout. Concrete failure: this loop sits inside
// generateArtForCandidate's own try/catch/finally -- if the awaited promise
// never resolves or rejects, that try/catch/finally never runs, so the
// candidate's `artGeneratingCandidateIds` entry is never cleared and the
// candidate sits "generating" forever with nothing surfaced to the user.
// Same defect class as pollAsyncArtJob (modelBuilderStore.ts, cycle 36),
// waitForQueuedArtJob (artStore.ts, cycle 37), waitForJob (videoStore.ts,
// cycle 38), and pollJob (buildBenchStore.ts, cycle 39), just in
// Brainstorm's own art-generation poll loop.
//
// Fixed by counting consecutive null-job outcomes separately from genuine
// PENDING/RUNNING statuses and, past a bounded threshold
// (MAX_CONSECUTIVE_ART_JOB_POLL_FAILURES), throwing instead of looping
// forever -- the thrown error propagates into generateArtForCandidate's
// existing catch block, the same error-surfacing path a genuine
// finalization failure already uses.
//
// This checks generateArtForCandidate's full source text for: (1) a
// per-call failure counter, (2) the counter being compared against a
// threshold constant, and (3) a `throw` reachable from the failure branch
// (proof the loop can actually exit on persistent failure, not just retry
// forever).
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/brainstormStore.ts')

const FUNCTION_ANCHOR = 'async function generateArtForCandidate('

/**
 * Extracts generateArtForCandidate's full function body (from its
 * `async function` anchor through the balancing closing brace), so the
 * checks below are robust to reformatting/comment changes elsewhere in the
 * file. Mirrors extractWaitForJobBody's brace-balancing approach
 * (verifyVideoJobPollFailureGuard.ts), including skipping over
 * string/template literals so a `${jobId}`-style interpolation in the real
 * fix's error message can't desync the brace-depth count.
 */
export function extractGenerateArtForCandidateBody(
  content: string,
): string | null {
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

  // generateArtForCandidate's return type is an object literal
  // (`Promise<{ success: boolean; message?: string }>`), which contains its
  // own braces before the real function body opens. Scan for the
  // body-opening brace by tracking angle-bracket depth instead of naively
  // taking the first `{` after the params close -- any `{`/`}` encountered
  // while still inside the generic's `< >` is part of the return-type
  // annotation, not the function body.
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

export function checkBrainstormArtPollFailureGuard(content: string): string[] {
  const errors: string[] = []

  const body = extractGenerateArtForCandidateBody(content)
  if (body === null) {
    errors.push(
      `Could not find \`${FUNCTION_ANCHOR}\` in brainstormStore.ts -- has ` +
        'generateArtForCandidate been renamed, removed, or restructured? ' +
        'If so, this guard (and the infinite-retry bug it protects ' +
        'against) needs to move with it.',
    )
    return errors
  }

  const counterDeclared = /let\s+consecutivePollFailures\s*=\s*0/.test(body)
  if (!counterDeclared) {
    errors.push(
      'generateArtForCandidate no longer declares a consecutive-failure ' +
        'counter (expected `let consecutivePollFailures = 0`) -- without ' +
        'one, a persistent status-fetch failure has no way to be ' +
        'distinguished from a transient one.',
    )
  }

  if (!/consecutivePollFailures\s*\+=\s*1/.test(body)) {
    errors.push(
      'generateArtForCandidate never increments consecutivePollFailures ' +
        '-- the failure count would never advance, so the threshold check ' +
        'below it could never trigger.',
    )
  }

  const zeroAssignmentCount = (
    body.match(/consecutivePollFailures\s*=\s*0/g) ?? []
  ).length
  if (zeroAssignmentCount < 2) {
    errors.push(
      'generateArtForCandidate never resets consecutivePollFailures back ' +
        'to 0 on a genuine PENDING/RUNNING status (only the initial ' +
        'declaration was found) -- a transient blip followed by recovery ' +
        'would keep counting toward the threshold instead of clearing.',
    )
  }

  if (!/MAX_CONSECUTIVE_ART_JOB_POLL_FAILURES/.test(body)) {
    errors.push(
      'generateArtForCandidate does not reference ' +
        'MAX_CONSECUTIVE_ART_JOB_POLL_FAILURES -- there is no bounded ' +
        'threshold past which a persistent status-fetch failure stops ' +
        'being retried.',
    )
  }

  if (!/throw new Error/.test(body)) {
    errors.push(
      'generateArtForCandidate has no `throw new Error` reachable from ' +
        'the failure-handling branch -- there is no path by which ' +
        'persistent status-fetch failures actually exit the poll loop; it ' +
        'would retry forever regardless of any counter.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkBrainstormArtPollFailureGuard(content)

  if (errors.length) {
    console.error(
      'Brainstorm art poll-failure guard contract failed for stores/brainstormStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Brainstorm art poll-failure guard contract passed: ' +
      'generateArtForCandidate caps consecutive status-fetch failures and ' +
      'throws instead of retrying forever.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
