// /utils/scripts/verifyModelBuilderResetRunGuard.ts
//
// Regression guard (model-builder/t-029, kaizen) -- a sibling of
// verifyModelBuilderResetAllGuard.ts for the same bug class reached through a
// second path. generatingItemId, committingItemId, autoBuilding/
// autoBuildingItemId, batchingOutputKey, and draftingField are store-wide
// (not per-run) "who's in flight" singletons. resetAll() was fixed to clear
// all five, but resetRun() -- reachable from ordinary UI clicks without going
// through resetAll() ("New run" in the progress matrix and run history, plus
// cancelRun() cancelling the active run) -- cleared none of them. Starting a
// batch/auto-build/commit/draft on Run A, then resetting to Run B before it
// finished left Run B inheriting the abandoned run's still-claimed in-flight
// state: e.g. Run B's same-named output group ("rewards") read as busy until
// Run A's abandoned batch call happened to resolve on its own.
//
// This asserts the textual shape of that fix stays in place: resetRun() sets
// generatingItemId/committingItemId/autoBuildingItemId/batchingOutputKey to
// null, autoBuilding to false, and draftingField.value to null -- deliberately
// scoped to this one function/bug, same convention as the other
// verifyModelBuilder*Guard.ts checkers in this directory.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'resetRun'

const REQUIRED_STATEMENTS = [
  'state.generatingItemId = null',
  'state.committingItemId = null',
  'state.autoBuilding = false',
  'state.autoBuildingItemId = null',
  'state.batchingOutputKey = null',
  'draftingField.value = null',
]

// Checks the fix's exact shape against the full source text of a file
// containing a `resetRun`-named function. Exported (rather than only
// exercised via main()) so the self-test below can run it against synthetic
// buggy/fixed fixtures without touching the real store file.
export function checkResetRunGuard(content: string): string[] {
  const errors: string[] = []

  const functions = extractFunctionBodies(content)
  const fn = functions.find((f) => f.name === FN_NAME)
  if (!fn) {
    errors.push(
      `Could not find a function named ${FN_NAME}() -- has it been ` +
        'renamed, removed, or inlined? If so, this guard (and the leak it ' +
        'protects against) needs to move with it.',
    )
    return errors
  }

  for (const statement of REQUIRED_STATEMENTS) {
    if (!fn.body.includes(statement)) {
      errors.push(
        `${FN_NAME}() no longer contains \`${statement}\`. ` +
          'generatingItemId, committingItemId, autoBuilding, ' +
          'autoBuildingItemId, batchingOutputKey, and draftingField are ' +
          'store-wide singletons, not scoped to the run being abandoned -- ' +
          'resetRun() must clear every one of them or a new run started ' +
          "after it can inherit the abandoned run's still-claimed " +
          'in-flight state.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkResetRunGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder resetRun guard contract failed for ' +
        `${FN_NAME}() in modelBuilderStore.ts:`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Model Builder resetRun guard contract passed: ${FN_NAME}() clears all ` +
      'six store-wide in-flight singletons (generatingItemId, ' +
      'committingItemId, autoBuilding/autoBuildingItemId, ' +
      'batchingOutputKey, draftingField).',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
