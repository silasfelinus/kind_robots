// /utils/scripts/verifyModelBuilderOpenRunRequestGuard.ts
//
// Regression guard (model-builder/t-029) -- openRun(runId)'s fallback network
// fetch (taken when the requested run is neither already active nor cached in
// state.runs) had no request-scoping at all. fetchRuns() and loadSources() in
// this same file each guard the identical class of bug -- an async
// list/record fetch whose response can land out of order -- by capturing a
// ticket up front and discarding any response that arrives after state has
// moved on. openRun() had no equivalent for its own fetch branch.
//
// Concrete repro: the run-history panel's "Open" button has no in-flight
// guard of its own (only cancellingRunId disables it -- see
// model-builder-run-history.vue). Click Open on run A while it is not yet in
// state.runs (falls through to the network fetch), then -- before that
// response lands -- click Open on run B. If B resolves synchronously (already
// cached, or becomes the newly-active run) the UI correctly shows B. If A's
// slower fetch then resolves, it unconditionally overwrote state.run with
// run A's data -- silently discarding the user's actual last click and
// leaving the Model Builder showing the wrong run with no error surfaced.
//
// Fixed by a monotonic request ticket (`openRunRequestId`), the same pattern
// as fetchRunsRequestId: captured as `requestId` at the very top of every
// call (so a newer call -- whether it resolves synchronously or via fetch --
// always invalidates an older call's still-pending fetch), and checked before
// applying the response in both the success and catch branches.
//
// This asserts the textual shape of that fix stays in place -- deliberately
// scoped to this one function/bug, mirroring
// verifyModelBuilderFetchRunsStalenessGuard.ts's identical pattern for its
// sibling function.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'openRun'
const TICKET_VAR = 'openRunRequestId'

const REQUIRED_BODY_STATEMENTS = [
  `const requestId = ++${TICKET_VAR}`,
  `if (${TICKET_VAR} !== requestId) return`,
]

// Checks the fix's exact shape against the full source text of a file
// containing an `openRun`-named function. Exported (rather than only
// exercised via main()) so the self-test below can run it against synthetic
// buggy/fixed fixtures without touching the real store file.
export function checkOpenRunRequestGuard(content: string): string[] {
  const errors: string[] = []

  if (!new RegExp(`let ${TICKET_VAR}\\s*=\\s*0`).test(content)) {
    errors.push(
      `Could not find \`let ${TICKET_VAR} = 0\` -- openRun() needs a ` +
        'closure-scoped request ticket to tell a stale fallback-fetch ' +
        'response apart from the latest one, the same pattern ' +
        'fetchRunsRequestId already uses for fetchRuns().',
    )
  }

  const functions = extractFunctionBodies(content)
  const fn = functions.find((f) => f.name === FN_NAME)
  if (!fn) {
    errors.push(
      `Could not find a function named ${FN_NAME}() -- has it been ` +
        'renamed, removed, or inlined? If so, this guard (and the race it ' +
        'protects against) needs to move with it.',
    )
    return errors
  }

  const staleChecks = (
    fn.body.match(new RegExp(`${TICKET_VAR} !== requestId`, 'g')) ?? []
  ).length
  if (staleChecks < 2) {
    errors.push(
      `${FN_NAME}() checks \`${TICKET_VAR} !== requestId\` only ` +
        `${staleChecks} time(s) -- both the success branch (after the ` +
        'await) and the catch branch must bail out on a stale response, or ' +
        'an older, slower Open click can still overwrite state.run with a ' +
        'different run after a newer click already resolved.',
    )
  }

  if (!fn.body.trimStart().startsWith(`const requestId = ++${TICKET_VAR}`)) {
    errors.push(
      `${FN_NAME}() does not capture \`const requestId = ++${TICKET_VAR}\` ` +
        'as its first statement. The ticket must be captured before the ' +
        'identity check / cache lookup so that ANY newer call -- whether it ' +
        "resolves synchronously or via fetch -- invalidates an older call's " +
        'still-pending fetch.',
    )
  }

  for (const statement of REQUIRED_BODY_STATEMENTS) {
    if (!fn.body.includes(statement)) {
      errors.push(
        `${FN_NAME}() no longer contains \`${statement}\`. Without every ` +
          'one of these, a stale (out-of-order) response from the fallback ' +
          'fetch can silently overwrite state.run with data from a run the ' +
          'user is no longer trying to open.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkOpenRunRequestGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder openRun request guard contract failed for ' +
        `${FN_NAME}() in modelBuilderStore.ts:`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Model Builder openRun request guard contract passed: ${FN_NAME}() ` +
      'discards any fallback-fetch response that lands after a newer call ' +
      "has already started, mirroring fetchRuns()' own requestId guard.",
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
