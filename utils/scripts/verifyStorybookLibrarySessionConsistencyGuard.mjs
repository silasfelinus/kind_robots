// /utils/scripts/verifyStorybookLibrarySessionConsistencyGuard.mjs
//
// Hardening guard (storybook/t-010). The previous t-010 bug-hunt cycle left
// two latent, not-concrete-enough-to-fix observations about
// storybookLibraryHelper.ts open for a future cycle. Neither had a
// constructed live repro after tracing every reachable call path, but both
// close a code-shape gap that matches a bug class this task has fixed for
// real before, so this cycle applied them proactively and pins the shape:
//
//   1. cloneSession() is the single choke point every library read/write
//      passes a session through (library.initialize(), openStory(),
//      duplicateStory()/remapDuplicate(), restartStory(), buildExport()),
//      but unlike normalizeRestoredSession() (storybookStore.ts's own
//      restore-path normalizer), it never backfilled a beat missing
//      `stateDelta`. The only current consumer
//      (narrativeArtMilestones.ts's hasMeaningfulStateDelta(), via the
//      milestone-art plugin) never actually reaches an affected beat today
//      -- its seen-beats gating only ever scans a freshly-generated beat,
//      which always has a valid stateDelta from parseGeneratedBeat() -- but
//      a session saved before this field existed, or by a future schema
//      change, would crash the first consumer that reads
//      `beat.stateDelta.consequences` off a library-sourced session.
//
//   2. openStory() unconditionally sourced from the archived library
//      snapshot (`findStory(sessionId)`), while its two siblings --
//      duplicateStory() and restartStory() -- both prefer the live
//      in-memory session when its id matches the request
//      (`current?.id === sessionId ? current : findStory(sessionId)`). No
//      reachable data-loss window was found (the library's deep watcher
//      archives every session mutation via a microtask that always flushes
//      before the browser can dispatch the next click), but the asymmetry
//      was still a latent trap for the next edit to assume all three
//      source identically.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractTsFunctionBody } from './lib/extractTsFunctionBody.mjs'

const HELPER_PATH = 'stores/helpers/storybookLibraryHelper.ts'

function extractFunctionBody(content, name) {
  return extractTsFunctionBody(content, name, {
    path: HELPER_PATH,
    notFoundHint:
      'has it been renamed, removed, or inlined? If so, this guard needs to move with it.',
  })
}

const content = readFileSync(resolve(process.cwd(), HELPER_PATH), 'utf8')

const cloneSessionBody = extractFunctionBody(content, 'cloneSession')

assert.ok(
  /stateDelta:\s*beat\.stateDelta\s*\?\?\s*emptyStateDelta\(\)/.test(
    cloneSessionBody,
  ),
  `cloneSession() in ${HELPER_PATH} must backfill a beat missing ` +
    '`stateDelta` with `emptyStateDelta()` -- the same fallback ' +
    'normalizeRestoredSession() applies on the localStorage-restore path in ' +
    'storybookStore.ts -- otherwise a beat saved before this field existed ' +
    '(or missing it for any other reason) reaches the first consumer that ' +
    'reads `beat.stateDelta.consequences` off a library-sourced session as ' +
    '`undefined.consequences`.',
)

const openStoryBody = extractFunctionBody(content, 'openStory')

assert.ok(
  /const current = bridge\.getSession\(\)/.test(openStoryBody) &&
    /current\?\.id === sessionId\s*\?\s*current\s*:\s*findStory\(sessionId\)/.test(
      openStoryBody,
    ),
  `openStory() in ${HELPER_PATH} must prefer the live in-memory session ` +
    'over the archived library snapshot when the requested id matches the ' +
    'current session -- the same sourcing duplicateStory() and ' +
    'restartStory() already use -- so opening the currently-active story ' +
    'can never step backwards to a stale archived copy.',
)

console.log(
  'Storybook library session-consistency guard contract passed: ' +
    'cloneSession() backfills a missing stateDelta and openStory() sources ' +
    "from the live session when ids match, matching duplicateStory()'s and " +
    "restartStory()'s existing pattern.",
)
