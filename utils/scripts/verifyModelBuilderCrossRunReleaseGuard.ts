// /utils/scripts/verifyModelBuilderCrossRunReleaseGuard.ts
//
// Regression guard (model-builder/t-029, cycle 75) -- autoBuildRun() and the
// four group batch operations (batchDraftField/batchSetField/
// batchApproveStage/batchAutoBuild) each capture a `runId` up front so their
// per-item loop and completion toast can tell "the user switched to a
// different run via History mid-pass" apart from "still the same run" (see
// verifyModelBuilderAutoBuildBatchExclusionGuard.ts and the runId doc
// comments in the store itself) -- but until this cycle, that same runId was
// never checked before each function's own `finally` block cleared its
// store-wide "in flight" flag.
//
// openRun()/resetRun()/resetAll() already clear state.autoBuilding and
// state.batchingOutputKey the instant the user switches away, precisely so a
// *new* operation on the newly-active run isn't blocked by an abandoned one.
// But an abandoned call's own `finally` still runs later, when its last
// awaited autoBuildItem()/batchPushItems() call finally settles -- and if the
// user has since started a genuinely new operation on the new run before
// that happens, the abandoned call's unconditional clear/release silently
// stomps the NEW operation's own in-flight flag back to false/null while it
// is still genuinely running. For batchingOutputSingleton specifically this
// is a real cross-run collision, not just a same-run one:
// createOwnedSingleton's release(value) only checks that the VALUE still
// matches, and output keys ("characters", "rewards", ...) are recipe-level
// names reused across many different runs, so an abandoned call for Run A's
// "rewards" group can release Run B's unrelated, still-running "rewards"
// batch the moment they share that name. Either way, the busy indicator
// clears while a real operation is still in flight, reopening the exact
// double-invocation race isRunOperationInFlight()/anyBatching exist to
// prevent.
//
// Fixed by guarding each function's own flag clear/release with
// `if (state.run?.id === runId) ...` -- the same check each function's
// completion-toast branch already used. This guard asserts that guard stays
// in the `finally` block of all five functions: if a future refactor reverts
// any one of them to an unconditional clear/release, this fails loudly
// rather than silently reopening the race for just that entry point.
//
// Cycle 76 strengthened this same guard with an additional `runEpoch`
// condition (a run id alone can't tell "still the same continuous session on
// this run" apart from "abandoned this run, then later revisited the same
// run id" -- see runEpoch's own doc comment in the store and
// verifyModelBuilderRunEpochGuard.ts, which asserts that stronger shape
// specifically). This guard only checks that the run-id half of the
// condition is still present -- it deliberately does not care whether an
// `&& runEpoch === epoch` clause has been added alongside it, so it keeps
// working unchanged as a baseline regardless of which cycle's fix shape is
// currently in place.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

// Deliberately not anchored to an immediately-following `)` -- cycle 76's
// `&& runEpoch === epoch` addition (see the doc comment above) puts other
// text between `runId` and the closing paren, and this guard only cares
// that the run-id half of the condition is still present somewhere in the
// `if (...)` guarding the clear/release.
const RUN_ID_GUARD = /if\s*\(\s*state\.run\?\.id\s*===\s*runId/

const BATCH_FUNCTIONS = [
  'batchDraftField',
  'batchSetField',
  'batchApproveStage',
  'batchAutoBuild',
] as const

// Checks the fix's exact shape against the full source text of a file
// containing autoBuildRun/batchXxx-named functions. Exported (rather than
// only exercised via main()) so the self-test below can run it against
// synthetic buggy/fixed fixtures without touching the real store file.
export function checkCrossRunReleaseGuard(content: string): string[] {
  const errors: string[] = []
  const functions = extractFunctionBodies(content)

  const runFn = functions.find((f) => f.name === 'autoBuildRun')
  if (!runFn) {
    errors.push(
      'Could not find a function named autoBuildRun() -- has it been ' +
        'renamed, removed, or inlined? If so, this guard (and the fix it ' +
        'protects) needs to move with it.',
    )
  } else {
    const finallyMatch = /finally\s*\{([\s\S]*?)\n {4}\}/.exec(runFn.body)
    const finallyBody = finallyMatch?.[1] ?? ''
    if (!/state\.autoBuilding\s*=\s*false/.test(finallyBody)) {
      errors.push(
        'autoBuildRun() no longer clears state.autoBuilding in its ' +
          'finally block at all -- has the cleanup been moved or renamed?',
      )
    } else if (!RUN_ID_GUARD.test(finallyBody)) {
      errors.push(
        "autoBuildRun()'s finally block clears state.autoBuilding " +
          'without first checking `state.run?.id === runId` -- an ' +
          'abandoned call for a run the user has since switched away ' +
          'from can clear a brand-new autoBuildRun()/batchAutoBuild() ' +
          "call's own in-flight flag out from under it the moment the " +
          'abandoned call finally settles.',
      )
    }
  }

  for (const name of BATCH_FUNCTIONS) {
    const fn = functions.find((f) => f.name === name)
    if (!fn) {
      errors.push(
        `Could not find a function named ${name}() -- has it been ` +
          'renamed, removed, or inlined? If so, this guard (and the fix ' +
          'it protects) needs to move with it.',
      )
      continue
    }
    const finallyMatch = /finally\s*\{([\s\S]*?)\n {4}\}/.exec(fn.body)
    const finallyBody = finallyMatch?.[1] ?? ''
    if (!/batchingOutputSingleton\.release\(outputKey\)/.test(finallyBody)) {
      errors.push(
        `${name}() no longer releases batchingOutputSingleton in its ` +
          'finally block at all -- has the cleanup been moved or renamed?',
      )
    } else if (!RUN_ID_GUARD.test(finallyBody)) {
      errors.push(
        `${name}()'s finally block releases batchingOutputSingleton ` +
          'without first checking `state.run?.id === runId` -- an ' +
          'abandoned call for a run the user has since switched away ' +
          "from can release a brand-new same-outputKey batch call's " +
          'own in-flight claim out from under it the moment the ' +
          'abandoned call finally settles (output keys are recipe-level ' +
          'names reused across many different runs, so this is a real ' +
          'cross-run collision, not just a same-run one).',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkCrossRunReleaseGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder cross-run release guard contract failed in ' +
        'modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder cross-run release guard contract passed: ' +
      'autoBuildRun() and every group batch operation only clear/release ' +
      'their own in-flight flag when the active run is still the one the ' +
      'call started for.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
