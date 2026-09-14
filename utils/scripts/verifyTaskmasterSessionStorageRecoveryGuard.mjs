// /utils/scripts/verifyTaskmasterSessionStorageRecoveryGuard.mjs
//
// Taskmaster quest durability, pinned against the surface that now holds it
// (storybook/t-047).
//
// REWRITTEN, NOT REPLACED. Until 2026-09-14 this guarded a recovery path:
// stores/taskmasterStore.ts kept a whole quest in a `taskmaster-session`
// localStorage blob, and restoreFromLocalStorage()'s catch block had to clean
// up inside its OWN try/catch, because a browser that just failed a read can
// fail the removeItem too and take the session down with it.
//
// That hazard is not fixed, it is GONE: a taskmaster quest is a server-side run
// now (LifeRun.questLedger), so there is no browser-held quest to lose, recover,
// or fail to clean up. The honest successor assertion is therefore the negative
// one -- nothing may put a taskmaster quest back in localStorage -- plus the
// positive rule the new store actually lives by: the only thing kept in the
// browser is WHICH RUN to reopen, and every access to it is best-effort.
//
// This matters beyond tidiness. A quest holds real work: real to-dos, real
// needs-human decisions, real proposals that have not been applied yet. Storing
// any of that client-side means a cleared cache silently drops a record of what
// someone agreed to and what they did not. A row does not do that.
//
// storybookStore.ts's own localStorage recovery is still guarded, separately and
// unchanged, by verifyStorybookSessionStorageRecoveryGuard.mjs. That store is
// the last client beat loop and storybook/t-037 retires it.

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractTsFunctionBody } from './lib/extractTsFunctionBody.mjs'

function source(path) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

// --- the quest is a row, not a blob ------------------------------------------

const RETIRED_STORE = 'stores/taskmasterStore.ts'
assert.ok(
  !existsSync(resolve(process.cwd(), RETIRED_STORE)),
  `${RETIRED_STORE} is back. A taskmaster quest is a server-side run (LifeRun.questLedger); re-introducing a client-held session re-introduces the recovery hazard this guard used to police, and loses unapplied proposals on a cleared cache.`,
)

const RUN_STORE_PATH = 'stores/storybookRunStore.ts'
const runStore = source(RUN_STORE_PATH)

assert.ok(
  !/taskmaster-session/.test(runStore),
  `${RUN_STORE_PATH} must not persist a taskmaster session in the browser.`,
)
assert.ok(
  /questLedger|quest/.test(runStore),
  `${RUN_STORE_PATH} must still be the store that carries the quest.`,
)

// The quest reaches the client through the run payload and goes back through the
// apply route -- never through storage.
assert.match(
  runStore,
  /async function applyProposal\(/,
  `${RUN_STORE_PATH} must keep applyProposal() as the client's only way to land a proposal.`,
)
assert.match(
  runStore,
  /\/proposals\/\$\{encodeURIComponent\(proposalId\)\}\/apply/,
  `${RUN_STORE_PATH}'s applyProposal() must call the authenticated apply route rather than mutating local state.`,
)

// --- what IS kept in the browser stays best-effort ---------------------------
// One integer: which run to reopen. Both accessors must swallow a storage
// failure, for the same reason the old catch-inside-catch existed -- a private
// window or a blocked-storage browser must lose resume-on-reload and nothing
// else.

for (const fn of ['readStoredRunId', 'writeStoredRunId']) {
  const body = extractTsFunctionBody(runStore, fn, {
    path: RUN_STORE_PATH,
    notFoundHint:
      'If the active-run pointer moved, move this durability guard with it.',
  })
  assert.match(
    body,
    /try\s*\{[\s\S]*?\}\s*catch\s*\{[\s\S]*?\}/,
    `${RUN_STORE_PATH} ${fn}() must wrap its localStorage access in try/catch: a browser with storage blocked must lose resume-on-reload and nothing else.`,
  )
  assert.match(
    body,
    /typeof localStorage === 'undefined'/,
    `${RUN_STORE_PATH} ${fn}() must tolerate a server-side render where localStorage does not exist at all.`,
  )
}

assert.match(
  runStore,
  /const ACTIVE_RUN_STORAGE_KEY = 'storybook-active-run-id'/,
  `${RUN_STORE_PATH} must keep the active-run pointer as the ONLY browser-held storybook state.`,
)

console.log(
  'Taskmaster session storage contract passed: the quest is a server-side row, no client session can strand unapplied proposals, and the one browser-held pointer degrades safely.',
)
