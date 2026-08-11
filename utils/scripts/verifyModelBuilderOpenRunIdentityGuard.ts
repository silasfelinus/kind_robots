// /utils/scripts/verifyModelBuilderOpenRunIdentityGuard.ts
//
// Regression guard (model-builder/t-029, kaizen) -- openRun(runId) always
// replaced state.run with a *different* object, even when the requested run
// was already the active one. fetchRuns() (called by the run-history panel
// on mount) and openRun's own fallback fetch both rebuild BuildRun/BuildItem
// objects via adaptRun/adaptItem, which reset the client-only artJobId and
// queueState fields to null (the server never returns them -- see the
// BuildItem.artJobId doc comment). pollAsyncArtJob captures a reference to
// the specific BuildItem object it was called with and polls against that
// object only, independent of whatever object state.run currently points
// to. So: user queues an async generate on an item, opens the run-history
// panel (which silently refreshes state.runs with fresh objects), then
// re-opens the same run they already had open -- openRun swapped in one of
// those fresh objects, orphaning the in-flight poll. The UI now shows the
// item as idle (no queued/rendering indicator, buttons re-enabled) while the
// original job is still running in the background, inviting a second
// concurrent generation and leaving the eventual first result to land
// invisibly on the orphaned object.
//
// Fixed by short-circuiting at the top of openRun: if the requested runId is
// already state.run's id, keep the live object in place (only update the
// step) instead of looking it up in state.runs / re-fetching it.
//
// This asserts the textual shape of that fix stays in place: openRun's body
// checks `state.run?.id === runId` (or an equivalent identity check against
// its own runId parameter) strictly before the `state.runs.find(` cache
// lookup that would otherwise unconditionally replace state.run.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'openRun'
const CACHE_LOOKUP = 'state.runs.find('
const IDENTITY_GUARD = /state\.run\?\.id\s*===\s*runId/

// Checks the fix's exact shape against the full source text of a file
// containing an `openRun`-named async function. Exported (rather than only
// exercised via main()) so the self-test below can run it against synthetic
// buggy/fixed fixtures without touching the real store file.
export function checkOpenRunIdentityGuard(content: string): string[] {
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

  const cacheLookupIndex = fn.body.indexOf(CACHE_LOOKUP)
  if (cacheLookupIndex === -1) {
    errors.push(
      `${FN_NAME}() no longer calls ${CACHE_LOOKUP} -- this guard's anchor ` +
        'point has moved; re-check where the run-object replacement now ' +
        'happens.',
    )
    return errors
  }

  const guardMatch = IDENTITY_GUARD.exec(fn.body)
  if (!guardMatch || guardMatch.index >= cacheLookupIndex) {
    errors.push(
      `${FN_NAME}() does not check \`state.run?.id === runId\` before its ` +
        `${CACHE_LOOKUP} cache lookup. Without this guard, re-opening the ` +
        'run that is already active swaps state.run for a freshly-adapted ' +
        'object (artJobId/queueState reset to null), orphaning any ' +
        "pollAsyncArtJob poll still bound to the item's live object -- an " +
        'in-flight async generation silently vanishes from the UI even ' +
        'though it is still running.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkOpenRunIdentityGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder open-run identity guard contract failed for ' +
        `${FN_NAME}() in modelBuilderStore.ts:`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder open-run identity guard contract passed: ' +
      `${FN_NAME}() keeps the live state.run object in place when the ` +
      'requested run is already active, before any cache lookup or ' +
      'refetch could replace it.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
