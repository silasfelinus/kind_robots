// /utils/scripts/verifyModelBuilderFetchRunsStalenessGuard.ts
//
// Regression guard (model-builder/t-029) -- fetchRuns() re-fires on every
// mount of model-builder-run-history.vue (onMounted) and on its "Refresh"
// button. loadSources() in this same file guards the identical class of bug
// -- an async list-fetch whose response can land out of order -- by
// capturing `requestedType` up front and discarding any response that
// arrives after state has moved on. fetchRuns() had no equivalent: it
// unconditionally applied whatever response landed most recently in wall-
// clock time, not whichever was actually the most recently REQUESTED.
//
// Concrete repro: open the History panel (fetchRuns call A starts), close it
// (an ordinary click -- model-builder-manager.vue's `showHistory` toggle
// unmounts the panel but does not cancel the in-flight request), reopen it
// (fetchRuns call B starts, mounts a fresh instance). If call B's response
// lands first (plausible network variance -- nothing orders these two
// requests), the panel correctly renders the current list. If call A's
// slower response then lands, it unconditionally overwrites state.runs with
// its older snapshot: a run cancelled in the interim reappears (clobbering
// cancelRun's own `state.runs = state.runs.filter(...)`), a run created in
// the interim vanishes, and `state.loadingRuns` can flip back to false while
// a *third*, still-in-flight call is the one that should own the spinner.
//
// Fixed by a monotonic request ticket (`fetchRunsRequestId`), the same
// pattern as loadSources' requestedType: capture it as `requestId` at the
// top of the call, and bail out of the success/catch branches (and skip
// clearing loadingRuns in `finally`) if a newer call has since started.
//
// This asserts the textual shape of that fix stays in place -- deliberately
// scoped to this one function/bug, mirroring
// verifyModelBuilderResetAllGuard.ts's preference for explicit, narrow
// textual checks over a general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'fetchRuns'
const TICKET_VAR = 'fetchRunsRequestId'

const REQUIRED_BODY_STATEMENTS = [
  `const requestId = ++${TICKET_VAR}`,
  `if (${TICKET_VAR} !== requestId) return`,
  `if (${TICKET_VAR} === requestId) state.loadingRuns = false`,
]

// Checks the fix's exact shape against the full source text of a file
// containing a `fetchRuns`-named function. Exported (rather than only
// exercised via main()) so the self-test below can run it against synthetic
// buggy/fixed fixtures without touching the real store file.
export function checkFetchRunsStalenessGuard(content: string): string[] {
  const errors: string[] = []

  if (!new RegExp(`let ${TICKET_VAR}\\s*=\\s*0`).test(content)) {
    errors.push(
      `Could not find \`let ${TICKET_VAR} = 0\` -- fetchRuns() needs a ` +
        'closure-scoped request ticket to tell a stale response apart from ' +
        'the latest one, the same pattern loadSources() already uses via ' +
        '`requestedType`.',
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
        'an older, slower call can still overwrite state.runs with outdated ' +
        'data after a newer call already rendered the current list.',
    )
  }

  for (const statement of REQUIRED_BODY_STATEMENTS) {
    if (!fn.body.includes(statement)) {
      errors.push(
        `${FN_NAME}() no longer contains \`${statement}\`. Without every ` +
          'one of these, a stale (out-of-order) response can silently ' +
          'overwrite state.runs or state.loadingRuns with data from a ' +
          'call that is no longer the most recently issued one.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkFetchRunsStalenessGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder fetchRuns staleness guard contract failed for ' +
        `${FN_NAME}() in modelBuilderStore.ts:`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Model Builder fetchRuns staleness guard contract passed: ${FN_NAME}() ` +
      'discards any response that lands after a newer call has already ' +
      'started, mirroring loadSources() own requestedType guard.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
