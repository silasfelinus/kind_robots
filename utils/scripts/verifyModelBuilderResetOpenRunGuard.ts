// /utils/scripts/verifyModelBuilderResetOpenRunGuard.ts
//
// Regression guard (model-builder/t-029, cycle 97) -- openRun()'s own request
// ticket (openRunRequestId, see verifyModelBuilderOpenRunRequestGuard.ts) only
// guards a second openRun() call against a slower first one. It does nothing
// to stop a still-in-flight openRun() fetch from landing *after* the user
// abandons that run a different way: resetRun() and resetAll() both
// unconditionally null state.run and reset state.step, but neither used to
// touch openRunRequestId, so a pending openRun() fetch's stale-response check
// (`if (openRunRequestId !== requestId) return`) still passed and its
// response still landed afterward.
//
// Concrete repro: model-builder-run-history.vue's "Open" button and "New run"
// button sit side by side with no guard between them (only cancellingRunId
// disables either). Click Open on a run that is not yet cached in
// state.runs (falls through to the network fetch), then click New run before
// that fetch resolves. resetRun() correctly nulls state.run and flips
// state.step back to 'source' -- but when Open's fetch then resolves, its
// success branch still passed the (unchanged) ticket check and unconditionally
// reassigned state.run and flipped state.step back to 'run', silently
// resurrecting the run the user just abandoned. The same gap applies to
// resetAll() (bound to the top-level "Reset" control in
// model-builder-manager.vue).
//
// Fixed by bumping the same openRunRequestId ticket inside resetRun() and
// resetAll(), immediately alongside their existing runEpoch++ (which guards a
// different, sibling class of abandoned-work races -- see runEpoch's own doc
// comment). This asserts the textual shape of that fix stays in place,
// deliberately scoped to this one bug, mirroring
// verifyModelBuilderOpenRunRequestGuard.ts's identical pattern for openRun()
// itself.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const TICKET_VAR = 'openRunRequestId'
const REQUIRED_STATEMENT = `${TICKET_VAR}++`
const TARGET_FUNCTIONS = ['resetRun', 'resetAll']

// Checks the fix's exact shape against the full source text of a file
// containing `resetRun`/`resetAll`-named functions. Exported (rather than
// only exercised via main()) so the self-test below can run it against
// synthetic buggy/fixed fixtures without touching the real store file.
export function checkResetOpenRunGuard(content: string): string[] {
  const errors: string[] = []
  const functions = extractFunctionBodies(content)

  for (const name of TARGET_FUNCTIONS) {
    const fn = functions.find((f) => f.name === name)
    if (!fn) {
      errors.push(
        `Could not find a function named ${name}() -- has it been renamed, ` +
          'removed, or inlined? If so, this guard (and the race it protects ' +
          'against) needs to move with it.',
      )
      continue
    }

    if (!fn.body.includes(REQUIRED_STATEMENT)) {
      errors.push(
        `${name}() no longer contains \`${REQUIRED_STATEMENT}\`. Without ` +
          'it, a still-in-flight openRun() fetch outstanding when the user ' +
          `calls ${name}() can land afterward and silently resurrect the ` +
          'run/step the user just abandoned -- see the doc comment at the ' +
          'top of this file for the concrete repro.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkResetOpenRunGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder reset/openRun race guard contract failed for ' +
        'modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder reset/openRun race guard contract passed: resetRun() ' +
      'and resetAll() both invalidate any openRun() fetch still in flight ' +
      'when the user abandons the run a different way.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
