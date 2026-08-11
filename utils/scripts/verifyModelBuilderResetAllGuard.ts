// /utils/scripts/verifyModelBuilderResetAllGuard.ts
//
// Regression guard (model-builder/t-029, kaizen) -- committingItemId,
// autoBuilding, autoBuildingItemId, batchingOutputKey, and draftingField are
// store-wide (not per-run) "who's in flight" singletons, documented as such
// alongside generatingItemId (see the comment above the state interface).
// resetAll() is the one path back to the very start of the wizard, and a
// user can trigger it while one of those singletons is still claimed (e.g.
// mid auto-build, mid commit, or mid a field draft) -- nothing disables the
// header Reset button for that. Before this fix, resetAll() cleared
// generatingItemId but left the other four dangling, so the abandoned run's
// in-flight claim leaked into whatever the user did next: a brand-new run's
// Auto-build/batch controls could read as busy (or, for batchingOutputKey,
// a same-named output group could be wrongly disabled) until the abandoned
// run's own in-flight network call happened to resolve on its own.
//
// This asserts the textual shape of that fix stays in place: resetAll()
// sets committingItemId/autoBuildingItemId/batchingOutputKey to null,
// autoBuilding to false, and draftingField.value to null, mirroring the
// existing `state.generatingItemId = null` line -- deliberately scoped to
// this one function/bug, same convention as the other
// verifyModelBuilder*Guard.ts checkers in this directory.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'resetAll'

const REQUIRED_STATEMENTS = [
  'state.committingItemId = null',
  'state.autoBuilding = false',
  'state.autoBuildingItemId = null',
  'state.batchingOutputKey = null',
  'draftingField.value = null',
]

// Checks the fix's exact shape against the full source text of a file
// containing a `resetAll`-named function. Exported (rather than only
// exercised via main()) so the self-test below can run it against synthetic
// buggy/fixed fixtures without touching the real store file.
export function checkResetAllGuard(content: string): string[] {
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
          'committingItemId, autoBuilding, autoBuildingItemId, ' +
          'batchingOutputKey, and draftingField are store-wide singletons, ' +
          'not scoped to the run being abandoned -- resetAll() must clear ' +
          'every one of them (alongside generatingItemId) or the next run ' +
          "started after a reset can inherit the abandoned run's still-" +
          'claimed in-flight state.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkResetAllGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder resetAll guard contract failed for ' +
        `${FN_NAME}() in modelBuilderStore.ts:`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Model Builder resetAll guard contract passed: ${FN_NAME}() clears all ` +
      'five store-wide in-flight singletons (generatingItemId, ' +
      'committingItemId, autoBuilding/autoBuildingItemId, ' +
      'batchingOutputKey, draftingField).',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
