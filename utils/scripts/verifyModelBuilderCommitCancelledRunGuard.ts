// /utils/scripts/verifyModelBuilderCommitCancelledRunGuard.ts
//
// Regression guard (model-builder/t-029, kaizen) -- commitItem() is the only
// stage-completion function in modelBuilderStore.ts that awaits a real
// network round-trip (the commit POST, up to 60s) without checking
// cancelledRunIds afterward, unlike its siblings generateItemAsset and
// pollAsyncArtJob. The commit POST durably creates/links/promotes the target
// server-side regardless -- that can't be undone from here, same as
// generateItemAsset's art render -- but before this fix, the code after the
// await unconditionally reattached the (possibly detached, cancelled-run)
// item locally and popped a "committed" success toast for a run the user had
// already told the app to abandon via cancelRun.
//
// This asserts the textual shape of that fix stays in place: commitItem
// checks `cancelledRunIds.has(runId)` immediately after its commit POST
// resolves, before either its success (`response.success` truthy) or catch
// branch does anything else. Deliberately scoped to this one function/bug,
// mirroring verifyModelBuilderCancelledRunGuard.ts's own narrow textual
// check over a general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'commitItem'
const RESPONSE_CHECK = 'if (!response.success)'
const SUCCESS_BRANCH = 'const target = response.data?.target'
const GUARD = 'cancelledRunIds.has(runId)'

// Checks the fix's exact shape against the full source text of a file
// containing a `commitItem`-named async function. Exported (rather than only
// exercised via main()) so the self-test below can run it against synthetic
// buggy/fixed fixtures without touching the real store file.
export function checkCommitCancelledRunGuard(content: string): string[] {
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

  const runIdAssignment = fn.body.indexOf('const runId = state.run.id')
  if (runIdAssignment === -1) {
    errors.push(
      `${FN_NAME}() no longer captures \`const runId = state.run.id\` at ` +
        'the top of the function -- without it there is nothing stable to ' +
        'check cancelledRunIds against once state.run may have changed ' +
        'across the await.',
    )
  }

  const responseCheckIndex = fn.body.indexOf(RESPONSE_CHECK)
  if (responseCheckIndex === -1) {
    errors.push(
      `${FN_NAME}() no longer checks ${RESPONSE_CHECK} -- this guard's ` +
        'anchor point has moved; re-check where the commit POST response is ' +
        'validated.',
    )
    return errors
  }

  const successBranchIndex = fn.body.indexOf(SUCCESS_BRANCH, responseCheckIndex)
  if (successBranchIndex === -1) {
    errors.push(
      `${FN_NAME}() no longer reads ${SUCCESS_BRANCH} after ${RESPONSE_CHECK} ` +
        '-- this guard\'s anchor point has moved.',
    )
    return errors
  }

  const guardIndex = fn.body.indexOf(GUARD, responseCheckIndex)
  if (guardIndex === -1 || guardIndex >= successBranchIndex) {
    errors.push(
      `${FN_NAME}() does not check \`${GUARD}\` between the commit POST ` +
        `resolving (${RESPONSE_CHECK}) and reading its target ` +
        `(${SUCCESS_BRANCH}). The commit POST is a network round-trip the ` +
        'user can cancel this run during; without this check, a commit that ' +
        'resolves after cancellation still reattaches the detached item and ' +
        'pops a "committed" success toast for a run the user no longer has ' +
        "open. Mirror generateItemAsset's own " +
        '`if (cancelledRunIds.has(runId)) return false` guard.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkCommitCancelledRunGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder commit cancelled-run guard contract failed for ' +
        `${FN_NAME}() in modelBuilderStore.ts:`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Model Builder commit cancelled-run guard contract passed: ${FN_NAME}() ` +
      'checks cancelledRunIds after its own commit-POST await, before ' +
      'reattaching the item or surfacing a success toast.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
