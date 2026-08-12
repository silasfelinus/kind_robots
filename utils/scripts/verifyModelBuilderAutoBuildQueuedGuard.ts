// /utils/scripts/verifyModelBuilderAutoBuildQueuedGuard.ts
//
// Regression guard (model-builder/t-029) -- autoBuildItem()'s in-flight
// bail-out checked only state.generatingItemId / state.committingItemId /
// draftingField.value?.itemId, never item.queueState. queueState is what
// generateItemAssetAsync()/pollAsyncArtJob() (the "Queue generation in
// background" path) set on the item while an async art job is
// queued/rendering -- a store-wide singleton is never touched for that path,
// so autoBuildItem's own guard didn't recognize the item as busy.
//
// isItemManualActionInFlight() (defined just above autoBuildItem, added for
// t-038's "N busy" pre-flight signal) already checks Boolean(item?.queueState)
// alongside the same three singletons -- autoBuildItem's inline guard simply
// didn't reuse it. Before this fix: queue an item's art generation in the
// background from model-builder-item-panel.vue, then click "Auto-build
// group" (model-builder-batch-editor.vue) or "Auto-build all"
// (model-builder-progress-matrix.vue) before it finishes -- both buttons are
// gated only by their own batching/autoBuilding flag, not busyCount. Auto
// walks straight into GENERATE_ASSETS and fires a second, synchronous
// generateItemAsset() call for the same item while the async one is still
// rendering; whichever response lands last silently overwrites
// item.artImageId/imagePath with no re-review, and the render is paid for
// twice. (The single-item Auto button in model-builder-item-panel.vue does
// not have this hole -- it already gates on isQueued before calling Auto.)
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'autoBuildItem'

// Checks the fix's exact shape against the full source text of a file
// containing an `autoBuildItem`-named async function. Exported (rather than
// only exercised via main()) so the self-test below can run it against
// synthetic buggy/fixed fixtures without touching the real store file.
export function checkAutoBuildQueuedGuard(content: string): string[] {
  const errors: string[] = []

  const functions = extractFunctionBodies(content)
  const fn = functions.find((f) => f.name === FN_NAME)
  if (!fn) {
    errors.push(
      `Could not find an async function named ${FN_NAME}() -- has it been ` +
        'renamed, removed, or inlined? If so, this guard (and the bug it ' +
        'protects against) needs to move with it.',
    )
    return errors
  }

  const usesSharedHelper = /isItemManualActionInFlight\(item\.id\)/.test(
    fn.body,
  )
  const checksQueueStateInline = /item\.queueState/.test(fn.body)

  if (!usesSharedHelper && !checksQueueStateInline) {
    errors.push(
      `${FN_NAME}()'s in-flight bail-out does not check item.queueState ` +
        '(directly, or via calling isItemManualActionInFlight(item.id)). ' +
        'Without it, an item with an async art job already queued/rendering ' +
        'via "Queue generation in background" is not recognized as busy, ' +
        'and Auto-build group/all can fire a second, concurrent ' +
        'generateItemAsset() call for the same item.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkAutoBuildQueuedGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder auto-build queued-item guard contract failed for ' +
        `${FN_NAME}() in modelBuilderStore.ts:`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder auto-build queued-item guard contract passed: ' +
      `${FN_NAME}() recognizes an item with a queued/rendering async art ` +
      'job as busy before walking into GENERATE_ASSETS.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
