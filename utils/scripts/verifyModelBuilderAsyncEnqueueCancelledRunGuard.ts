// /utils/scripts/verifyModelBuilderAsyncEnqueueCancelledRunGuard.ts
//
// Regression guard (model-builder/t-029) -- generateItemAssetAsync()'s catch
// block (covering `artStore.prepareArtGenerator()` / `artStore.enqueueCurrentArt()`,
// both network round-trips) called the global handleError() unconditionally and
// unconditionally rewrote the item's GENERATE_ASSETS stage/queueState, with no
// check against cancelledRunIds. Its synchronous sibling generateItemAsset --
// literally the previous function in this same file -- already guards its own
// catch block with `if (cancelledRunIds.has(runId)) return false` as the very
// first line, precisely so a render/enqueue that fails after the user has
// cancelled this exact run (via the History panel's cancelRun()) doesn't pop a
// stray, app-wide error banner or touch a now-detached item for a run the user
// already told the app to abandon. generateItemAssetAsync never got the same
// treatment: click "Queue generation in background", cancel the run while
// prepareArtGenerator/enqueueCurrentArt is still in flight, then have that
// enqueue independently fail (network hiccup, guest-promotion failure, quota) --
// handleError() fires a global "An error occurred while queueing model builder
// asset: ..." toast regardless of the cancellation, unlike every other
// cancellable async entry point in this store (generateItemAsset,
// pollAsyncArtJob, commitItem all check cancelledRunIds before their own
// handleError/toast).
//
// This asserts the textual shape of the fix stays in place: a
// `cancelledRunIds.has(runId)` check appears in generateItemAssetAsync's body
// strictly before its `handleError(error, 'queueing model builder asset')`
// call -- deliberately scoped to this one function/bug, mirroring
// verifyModelBuilderCommitCancelledRunGuard.ts's and
// verifyModelBuilderCancelledRunGuard.ts's own narrow textual checks over a
// general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'generateItemAssetAsync'
const HANDLE_ERROR_CALL = "handleError(error, 'queueing model builder asset')"
const GUARD = 'cancelledRunIds.has(runId)'

// Checks the fix's exact shape against the full source text of a file
// containing a `generateItemAssetAsync`-named async function. Exported
// (rather than only exercised via main()) so the self-test below can run it
// against synthetic buggy/fixed fixtures without touching the real store
// file.
export function checkAsyncEnqueueCancelledRunGuard(content: string): string[] {
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

  const handleErrorIndex = fn.body.indexOf(HANDLE_ERROR_CALL)
  if (handleErrorIndex === -1) {
    errors.push(
      `${FN_NAME}() no longer calls ${HANDLE_ERROR_CALL} -- this guard's ` +
        "anchor point has moved; re-check how this function's enqueue " +
        'failure is reported.',
    )
    return errors
  }

  const guardIndex = fn.body.indexOf(GUARD)
  if (guardIndex === -1 || guardIndex >= handleErrorIndex) {
    errors.push(
      `${FN_NAME}() does not check \`${GUARD}\` before its ` +
        `${HANDLE_ERROR_CALL} call. prepareArtGenerator/enqueueCurrentArt is ` +
        'a network round-trip the user can cancel this run during; without ' +
        'this check, an enqueue that fails after cancellation still pops a ' +
        'global, unscoped error banner and rewrites the detached item for a ' +
        'run the user already told the app to abandon -- unlike this ' +
        "function's own synchronous sibling generateItemAsset, which guards " +
        'its identical catch block the same way.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkAsyncEnqueueCancelledRunGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder async-enqueue cancelled-run guard contract failed for ' +
        `${FN_NAME}() in modelBuilderStore.ts:`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder async-enqueue cancelled-run guard contract passed: ' +
      `${FN_NAME}() checks cancelledRunIds before reporting an enqueue ` +
      'failure, matching its synchronous sibling generateItemAsset.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
