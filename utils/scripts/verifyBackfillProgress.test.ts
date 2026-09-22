// /utils/scripts/verifyBackfillProgress.test.ts
//
// A structural contract, not a behavioural one, because the property that
// regressed is an ORDERING property of the script's own control flow and there
// is no way to observe it without a live catalog and a live Civitai.
//
// The backfill used to do every one of its ~2,200 network round trips before
// printing a single line, so from the terminal a run that was working and a run
// wedged on a dead socket were indistinguishable for twenty-five minutes
// (Silas, 2026-09-22: "It just hangs after prisma. Maybe it's running, but
// there's no output."). Nothing in that sweep needed the network to know its own
// reach or which credential it had picked up -- those are local facts, and they
// are the two lines that answer "is this going to work at all".
//
// So: the diagnostics must be emitted before the first fetch, the fetch must
// carry a timeout, and --limit must reach the query. Each assertion below is
// one of those, and each one failed before 2026-09-22.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('./backfillLoraCategories.ts', import.meta.url)),
  'utf8',
)

const at = (needle: string): number => {
  const index = source.indexOf(needle)
  assert.notEqual(
    index,
    -1,
    `backfillLoraCategories.ts no longer contains: ${needle}`,
  )
  return index
}

// 1. Reach and credential are printed before the sweep, not after it.
const firstFetch = at('await civitaiTags(')
assert.ok(
  at('`Civitai reach:') < firstFetch,
  'The Civitai reach line must print before the first fetch, not after the whole sweep.',
)
assert.ok(
  at('Civitai auth: token found in') < firstFetch,
  'The credential line must print before the first fetch: an unauthenticated sweep this size rate-limits, and finding out afterwards costs the whole run.',
)

// 2. The sweep says how much work it is about to do, and keeps saying so.
assert.ok(
  at('Asking Civitai about') < firstFetch,
  'The run must state how many rows it will fetch before it starts fetching them.',
)
assert.match(
  source,
  /fetched % PROGRESS_EVERY === 0/,
  'The fetch loop must emit periodic progress; silence is how the old shape read as a hang.',
)

// 3. One stalled socket cannot decide how long the whole run takes.
assert.match(
  source,
  /signal:\s*AbortSignal\.timeout\(FETCH_TIMEOUT_MS\)/,
  'The Civitai fetch must carry an explicit timeout.',
)

// 4. An empty result says WHY. Collapsing "no tags", "rate-limited" and "socket
//    died" into one null is what let a 429 wall finish as a clean-looking run.
assert.match(
  source,
  /failure:\s*`HTTP \$\{response\.status\}`/,
  'A non-ok response must report its status, not silently return no tags.',
)
assert.ok(
  source.includes('429'),
  'A rate-limit wall must be called out by name: every row after it classifies on title alone.',
)

// 5. --limit reaches the query, so "is this working" costs twenty seconds.
assert.match(
  source,
  /\.\.\.\(rowLimit \? \{ take: rowLimit \} : \{\}\)/,
  '--limit must be applied at the query, not by slicing after a full fetch sweep.',
)

console.log('verifyBackfillProgress: ok')
