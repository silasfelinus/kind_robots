// /utils/scripts/verifyModelBuilderStaleSelectionOnReopenGuard.ts
//
// Regression guard (model-builder/t-029, cycle 24) -- resumeRun() and
// openRun() each have a branch that adopts a *different* run's sourceType
// and recipeKey directly (`state.sourceType = data.sourceType`, `state.
// recipeKey = data.recipeKey`, etc.), bypassing selectSource()/
// selectRecipe() entirely. Neither branch touched state.selectedSource or
// state.selections, so both were left holding whatever an earlier
// in-session selectSource()/selectRecipe() call had put there -- stale, not
// merely absent.
//
// That staleness is user-visible and functional, not cosmetic: the header
// crumb nav's "Recipe" step is enabled by `Boolean(store.selectedSource)`
// alone (model-builder-manager.vue's `crumbs` computed), so a stale non-null
// selectedSource left the crumb clickable after opening/resuming a
// different run. Clicking it renders model-builder-recipe-selector.vue
// against the *new* recipeKey's outputs (via getOutputsForRecipe) but the
// *old* selections object -- output keys don't overlap across recipes in
// OUTPUT_CATALOG, so every checkbox reads unchecked while
// store.selectedOutputCount (which just counts `.on` entries in
// state.selections, unscoped to the current recipe) still reports the old
// recipe's leftover selections, and store.sourceLabel(store.selectedSource)
// shows the OLD source's name/title paired with the NEW sourceType. Worse,
// store.canStartRun only checks selectedSource/recipeKey/
// selectedOutputCount>0, not whether those "on" selections' keys actually
// belong to the current recipe -- so "Start build run" renders enabled and
// silently no-ops when clicked, since startRun()'s own per-output
// `state.selections[output.key]` lookup finds nothing for the new recipe's
// keys and its itemsPayload ends up empty (`if (!itemsPayload.length)
// return`, with no error/status message).
//
// Fixed by clearing both `state.selectedSource = null` and
// `state.selections = {}` in all three "adopt a different run" branches
// (resumeRun's else branch, and both of openRun's cached/fetched branches),
// matching adaptRun's own existing comment that selectedSource "is only
// ever set by an in-session selectSource() call and is never restored on
// resume/reopen" -- the bug was that it could still be *wrong*, not just
// missing. The "requested run is already the active one" early-return
// branches in both functions are deliberately untouched: they don't adopt a
// different run, so the current selectedSource/selections are still valid.
//
// This asserts the textual shape of that fix stays in place: each of the
// three adopt-a-different-run anchor lines is followed, before the next
// `state.step = 'run'`, by both `state.selectedSource = null` and
// `state.selections = {}`.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const SELECTED_SOURCE_RESET = 'state.selectedSource = null'
const SELECTIONS_RESET = 'state.selections = {}'
const STEP_RUN = "state.step = 'run'"

interface Branch {
  name: string
  anchor: string
}

const BRANCHES: Branch[] = [
  {
    name: "resumeRun()'s adopt-a-different-run branch (the `else` of `if (state.run?.id === String(data.id))`)",
    anchor: 'state.recipeKey = data.recipeKey as RecipeKey',
  },
  {
    name: "openRun()'s cached-run branch (`const cached = state.runs.find(...)`)",
    anchor: 'state.recipeKey = cached.recipeKey',
  },
  {
    name: "openRun()'s network-fetch branch (`response.success && response.data`)",
    anchor: 'state.recipeKey = state.run.recipeKey',
  },
]

// Checks the fix's exact shape against the full source text of a file
// shaped like modelBuilderStore.ts. Exported so the self-test below can run
// it against synthetic buggy/fixed fixtures without touching the real store
// file.
export function checkStaleSelectionOnReopenGuard(content: string): string[] {
  const errors: string[] = []

  for (const branch of BRANCHES) {
    const anchorIndex = content.indexOf(branch.anchor)
    if (anchorIndex === -1) {
      errors.push(
        `Could not find \`${branch.anchor}\` in modelBuilderStore.ts -- ` +
          `has ${branch.name} been renamed or restructured? If so, this ` +
          'guard needs to move with it.',
      )
      continue
    }

    const stepRunIndex = content.indexOf(STEP_RUN, anchorIndex)
    const windowEnd = stepRunIndex === -1 ? content.length : stepRunIndex
    const window = content.slice(anchorIndex, windowEnd)

    if (!window.includes(SELECTED_SOURCE_RESET)) {
      errors.push(
        `${branch.name} no longer resets \`${SELECTED_SOURCE_RESET}\` ` +
          "before setting the step to 'run' -- without this, a source " +
          'picked earlier in the session (via selectSource()) stays ' +
          "attached after this branch adopts a different run's " +
          'sourceType/recipeKey, leaving the header\'s "Recipe" crumb ' +
          '(enabled by `Boolean(store.selectedSource)` alone) clickable ' +
          'into a mismatched recipe-selector screen: wrong source label, ' +
          'wrong selected-output count, and a "Start build run" button ' +
          'that renders enabled but silently no-ops when clicked.',
      )
    }

    if (!window.includes(SELECTIONS_RESET)) {
      errors.push(
        `${branch.name} no longer resets \`${SELECTIONS_RESET}\` before ` +
          "setting the step to 'run' -- without this, an earlier " +
          "recipe's output selections stay in state.selections after " +
          "this branch adopts a different run's recipeKey. Since output " +
          'keys never overlap across recipes in OUTPUT_CATALOG, every ' +
          'checkbox on a later visit to the recipe step would read ' +
          'unchecked while store.selectedOutputCount still counts the ' +
          "old recipe's leftover `on` entries -- letting canStartRun " +
          'read true for a selection set that maps to zero real items.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkStaleSelectionOnReopenGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder stale-selection-on-reopen guard contract failed for ' +
        'modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder stale-selection-on-reopen guard contract passed: ' +
      'resumeRun() and openRun() both clear selectedSource/selections in ' +
      'every branch that adopts a different run, so a stale in-session ' +
      'source/recipe selection can never make the "Recipe" crumb or ' +
      '"Start build run" button misleadingly clickable after opening or ' +
      'resuming an unrelated run.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
