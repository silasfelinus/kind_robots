// /utils/scripts/verifyModelBuilderOpenRunCancelledGuard.ts
//
// Regression guard (model-builder/t-029 cycle 32) -- openRun(runId) had no
// equivalent of resumeRun()'s "don't resume a dead run" check (see
// verifyModelBuilderResumeCancelledRunGuard.ts for that sibling fix).
// fetchRuns()'s default query excludes CANCELLED runs, so state.runs is
// *usually* clean, but that list goes stale the instant a run is cancelled
// from elsewhere -- another browser tab, another device, or just a
// concurrent fetchRuns()/cancelRun() finishing after the click. Before this
// fix, openRun()'s cached branch reopened a stale CANCELLED entry from
// state.runs with no status check at all, and its network-fetch fallback
// fetched the live (status-accurate) record and still ignored the status.
// Either path leaves state.run pointing at a run that looks fully
// interactive -- every stage-mutating action optimistically updates local
// state, then the background PATCH/POST 409s server-side on
// assertRunWritable's cancelled check -- the exact "read-only 409 trap"
// resumeRun's own fix exists to avoid.
//
// Fixed by carrying `status` on every cached BuildRun (adaptRun) so the
// cached branch can refuse a stale CANCELLED entry, and by checking
// `response.data.status === 'CANCELLED'` on the fetch fallback the same way
// resumeRun checks its own remembered-id fetch, dropping the stale entry
// from state.runs and surfacing an error instead of opening a dead run.
//
// This asserts the textual shape of that fix stays in place: openRun()'s
// cached-branch guard includes `cached.status !== 'CANCELLED'`, and its
// fetch-fallback branch checks `response.data.status === 'CANCELLED'` before
// the `state.run = adaptRun(response.data)` assignment. Deliberately scoped
// to this one function/bug, mirroring
// verifyModelBuilderResumeCancelledRunGuard.ts's own narrow textual check
// over a general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'openRun'
const CACHED_CHECK = "cached.status !== 'CANCELLED'"
const FETCH_CHECK = "response.data.status === 'CANCELLED'"
const ADOPT_STATEMENT = 'state.run = adaptRun(response.data)'
const DROP_STALE_ENTRY =
  'state.runs = state.runs.filter((entry) => entry.id !== runId)'

// Checks the fix's exact shape against the full source text of a file
// containing an `openRun`-named function. Exported (rather than only
// exercised via main()) so the self-test below can run it against synthetic
// buggy/fixed fixtures without touching the real store file.
export function checkOpenRunCancelledGuard(content: string): string[] {
  const errors: string[] = []

  const functions = extractFunctionBodies(content)
  const fn = functions.find((f) => f.name === FN_NAME)
  if (!fn) {
    errors.push(
      `Could not find an async function named ${FN_NAME}() -- has it been ` +
        'renamed, removed, or inlined? If so, this guard (and the bug it ' +
        'protects against) needs to move with it.',
    )
    return errors
  }

  if (!fn.body.includes(CACHED_CHECK)) {
    errors.push(
      `${FN_NAME}()'s cached-run branch does not check \`${CACHED_CHECK}\` ` +
        '-- without this, a stale CANCELLED entry left in state.runs by a ' +
        'run cancelled from elsewhere (another tab/device, or a concurrent ' +
        'fetchRuns()) gets reopened directly with no status check, leading ' +
        "to the same read-only 409 trap resumeRun()'s own cancelled-run " +
        'check exists to avoid.',
    )
  }

  const fetchCheckIndex = fn.body.indexOf(FETCH_CHECK)
  const adoptIndex = fn.body.indexOf(ADOPT_STATEMENT)
  if (fetchCheckIndex === -1) {
    errors.push(
      `${FN_NAME}()'s network-fetch fallback does not check ` +
        `\`${FETCH_CHECK}\` before adopting the response -- ` +
        'GET /api/model-builder/runs/:id has no status filter, so a ' +
        'CANCELLED run fetched this way would otherwise be opened as if it ' +
        'were still live.',
    )
  } else if (adoptIndex !== -1 && fetchCheckIndex >= adoptIndex) {
    errors.push(
      `${FN_NAME}() checks \`${FETCH_CHECK}\` AFTER already assigning ` +
        `\`${ADOPT_STATEMENT}\` -- the check must run before state.run is ` +
        'set, or a CANCELLED response still gets adopted first.',
    )
  }

  if (!fn.body.includes(DROP_STALE_ENTRY)) {
    errors.push(
      `${FN_NAME}() does not drop the stale entry from state.runs ` +
        `(expected \`${DROP_STALE_ENTRY}\`) when the fetch reveals the run ` +
        'is CANCELLED -- without this, the same dead entry stays cached and ' +
        'a later click can still hit the cached branch instead of ' +
        're-checking.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkOpenRunCancelledGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder open-run-cancelled guard contract failed for ' +
        `${FN_NAME}() in modelBuilderStore.ts:`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder open-run-cancelled guard contract passed: ' +
      `${FN_NAME}() refuses a stale cached or freshly-fetched CANCELLED ` +
      'run instead of silently reopening it.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
