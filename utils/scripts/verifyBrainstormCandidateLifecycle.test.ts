// /utils/scripts/verifyBrainstormCandidateLifecycle.test.ts
//
// conductor brainstorm/t-021: deterministic fixtures around candidate state
// transitions, regeneration lineage, and save/reopen restore -- the areas
// this project's existing Brainstorm coverage left as source-text shape
// checks only (verifyBrainstormStoreContract.mjs's requireText assertions
// confirm a string like "reason: 'regenerated'" appears somewhere in the
// file; it never actually calls the code and checks what happens).
//
// stores/brainstormStore.ts's candidate-transition logic (setCandidateStatus,
// editCandidate, restoreCandidateRevision, replaceCandidateWithGenerated,
// appendBranchCandidate's branch-origin stamp) previously lived only inside
// the store's Pinia setup closure, coupled to candidates.value -- and
// brainstormStore.ts itself cannot be imported from a plain `tsx` process:
// it pulls in useServerStore -> userStore -> achievementStore, and
// achievementStore.ts calls the Vite-only `import.meta.glob(...)` at module
// load time. This task moved the pure normalizers and the candidate
// mutation logic (applyCandidateStatus/applyCandidateEdit/
// applyCandidateRevisionRestore/applyCandidateRegeneration/
// computeBranchOrigin) into stores/helpers/brainstormCandidateLifecycle.ts,
// which has no such dependency -- the same split already used for
// brainstormSourceAdapterKit.ts/brainstormSourceContextKit.ts, and for the
// same reason. brainstormStore.ts imports them back and its own action
// functions are now thin findCandidate-then-delegate wrappers; that wiring
// is still covered by verifyBrainstormStoreContract.mjs. This file is what
// actually calls the logic and checks what happens -- same "test real
// logic, not shape" standard verifyBrainstormGeneration.ts already holds
// the parser to.
//
// Save/reopen is split two ways in this codebase: the SERVER-side
// persistence round-trip (brainstormSessionData/normalizeBrainstormSession
// SaveRequest/storedBrainstormSession) already has deep coverage in
// verifyBrainstormPersistence.ts. The CLIENT-side restore path -- what
// normalizeStoredCandidate/normalizeStoredBatch turn a GET/localStorage
// payload back into -- had none; that gap is closed below.
import assert from 'node:assert/strict'
import {
  applyCandidateEdit,
  applyCandidateRegeneration,
  applyCandidateRevisionRestore,
  applyCandidateStatus,
  classifyError,
  computeBranchOrigin,
  normalizeBranchOrigin,
  normalizeGeneratedCandidates,
  normalizeRevision,
  normalizeStoredBatch,
  normalizeStoredCandidate,
} from '../../stores/helpers/brainstormCandidateLifecycle'
import type { BrainstormCandidate } from '../../types/brainstorm'

function baseCandidate(
  overrides: Partial<BrainstormCandidate> = {},
): BrainstormCandidate {
  return {
    id: 'candidate-1',
    batchId: 'batch-1',
    title: 'Glass Choir',
    text: 'A choir performs with sugar-glass mouths that shatter on the high notes.',
    status: 'pending',
    feedback: '',
    edited: false,
    parentId: null,
    revisions: [
      {
        title: 'Glass Choir',
        text: 'A choir performs with sugar-glass mouths that shatter on the high notes.',
        createdAt: '2026-08-10T12:00:00.000Z',
        reason: 'generated',
        returnType: null,
      },
    ],
    meta: { source: null, returnType: null, branchOrigin: null },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// applyCandidateStatus -- keep/reject/reset transitions
// ---------------------------------------------------------------------------

{
  const candidate = baseCandidate({ feedback: 'too safe' })
  applyCandidateStatus(candidate, 'kept')
  assert.equal(candidate.status, 'kept')
  assert.equal(
    candidate.feedback,
    '',
    'keeping a candidate must clear stale reject feedback',
  )
}

{
  const candidate = baseCandidate({ feedback: 'too safe' })
  applyCandidateStatus(candidate, 'rejected')
  assert.equal(candidate.status, 'rejected')
  assert.equal(
    candidate.feedback,
    'too safe',
    'rejecting must NOT clear feedback -- it is the reason the reviewer is recording',
  )
}

{
  const candidate = baseCandidate({ status: 'rejected', feedback: 'too safe' })
  applyCandidateStatus(candidate, 'pending')
  assert.equal(candidate.status, 'pending')
  assert.equal(
    candidate.feedback,
    'too safe',
    'resetting to pending must preserve feedback -- only kept clears it',
  )
}

// ---------------------------------------------------------------------------
// applyCandidateEdit -- revision push on real change, no-op skip, rejection
// ---------------------------------------------------------------------------

{
  const candidate = baseCandidate()
  const ok = applyCandidateEdit(candidate, {
    text: 'A choir of glass mouths shatters on cue.',
  })
  assert.equal(ok, true)
  assert.equal(candidate.text, 'A choir of glass mouths shatters on cue.')
  assert.equal(
    candidate.title,
    'Glass Choir',
    'an undefined title in the patch must leave the existing title alone',
  )
  assert.equal(candidate.edited, true)
  assert.equal(candidate.revisions.length, 2)
  assert.equal(candidate.revisions[1]?.reason, 'edited')
  assert.equal(
    candidate.revisions[1]?.text,
    'A choir of glass mouths shatters on cue.',
  )
}

{
  // Re-submitting the exact same title/text (e.g. a form re-save with no
  // actual change) must not fabricate a revision entry.
  const candidate = baseCandidate()
  const ok = applyCandidateEdit(candidate, {
    title: 'Glass Choir',
    text: candidate.text,
  })
  assert.equal(ok, true)
  assert.equal(
    candidate.revisions.length,
    1,
    'a no-op edit must not push a new revision',
  )
  assert.equal(candidate.edited, false)
}

{
  const candidate = baseCandidate()
  const ok = applyCandidateEdit(candidate, { text: '   ' })
  assert.equal(ok, false, 'blanking the text entirely must be rejected')
  assert.equal(
    candidate.text,
    baseCandidate().text,
    'a rejected edit must leave the candidate untouched',
  )
  assert.equal(candidate.revisions.length, 1)
}

// ---------------------------------------------------------------------------
// applyCandidateRevisionRestore -- exact restoration, no-op skip, bad index
// ---------------------------------------------------------------------------

{
  const candidate = baseCandidate({
    title: 'Current Title',
    text: 'Current text after an edit.',
    meta: { source: null, returnType: 'dark-humor', branchOrigin: null },
    revisions: [
      {
        title: 'Glass Choir',
        text: 'A choir performs with sugar-glass mouths that shatter on the high notes.',
        createdAt: '2026-08-10T12:00:00.000Z',
        reason: 'generated',
        returnType: 'pun',
      },
      {
        title: 'Current Title',
        text: 'Current text after an edit.',
        createdAt: '2026-08-10T12:05:00.000Z',
        reason: 'edited',
        returnType: 'dark-humor',
      },
    ],
  })

  const ok = applyCandidateRevisionRestore(candidate, 0)
  assert.equal(ok, true)
  assert.equal(candidate.title, 'Glass Choir')
  assert.equal(
    candidate.text,
    'A choir performs with sugar-glass mouths that shatter on the high notes.',
  )
  assert.equal(
    candidate.meta.returnType,
    'pun',
    'restoring a revision must restore its returnType too',
  )
  assert.equal(candidate.edited, true)
  assert.equal(
    candidate.revisions.length,
    3,
    'a restore is itself recorded as a new revision, not a rewind',
  )
  assert.equal(candidate.revisions[2]?.reason, 'restored')
  assert.equal(candidate.revisions[2]?.text, candidate.text)
}

{
  // Restoring the revision that already matches current state must not
  // fabricate a duplicate "restored" entry.
  const candidate = baseCandidate()
  const before = candidate.revisions.length
  const ok = applyCandidateRevisionRestore(candidate, 0)
  assert.equal(ok, true)
  assert.equal(
    candidate.revisions.length,
    before,
    'restoring the already-current revision must be a no-op',
  )
}

for (const badIndex of [-1, 1, 99, 1.5]) {
  const candidate = baseCandidate()
  const ok = applyCandidateRevisionRestore(candidate, badIndex)
  assert.equal(ok, false, `revisionIndex ${badIndex} must be rejected`)
  assert.equal(candidate.revisions.length, 1)
}

// ---------------------------------------------------------------------------
// applyCandidateRegeneration -- clears review state, records lineage
// ---------------------------------------------------------------------------

{
  const candidate = baseCandidate({
    status: 'kept',
    feedback: 'liked it but try darker',
    edited: true,
  })
  const ok = applyCandidateRegeneration(candidate, {
    title: 'Borrowed Shadows',
    text: 'People rent better shadows for important social occasions.',
    returnType: 'dry-observation',
  })
  assert.equal(ok, true)
  assert.equal(candidate.title, 'Borrowed Shadows')
  assert.equal(
    candidate.text,
    'People rent better shadows for important social occasions.',
  )
  assert.equal(
    candidate.status,
    'pending',
    'regenerating must reopen the candidate for review',
  )
  assert.equal(
    candidate.feedback,
    '',
    'regenerating must clear the feedback that prompted it',
  )
  assert.equal(
    candidate.edited,
    false,
    'a freshly regenerated candidate is not a hand edit',
  )
  assert.equal(candidate.meta.returnType, 'dry-observation')
  assert.equal(candidate.revisions.length, 2)
  assert.equal(candidate.revisions[1]?.reason, 'regenerated')
}

{
  const candidate = baseCandidate()
  const ok = applyCandidateRegeneration(candidate, { text: '' })
  assert.equal(ok, false, 'an empty regenerated text must be rejected')
  assert.equal(candidate.revisions.length, 1)
}

{
  // A regeneration response with no returnType must fall back to the
  // candidate's existing one rather than clearing it.
  const candidate = baseCandidate({
    meta: { source: null, returnType: 'inversion', branchOrigin: null },
  })
  applyCandidateRegeneration(candidate, {
    text: 'A fresh mechanism with no declared lens.',
  })
  assert.equal(candidate.meta.returnType, 'inversion')
}

// ---------------------------------------------------------------------------
// computeBranchOrigin -- exact parent-revision lineage stamp
// ---------------------------------------------------------------------------

{
  const parent = baseCandidate({
    id: 'parent-1',
    title: 'Useful Idea',
    text: 'A character is slowly laminated during an argument.',
    revisions: [
      baseCandidate().revisions[0]!,
      { text: 'edit 1', createdAt: 't1', reason: 'edited', returnType: null },
      { text: 'edit 2', createdAt: 't2', reason: 'edited', returnType: null },
    ],
  })
  const origin = computeBranchOrigin(parent)
  assert.deepEqual(origin, {
    candidateId: 'parent-1',
    revisionIndex: 2,
    title: 'Useful Idea',
    text: 'A character is slowly laminated during an argument.',
  })
}

{
  // A single-revision parent must clamp to index 0, never negative.
  const parent = baseCandidate({ id: 'parent-2' })
  const origin = computeBranchOrigin(parent)
  assert.equal(origin.revisionIndex, 0)
}

{
  const parent = baseCandidate({ id: 'parent-3', title: '' })
  const origin = computeBranchOrigin(parent)
  assert.ok(
    !('title' in origin),
    'an empty parent title must not appear as an empty-string key',
  )
}

// ---------------------------------------------------------------------------
// classifyError -- status -> error-kind mapping
// ---------------------------------------------------------------------------

assert.equal(classifyError(401), 'auth')
assert.equal(classifyError(402), 'mana')
assert.equal(classifyError(408), 'network')
assert.equal(classifyError(404), 'server')
assert.equal(classifyError(503), 'server')
assert.equal(classifyError(500), 'provider')
assert.equal(classifyError(529), 'provider')
assert.equal(
  classifyError(undefined),
  'network',
  'no status at all falls back to network, not provider',
)
assert.equal(classifyError(0), 'network')

// ---------------------------------------------------------------------------
// normalizeGeneratedCandidates -- the STORE's own exact-duplicate client-side
// sanity check on a generation response, distinct from the server-side
// parser's near-duplicate (Jaccard) check already covered in
// verifyBrainstormGeneration.ts. This one had zero prior coverage.
// ---------------------------------------------------------------------------

{
  const result = normalizeGeneratedCandidates(
    [
      { title: 'A', text: 'First distinct idea.' },
      { title: 'B', text: 'Second distinct idea.' },
    ],
    2,
  )
  assert.equal(result?.length, 2)
}

assert.equal(
  normalizeGeneratedCandidates(
    [{ text: 'Same idea.' }, { text: '  same   idea.  ' }],
    2,
  ),
  null,
  'whitespace/case-normalized exact duplicates must be rejected',
)

assert.equal(
  normalizeGeneratedCandidates([{ text: 'Only one.' }], 2),
  null,
  'a short response must be rejected even if every entry is otherwise valid',
)

assert.equal(
  normalizeGeneratedCandidates('not-an-array', 1),
  null,
  'a non-array payload must be rejected outright',
)

assert.equal(
  normalizeGeneratedCandidates([{ title: 'No text field' }], 1),
  null,
  'an entry with no usable text must reject the whole batch',
)

// ---------------------------------------------------------------------------
// Client-side save/reopen restore -- normalizeStoredCandidate /
// normalizeStoredBatch round-tripping a realistic session payload, the way
// openSavedSession()/restoreSession() consume a GET or localStorage read.
// ---------------------------------------------------------------------------

{
  const stored = {
    id: 'candidate-9',
    batchId: 'batch-9',
    title: 'Compliance Vanilla',
    text: 'Vanilla served with a forty-page terms-of-service agreement nobody reads.',
    status: 'kept',
    feedback: '',
    edited: true,
    parentId: 'candidate-1',
    revisions: [
      {
        title: 'Compliance Vanilla',
        text: 'Vanilla served with paperwork.',
        createdAt: '2026-08-10T12:00:00.000Z',
        reason: 'branched',
        returnType: 'dry-observation',
      },
      {
        title: 'Compliance Vanilla',
        text: 'Vanilla served with a forty-page terms-of-service agreement nobody reads.',
        createdAt: '2026-08-10T12:05:00.000Z',
        reason: 'edited',
        returnType: 'dry-observation',
      },
    ],
    meta: {
      source: {
        modelType: 'Character',
        id: 42,
        intent: 'art prompt variations',
      },
      returnType: 'dry-observation',
      branchOrigin: {
        candidateId: 'candidate-1',
        revisionIndex: 0,
        title: 'Glass Choir',
        text: 'A choir performs with sugar-glass mouths that shatter on the high notes.',
      },
    },
  }

  // JSON round trip -- exactly what a GET response or a JSON.parse(localStorage...) read is.
  const restored = normalizeStoredCandidate(JSON.parse(JSON.stringify(stored)))
  assert.ok(restored)
  assert.equal(restored?.id, 'candidate-9')
  assert.equal(restored?.parentId, 'candidate-1')
  assert.equal(restored?.status, 'kept')
  assert.equal(restored?.revisions.length, 2)
  assert.equal(restored?.revisions[0]?.reason, 'branched')
  assert.equal(restored?.revisions[1]?.reason, 'edited')
  assert.equal(restored?.meta.source?.modelType, 'Character')
  assert.equal(restored?.meta.source?.id, 42)
  assert.equal(restored?.meta.branchOrigin?.candidateId, 'candidate-1')
  assert.equal(restored?.meta.branchOrigin?.revisionIndex, 0)
}

{
  // A candidate with no stored revisions (older/malformed payload) must
  // synthesize one from its current title/text/status rather than restoring
  // with an empty lineage.
  const restored = normalizeStoredCandidate({
    id: 'candidate-10',
    batchId: 'batch-9',
    title: 'Bare',
    text: 'No history was ever recorded for this one.',
    status: 'pending',
    revisions: [],
  })
  assert.ok(restored)
  assert.equal(restored?.revisions.length, 1)
  assert.equal(restored?.revisions[0]?.reason, 'generated')
  assert.equal(
    restored?.revisions[0]?.text,
    'No history was ever recorded for this one.',
  )
}

for (const bad of [
  { id: '', batchId: 'b', text: 't', status: 'pending' },
  { id: 'c', batchId: '', text: 't', status: 'pending' },
  { id: 'c', batchId: 'b', text: '', status: 'pending' },
  { id: 'c', batchId: 'b', text: 't', status: 'archived' },
  null,
  'a string',
]) {
  assert.equal(
    normalizeStoredCandidate(bad),
    null,
    `malformed candidate payload must be rejected: ${JSON.stringify(bad)}`,
  )
}

{
  const batch = normalizeStoredBatch({
    id: 'batch-9',
    createdAt: '2026-08-10T12:00:00.000Z',
    premise: 'Invent terrible ice cream flavors',
    candidateIds: ['candidate-9', 'candidate-10'],
    request: {
      premise: 'Invent terrible ice cream flavors',
      count: 4,
      mode: 'darker-funnier',
      outputDomain: 'art-prompts',
      batchShape: 'assortment',
      returnTypes: [{ id: 'dark-humor', count: 2 }],
    },
  })
  assert.ok(batch)
  assert.equal(batch?.candidateIds.length, 2)
  assert.equal(batch?.request.mode, 'darker-funnier')
  assert.equal(batch?.request.outputDomain, 'art-prompts')
  assert.equal(batch?.request.batchShape, 'assortment')
  assert.equal(batch?.request.returnTypes?.[0]?.id, 'dark-humor')
}

assert.equal(
  normalizeStoredBatch({
    id: 'batch-empty',
    createdAt: '2026-08-10T12:00:00.000Z',
    premise: 'Invent something',
    candidateIds: [],
  }),
  null,
  'a batch with no surviving candidate ids must be rejected, not restored empty',
)

{
  // A malformed/missing request object must fall back to safe defaults
  // rather than restoring undefined into the generation composer.
  const batch = normalizeStoredBatch({
    id: 'batch-legacy',
    createdAt: '2026-08-10T12:00:00.000Z',
    premise: 'Invent something',
    candidateIds: ['candidate-1'],
  })
  assert.ok(batch)
  assert.equal(batch?.request.mode, 'freeform')
  assert.equal(batch?.request.outputDomain, 'ideas')
  assert.equal(batch?.request.batchShape, 'focused')
  assert.deepEqual(batch?.request.returnTypes, [])
}

// ---------------------------------------------------------------------------
// normalizeRevision / normalizeBranchOrigin -- invalid-input rejection
// ---------------------------------------------------------------------------

assert.equal(
  normalizeRevision({
    text: 'ok',
    createdAt: 't',
    reason: 'not-a-real-reason',
  }),
  null,
  'an unrecognized revision reason must be rejected',
)
assert.equal(
  normalizeRevision({ text: '', createdAt: 't', reason: 'edited' }),
  null,
  'a revision with no text must be rejected',
)
assert.ok(normalizeRevision({ text: 'ok', createdAt: 't', reason: 'restored' }))

assert.equal(
  normalizeBranchOrigin({ candidateId: 'c', revisionIndex: -1, text: 't' }),
  null,
  'a negative revisionIndex must be rejected',
)
assert.equal(
  normalizeBranchOrigin({ candidateId: '', revisionIndex: 0, text: 't' }),
  null,
  'a branch origin with no candidateId must be rejected',
)
assert.ok(
  normalizeBranchOrigin({ candidateId: 'c', revisionIndex: 0, text: 't' }),
)

console.log('Brainstorm candidate lifecycle contract passed.')
