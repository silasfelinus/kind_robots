// /utils/scripts/verifyModelBuilderStaleStatusClearGuard.ts
//
// Regression guard (model-builder/t-029, cycle 42, found by inspection).
// model-builder-manager.vue renders a single global status banner off
// state.statusMessage/statusTone (`v-if="store.statusMessage"`), with no
// auto-dismiss timer of its own -- it stays exactly as-is until the store
// itself calls setStatus()/setStatusForRun() (an error or success message)
// or clearStatus() (blanks it). Every action that persists a change via
// pushItem()/batchPushItems() and can therefore have that PATCH/batch
// request rejected -- generateItemAsset, generateItemAssetAsync, commitItem,
// draftText, autoBuildRun, batchDraftField, and batchAutoBuild -- already
// calls clearStatus() at the start of its own fresh attempt, specifically so
// a stale banner from an earlier failed attempt doesn't linger through a
// later successful one. approveStage, rejectStage, reopenStage, updatePitch,
// updateFields, updatePrompt, batchSetField, and batchApproveStage are the
// same shape of action (mutate local state optimistically, call pushItem/
// batchPushItems, revert on a real failure) but never got this same
// treatment.
//
// Concrete repro (pre-fix): click "Approve pitch" while the PATCH happens to
// fail (a transient network blip is enough) -- approveStage's own onFailure
// correctly reverts the stage locally, and pushItem's failure branch pops
// "Failed to save changes." into the banner. Click "Approve pitch" again and
// have it succeed this time -- nothing in approveStage (or any of its seven
// siblings above) ever clears that banner, so the same stale "Failed to save
// changes." text keeps showing, now describing a save that actually
// succeeded, until some UNRELATED later action (a generate, a commit, a
// draft, an auto-build/batch pass) happens to call clearStatus()/setStatus()
// of its own accord. If the user's next several actions are all
// approve/reject/reopen/edit/batch-field/batch-approve calls -- an entirely
// normal editing session -- the stale error banner can outlive the entire
// rest of the run. Exactly the "indicator lying about what's actually
// stored" class of bug this codebase treats as real everywhere else it's
// found (see verifyModelBuilderAutoBuildOutcomeClearGuard.ts for the
// per-item-field instance of the same class), just reached through the
// global status banner instead of a per-item field.
//
// Fixed by adding a `clearStatus()` call to each of the eight target
// functions, placed the same way their fixed siblings already do -- right
// before the pushItem()/batchPushItems() call it guards.
//
// This walks each target function in modelBuilderStore.ts and requires its
// body to contain at least one bare `clearStatus()` call -- i.e. that the
// function actually clears the stale banner somewhere on its way to
// persisting, mirroring verifyModelBuilderAutoBuildOutcomeClearGuard.ts's own
// presence-check style rather than proving every single branch does it.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const TARGET_FUNCTIONS = [
  'approveStage',
  'rejectStage',
  'reopenStage',
  'updatePitch',
  'updateFields',
  'updatePrompt',
  'batchSetField',
  'batchApproveStage',
] as const

const CLEARS_STATUS = /\bclearStatus\(\)/

// Checks the fix's exact shape against the full source text of a file
// containing these function names. Exported so the self-test below can run
// it against synthetic buggy/fixed fixtures without touching the real store.
export function checkStaleStatusClearGuard(content: string): string[] {
  const errors: string[] = []

  const functions = extractFunctionBodies(content)

  for (const name of TARGET_FUNCTIONS) {
    const fn = functions.find((f) => f.name === name)
    if (!fn) {
      errors.push(
        `Could not find a function named ${name}() -- has it been renamed, ` +
          'removed, or inlined? If so, this guard (and the stale-status-' +
          'banner clearing it protects) needs to move with it.',
      )
      continue
    }

    if (!CLEARS_STATUS.test(fn.body)) {
      errors.push(
        `${name}() never calls clearStatus() (expected a bare ` +
          '`clearStatus()` call in its body, mirroring how generateItemAsset/' +
          'generateItemAssetAsync/commitItem/draftText/autoBuildRun/' +
          'batchDraftField/batchAutoBuild already clear the global status ' +
          'banner before their own fresh attempt). Without it, a stale ' +
          '"Failed to save changes." banner from an earlier failed call to ' +
          'this function outlives a subsequent successful one, with nothing ' +
          'to clear it short of an unrelated later action happening to call ' +
          'clearStatus()/setStatus() on its own.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkStaleStatusClearGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder stale status-banner clear guard contract failed in ' +
        'modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder stale status-banner clear guard contract passed: ' +
      'approveStage(), rejectStage(), reopenStage(), updatePitch(), ' +
      'updateFields(), updatePrompt(), batchSetField(), and ' +
      'batchApproveStage() all call clearStatus() before persisting, so a ' +
      'stale error banner from an earlier failed attempt never outlives a ' +
      'subsequent successful one.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
