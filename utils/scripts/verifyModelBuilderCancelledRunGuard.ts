// /utils/scripts/verifyModelBuilderCancelledRunGuard.ts
//
// Regression guard (model-builder/t-029, kaizen) -- pollAsyncArtJob's
// terminal branch calls artStore.finalizeQueuedArtImage(), a real network
// round-trip; the user can cancel this exact run (cancelRun) while that call
// is in flight. Before this fix, the code after that await unconditionally
// persisted the result (recordArtifact/pushItem) and popped a "Generated a
// candidate" success toast even for a run the user had already cancelled --
// despite cancelRun's own doc comment claiming to prevent exactly that
// ("PATCHing/POSTing artifacts onto items that belong to a run the user just
// cancelled"). cancelRun clears item.artJobId, and pollAsyncArtJob's while
// loop and its one mid-loop check (`if (item.artJobId !== jobId) return`)
// both key off that field -- but by the time finalizeQueuedArtImage is
// called, the terminal branch has already zeroed item.artJobId itself as
// part of normal (non-cancellation) processing, so that check can no longer
// tell "cancelled" apart from "completing normally". generateItemAsset (the
// synchronous sibling) already guards its own post-await completion writes
// with `if (cancelledRunIds.has(runId)) return false`; pollAsyncArtJob was
// missing the equivalent guard on its own await. Fixed by threading `runId`
// through pollAsyncArtJob and checking `cancelledRunIds.has(runId)`
// immediately after finalizeQueuedArtImage resolves, before either its
// success or failure branch runs (both branches -- and everything they lead
// to, including recordArtifact/pushItem/setStatus -- sit textually after
// that check, so one guard covers all of them).
//
// This asserts the textual shape of that fix stays in place: pollAsyncArtJob
// takes a `runId` parameter, and a `cancelledRunIds.has(runId)` check
// appears strictly between the `finalizeQueuedArtImage(` call and the
// `if (!result.success` branch that follows it in the same function body --
// deliberately scoped to this one function/bug, mirroring
// verifyModelBuilderCompletionGate.ts's preference for explicit, narrow
// textual checks over a general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'pollAsyncArtJob'
const FINALIZE_CALL = 'artStore.finalizeQueuedArtImage('
const RESULT_BRANCH = 'if (!result.success'
const GUARD = 'cancelledRunIds.has(runId)'

// Checks the fix's exact shape against the full source text of a file
// containing a `pollAsyncArtJob`-named async function. Exported (rather than
// only exercised via main()) so the self-test below can run it against
// synthetic buggy/fixed fixtures without touching the real store file.
export function checkCancelledRunGuard(content: string): string[] {
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

  const signatureMatch = new RegExp(
    `async function ${FN_NAME}\\(([\\s\\S]*?)\\):\\s*Promise<void>\\s*\\{`,
  ).exec(content)
  const params = signatureMatch?.[1] ?? ''
  if (!/\brunId\s*:\s*string\b/.test(params)) {
    errors.push(
      `${FN_NAME}() no longer takes a \`runId: string\` parameter -- ` +
        'without it there is nothing to check cancelledRunIds against.',
    )
  }

  const finalizeIndex = fn.body.indexOf(FINALIZE_CALL)
  if (finalizeIndex === -1) {
    errors.push(
      `${FN_NAME}() no longer calls ${FINALIZE_CALL} -- this guard's ` +
        'anchor point has moved; re-check where the real network round-trip ' +
        'that can outlast a cancellation now happens.',
    )
    return errors
  }

  const resultBranchIndex = fn.body.indexOf(RESULT_BRANCH, finalizeIndex)
  if (resultBranchIndex === -1) {
    errors.push(
      `${FN_NAME}() calls ${FINALIZE_CALL} but no longer branches on ` +
        `${RESULT_BRANCH} afterward -- this guard's anchor point has moved.`,
    )
    return errors
  }

  const guardIndex = fn.body.indexOf(GUARD, finalizeIndex)
  if (guardIndex === -1 || guardIndex >= resultBranchIndex) {
    errors.push(
      `${FN_NAME}() does not check \`${GUARD}\` between ${FINALIZE_CALL} ` +
        `resolving and its ${RESULT_BRANCH} branch. finalizeQueuedArtImage ` +
        'is a network round-trip the user can cancel this run during; ' +
        'without this check, a job that finishes after cancellation still ' +
        'persists a candidate (recordArtifact/pushItem) and pops a ' +
        '"Generated a candidate" success toast for a run the user no ' +
        "longer has open. Mirror generateItemAsset's own " +
        '`if (cancelledRunIds.has(runId)) return` guard.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkCancelledRunGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder cancelled-run guard contract failed for ' +
        `${FN_NAME}() in modelBuilderStore.ts:`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Model Builder cancelled-run guard contract passed: ${FN_NAME}() checks ` +
      'cancelledRunIds after its own async completion await, before ' +
      'persisting a candidate or surfacing a status toast.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
