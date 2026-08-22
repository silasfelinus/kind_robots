// /utils/scripts/verifyModelBuilderItemPanelAutoRunGuard.ts
//
// Regression guard (model-builder/t-029, cycle 51) -- model-builder-item-
// panel.vue's own single-item "Auto" button (`store.autoBuildItem(item.id)`)
// was the one entry point cycle 25's isRunOperationInFlight fix never
// reached. autoBuildItem() -- the exact store function this button calls --
// is also the function autoBuildRun() (model-builder-progress-matrix.vue's
// "Auto-build all") and batchAutoBuild() (model-builder-batch-editor.vue's
// "Auto-build group") call internally for every item they walk, so it has
// no store.autoBuilding/batchingOutputKey check of its own by design --
// those two callers legitimately invoke it while their own flag is already
// true. That left the whole-run and group entry points to police each
// other (cycle 25's fix, verified by verifyModelBuilderBatchAnyInFlightGuard
// and this file's sibling progress-matrix guard), and left this panel's
// button as the unguarded third path in: `isManualActionInFlight` only
// reads THIS item's own generating/queued/committing/drafting flags, none
// of which are set for an item an in-progress run/batch loop hasn't reached
// yet, so clicking Auto here on a not-yet-processed item started a second,
// fully concurrent autoBuildItem() call racing the run/batch loop's own
// eventual call for the same item -- the exact "two different items in the
// same run mid-generate/mid-commit at once" class isRunOperationInFlight
// exists to prevent.
//
// Fixed by adding `runOperationInFlight = computed(() => store.autoBuilding
// || store.batchingOutputKey !== null)` (mirroring modelBuilderStore.ts's
// own isRunOperationInFlight, which isn't exported) and folding it into the
// Auto button's `:disabled`.
//
// This asserts the textual shape of that fix stays in place: the computed
// definition, and the Auto button's `:disabled` attribute referencing it --
// deliberately scoped to this one bug shape, mirroring this project's other
// narrow textual guards over a general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const ITEM_PANEL_PATH = join(
  repositoryRoot,
  'components/model-builder/model-builder-item-panel.vue',
)

const RUN_OPERATION_IN_FLIGHT_DEF =
  'const runOperationInFlight = computed(\n  () => store.autoBuilding || store.batchingOutputKey !== null,\n)'

// The Auto button is the only `@click="store.autoBuildItem(item.id)"` call
// in this file -- find its `:disabled="..."` attribute specifically, rather
// than scanning every `:disabled` in the file (most of which correctly have
// nothing to do with this race).
const AUTO_BUTTON_PATTERN =
  /:disabled="([^"]*)"\s*\n\s*:title="[^"]*"\s*\n\s*@click="store\.autoBuildItem\(item\.id\)"/

export function checkItemPanelAutoRunGuard(content: string): string[] {
  const errors: string[] = []

  if (!content.includes(RUN_OPERATION_IN_FLIGHT_DEF)) {
    errors.push(
      'Could not find the `runOperationInFlight` computed (checking ' +
        'store.autoBuilding || store.batchingOutputKey !== null) in ' +
        "model-builder-item-panel.vue -- without it, this item's own Auto " +
        'button has no way to know a whole-run or batch-group auto-build is ' +
        'already walking the run, and can start a second, fully concurrent ' +
        'orchestration pass over a different item.',
    )
  }

  const match = content.match(AUTO_BUTTON_PATTERN)
  if (!match) {
    errors.push(
      'Could not find the Auto button\'s `:disabled="..."` attribute ' +
        '(the button with `@click="store.autoBuildItem(item.id)"`) in ' +
        'model-builder-item-panel.vue -- has it been renamed or ' +
        'restructured? If so, this guard (and the bug it protects against) ' +
        'needs to move with it.',
    )
    return errors
  }

  const expression = match[1] ?? ''
  if (!expression.includes('runOperationInFlight')) {
    errors.push(
      `Found the Auto button's :disabled="${expression}" not gating on ` +
        '`runOperationInFlight` -- this button stays clickable while a ' +
        'whole-run "Auto-build all" or a batch "Auto-build group" is ' +
        'already in progress, letting the user start a second, concurrent ' +
        'orchestration pass over the same run.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(ITEM_PANEL_PATH, 'utf8')
  const errors = checkItemPanelAutoRunGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder item-panel Auto run-in-flight guard contract failed ' +
        'for model-builder-item-panel.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder item-panel Auto run-in-flight guard contract passed: ' +
      'the single-item Auto button gates on runOperationInFlight, so it ' +
      'can no longer start a second, concurrent auto-build pass while a ' +
      'whole-run or batch-group auto-build is already walking this run.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
