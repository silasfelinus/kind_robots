// /utils/scripts/verifyModelBuilderResumeRunIdentityGuard.ts
//
// Regression guard (model-builder/t-029, kaizen) -- resumeRun() always
// replaced state.run with a *different* object once it resolved the run to
// resume, even when that run was already the active one. resumeRun() is
// called unconditionally on every mount of model-builder-manager.vue, and
// rebuilds BuildRun/BuildItem objects via adaptRun/adaptItem, which reset
// the client-only artJobId and queueState fields to null (the server never
// returns them -- see the BuildItem.artJobId doc comment). pollAsyncArtJob
// captures a reference to the specific BuildItem object it was called with
// and polls against that object only, independent of whatever object
// state.run currently points to. So: user queues an async generate on an
// item, navigates away from and back to the Model Builder page (a normal
// SPA remount), and resumeRun() swaps in a freshly-adapted object for the
// same already-active run, orphaning the in-flight poll. The UI now shows
// the item as idle (no queued/rendering indicator, buttons re-enabled)
// while the original job is still running in the background, inviting a
// second concurrent generation and leaving the eventual first result to
// land invisibly on the orphaned object -- the same failure mode openRun()
// already guards against for its own reopen path (see
// verifyModelBuilderOpenRunIdentityGuard.ts).
//
// Fixed by checking state.run's identity against the resolved run's id
// immediately before the `state.run = adaptRun(` assignment: if they match,
// keep the live object in place (only update step/activeRunId) instead of
// replacing it.
//
// This asserts the textual shape of that fix stays in place: resumeRun's
// body checks `state.run?.id === String(data.id)` (or an equivalent
// identity check against the resolved run's id) strictly before the
// `state.run = adaptRun(` assignment that would otherwise unconditionally
// replace state.run.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'resumeRun'
const REPLACE_ASSIGNMENT = 'state.run = adaptRun('
const IDENTITY_GUARD = /state\.run\?\.id\s*===\s*String\(data\.id\)/

// Checks the fix's exact shape against the full source text of a file
// containing a `resumeRun`-named async function. Exported (rather than only
// exercised via main()) so the self-test below can run it against synthetic
// buggy/fixed fixtures without touching the real store file.
export function checkResumeRunIdentityGuard(content: string): string[] {
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

  const replaceIndex = fn.body.indexOf(REPLACE_ASSIGNMENT)
  if (replaceIndex === -1) {
    errors.push(
      `${FN_NAME}() no longer calls ${REPLACE_ASSIGNMENT} -- this guard's ` +
        'anchor point has moved; re-check where the run-object replacement ' +
        'now happens.',
    )
    return errors
  }

  const guardMatch = IDENTITY_GUARD.exec(fn.body)
  if (!guardMatch || guardMatch.index >= replaceIndex) {
    errors.push(
      `${FN_NAME}() does not check \`state.run?.id === String(data.id)\` ` +
        `before its ${REPLACE_ASSIGNMENT} assignment. Without this guard, ` +
        'resuming the run that is already active (e.g. on a component ' +
        'remount) swaps state.run for a freshly-adapted object ' +
        '(artJobId/queueState reset to null), orphaning any pollAsyncArtJob ' +
        "poll still bound to the item's live object -- an in-flight async " +
        'generation silently vanishes from the UI even though it is still ' +
        'running.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkResumeRunIdentityGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder resume-run identity guard contract failed for ' +
        `${FN_NAME}() in modelBuilderStore.ts:`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder resume-run identity guard contract passed: ' +
      `${FN_NAME}() keeps the live state.run object in place when the ` +
      'resolved run is already active, before the adaptRun reassignment ' +
      'that would otherwise replace it.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
