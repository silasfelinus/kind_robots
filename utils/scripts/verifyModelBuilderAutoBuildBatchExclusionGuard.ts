// /utils/scripts/verifyModelBuilderAutoBuildBatchExclusionGuard.ts
//
// Regression guard (model-builder/t-029, cycle 25) -- autoBuildRun()
// (whole-run "Auto-build all") and the four group batch operations
// (batchDraftField/batchSetField/batchApproveStage/batchAutoBuild, driven by
// model-builder-batch-editor.vue's "Draft pitches/fields/prompts", "Approve
// fields", and "Auto-build group" buttons) each track their own
// store-wide "in flight" flag -- state.autoBuilding vs
// state.batchingOutputKey -- and neither checked the other before this fix,
// at either the store-function level or the UI button level
// (model-builder-progress-matrix.vue's "Auto-build all" button only
// disabled on store.autoBuilding; model-builder-batch-editor.vue's action
// buttons only disabled on anyBatching, itself scoped to
// store.batchingOutputKey).
//
// A user could click "Auto-build all" while a group's batch operation was
// still running for that same run (or the reverse: start a batch action
// while "Auto-build all" was already walking the run), and both entry
// points loop sequentially over the run's items, awaiting each item's own
// draftText/generateItemAsset/commitItem calls in turn. Starting two of
// these loops at once lets them interleave: two *different* items in the
// same run can end up mid-draft/mid-generate/mid-commit at the same instant
// via two independent orchestration passes -- exactly the race class
// isItemManualActionInFlight and anyBatching's own gate already exist to
// prevent for a single item or two group batch operations, just never
// extended to these two sibling whole-run/group entry points recognizing
// each other. (autoBuildItem's own autoBuildingItemSingleton only protects
// the exact same item id from double-processing at a given instant, and
// only weakly -- see createOwnedSingleton's own doc comment -- it does
// nothing for two *different* items being driven by two concurrent loops.)
//
// Fixed with a shared isRunOperationInFlight() helper
// (`state.autoBuilding || state.batchingOutputKey !== null`), used in
// autoBuildRun()'s own entry guard, plus an explicit
// `if (state.autoBuilding) return` added to each of the four batch
// functions (kept as a separate literal check rather than reusing the
// helper there, since a batch function checking its OWN flag too would
// change existing same-flag re-entrancy semantics that are out of scope for
// this fix). This guard asserts both halves of that fix stay in place:
// if a future refactor drops either side, the two orchestration loops can
// run concurrently again with no error and no warning until a user
// happens to trigger both from the UI at once.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const BATCH_FUNCTIONS = [
  'batchDraftField',
  'batchSetField',
  'batchApproveStage',
  'batchAutoBuild',
] as const

// Checks the fix's exact shape against the full source text of a file
// containing isRunOperationInFlight/autoBuildRun/batchXxx-named functions.
// Exported (rather than only exercised via main()) so the self-test below
// can run it against synthetic buggy/fixed fixtures without touching the
// real store file.
export function checkAutoBuildBatchExclusionGuard(content: string): string[] {
  const errors: string[] = []
  const functions = extractFunctionBodies(content)

  const helperFn = functions.find((f) => f.name === 'isRunOperationInFlight')
  if (!helperFn) {
    errors.push(
      'Could not find a function named isRunOperationInFlight() -- has it ' +
        'been renamed, removed, or inlined? If so, this guard (and the ' +
        'shared whole-run/batch mutual-exclusion check it protects) needs ' +
        'to move with it.',
    )
  } else {
    if (!/state\.autoBuilding/.test(helperFn.body)) {
      errors.push(
        'isRunOperationInFlight() does not check state.autoBuilding -- a ' +
          'group batch operation could start while a whole-run auto-build ' +
          'is still in progress.',
      )
    }
    if (!/state\.batchingOutputKey\s*!==\s*null/.test(helperFn.body)) {
      errors.push(
        'isRunOperationInFlight() does not check ' +
          'state.batchingOutputKey !== null -- a whole-run auto-build ' +
          'could start while a group batch operation is still in progress.',
      )
    }
  }

  const runFn = functions.find((f) => f.name === 'autoBuildRun')
  if (!runFn) {
    errors.push(
      'Could not find a function named autoBuildRun() -- has it been ' +
        'renamed, removed, or inlined? If so, this guard (and the fix it ' +
        'protects) needs to move with it.',
    )
  } else if (!/isRunOperationInFlight\(\)/.test(runFn.body)) {
    errors.push(
      'autoBuildRun() does not check isRunOperationInFlight() in its ' +
        'entry guard -- a group batch operation already running for this ' +
        'run (batchDraftField/batchSetField/batchApproveStage/' +
        'batchAutoBuild) no longer blocks "Auto-build all" from starting ' +
        "a second, fully concurrent walk over the same run's items.",
    )
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
    if (!/if\s*\(\s*state\.autoBuilding\s*\)\s*return/.test(fn.body)) {
      errors.push(
        `${name}() does not bail out early when state.autoBuilding is ` +
          'true (expected something like `if (state.autoBuilding) ' +
          'return`) -- a whole-run "Auto-build all" already in progress ' +
          `no longer blocks ${name}() from starting a second, fully ` +
          "concurrent walk over the same run's items.",
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkAutoBuildBatchExclusionGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder auto-build/batch mutual-exclusion guard contract ' +
        'failed in modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder auto-build/batch mutual-exclusion guard contract ' +
      'passed: autoBuildRun() refuses to start while a group batch ' +
      'operation is in flight, and every group batch operation refuses to ' +
      'start while a whole-run auto-build is in flight.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
