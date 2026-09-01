// /utils/scripts/verifyModelBuilderRunEpochGuard.ts
//
// Regression guard (model-builder/t-029, cycle 76). Cycle 75 fixed
// autoBuildRun()/batchDraftField()/batchSetField()/batchApproveStage()/
// batchAutoBuild() so their loop-abort checks and `finally`-block flag
// clears only fire `if (state.run?.id === runId)` -- i.e. only while the
// run they started for is still the active one (see
// verifyModelBuilderCrossRunReleaseGuard.ts for that fix's own guard).
//
// A captured run id is not a one-shot token, though. openRun()'s
// cached-adopt branch reuses the exact same cached run object on a revisit,
// and state.runs is never purged by resetRun(), so reopening the SAME run
// after abandoning it (e.g. "New run" mid auto-build, then History → Open
// on the run just left) makes `state.run?.id === runId` true again even
// though the abandon event already happened. Concrete repro: start
// "Auto-build all" on Run A (several items, each a real await), click "New
// run" mid-loop (resetRun() clears state.run/state.autoBuilding
// immediately, but the abandoned loop keeps awaiting -- JS doesn't cancel
// in-flight promises), then reopen Run A from History before the abandoned
// loop's next iteration runs. `state.run?.id === runId` now reads true
// again, so the abandoned loop's per-iteration guard no longer stops it: it
// keeps processing Run A's remaining items in the background while the user
// believes they're looking at a fresh, idle run, and its `finally` can
// later clear/stomp a genuinely new operation's own in-flight flag.
//
// Fixed with a monotonic `runEpoch` counter, bumped once at every "abandon
// the active run's in-flight work" site (resetRun, resetAll, openRun's two
// adopt-a-different-run branches, resumeRun's adopt-a-different-run
// branch) -- never reused, so unlike a run id it reliably distinguishes
// "still the same continuous session on this run" from "abandoned this
// run, then later revisited the same run id". autoBuildRun and the four
// batch functions each capture `const epoch = runEpoch` alongside their
// existing `runId` capture and additionally require `runEpoch === epoch`
// everywhere they previously checked only `state.run?.id === runId`.
//
// This guard asserts both halves of that fix stay in place: every abandon
// site still bumps runEpoch, and every one of the five run/batch operation
// functions still captures and re-checks its own epoch. If a future
// refactor drops either half, this fails loudly rather than silently
// reopening the revisit race for just that entry point.
//
// Cycle 77 closed a gap in the fix itself, not just the guard: batchDraftField
// captured and re-checked its epoch in its finally block (per the above) but,
// unlike autoBuildRun/batchAutoBuild, never checked it inside its own
// per-item loop -- so a revisited run's abandoned draft pass kept awaiting
// draftText for the run's remaining items instead of stopping. Fixed the
// same way as the other two loops, and LOOPING_FUNCTIONS below now covers
// all three.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const RUN_EPOCH_DECLARATION = /let\s+runEpoch\s*=\s*0/
const EPOCH_BUMP = /runEpoch\+\+/
const EPOCH_CAPTURE = /const\s+epoch\s*=\s*runEpoch/
const EPOCH_CHECK = /runEpoch\s*===\s*epoch/
const EPOCH_MISMATCH_CHECK = /runEpoch\s*!==\s*epoch/

// Functions that must abandon the active run's in-flight work by bumping
// runEpoch (in addition to their existing singleton clears).
const ABANDON_FUNCTIONS = [
  'resetRun',
  'resetAll',
  'openRun',
  'resumeRun',
] as const

// openRun() has two abandon branches (cached-adopt, freshly-fetched-adopt);
// every other abandon function only has one.
const MIN_BUMPS_PER_FUNCTION: Record<
  (typeof ABANDON_FUNCTIONS)[number],
  number
> = {
  resetRun: 1,
  resetAll: 1,
  openRun: 2,
  resumeRun: 1,
}

// Functions whose loop-abort check (not just their finally block) must also
// check runEpoch -- the three entry points with a per-item-await loop that
// can span a run revisit mid-pass, mirroring their existing runId-mismatch
// check. batchDraftField joined autoBuildRun/batchAutoBuild here in cycle 77
// -- it awaits draftText once per item, same shape as the other two, but its
// loop had no abort check at all pre-fix (only its finally-block release was
// epoch-guarded, from cycle 76). batchSetField/batchApproveStage stay out of
// this list on purpose: their per-item loops build up a payload
// synchronously with no await inside the loop body, then await once via a
// single batchPushItems() call after the loop -- there's no per-iteration
// await to abandon mid-loop, so a loop-abort check would have nothing to
// guard.
const LOOPING_FUNCTIONS = [
  'autoBuildRun',
  'batchDraftField',
  'batchAutoBuild',
] as const

// All five run/batch operation functions whose finally block releases a
// store-wide "in flight" flag and must therefore re-check both the run id
// and the epoch before doing so.
const RELEASE_FUNCTIONS = [
  'autoBuildRun',
  'batchDraftField',
  'batchSetField',
  'batchApproveStage',
  'batchAutoBuild',
] as const

export function checkRunEpochGuard(content: string): string[] {
  const errors: string[] = []

  if (!RUN_EPOCH_DECLARATION.test(content)) {
    errors.push(
      'Could not find `let runEpoch = 0` -- has the run-epoch counter been ' +
        'renamed, removed, or changed to a different declaration shape? If ' +
        'so, this guard (and the fix it protects) needs to move with it.',
    )
  }

  const functions = extractFunctionBodies(content)

  for (const name of ABANDON_FUNCTIONS) {
    const fn = functions.find((f) => f.name === name)
    if (!fn) {
      errors.push(
        `Could not find a function named ${name}() -- has it been renamed, ` +
          'removed, or inlined? If so, this guard needs to move with it.',
      )
      continue
    }
    const bumps = fn.body.match(new RegExp(EPOCH_BUMP.source, 'g'))
    const bumpCount = bumps ? bumps.length : 0
    const required = MIN_BUMPS_PER_FUNCTION[name]
    if (bumpCount < required) {
      errors.push(
        `${name}() bumps runEpoch ${bumpCount} time(s), expected at least ` +
          `${required} -- every branch that abandons the active run's ` +
          'in-flight work must bump runEpoch, or a revisit of the same ' +
          "run id after abandoning it won't be distinguishable from never " +
          'having left (model-builder/t-029, cycle 76).',
      )
    }
  }

  for (const name of RELEASE_FUNCTIONS) {
    const fn = functions.find((f) => f.name === name)
    if (!fn) {
      errors.push(
        `Could not find a function named ${name}() -- has it been renamed, ` +
          'removed, or inlined? If so, this guard needs to move with it.',
      )
      continue
    }
    if (!EPOCH_CAPTURE.test(fn.body)) {
      errors.push(
        `${name}() no longer captures \`const epoch = runEpoch\` -- ` +
          'without it, this function cannot tell a same-run revisit apart ' +
          'from an uninterrupted session on the same run.',
      )
      continue
    }
    const finallyMatch = /finally\s*\{([\s\S]*?)\n {4}\}/.exec(fn.body)
    const finallyBody = finallyMatch?.[1] ?? ''
    if (!EPOCH_CHECK.test(finallyBody)) {
      errors.push(
        `${name}()'s finally block no longer checks \`runEpoch === epoch\` ` +
          'before clearing/releasing its in-flight flag -- an abandoned ' +
          'call revisiting the same run id (state.run?.id === runId reads ' +
          "true again) can silently clear a brand-new operation's own " +
          'in-flight flag out from under it (model-builder/t-029, cycle 76).',
      )
    }
  }

  for (const name of LOOPING_FUNCTIONS) {
    const fn = functions.find((f) => f.name === name)
    if (!fn) {
      // Already reported above via RELEASE_FUNCTIONS.
      continue
    }
    if (!EPOCH_MISMATCH_CHECK.test(fn.body)) {
      errors.push(
        `${name}()'s per-item loop no longer checks \`runEpoch !== epoch\` ` +
          'to abort -- a revisited run (same id, but abandoned and later ' +
          "reopened mid-loop) would keep walking the abandoned pass's " +
          'remaining items instead of stopping (model-builder/t-029, ' +
          'cycle 76).',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkRunEpochGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder run-epoch guard contract failed in modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder run-epoch guard contract passed: every abandon site ' +
      'bumps runEpoch, autoBuildRun()/batchDraftField()/batchSetField()/' +
      'batchApproveStage()/batchAutoBuild() each capture and re-check their ' +
      'own epoch before clearing/releasing their in-flight flag, and ' +
      "autoBuildRun()/batchDraftField()/batchAutoBuild()'s own per-item " +
      'loops abort on an epoch mismatch too.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
