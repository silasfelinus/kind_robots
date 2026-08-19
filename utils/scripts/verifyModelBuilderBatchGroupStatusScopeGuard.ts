// /utils/scripts/verifyModelBuilderBatchGroupStatusScopeGuard.ts
//
// Regression guard (model-builder/t-029 cycle 13). draftText was fixed
// (model-builder/t-029, see verifyModelBuilderDraftStatusScopeGuard's own
// doc comment) to capture `const runId = state.run.id` up front and route
// every status message it surfaces through setStatusForRun(runId, ...) --
// because it spans a real network round-trip long enough for the user to
// switch to (or start) a DIFFERENT run via History before the response
// lands, and a bare, unscoped setStatus() would then pop a misleading toast
// over whatever OTHER run is now on screen. autoBuildRun (the whole-run
// auto-build entry point) already followed that same discipline from the
// start: it captures its own runId and gates both its per-item loop and its
// final summary on `state.run?.id === runId`.
//
// The four "act on every item in one quantity/expansion output group at
// once" entry points -- batchDraftField, batchSetField, batchApproveStage,
// batchAutoBuild -- never got this treatment. Each awaits at least one real
// network round-trip per group (draftText per item, a single batchPushItems
// call, or autoBuildItem per item), so each is exactly as exposed to the
// same run-switch race, but every one of them reported its own completion
// toast through the bare, unscoped setStatus() with no runId captured
// anywhere in the function. Concrete repro (pre-fix): open a run with a
// quantity output group (e.g. "expand-characters" x5), click "Auto-build
// group", then -- while it's still working through the group -- open Run
// History and open a different run. Minutes later, while looking at the
// OTHER run, a stale "Auto-built X/N in this group (Y failed...)" banner
// pops up over it, about a group that isn't even part of what's on screen.
// Identical shape for batchDraftField's "Drafted X/N items.", batchSetField's
// "Set KEY on X/M items.", and batchApproveStage's "Approved STAGE for X
// items." toasts.
//
// This asserts the textual shape of the fix stays in place for all four
// functions: each contains `const runId = state.run?.id` (or `state.run.id`
// on a path where the type checker sees state.run as already narrowed
// non-null), and every one of that function's own completion-toast call
// sites reads `setStatusForRun(runId` or is wrapped in an explicit
// `state.run?.id === runId` check -- never a bare `setStatus(` outside of
// that guard. Deliberately scoped to these four functions/this one bug,
// mirroring verifyModelBuilderDraftStatusScopeGuard's own narrow, textual
// approach over a general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAMES = [
  'batchDraftField',
  'batchSetField',
  'batchApproveStage',
  'batchAutoBuild',
] as const

const RUN_ID_CAPTURE = /const\s+runId\s*=\s*state\.run\??\.id/

// A bare `setStatus(` call -- i.e. not `setStatusForRun(` -- that is NOT
// immediately preceded (on the same or an earlier line, ignoring
// whitespace/newlines) by an opening `state.run?.id === runId) {` guard.
// Rather than trying to fully parse nesting, this narrow check mirrors
// verifyModelBuilderDraftStatusScopeGuard's own approach: strip every
// `setStatusForRun(` occurrence first (so its embedded `setStatus` prefix
// can't false-match), strip every guarded bare call (the
// `state.run?.id === runId) {\n...setStatus(` shape batchAutoBuild uses),
// then anything left starting with `setStatus(` is a genuine unscoped call.
function findUnguardedBareSetStatusCalls(body: string): number {
  let scrubbed = body.replace(/setStatusForRun\(/g, '')
  // Remove the one sanctioned guarded shape: an `if (state.run?.id ===
  // runId)` block whose body calls the bare setStatus(. Non-greedy across
  // newlines so this only eats up to the next closing brace, not the rest
  // of the function.
  scrubbed = scrubbed.replace(
    /if\s*\(\s*state\.run\?\.id\s*===\s*runId\s*\)\s*\{[\s\S]*?setStatus\([\s\S]*?\n\s*\}/,
    '',
  )
  const matches = scrubbed.match(/\bsetStatus\(/g)
  return matches ? matches.length : 0
}

export function checkBatchGroupStatusScopeGuard(content: string): string[] {
  const errors: string[] = []
  const functions = extractFunctionBodies(content)

  for (const name of FN_NAMES) {
    const fn = functions.find((f) => f.name === name)
    if (!fn) {
      errors.push(
        `Could not find a function named ${name}() -- has it been ` +
          'renamed, removed, or inlined? If so, this guard (and the bug it ' +
          'protects against) needs to move with it.',
      )
      continue
    }

    if (!RUN_ID_CAPTURE.test(fn.body)) {
      errors.push(
        `${name}() no longer captures a runId (\`const runId = state.run?.id\`` +
          " or `state.run.id`) up front -- without it, this function's own " +
          'completion toast can never be scoped to the run it was acting on, ' +
          'and a group action that finishes after the user has switched runs ' +
          'via History will surface a misleading toast in whatever run is ' +
          'now on screen.',
      )
    }

    const bareCount = findUnguardedBareSetStatusCalls(fn.body)
    if (bareCount > 0) {
      errors.push(
        `${name}() still calls the bare, unscoped setStatus(...) ` +
          `${bareCount} time(s) outside of a \`state.run?.id === runId\` ` +
          "guard -- this function's own completion toast must go through " +
          'setStatusForRun(runId, ...) (or be wrapped in that same runId ' +
          'check), mirroring draftText/generateItemAsset/commitItem/' +
          'pushItem/batchPushItems/autoBuildRun.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkBatchGroupStatusScopeGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder batch-group status-scope guard contract failed in ' +
        'modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder batch-group status-scope guard contract passed: ' +
      'batchDraftField/batchSetField/batchApproveStage/batchAutoBuild each ' +
      'capture their own runId and route their completion toast through ' +
      'setStatusForRun(runId, ...) (or an equivalent state.run?.id === ' +
      'runId guard).',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
