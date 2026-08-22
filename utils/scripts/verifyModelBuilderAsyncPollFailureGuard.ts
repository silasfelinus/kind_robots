// /utils/scripts/verifyModelBuilderAsyncPollFailureGuard.ts
//
// Regression guard (model-builder/t-029, cycle 36). stores/modelBuilderStore.ts's
// pollAsyncArtJob() polls an async art job's status every ASYNC_ART_POLL_MS via
// artStore.getArtJobStatus(), which returns `null` for BOTH "the job hasn't
// started yet" and "the status fetch itself failed" -- performFetch
// (stores/utils.ts) never throws; a network blip, an expired session's 401, the
// store-wide circuit breaker being open, or a genuine 404 all collapse to the
// same `null`.
//
// Before this fix, the loop's condition was
// `if (!job || job.status === 'PENDING' || job.status === 'RUNNING')` --
// treating every null identically to a real PENDING status. A *persistent*
// fetch failure (e.g. the user's JWT expiring mid-render) therefore looped
// forever every ASYNC_ART_POLL_MS with no retry cap, no timeout, and no error
// ever surfaced to the user or the server, even if the underlying ArtJob had
// long since finished server-side. Concrete failure: the item sits at
// "queued" indefinitely; item.error never gets set; GENERATE_ASSETS can never
// reach ready/approved; nothing tells the user or pushes anything to the
// server -- exactly the class of silently-local-only failure this file's
// synchronous sibling generateItemAsset() already guards against (its own
// catch block sets item.error, calls finishGenerateAssets, and pushItem's a
// server-visible error).
//
// Fixed by counting consecutive `!job` failures separately from genuine
// PENDING/RUNNING statuses and, past a bounded threshold
// (MAX_CONSECUTIVE_POLL_FAILURES), falling through to the same
// terminal-failure handling already used a few lines below for a genuine
// DONE/FAILED job (set item.error, finishGenerateAssets 'ready', setStatusForRun
// 'error', pushItem the error) instead of looping forever.
//
// This checks pollAsyncArtJob's source text for: (1) a per-call failure
// counter, (2) the counter being compared against a threshold constant, and
// (3) a `return` reachable from the `!job` branch (proof the loop can
// actually exit on persistent failure, not just `continue` forever) -- and
// fails if the pre-fix combined `!job || job.status === 'PENDING' ...`
// condition (which retries `!job` unconditionally, forever) has come back.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FUNCTION_ANCHOR = 'async function pollAsyncArtJob('
const PRE_FIX_UNBOUNDED_RETRY =
  "if (!job || job.status === 'PENDING' || job.status === 'RUNNING')"

/**
 * Extracts pollAsyncArtJob's full function body (from its `async function`
 * anchor through the balancing closing brace), so the checks below are
 * robust to reformatting/comment changes elsewhere in the file.
 */
export function extractPollAsyncArtJobBody(content: string): string | null {
  const anchorIndex = content.indexOf(FUNCTION_ANCHOR)
  if (anchorIndex === -1) return null

  // The naive `content.indexOf('{', anchorIndex)` finds whichever `{` comes
  // first -- which, for a multi-line parameter list, is an object-type
  // parameter's brace (e.g. `dims: { width: number; height: number }`), not
  // the function body's own opening brace. Balance the parameter list's
  // parens first, then look for the body's `{` only after they close.
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

  // Skips over string/template literals so a `${expr}` interpolation's own
  // braces (e.g. the real fix's ``Lost track of art job ${jobId}...`` error
  // message) can't desync the brace-depth count -- the same class of bug
  // verifyCaptureGroupGuards.ts's afterCaptureCallClose already guards
  // against for regex literals.
  //
  // Bug (model-builder/t-029, cycle 41, found by inspection while verifying
  // an unrelated fix): this used to skip only string/template literals, not
  // `//` line comments or `/* */` block comments -- but this file's own
  // comments are full of ordinary English contractions ("doesn't", "isn't",
  // "can't", "it's" ...), and a lone apostrophe inside a `//` comment reads
  // to this scanner exactly like an opening single-quoted string literal. It
  // then swallows everything up to the NEXT apostrophe anywhere in the file
  // (there is no shortage of them) as if it were still inside that "string",
  // silently eating real braces along the way and desyncing the depth
  // count. On the pre-fix version of this file, that miscount happened to
  // still reach depth 0 at SOME later point deep inside a completely
  // different function (batchDraftField's own success-toast string, far
  // past pollAsyncArtJob/generateItemAssetAsync/commitItem/autoBuildItem/
  // autoBuildRun) -- so `body` was never null and every substantive check
  // below still passed, but only because the real `if (!job) {...}` pattern
  // it was supposed to verify happened to be included as a small part of a
  // vastly over-captured region, not because the extraction was actually
  // correct. Editing any code between pollAsyncArtJob and that coincidental
  // stopping point (a normal, unrelated change elsewhere in the file) could
  // shift where the miscounted depth happens to land -- including all the
  // way past the end of the file, which turns a silent false-positive into
  // a hard, misleading "Could not find `async function pollAsyncArtJob(`"
  // failure for a function that is right there, unchanged. Skipping
  // comments before the quote check closes the hole at its root instead of
  // patching around wherever it next happens to surface.
  let depth = 0
  let i = bodyOpen
  for (; i < content.length; i++) {
    const char = content[i]
    const next = content[i + 1]

    if (char === '/' && next === '/') {
      i += 2
      while (i < content.length && content[i] !== '\n') i += 1
      continue
    }

    if (char === '/' && next === '*') {
      i += 2
      while (
        i < content.length &&
        !(content[i] === '*' && content[i + 1] === '/')
      ) {
        i += 1
      }
      i += 1 // land on the '/' of '*/'; the loop's own i++ steps past it
      continue
    }

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

export function checkAsyncPollFailureGuard(content: string): string[] {
  const errors: string[] = []

  const body = extractPollAsyncArtJobBody(content)
  if (body === null) {
    errors.push(
      `Could not find \`${FUNCTION_ANCHOR}\` in modelBuilderStore.ts -- has ` +
        'pollAsyncArtJob been renamed, removed, or restructured? If so, this ' +
        'guard (and the infinite-retry bug it protects against) needs to move ' +
        'with it.',
    )
    return errors
  }

  if (body.includes(PRE_FIX_UNBOUNDED_RETRY)) {
    errors.push(
      'pollAsyncArtJob has reverted to treating `!job` identically to a real ' +
        'PENDING/RUNNING status in one combined condition -- a persistent ' +
        'status-fetch failure (expired session, network blip, circuit ' +
        'breaker open) would once again retry forever with no error ever ' +
        'surfaced.',
    )
  }

  const counterDeclared = /let\s+consecutivePollFailures\s*=\s*0/.test(body)
  if (!counterDeclared) {
    errors.push(
      'pollAsyncArtJob no longer declares a consecutive-failure counter ' +
        '(expected `let consecutivePollFailures = 0`) -- without one, a ' +
        'persistent `!job` status-fetch failure has no way to be ' +
        'distinguished from a transient one.',
    )
  }

  const failureBlockMatch = body.match(/if \(!job\) \{([\s\S]*?)\n {6}\}\n/)
  if (!failureBlockMatch) {
    errors.push(
      'Could not find a standalone `if (!job) { ... }` block in ' +
        'pollAsyncArtJob -- the `!job` (status-fetch-failed) case must be ' +
        'handled separately from genuine PENDING/RUNNING statuses so it can ' +
        'be capped independently.',
    )
  } else {
    const failureBlock = failureBlockMatch[1]!
    if (!/consecutivePollFailures\s*\+=\s*1/.test(failureBlock)) {
      errors.push(
        'The `if (!job) { ... }` block does not increment ' +
          'consecutivePollFailures -- the failure count would never advance, ' +
          'so the threshold check below it could never trigger.',
      )
    }
    if (!/MAX_CONSECUTIVE_POLL_FAILURES/.test(failureBlock)) {
      errors.push(
        'The `if (!job) { ... }` block does not reference ' +
          'MAX_CONSECUTIVE_POLL_FAILURES -- there is no bounded threshold ' +
          'past which a persistent status-fetch failure stops being treated ' +
          'as "still queued."',
      )
    }
    if (!/\breturn\b/.test(failureBlock)) {
      errors.push(
        'The `if (!job) { ... }` block has no `return` -- there is no path ' +
          'by which persistent status-fetch failures actually exit the poll ' +
          'loop; it would retry forever regardless of any counter.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkAsyncPollFailureGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder async poll-failure guard contract failed for ' +
        'stores/modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder async poll-failure guard contract passed: pollAsyncArtJob ' +
      'caps consecutive status-fetch failures and surfaces an error instead ' +
      'of retrying forever.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
