// /utils/scripts/verifyModelBuilderBatchSetFieldConfirmedSuccessGuard.ts
//
// Regression guard (model-builder/t-029) -- batchSetField() is the "Set a
// field on all N" action in the batch editor (model-builder-batch-editor.vue).
// Every other batch entry point that summarizes its own outcome --
// batchDraftField (awaits draftText per item, tallies real `ok` results) and
// batchAutoBuild (awaits autoBuildItem per item, tallies real outcomes) --
// reports its status message only after its async work actually resolves.
// batchSetField was the exception: it called batchPushItems(entries) without
// awaiting it, then *unconditionally* showed a
// `Set ${fieldKey} on ${entries.length}/${items.length} items.` success
// toast the instant the request was fired, before the server had even
// responded.
//
// Concretely: apply a field to a group of 10 items where one item's
// FIELDS_AND_PROMPTS stage was independently approved a moment earlier
// (another tab, or a concurrent autoBuildItem/approveStage call) --
// batchSetField's own client-side isStageEditable check doesn't see that
// yet, so all 10 entries get queued and posted in one batch request. The UI
// immediately shows "Set rarity on 10/10 items." in success (green) tone.
// The server's batch route (items/batch.patch.ts) correctly rejects that one
// entry (assertContentStageEditable) and returns `success: false` (207,
// partial failure) -- batchPushItems' own `.then` branch then fires a
// *second*, unrelated-looking toast: a generic "Failed to save changes."
// error, silently overwriting the false "success" one moments later, with no
// indication of which item(s) never actually persisted. Every item's local
// fieldsDraft/stageStatuses had already been optimistically mutated either
// way.
//
// Fixed by making batchPushItems return Promise<boolean> (the real,
// confirmed outcome) and batchSetField `async`, awaiting that result and
// only showing the success toast when it's actually true -- mirroring
// batchDraftField/batchAutoBuild's own await-then-report shape. On failure,
// batchPushItems' existing run-scoped setStatusForRun(...) call is the only
// message shown, instead of a false success immediately followed by a
// generic failure.
//
// This asserts the textual shape of that fix stays in place: batchSetField()
// is declared `async`, its body awaits `batchPushItems(entries)`, and the
// success toast is gated behind that awaited result rather than firing
// unconditionally right after an un-awaited `batchPushItems(entries)` call.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'batchSetField'

// The pre-fix shape: batchPushItems(entries) fired without `await`, followed
// (with nothing gating it) by the success toast.
const UNAWAITED_FIRE_AND_FORGET =
  /(?<!await\s)batchPushItems\(entries\)\s*\n\s*setStatus\(\s*\n?\s*'success'/

export function checkBatchSetFieldConfirmedSuccessGuard(
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
        "not a confirmed outcome (mirrors batchDraftField/batchAutoBuild's " +
        'own await-then-report shape).',
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

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkBatchSetFieldConfirmedSuccessGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder batchSetField confirmed-success guard contract ' +
        'failed in modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder batchSetField confirmed-success guard contract passed: ' +
      "batchSetField awaits batchPushItems' real result and only reports " +
      'success once the write actually confirms it.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
