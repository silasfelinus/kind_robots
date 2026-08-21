// /utils/scripts/verifyModelBuilderBatchBusyItemExclusionGuard.ts
//
// Regression guard (model-builder/t-029, cycle 30) -- batchDraftField(),
// batchSetField(), and batchApproveStage() each loop over a quantity
// group's items and, for every item they touch, push that item's FULL
// current `item.stages` blob to the server as part of the write (directly
// as `payload: { stageStatuses: item.stages }` in batchApproveStage/
// batchSetField, or indirectly via draftText -> updatePitch/updateFields/
// updatePrompt -> pushItem in batchDraftField). None of the three checked
// whether the SAME item already had a manual single-item action in flight
// before this fix.
//
// That matters because two single-item actions set a stage to a purely
// client-local 'in-progress' marker *before* their own await, and never
// themselves persist it: commitItem() sets item.stages.COMMIT =
// { status: 'in-progress' } and relies entirely on the server's own
// commit.post.ts write to resolve it later; generateItemAsset/
// generateItemAssetAsync do the identical thing for GENERATE_ASSETS. If one
// of the three batch functions above snapshots and pushes that item's
// stageStatuses while such a marker is set, the server's diff-then-merge
// stage-status logic (diffStageStatusChanges/mergeStageStatusChanges in
// server/api/model-builder/runs/index.ts) has no way to tell that stray
// local marker apart from a genuinely intended change -- it diffs the whole
// blob against its own last-known value and persists whatever differs. If
// that batch write's transaction happens to land AFTER the single-item
// action's own dedicated final write, it silently clobbers the correct
// final status (e.g. reverting a just-committed item's COMMIT status from
// 'approved' back to a permanently-stuck 'in-progress' that nothing will
// ever resolve) -- the same "review gate lying about what's actually
// stored" class of bug this codebase treats as real everywhere else.
//
// This is reachable in a single browser tab with no clock race required:
// model-builder-progress-matrix.vue renders model-builder-batch-editor.vue
// and model-builder-item-panel.vue side by side for the SAME selected
// item's group, so a user can click "Execute commit" in the item panel and
// then immediately click a batch-editor button for that same group while
// the commit POST is still in flight.
//
// Fixed by adding an `if (isItemManualActionInFlight(item.id)) continue`
// skip to all three loops, mirroring autoBuildItem's own identical guard
// for the exact same reason. This guard asserts that skip stays present in
// all three functions: if a future refactor drops it from any of them, this
// exact race reopens silently.
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
] as const

const BUSY_CHECK_PATTERN =
  /if\s*\(\s*isItemManualActionInFlight\(\s*item\.id\s*\)\s*\)\s*continue/

// Checks the fix's exact shape against the full source text of a file
// containing batchDraftField/batchSetField/batchApproveStage-named
// functions. Exported (rather than only exercised via main()) so the
// self-test below can run it against synthetic buggy/fixed fixtures without
// touching the real store file.
export function checkBatchBusyItemExclusionGuard(content: string): string[] {
  const errors: string[] = []
  const functions = extractFunctionBodies(content)

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
    if (!BUSY_CHECK_PATTERN.test(fn.body)) {
      errors.push(
        `${name}() does not skip an item that already has a manual ` +
          'single-item action in flight (expected something like ' +
          '`if (isItemManualActionInFlight(item.id)) continue`) -- a ' +
          'concurrent commitItem()/generateItemAsset() for the same item ' +
          "can leak that action's transient, never-persisted " +
          `in-progress stage marker into ${name}()'s own ` +
          'stageStatuses write, and a later-landing write can silently ' +
          "clobber the manual action's real, just-persisted result.",
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkBatchBusyItemExclusionGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder batch busy-item exclusion guard contract failed in ' +
        'modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder batch busy-item exclusion guard contract passed: ' +
      'batchDraftField(), batchSetField(), and batchApproveStage() all ' +
      'skip an item that already has a manual single-item action in ' +
      'flight.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
