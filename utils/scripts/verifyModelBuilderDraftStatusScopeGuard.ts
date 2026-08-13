// /utils/scripts/verifyModelBuilderDraftStatusScopeGuard.ts
//
// Regression guard (model-builder/t-029) -- draftText() is the single async
// primitive behind every AI-drafting entry point in the store: the item
// panel's per-field "Draft with AI" buttons, autoBuildItem()'s draft steps,
// and batchDraftField()'s per-item loop. It spans a real network round-trip
// (`/api/suggest`, up to a 60s timeout), long enough for the user to
// navigate away from the run it was drafting for via resetRun()/resetAll()/
// openRun() before the response lands. Every OTHER async model-builder
// action that can outlive a run switch this way -- generateItemAsset,
// pollAsyncArtJob, commitItem, pushItem, batchPushItems -- captures its own
// `runId` up front and routes every status message it can ever surface
// through setStatusForRun(runId, ...), which no-ops unless
// `state.run?.id === runId` (see setStatusForRun's own doc comment).
// draftText was the one async entry point that never got this treatment: it
// called the plain, unscoped setStatus() for its success message and both
// of its own mid-flight discard cases (a hand-edit or an approval landing
// while the draft was in flight), plus its catch block's failure message.
// Before this fix, a draft started against Run A but resolving after the
// user had switched to (or started) a different Run B popped a misleading
// "Drafted ... for ..." success (or "was edited/approved while drafting"
// discard, or a bare failure) toast in Run B's banner, about an item that
// isn't even part of what's on screen -- the exact failure mode
// setStatusForRun exists to prevent, just missing at this one call site.
//
// Fixed by capturing `const runId = state.run.id` at the top of draftText
// (immediately after its own `if (!item || !state.run) return false` guard)
// and routing all four of its status messages through
// setStatusForRun(runId, ...) instead of the bare setStatus(...).
//
// This asserts the textual shape of that fix stays in place: draftText's
// body contains `const runId = state.run.id`, and no bare `setStatus(` call
// (i.e. not `setStatusForRun(`) remains anywhere in its body -- deliberately
// scoped to this one function/bug, mirroring this project's other narrow
// textual guards over a general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'draftText'

// `setStatus(` but not `setStatusForRun(` -- a trailing `(` after the plain
// name means the call wasn't routed through the run-scoped wrapper.
const BARE_SET_STATUS = /\bsetStatus\(/g

export function checkDraftStatusScopeGuard(content: string): string[] {
  const errors: string[] = []
  const functions = extractFunctionBodies(content)
  const fn = functions.find((f) => f.name === FN_NAME)

  if (!fn) {
    errors.push(
      `Could not find a function named ${FN_NAME}() -- has it been ` +
        'renamed, removed, or inlined? If so, this guard (and the bug it ' +
        'protects against) needs to move with it.',
    )
    return errors
  }

  if (!/const\s+runId\s*=\s*state\.run\.id/.test(fn.body)) {
    errors.push(
      `${FN_NAME}() no longer captures \`const runId = state.run.id\` up ` +
        "front -- without it, none of this function's status messages can " +
        'be scoped to the run they were drafting for, and a draft that ' +
        'resolves after the user has switched runs will surface a ' +
        'misleading toast in whatever run is now on screen.',
    )
  }

  const bareMatches = fn.body.match(BARE_SET_STATUS)
  if (bareMatches) {
    errors.push(
      `${FN_NAME}() still calls the bare, unscoped setStatus(...) ` +
        `${bareMatches.length} time(s) -- every status message this ` +
        'function surfaces (success, either mid-flight discard case, and ' +
        'the catch block) must go through setStatusForRun(runId, ...) ' +
        'instead, mirroring generateItemAsset/pollAsyncArtJob/commitItem/' +
        'pushItem/batchPushItems.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkDraftStatusScopeGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder draftText status-scope guard contract failed in ' +
        'modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder draftText status-scope guard contract passed: draftText ' +
      'captures its own runId and every status message it surfaces is ' +
      'scoped through setStatusForRun(runId, ...).',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
