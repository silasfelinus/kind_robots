// /utils/scripts/verifyModelBuilderCancelRunPollGuard.ts
//
// Regression guard (model-builder/t-029, kaizen) -- cancelRun()'s
// poll-stopping step picked at most ONE of state.runs' and state.run's
// object instances for a cancelled run id via `??`, then nulled
// artJobId/queueState only on that one. adaptRun/adaptItem never memoize,
// so state.runs (populated independently by fetchRuns(), e.g. when the
// History panel mounts) and state.run (the currently open run) can each
// hold a *different* object instance for the same run id at the same time.
// pollAsyncArtJob's while loop holds a closure reference to whichever item
// object was live in state.run when generateItemAssetAsync queued the job
// -- so if `??` picked the state.runs copy (because both existed), the poll
// keeps running against state.run's untouched original, defeating the
// "clearing artJobId makes the loop exit at its next check" mechanism the
// surrounding comment describes. Concretely: queue an async render, open
// the History panel (populates state.runs), cancel that same run from
// there -- the poll silently keeps hitting the ArtJob-status endpoint every
// ASYNC_ART_POLL_MS for as long as the render takes, well past cancellation.
//
// Fixed by clearing artJobId/queueState on every matching copy found across
// both state.runs and state.run, not just whichever `??` happened to pick.
//
// This asserts the textual shape of that fix stays in place: cancelRun's
// body no longer uses `??` to select a single cancelledRun between
// state.runs and state.run, and instead nulls items on each copy that
// exists.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'cancelRun'
const SINGLE_PICK_PATTERN =
  /\?\?\s*\(\s*state\.run\?\.id\s*===\s*runId\s*\?\s*state\.run\s*:\s*null\s*\)/
const RUNS_LOOKUP =
  /state\.runs\.find\(\s*\(entry\)\s*=>\s*entry\.id\s*===\s*runId\s*\)/
const RUN_LOOKUP = /state\.run\?\.id\s*===\s*runId\s*\?\s*state\.run\s*:\s*null/

export function checkCancelRunPollGuard(content: string): string[] {
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

  if (SINGLE_PICK_PATTERN.test(fn.body)) {
    errors.push(
      `${FN_NAME}() picks at most one of the state.runs / state.run ` +
        'copies of the cancelled run via `??` before nulling artJobId/' +
        'queueState. adaptRun/adaptItem never memoize, so these can be ' +
        'distinct object instances for the same run id -- clearing only ' +
        "one leaves pollAsyncArtJob's closure over the other copy's item " +
        'orphaned and polling indefinitely after cancellation.',
    )
    return errors
  }

  const hasRunsLookup = RUNS_LOOKUP.test(fn.body)
  const hasRunLookup = RUN_LOOKUP.test(fn.body)
  if (!hasRunsLookup || !hasRunLookup) {
    errors.push(
      `${FN_NAME}() no longer looks up the cancelled run independently in ` +
        "both state.runs and state.run -- this guard's anchor points have " +
        'moved; re-check how the poll-stopping copies are resolved.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkCancelRunPollGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder cancel-run poll guard contract failed for ' +
        `${FN_NAME}() in modelBuilderStore.ts:`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder cancel-run poll guard contract passed: ' +
      `${FN_NAME}() clears artJobId/queueState on every matching copy of ` +
      'the cancelled run across state.runs and state.run, not just ' +
      'whichever one a `??` pick happened to select.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
