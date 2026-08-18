// /utils/scripts/verifyModelBuilderBatchApproveStageConfirmedSuccessGuard.ts
//
// Regression guard (model-builder/t-029) -- batchApproveStage() is the
// "Approve fields for all N" action in the batch editor
// (model-builder-batch-editor.vue). It's the same shape of bug the
// confirmed-outcome-before-toast meta-guard (verifyModelBuilderConfirmedOutcomeGuard.ts,
// t-042) deliberately does NOT catch: that meta-guard excludes any `void`
// -returning helper (pushItem, approveStage, ...) on the theory that a
// caller reporting success right after firing one is usually reporting on
// separately-confirmed local work (e.g. generateItemAsset's toast reports
// the *render* succeeding, with pushItem persisting it alongside as a
// best-effort background write). batchApproveStage doesn't fit that
// exception: "approved" has no meaning other than "persisted" -- there's no
// separate local accomplishment being confirmed the way a rendered asset is.
//
// The pre-fix shape called the single-item approveStage (whose own pushItem
// is a fire-and-forget background PATCH) in a loop and *unconditionally*
// showed an `Approved ${stageKey} for ${approved} items.` success toast the
// instant the loop finished, before any of those N background writes had
// resolved. Concretely: approve a stage on a group of 10 items while the run
// gets cancelled in another tab (or any other server-side rejection, e.g.
// assertRunWritable) mid-loop -- the UI immediately shows "Approved
// FIELDS_AND_PROMPTS for 10 items." in success (green) tone, then each
// pushItem's own unrelated-looking "Failed to save changes." error toast
// silently overwrites it moments later, one at a time, with no indication of
// which item(s) never actually persisted. Every item's local stageStatuses
// had already been optimistically flipped to 'approved' either way.
//
// Fixed exactly like its sibling batchSetField
// (verifyModelBuilderBatchSetFieldConfirmedSuccessGuard.ts): collect entries
// and post them in a single batchPushItems(entries) call, make
// batchApproveStage `async`, await that real result, and only show the
// success toast when it's actually true -- mirroring
// batchDraftField/batchAutoBuild/batchSetField's own await-then-report
// shape. On failure, batchPushItems' existing run-scoped setStatusForRun(...)
// call is the only message shown, instead of a false success immediately
// followed by a generic failure.
//
// This asserts the textual shape of that fix stays in place: batchApproveStage()
// is declared `async`, its body awaits `batchPushItems(entries)`, and the
// success toast is gated behind that awaited result rather than firing
// unconditionally right after an un-awaited `batchPushItems(entries)` call
// (or, regressing back to the original bug shape, right after a bare loop of
// un-awaited `approveStage(...)` calls).
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'batchApproveStage'

// The pre-fix shape: batchPushItems(entries) fired without `await`, followed
// (with nothing gating it) by the success toast.
const UNAWAITED_FIRE_AND_FORGET =
  /(?<!await\s)batchPushItems\(entries\)\s*\n\s*setStatus\(\s*\n?\s*'success'/

// The original pre-fix shape: a bare, un-awaited `approveStage(...)` call
// inside a loop, with an unconditional success toast right after the loop.
const LOOPED_FIRE_AND_FORGET_APPROVE = /^[ \t]*approveStage\(/m

export function checkBatchApproveStageConfirmedSuccessGuard(
  content: string,
): string[] {
  const errors: string[] = []
  const functions = extractFunctionBodies(content)
  const fn = functions.find((f) => f.name === FN_NAME)

  if (!fn) {
    errors.push(
      `Could not find a function named ${FN_NAME}() -- has it been ` +
        'renamed, removed, or inlined? If so, this guard (and the bug it ' +
        'protects against) needs to move with it.',
    )
    return errors
  }

  if (!fn.isAsync) {
    errors.push(
      `${FN_NAME}() is no longer declared \`async\` -- without it, it ` +
        "can't await batchPushItems' real result before reporting its own " +
        'success/failure toast.',
    )
  }

  if (!/await\s+batchPushItems\(\s*entries\s*\)/.test(fn.body)) {
    errors.push(
      `${FN_NAME}() no longer awaits \`batchPushItems(entries)\` -- ` +
        'without awaiting the real result, any success message it shows ' +
        'is just an assumption made the instant the request was issued, ' +
        "not a confirmed outcome (mirrors batchSetField's own " +
        'await-then-report shape).',
    )
  }

  if (UNAWAITED_FIRE_AND_FORGET.test(fn.body)) {
    errors.push(
      `${FN_NAME}() still fires batchPushItems(entries) without awaiting ` +
        'it and unconditionally reports a success toast right after -- a ' +
        'partial or total server-side failure will still show that false ' +
        "success message before batchPushItems' own error toast silently " +
        'overwrites it moments later.',
    )
  }

  if (LOOPED_FIRE_AND_FORGET_APPROVE.test(fn.body)) {
    errors.push(
      `${FN_NAME}() has regressed to the original pre-fix shape -- a bare ` +
        'call to the single-item approveStage(...) (whose own pushItem is ' +
        'fire-and-forget) inside its loop, rather than collecting entries ' +
        'and awaiting a single batchPushItems(entries) call. approveStage ' +
        "is fine for item-panel.vue's single-item flow (no aggregate " +
        'success message to falsely confirm), but reintroducing it here ' +
        'brings back the exact race this guard exists to catch.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkBatchApproveStageConfirmedSuccessGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder batchApproveStage confirmed-success guard contract ' +
        'failed in modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder batchApproveStage confirmed-success guard contract ' +
      "passed: batchApproveStage awaits batchPushItems' real result and " +
      'only reports success once the write actually confirms it.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
