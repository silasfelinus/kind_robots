// /utils/scripts/verifyModelBuilderBatchPartialFailureRevertGuard.ts
//
// Regression guard (model-builder/t-029 cycle 9). batchApproveStage() and
// batchSetField() (the "Approve for all N" / "Set a field on all N" actions
// in the batch editor, model-builder-batch-editor.vue) mutate every entry's
// item optimistically BEFORE the batch PATCH is even sent, then call
// batchPushItems(entries) once to persist the whole group in a single
// round-trip. items/batch.patch.ts validates and applies each entry
// independently -- a single failing entry does not abort the others (see its
// own header comment) -- so a real-world failure here is usually *partial*:
// most entries persist, one or two are rejected (e.g. a concurrent edit made
// that specific item's stage no longer editable server-side by the time this
// batch reached it).
//
// Before this fix, batchPushItems only ever returned a plain boolean, so its
// callers could tell "the whole batch failed" from "the whole batch
// succeeded" but had no way to tell WHICH entries, if any, a partial failure
// actually rejected. Every entry's local optimistic mutation stayed in place
// either way -- an earlier fix (see
// verifyModelBuilderBatch{SetField,ApproveStage}ConfirmedSuccessGuard.ts)
// stopped the success TOAST from lying, but the item's own badge/fieldsDraft
// for the specific rejected entry kept silently claiming a change that was
// never actually persisted, with nothing short of a full reload revealing
// the discrepancy -- the same "review gate would be lying about what's
// actually stored" class of bug this codebase treats as a real defect
// everywhere else it's found (see e.g. isStageEditable's own doc comment).
//
// Fixed by having batchPushItems return `{ ok, failedIds }` (see its own doc
// comment in modelBuilderStore.ts) instead of a bare boolean, and both
// callers revert exactly the entries found in failedIds back to a locally
// captured pre-mutation snapshot whenever the batch does not come back fully
// ok.
//
// This asserts the textual shape of that fix stays in place: batchPushItems
// still computes/returns `failedIds`, and each of batchApproveStage /
// batchSetField destructures `{ ok, failedIds }` from the awaited call and
// checks `failedIds.has(entry.item.id)` somewhere in its body to revert the
// rejected entries.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const CALLER_FN_NAMES = ['batchApproveStage', 'batchSetField']

const DESTRUCTURED_RESULT =
  /const\s*\{\s*ok\s*,\s*failedIds\s*\}\s*=\s*await\s+batchPushItems\(\s*entries\s*\)/

const REVERT_BRANCH = /failedIds\.has\(\s*entry\.item\.id\s*\)/

export function checkBatchPartialFailureRevertGuard(
  content: string,
): string[] {
  const errors: string[] = []
  const functions = extractFunctionBodies(content)

  const batchPushItemsFn = functions.find((f) => f.name === 'batchPushItems')
  if (!batchPushItemsFn) {
    errors.push(
      'Could not find a function named batchPushItems() -- has it been ' +
        'renamed, removed, or inlined? If so, this guard (and the bug it ' +
        'protects against) needs to move with it.',
    )
  } else if (!/failedIds/.test(batchPushItemsFn.body)) {
    errors.push(
      'batchPushItems() no longer computes/returns failedIds -- without a ' +
        'per-entry breakdown, its callers cannot tell which entries a ' +
        'partial batch failure actually rejected, and are forced back to ' +
        'either reverting every entry (discarding ones that DID persist) ' +
        'or none (leaving the genuinely rejected entries silently showing ' +
        'an unpersisted optimistic change).',
    )
  }

  for (const fnName of CALLER_FN_NAMES) {
    const fn = functions.find((f) => f.name === fnName)
    if (!fn) {
      errors.push(
        `Could not find a function named ${fnName}() -- has it been ` +
          'renamed, removed, or inlined? If so, this guard (and the bug it ' +
          'protects against) needs to move with it.',
      )
      continue
    }

    if (!DESTRUCTURED_RESULT.test(fn.body)) {
      errors.push(
        `${fnName}() no longer destructures \`const { ok, failedIds } = ` +
          'await batchPushItems(entries)` -- without `failedIds`, a ' +
          'partial server-side rejection can no longer be told apart from ' +
          'a fully-successful batch, and the entries the server actually ' +
          'rejected have nothing left to revert their optimistic change.',
      )
    }

    if (!REVERT_BRANCH.test(fn.body)) {
      errors.push(
        `${fnName}() no longer checks \`failedIds.has(entry.item.id)\` -- ` +
          'a partial batch failure used to (and, without this check, would ' +
          'again) leave every entry -- including the ones the server ' +
          'actually rejected -- showing its optimistic local change ' +
          'forever, with nothing short of a full reload revealing the ' +
          'discrepancy.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkBatchPartialFailureRevertGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder batch partial-failure revert guard contract failed in ' +
        'modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder batch partial-failure revert guard contract passed: ' +
      'batchPushItems reports per-entry failedIds, and both ' +
      'batchApproveStage/batchSetField revert exactly the entries the ' +
      'server actually rejected instead of leaving them showing an ' +
      'unpersisted optimistic change.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
