// /utils/scripts/verifyModelBuilderAsyncFetchStalenessCoverage.ts
//
// Coverage guard (model-builder/t-044, kaizen from t-029 / kind_robots PR
// #1882). The monotonic request-ticket pattern (fetchRunsRequestId, then
// openRunRequestId) has been hand-applied to modelBuilderStore.ts across
// three separate bug-hunt cycles, each time found by a fresh manual
// read-through rather than any automated check -- see
// verifyModelBuilderFetchRunsStalenessGuard.ts,
// verifyModelBuilderOpenRunRequestGuard.ts, and loadSources' own
// `requestedType` fix that predates both.
//
// A literal "every performFetch call site must use a monotonic counter"
// requirement turns out to be the WRONG generalization once every call site
// is actually read (this guard's own research pass, 2026-08-14): the store
// uses several genuinely different, independently-correct staleness idioms
// depending on what the function does with the response:
//   - ticket-counter: fetchRuns/openRun -- an incrementing counter, re-entrant
//     calls are expected and the newest one must win.
//   - capture-compare: loadSources/draftText -- a value snapshotted at the
//     top of the call (state.sourceType, the field's live text) is compared
//     against its live equivalent before applying the response, instead of a
//     separate counter variable.
//   - cancelled-run-check: commitItem -- `cancelledRunIds.has(runId)`, since
//     the thing that can go stale here is "the run was cancelled," not "a
//     newer call of the same kind superseded this one."
//   - identity-check: resumeRun -- compares the fetched run's id against
//     state.run's current id before deciding to replace vs. no-op, so an
//     in-flight async poll's object reference is never orphaned.
//   - serialized-lock: startRun -- a boolean (state.startingRun) blocks a
//     second call from ever starting while the first is in flight, so no two
//     calls can race in the first place; nothing to compare on response.
//   - write-only: pushItem/batchPushItems/recordArtifact/cancelRun -- the
//     response is only ever consulted for `.success`/`.message`; nothing
//     from `.data` is written into shared state, so an out-of-order response
//     has nothing to corrupt.
//
// So this guard does NOT re-demand the ticket-counter shape everywhere --
// the individual guards above already assert that exact shape for the two
// functions where it's the right fix, and would themselves fail if it
// regressed. What NONE of the individual guards do is notice a brand new
// performFetch call site showing up somewhere else in the file with no
// staleness idiom recorded for it at all -- exactly how every one of the
// existing guards came to exist (a fresh manual read-through, not a CI
// signal). This is that missing signal: it enumerates every function that
// calls performFetch(, requires each to appear in the registry below with a
// classified guardKind, and fails loudly on anything unregistered so the
// next bug-hunt cycle has to make and record a real decision about it
// instead of it silently shipping unaudited. It also spot-checks each
// registered entry's `marker` substring is still present, so a refactor that
// quietly deletes the actual protection (while leaving the registry entry
// behind) still fails instead of passing on stale metadata.
//
// Deliberately scoped to modelBuilderStore.ts's own top-level `function`
// declarations (via extractFunctionBodies, the same 2-space-indent
// convention every other verifyModelBuilder* guard relies on) and to literal
// `performFetch(` call sites within them. Functions that reach the same bug
// class indirectly through a delegated call (generateItemAsset/
// pollAsyncArtJob/generateItemAssetAsync calling artStore methods rather than
// performFetch directly) are out of scope here -- they already have their
// own dedicated guards (verifyModelBuilderCancelledRunGuard.ts,
// verifyModelBuilderAsyncEnqueueCancelledRunGuard.ts, etc.), the same
// per-bug-found pattern this guard's registry continues for direct
// performFetch call sites specifically.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

// Matches both a plain call (`performFetch(`) and a generic one
// (`performFetch<ServerRun>(`) -- most call sites in this store use an
// explicit type argument.
const FETCH_CALL = /performFetch[<(]/

export type StalenessGuardKind =
  | 'ticket-counter'
  | 'capture-compare'
  | 'cancelled-run-check'
  | 'identity-check'
  | 'serialized-lock'
  | 'write-only'

export interface AuditedFetchFunction {
  guardKind: StalenessGuardKind
  // A substring that must still be present in the function's body for the
  // recorded classification to still hold. Not a full re-implementation of
  // the dedicated guard (where one already exists) -- just enough to notice
  // if the protection itself has been deleted out from under the registry.
  marker: string
  rationale: string
}

// Every function in modelBuilderStore.ts known (as of this audit) to call
// performFetch(, and how it's protected against an out-of-order response.
// A new performFetch call site not listed here fails the build -- see file
// header. Keep entries in the order they appear in the store.
export const AUDITED_ASYNC_FETCH_FUNCTIONS: Record<
  string,
  AuditedFetchFunction
> = {
  loadSources: {
    guardKind: 'capture-compare',
    marker: 'state.sourceType !== requestedType',
    rationale:
      'Captures state.sourceType as requestedType before the fetch and ' +
      're-checks it in both the success and catch branches (and finally) ' +
      'before touching state.sources/state.sourcesError/state.loadingSources ' +
      '-- a rapid tab switch cannot let a slower, now-irrelevant response ' +
      'overwrite the currently selected tab.',
  },
  startRun: {
    guardKind: 'serialized-lock',
    marker: 'state.startingRun',
    rationale:
      'Entry is gated on `state.startingRun` and it is only cleared in the ' +
      'finally block, so a second startRun() cannot begin while the first ' +
      'is still in flight -- there is no concurrent call for a response to ' +
      'race against.',
  },
  pushItem: {
    guardKind: 'write-only',
    marker: 'performFetch(',
    rationale:
      'Fire-and-forget PATCH; the response is only ever read for ' +
      '`.success`/`.message` (to report a failure via the run-scoped ' +
      'setStatusForRun), never applied to shared state, so an out-of-order ' +
      'response has nothing to corrupt.',
  },
  batchPushItems: {
    guardKind: 'write-only',
    marker: 'performFetch(',
    rationale:
      'Same shape as pushItem, batched: response consulted only for ' +
      '`.success`/`.message`, never written into state.',
  },
  draftText: {
    guardKind: 'capture-compare',
    marker: 'liveValue !== current',
    rationale:
      "Captures the field's current value up front and, before applying " +
      'the AI draft, re-checks both that the live value is unchanged ' +
      '(liveValue !== current) and that the stage is still editable ' +
      '(isStageEditable) -- a manual edit or an approval that landed while ' +
      'the draft was in flight wins instead of being silently overwritten.',
  },
  recordArtifact: {
    guardKind: 'write-only',
    marker: 'if (!result.success)',
    rationale:
      'POST is only ever consulted for `.success` (to report a failure via ' +
      'setStatusForRun); no response field is written into shared state, so ' +
      'there is nothing an out-of-order response could corrupt.',
  },
  commitItem: {
    guardKind: 'cancelled-run-check',
    marker: 'cancelledRunIds.has(runId)',
    rationale:
      'The commit POST durably lands server-side regardless of ordering; ' +
      'the guard exists to stop a completion that lands after the user ' +
      'cancelled this exact run from re-attaching a detached item or ' +
      'popping a misleading "committed" toast, checked in both the success ' +
      'and catch branches.',
  },
  resumeRun: {
    guardKind: 'identity-check',
    marker: 'state.run?.id === String(data.id)',
    rationale:
      'Before replacing state.run with the fetched run, compares the ' +
      "fetched run's id against the currently active run's id -- resuming " +
      'the run that is already active must not swap in a fresh object, or ' +
      "an in-flight pollAsyncArtJob's reference to the live item would be " +
      'silently orphaned.',
  },
  fetchRuns: {
    guardKind: 'ticket-counter',
    marker: 'fetchRunsRequestId !== requestId',
    rationale:
      'Monotonic request ticket; fully asserted by its own dedicated guard, ' +
      'verifyModelBuilderFetchRunsStalenessGuard.ts. This entry only exists ' +
      "so this file's coverage sweep recognizes fetchRuns as already " +
      'audited rather than flagging it as a new, unclassified call site.',
  },
  openRun: {
    guardKind: 'ticket-counter',
    marker: 'openRunRequestId !== requestId',
    rationale:
      'Monotonic request ticket; fully asserted by its own dedicated guard, ' +
      'verifyModelBuilderOpenRunRequestGuard.ts (plus ' +
      'verifyModelBuilderOpenRunIdentityGuard.ts for the identity side). ' +
      'Same as fetchRuns above, this entry exists for coverage recognition.',
  },
  cancelRun: {
    guardKind: 'write-only',
    marker: 'if (!response.success)',
    rationale:
      'The PATCH response is only consulted for `.success`/`.message`; the ' +
      'subsequent state mutations (state.runs filter, resetRun, ' +
      'cancelledRunIds.add) are all driven by the runId parameter the ' +
      'caller already had, not by anything in the response body, so an ' +
      'out-of-order response has nothing to corrupt.',
  },
}

// A function is "write-only" only if it never assigns a `state.*` field
// directly from the fetch response's `.data` -- a real, checkable structural
// claim, not just a label. If a later edit starts doing that inside a
// function still classified 'write-only', this catches the classification
// going stale instead of silently trusting the registry text.
const STATE_FROM_RESPONSE_DATA = /state\.[\w.[\]'"]+\s*=[^;\n]*\.data\b/

export function checkAsyncFetchStalenessCoverage(content: string): string[] {
  const errors: string[] = []
  const functions = extractFunctionBodies(content)
  const byName = new Map(functions.map((f) => [f.name, f]))

  const foundFetchFunctions = functions.filter((f) => FETCH_CALL.test(f.body))

  // 1. Every function that calls performFetch( must be registered.
  for (const fn of foundFetchFunctions) {
    if (!(fn.name in AUDITED_ASYNC_FETCH_FUNCTIONS)) {
      errors.push(
        `${fn.name}() calls performFetch( but has no entry in ` +
          'AUDITED_ASYNC_FETCH_FUNCTIONS -- this is a new async-fetch call ' +
          'site with no recorded staleness classification. Read it fresh ' +
          '(does it apply the response to shared state after an await? can ' +
          'two calls race?) and add a registry entry with the guardKind it ' +
          'actually uses (see the guardKind union and existing entries for ' +
          'the shapes already in use) before merging -- do not default to ' +
          "assuming it's safe.",
      )
    }
  }

  // 2. Every registered function must still exist and still call
  // performFetch( -- catches a rename/removal the registry wasn't updated
  // for, mirroring every other verifyModelBuilder* guard's "has it moved?"
  // check.
  for (const [name, entry] of Object.entries(AUDITED_ASYNC_FETCH_FUNCTIONS)) {
    const fn = byName.get(name)
    if (!fn) {
      errors.push(
        `AUDITED_ASYNC_FETCH_FUNCTIONS has an entry for ${name}(), but no ` +
          'function by that name was found in modelBuilderStore.ts -- has ' +
          'it been renamed, removed, or inlined? If so, this registry entry ' +
          '(and the staleness protection it documents) needs to move with ' +
          'it, or be removed if the call site is genuinely gone.',
      )
      continue
    }
    if (!FETCH_CALL.test(fn.body)) {
      errors.push(
        `AUDITED_ASYNC_FETCH_FUNCTIONS has an entry for ${name}(), but its ` +
          'body no longer contains a performFetch( call -- remove the ' +
          'registry entry, or if the fetch moved to a helper it calls, ' +
          'confirm the helper (not this function) is the real call site and ' +
          'register that instead.',
      )
      continue
    }
    if (!fn.body.includes(entry.marker)) {
      errors.push(
        `${name}()'s recorded staleness-guard marker (${JSON.stringify(entry.marker)}, ` +
          `guardKind: '${entry.guardKind}') is no longer present in its body ` +
          '-- the protection this registry entry documents may have been ' +
          'removed or rewritten. Re-audit this function for the out-of-order ' +
          'response race and update the registry entry (marker and/or ' +
          'guardKind) to match what is actually there now.',
      )
    }
    if (
      entry.guardKind === 'write-only' &&
      STATE_FROM_RESPONSE_DATA.test(fn.body)
    ) {
      errors.push(
        `${name}() is classified 'write-only' (never applies the fetch ` +
          "response's .data to shared state), but its body now contains a " +
          'state assignment sourced from `.data` -- this classification is ' +
          'stale. Re-audit for an out-of-order response race and reclassify ' +
          "(likely 'ticket-counter', 'capture-compare', or 'identity-check' " +
          'depending on what it does with the response).',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkAsyncFetchStalenessCoverage(content)

  if (errors.length) {
    console.error(
      'Model Builder async-fetch staleness coverage contract failed for ' +
        'modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder async-fetch staleness coverage contract passed: every ' +
      `performFetch( call site (${Object.keys(AUDITED_ASYNC_FETCH_FUNCTIONS).length} ` +
      'functions) has a recorded staleness classification, and each ' +
      "classification's marker is still present in the store.",
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
