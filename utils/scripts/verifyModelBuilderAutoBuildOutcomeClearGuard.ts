// /utils/scripts/verifyModelBuilderAutoBuildOutcomeClearGuard.ts
//
// Regression guard (model-builder/t-029, cycle 41, found by inspection).
// model-builder-progress-matrix.vue's and model-builder-batch-editor.vue's
// own autoBuildFailed() render a per-item "failed" badge (a red warning icon
// plus a summary badge) whenever
// `item.lastAutoBuildOutcome === 'failed' || Boolean(item.error)` and the
// item isn't COMMIT-approved yet. lastAutoBuildOutcome is written ONLY by
// autoBuildRun()/batchAutoBuild() (see
// verifyModelBuilderAutoBuildOutcomePersistenceGuard.ts for why that field
// exists) and, before this fix, was never cleared anywhere else in this
// file -- not by updatePitch/updateFields/updatePrompt (which already clear
// the sibling item.error the moment the user edits or AI-redrafts a field,
// specifically to avoid "a confusing asymmetry" between the two repair
// paths -- see updatePitch's own doc comment), not by generateItemAsset/
// generateItemAssetAsync's own optimistic `item.error = null` at the start
// of a fresh render, and not by commitItem's identical optimistic clear.
//
// Concrete repro: run "Auto-build all" on a run where one item's
// FIELDS_AND_PROMPTS AI draft fails (a transient text-server hiccup is
// enough) -- autoBuildRun sets that item's lastAutoBuildOutcome = 'failed'
// and item.error to the failure message, and the row in model-builder-
// progress-matrix.vue correctly shows the red warning icon with a "failed"
// summary badge. The user then opens the item and either types the fields
// by hand or clicks "Draft with AI" again and it succeeds -- either path
// routes through updateFields (draftText's own success path calls it too),
// which clears item.error (the item panel's error banner correctly
// disappears) but left lastAutoBuildOutcome sitting at 'failed' with
// nothing to ever clear it short of a full COMMIT or another whole
// auto-build/batch pass. The progress-matrix row and batch-editor badge
// kept flashing "failed" for an item the user was actively, successfully
// fixing -- exactly the "badge lying about what's actually stored" class of
// bug this codebase treats as real everywhere else it's found, just reached
// through the newer lastAutoBuildOutcome field instead of stageStatuses/
// error itself.
//
// Fixed by clearing `item.lastAutoBuildOutcome = null` at every point that
// already clears (or reverts) `item.error` as part of a fresh attempt or
// manual/AI fix: updatePitch, updateFields, updatePrompt (both the
// optimistic clear and its onFailure revert), and the optimistic clear at
// the start of generateItemAsset, generateItemAssetAsync, and commitItem.
//
// This walks each target function in modelBuilderStore.ts and requires its
// body to contain at least one `item.lastAutoBuildOutcome = null` (or, for
// the three setters' revert closures, a matching
// `previousLastAutoBuildOutcome` snapshot/restore pair) -- i.e. that the
// function actually clears the stale outcome somewhere, on some path,
// mirroring verifyModelBuilderErrorPersistenceGuard.ts's own presence-check
// style rather than proving every single branch does it.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

// The three manual/AI-edit setters also need a snapshot/restore pair around
// their optimistic clear, mirroring how they already snapshot/restore
// item.error on a failed PATCH -- otherwise a rejected write would leave the
// outcome permanently cleared even though the edit itself never persisted.
const SETTER_FUNCTIONS = [
  'updatePitch',
  'updateFields',
  'updatePrompt',
] as const

// generateItemAsset/generateItemAssetAsync/commitItem only need the
// optimistic clear at the start of a fresh attempt -- there is no revert
// path for these (a failed attempt re-sets item.error again in its own
// catch block, which the badge's `Boolean(item.error)` half already
// re-flags correctly with no help from lastAutoBuildOutcome).
const RETRY_FUNCTIONS = [
  'generateItemAsset',
  'generateItemAssetAsync',
  'commitItem',
] as const

const CLEARS_OUTCOME = /item\.lastAutoBuildOutcome\s*=\s*null\b/
const SNAPSHOTS_OUTCOME =
  /const previousLastAutoBuildOutcome\s*=\s*item\.lastAutoBuildOutcome\b/
const RESTORES_OUTCOME =
  /item\.lastAutoBuildOutcome\s*=\s*previousLastAutoBuildOutcome\b/

// Checks the fix's exact shape against the full source text of a file
// containing these function names. Exported so the self-test below can run
// it against synthetic buggy/fixed fixtures without touching the real store.
export function checkAutoBuildOutcomeClearGuard(content: string): string[] {
  const errors: string[] = []

  const functions = extractFunctionBodies(content)

  for (const name of SETTER_FUNCTIONS) {
    const fn = functions.find((f) => f.name === name)
    if (!fn) {
      errors.push(
        `Could not find a function named ${name}() -- has it been renamed, ` +
          'removed, or inlined? If so, this guard (and the stale-outcome ' +
          'clearing it protects) needs to move with it.',
      )
      continue
    }

    if (!CLEARS_OUTCOME.test(fn.body)) {
      errors.push(
        `${name}() never clears item.lastAutoBuildOutcome (expected an ` +
          '`item.lastAutoBuildOutcome = null` assignment in its body, ' +
          'alongside its existing `item.error = null` clear). Without it, ' +
          'a manual edit or successful AI redraft that fixes a previously ' +
          'failed auto-build pass clears item.error but leaves the ' +
          'progress-matrix/batch-editor "failed" badge stuck showing a ' +
          'stale outcome for an item the user is actively fixing.',
      )
    }
    if (!SNAPSHOTS_OUTCOME.test(fn.body) || !RESTORES_OUTCOME.test(fn.body)) {
      errors.push(
        `${name}() does not snapshot and restore item.lastAutoBuildOutcome ` +
          'around its optimistic clear (expected both ' +
          '`const previousLastAutoBuildOutcome = item.lastAutoBuildOutcome` ' +
          'and a matching ' +
          '`item.lastAutoBuildOutcome = previousLastAutoBuildOutcome` in ' +
          'its onFailure revert). Without it, a rejected PATCH reverts ' +
          'item.error and item.stages but permanently clears a genuinely ' +
          'still-failed outcome, the same "revert only what this call ' +
          'actually changed" gap pushItem\'s onFailure exists to close ' +
          'everywhere else.',
      )
    }
  }

  for (const name of RETRY_FUNCTIONS) {
    const fn = functions.find((f) => f.name === name)
    if (!fn) {
      errors.push(
        `Could not find a function named ${name}() -- has it been renamed, ` +
          'removed, or inlined? If so, this guard (and the stale-outcome ' +
          'clearing it protects) needs to move with it.',
      )
      continue
    }

    if (!CLEARS_OUTCOME.test(fn.body)) {
      errors.push(
        `${name}() never clears item.lastAutoBuildOutcome at the start of ` +
          'a fresh attempt (expected an `item.lastAutoBuildOutcome = null` ' +
          'assignment in its body, alongside its existing ' +
          '`item.error = null` optimistic clear). Without it, retrying a ' +
          'failed stage through this function leaves the progress-matrix/' +
          'batch-editor "failed" badge stuck showing a stale outcome while ' +
          'the retry is in flight or has already succeeded.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkAutoBuildOutcomeClearGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder auto-build outcome-clear guard contract failed in ' +
        'modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder auto-build outcome-clear guard contract passed: ' +
      'updatePitch(), updateFields(), updatePrompt(), generateItemAsset(), ' +
      'generateItemAssetAsync(), and commitItem() all clear (and, for the ' +
      'three setters, snapshot/restore) item.lastAutoBuildOutcome, so a ' +
      'manual fix or a successful retry never leaves the per-item "failed" ' +
      'badge stuck showing a stale outcome.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
