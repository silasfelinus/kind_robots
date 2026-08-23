// /utils/scripts/verifyModelBuilderResumeRunRequestGuard.ts
//
// Regression guard (model-builder/t-029, cycle 59) -- resumeRun() had no
// request-scoping at all, unlike openRun()/fetchRuns()/loadSources() in this
// same file, which each guard the identical class of bug (an async
// list/record fetch whose response can land out of order) by capturing a
// ticket up front and discarding any response that arrives after state has
// moved on.
//
// Concrete repro: resumeRun() only ever fires from model-builder-manager.
// vue's onMounted, but that component remounts on every navigation away
// from and back to the Model Builder page (no keep-alive anywhere in this
// app), and unmounting a component does not cancel its in-flight promises.
// Navigate away, then back before the first mount's resumeRun() resolves --
// its `resumingRun` gate is a per-mount ref, so it does not block the
// SECOND mount's own UI once that call resolves. If the second call
// finishes first and the user starts a genuinely different run
// (resetRun()/openRun()) before the first, now very stale, call finally
// resolves, that stale call's `data` -- fetched for whatever run WAS
// remembered/latest back when it started -- lands on top of the user's new
// run: the "adopt a different run" branch unconditionally overwrites
// state.run and clears every in-flight singleton, exactly the class of bug
// openRun()/fetchRuns()/loadSources() are each already guarded against.
//
// Fixed by a monotonic request ticket (`resumeRunRequestId`), the same
// pattern as openRunRequestId: captured as `requestId` at the very top of
// every call, and checked after each of resumeRun()'s two sequential
// performFetch calls before applying (or acting on) their response.
//
// This asserts the textual shape of that fix stays in place -- deliberately
// scoped to this one function/bug, mirroring
// verifyModelBuilderOpenRunRequestGuard.ts's identical pattern for its
// sibling function.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'resumeRun'
const TICKET_VAR = 'resumeRunRequestId'

const REQUIRED_BODY_STATEMENTS = [
  `const requestId = ++${TICKET_VAR}`,
  `if (${TICKET_VAR} !== requestId) return`,
]

// Checks the fix's exact shape against the full source text of a file
// containing a `resumeRun`-named function. Exported (rather than only
// exercised via main()) so the self-test below can run it against synthetic
// buggy/fixed fixtures without touching the real store file.
export function checkResumeRunRequestGuard(content: string): string[] {
  const errors: string[] = []

  if (!new RegExp(`let ${TICKET_VAR}\\s*=\\s*0`).test(content)) {
    errors.push(
      `Could not find \`let ${TICKET_VAR} = 0\` -- resumeRun() needs a ` +
        'closure-scoped request ticket to tell a stale performFetch ' +
        'response apart from the latest one, the same pattern ' +
        'openRunRequestId already uses for openRun().',
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
        `${staleChecks} time(s) -- both sequential performFetch calls (the ` +
        'remembered-run lookup and the latest-run fallback) must bail out ' +
        'on a stale response, or a slower, older resumeRun() call (e.g. ' +
        'from a component remount) can still overwrite state.run with a ' +
        'different run after a newer call already resolved and the user ' +
        'moved on.',
    )
  }

  if (!fn.body.trimStart().startsWith(`const requestId = ++${TICKET_VAR}`)) {
    errors.push(
      `${FN_NAME}() does not capture \`const requestId = ++${TICKET_VAR}\` ` +
        'as its first statement. The ticket must be captured before either ' +
        'performFetch call so that ANY newer call always invalidates an ' +
        "older call's still-pending fetches.",
    )
  }

  for (const statement of REQUIRED_BODY_STATEMENTS) {
    if (!fn.body.includes(statement)) {
      errors.push(
        `${FN_NAME}() no longer contains \`${statement}\`. Without every ` +
          'one of these, a stale (out-of-order) response from either fetch ' +
          'can silently overwrite state.run with data for a run the user ' +
          'is no longer looking at.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkResumeRunRequestGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder resumeRun request guard contract failed for ' +
        `${FN_NAME}() in modelBuilderStore.ts:`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Model Builder resumeRun request guard contract passed: ${FN_NAME}() ` +
      'discards any performFetch response that lands after a newer call ' +
      "has already started, mirroring openRun()'s own requestId guard.",
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
