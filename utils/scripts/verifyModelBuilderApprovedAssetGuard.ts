// /utils/scripts/verifyModelBuilderApprovedAssetGuard.ts
//
// Regression guard (model-builder/t-029, kaizen) -- pollAsyncArtJob clears
// item.artJobId/queueState before awaiting artStore.finalizeQueuedArtImage(),
// a real network round-trip. The item panel's canApproveAssets computed
// reads item.artJobId (via isQueued) as its only "is a render still
// happening" signal alongside isGenerating/isLocked -- none of which are
// true during that exact span, so on a REGENERATE (item.artImageId already
// holds a prior candidate) canApproveAssets briefly evaluates true, letting
// the user click "Keep this asset" using the OLD image while
// GENERATE_ASSETS is still nominally 'in-progress'. approveStage writes
// 'approved' straight through with no gate of its own. Before this fix, the
// completion handler then unconditionally overwrote item.artImageId /
// item.imagePath with the NEW image once finalizeQueuedArtImage resolved --
// silently swapping what an already-'approved' stage points at, with no
// re-review, directly contradicting the file's own stale-invalidation
// philosophy (isStageEditable's doc comment: "the review gate would be
// lying about what's actually stored"). Fixed by checking
// `item.stages.GENERATE_ASSETS.status === 'approved'` right before the
// artImageId/imagePath write and discarding the finished render instead of
// applying it when the stage was approved out from under the poll. A
// concurrent 'stale' (upstream edit reopening an earlier stage) is left
// alone on purpose -- that's the existing, intended way to flag "re-review
// this candidate," and should still receive the image.
//
// generateItemAsset (the synchronous sibling) had the identical gap: two
// calls can be in flight for the same item id at once (an item's own "Auto"
// button and a run-level "Auto-build all" both reaching the same item
// concurrently -- generatingItemSingleton only guards a *different* owner
// overwriting this one, not two calls sharing the same item id), so an
// earlier-started call finishing after the user approved a sibling call's
// candidate would silently overwrite it. Fixed with the exact same guard,
// so this checker covers both functions.
//
// This asserts the textual shape of that fix stays in place in each function:
// `item.stages.GENERATE_ASSETS.status === 'approved'` strictly between the
// `if (!result.success` branch and the `item.artImageId =` write that
// follows it in the same function body -- deliberately scoped to this one
// bug shape, mirroring verifyModelBuilderCancelledRunGuard.ts's preference
// for explicit, narrow textual checks over a general-purpose static
// analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAMES = ['pollAsyncArtJob', 'generateItemAsset']
const RESULT_BRANCH = 'if (!result.success'
const IMAGE_WRITE = 'item.artImageId = image.id'
const GUARD = "item.stages.GENERATE_ASSETS.status === 'approved'"

// Checks the fix's exact shape against the full source text of a file
// containing `pollAsyncArtJob`/`generateItemAsset`-named async functions.
// Exported (rather than only exercised via main()) so the self-test below
// can run it against synthetic buggy/fixed fixtures without touching the
// real store file.
export function checkApprovedAssetGuard(content: string): string[] {
  const errors: string[] = []
  const functions = extractFunctionBodies(content)

  for (const fnName of FN_NAMES) {
    const fn = functions.find((f) => f.name === fnName)
    if (!fn) {
      errors.push(
        `Could not find an async function named ${fnName}() -- has it been ` +
          'renamed, removed, or inlined? If so, this guard (and the bug it ' +
          'protects against) needs to move with it.',
      )
      continue
    }

    const resultBranchIndex = fn.body.indexOf(RESULT_BRANCH)
    if (resultBranchIndex === -1) {
      errors.push(
        `${fnName}() no longer branches on ${RESULT_BRANCH} -- this guard's ` +
          'anchor point has moved.',
      )
      continue
    }

    const imageWriteIndex = fn.body.indexOf(IMAGE_WRITE, resultBranchIndex)
    if (imageWriteIndex === -1) {
      errors.push(
        `${fnName}() no longer writes \`${IMAGE_WRITE}\` after its ` +
          `${RESULT_BRANCH} branch -- this guard's anchor point has moved; ` +
          're-check where the finished render gets applied to the item.',
      )
      continue
    }

    const guardIndex = fn.body.indexOf(GUARD, resultBranchIndex)
    if (guardIndex === -1 || guardIndex >= imageWriteIndex) {
      errors.push(
        `${fnName}() does not check \`${GUARD}\` between its ${RESULT_BRANCH} ` +
          `branch and the ${IMAGE_WRITE} write. Two calls can complete for ` +
          'the same item (regenerate-while-queued for pollAsyncArtJob, or ' +
          'two entry points reaching the same item concurrently for ' +
          'generateItemAsset), so without this check a render that finishes ' +
          'after the user already approved a sibling candidate silently ' +
          'overwrites the already-approved artImageId/imagePath with no ' +
          're-review.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkApprovedAssetGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder approved-asset guard contract failed in modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder approved-asset guard contract passed: ' +
      `${FN_NAMES.map((n) => `${n}()`).join(' and ')} refuse to overwrite ` +
      'an already-approved candidate with a render that finishes after the fact.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
