// /utils/scripts/verifyModelBuilderPushItemErrorScopeGuard.ts
//
// Regression guard (model-builder/t-041, kaizen from t-029's run-history
// cancellation-race fix, kind_robots PR #1825) -- pushItem()/batchPushItems()
// persist a single item (or a batch) in the background after the caller has
// already applied an optimistic local update. Their `.then` branch already
// run-scopes a `{success: false}` response: it only surfaces a status toast
// via setStatusForRun(runId, ...), which itself no-ops unless
// `state.run?.id === runId` -- so a background write that resolves
// unsuccessfully for a run the user has since cancelled (state.run reset to
// null by cancelRun) or navigated away from (state.run pointing at a
// different run) never surfaces anything.
//
// The `.catch` branch had no equivalent scoping: a PATCH that *rejects*
// (network error, timeout, etc.) rather than resolving with
// `{success: false}` called the global handleError() unconditionally,
// popping an app-wide error banner for a run that may no longer be the one
// on screen -- the same class of "action still fires after the user's
// context changed" issue t-029 fixed for the synchronous run-history UI
// path. Fixed by mirroring the `.then` branch's own gate: the catch handler
// now checks `runId` and routes through setStatusForRun instead of calling
// handleError at all.
//
// This asserts the textual shape of that fix stays in place for both
// functions: neither's `.catch` block calls handleError(), and both gate a
// setStatusForRun(...) call behind an `if (runId)` check.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAMES = ['pushItem', 'batchPushItems']
const CATCH_OPEN = '.catch((error) => {'

// Slices the `.catch((error) => { ... })` block out of a function body via
// brace-matching, starting from CATCH_OPEN's own opening '{'. Returns null
// if the function's catch handler isn't (or is no longer) an arrow function
// block -- e.g. reverted to the single-expression `.catch((error) =>
// handleError(...))` shape this guard exists to catch.
function extractCatchBlock(body: string): string | null {
  const catchIndex = body.indexOf(CATCH_OPEN)
  if (catchIndex === -1) return null

  const braceOpen = catchIndex + CATCH_OPEN.length - 1
  let depth = 0
  for (let i = braceOpen; i < body.length; i++) {
    if (body[i] === '{') depth++
    else if (body[i] === '}') {
      depth--
      if (depth === 0) return body.slice(braceOpen, i + 1)
    }
  }
  return null
}

export function checkPushItemErrorScopeGuard(content: string): string[] {
  const errors: string[] = []
  const functions = extractFunctionBodies(content)

  for (const fnName of FN_NAMES) {
    const fn = functions.find((f) => f.name === fnName)
    if (!fn) {
      errors.push(
        `Could not find a function named ${fnName}() -- has it been ` +
          'renamed, removed, or inlined? If so, this guard (and the bug it ' +
          'protects against) needs to move with it.',
      )
      continue
    }

    const catchBlock = extractCatchBlock(fn.body)
    if (!catchBlock) {
      errors.push(
        `${fnName}() no longer has a \`${CATCH_OPEN}\` block -- this ` +
          "guard's anchor point has moved (reverted to a single-expression " +
          'catch, or restructured entirely). Re-check how it handles a ' +
          'rejected background write.',
      )
      continue
    }

    if (catchBlock.includes('handleError(')) {
      errors.push(
        `${fnName}()'s catch block calls handleError() again -- this pops ` +
          'a global error banner unconditionally, including for a run the ' +
          "user has since cancelled or navigated away from. Route it " +
          "through setStatusForRun(runId, ...) instead, mirroring the " +
          "same function's own `.then` success:false branch.",
      )
    }

    if (!/if\s*\(\s*runId\s*\)/.test(catchBlock)) {
      errors.push(
        `${fnName}()'s catch block no longer gates on \`if (runId)\` -- ` +
          'without it, a rejected write can surface a status update for a ' +
          "run that isn't the caller's own (or none at all).",
      )
    }

    if (!catchBlock.includes('setStatusForRun(')) {
      errors.push(
        `${fnName}()'s catch block no longer calls setStatusForRun() -- ` +
          "it should surface the failure the same way the function's own " +
          '`.then` success:false branch does, not via a different, ' +
          'unscoped mechanism.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkPushItemErrorScopeGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder pushItem/batchPushItems error-scope guard contract ' +
        'failed in modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder pushItem/batchPushItems error-scope guard contract ' +
      'passed: both catch a rejected write without calling the global ' +
      'handleError(), scoping the failure through setStatusForRun(runId, ' +
      '...) instead, same as their own `.then` success:false branch.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
