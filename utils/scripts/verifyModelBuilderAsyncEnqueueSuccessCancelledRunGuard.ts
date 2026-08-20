// /utils/scripts/verifyModelBuilderAsyncEnqueueSuccessCancelledRunGuard.ts
//
// Regression guard (model-builder/t-029 cycle 29) -- generateItemAssetAsync()'s
// SUCCESS path (after `artStore.enqueueCurrentArt()` resolves with a real job)
// unconditionally armed `item.artJobId = enqueued.jobId` and started
// `pollAsyncArtJob` with no check against cancelledRunIds. Its own catch block
// already guards the failure path this exact same way (see
// verifyModelBuilderAsyncEnqueueCancelledRunGuard.ts), and its synchronous
// sibling generateItemAsset guards its equivalent success path too (`if
// (cancelledRunIds.has(runId)) return false` immediately after
// `artStore.generateCurrentArt()` resolves, before touching the result) --
// generateItemAssetAsync's success branch never got the same treatment.
//
// enqueueCurrentArt is a network round-trip the user can cancel this exact run
// during (click "Queue generation in background", then hit Cancel on the run
// before the enqueue POST resolves). Without this check, a successful enqueue
// that lands after cancellation still arms item.artJobId and starts a fresh
// pollAsyncArtJob loop for an item cancelRun() already detached (or never saw,
// if this run wasn't the active one) -- re-arming a 5s poll loop for a run the
// user already told the app to abandon. pollAsyncArtJob's own cancelledRunIds
// check does stop it from ever persisting a candidate once the job resolves,
// but only after minutes of pointless polling against a run nothing displays
// any more.
//
// This asserts the textual shape of the fix stays in place: a
// `cancelledRunIds.has(runId)` check appears in generateItemAssetAsync's body
// strictly before the `item.artJobId = enqueued.jobId` assignment that arms
// the poll -- deliberately scoped to this one function/bug, mirroring
// verifyModelBuilderAsyncEnqueueCancelledRunGuard.ts's own narrow textual
// check over a general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'generateItemAssetAsync'
const ARM_POLL_ASSIGNMENT = 'item.artJobId = enqueued.jobId'
const GUARD = 'cancelledRunIds.has(runId)'

// Checks the fix's exact shape against the full source text of a file
// containing a `generateItemAssetAsync`-named async function. Exported
// (rather than only exercised via main()) so the self-test below can run it
// against synthetic buggy/fixed fixtures without touching the real store
// file.
export function checkAsyncEnqueueSuccessCancelledRunGuard(
  content: string,
): string[] {
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

  const armPollIndex = fn.body.indexOf(ARM_POLL_ASSIGNMENT)
  if (armPollIndex === -1) {
    errors.push(
      `${FN_NAME}() no longer contains \`${ARM_POLL_ASSIGNMENT}\` -- this ` +
        "guard's anchor point has moved; re-check how this function arms " +
        'its async poll after a successful enqueue.',
    )
    return errors
  }

  const guardIndex = fn.body.indexOf(GUARD)
  if (guardIndex === -1 || guardIndex >= armPollIndex) {
    errors.push(
      `${FN_NAME}() does not check \`${GUARD}\` before its ` +
        `${ARM_POLL_ASSIGNMENT} assignment. enqueueCurrentArt is a network ` +
        'round-trip the user can cancel this run during; without this ' +
        'check, a successful enqueue that lands after cancellation still ' +
        'arms item.artJobId and starts a fresh pollAsyncArtJob loop for a ' +
        'run the user already told the app to abandon -- unlike this ' +
        "function's own catch block, and its synchronous sibling " +
        'generateItemAsset, which both guard their equivalent path the ' +
        'same way.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkAsyncEnqueueSuccessCancelledRunGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder async-enqueue success cancelled-run guard contract ' +
        `failed for ${FN_NAME}() in modelBuilderStore.ts:`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder async-enqueue success cancelled-run guard contract ' +
      `passed: ${FN_NAME}() checks cancelledRunIds before arming its async ` +
      'poll on a successful enqueue, matching its own catch block and its ' +
      'synchronous sibling generateItemAsset.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
