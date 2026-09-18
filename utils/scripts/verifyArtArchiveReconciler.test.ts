// /utils/scripts/verifyArtArchiveReconciler.test.ts
//
// Self-test for art-archive/t-008's pure planner
// (server/utils/artArchiveReconciler.ts's planArchiveReconciliation): new,
// unchanged, changed-in-place, moved (old path gone), copied (old path still
// live), and missing (known entry the scan no longer finds anywhere)
// classification. No Prisma involved -- the planner takes and returns plain
// data.
import assert from 'node:assert/strict'
import { planArchiveReconciliation, type ArchiveLedgerEntry } from '../../server/utils/artArchiveReconciler'

function entry(overrides: Partial<ArchiveLedgerEntry> = {}): ArchiveLedgerEntry {
  return { id: 1, relativePath: 'a/one.png', contentHash: 'hash-1', ...overrides }
}

function testBrandNewFileWithNoLedgerEntry() {
  const plan = planArchiveReconciliation([{ relativePath: 'new/one.png', contentHash: 'hash-x' }], [])
  assert.deepEqual(plan.actions, [{ kind: 'new', relativePath: 'new/one.png' }])
  assert.deepEqual(plan.missing, [])
  console.log('verifyArtArchiveReconciler: a file with no ledger entry at any path or hash is new')
}

function testUnchangedFileAtSamePathAndHash() {
  const known = entry({ id: 5, relativePath: 'a/one.png', contentHash: 'hash-1' })
  const plan = planArchiveReconciliation([{ relativePath: 'a/one.png', contentHash: 'hash-1' }], [known])
  assert.deepEqual(plan.actions, [{ kind: 'unchanged', relativePath: 'a/one.png', entryId: 5 }])
  assert.deepEqual(plan.missing, [])
  console.log('verifyArtArchiveReconciler: same path and same hash is unchanged')
}

function testChangedFileAtSamePathNewHash() {
  const known = entry({ id: 5, relativePath: 'a/one.png', contentHash: 'hash-old' })
  const plan = planArchiveReconciliation([{ relativePath: 'a/one.png', contentHash: 'hash-new' }], [known])
  assert.deepEqual(plan.actions, [{ kind: 'changed', relativePath: 'a/one.png', entryId: 5 }])
  console.log('verifyArtArchiveReconciler: same path, different hash is changed in place')
}

function testMovedFileWhenOldPathIsGone() {
  const known = entry({ id: 5, relativePath: 'old/one.png', contentHash: 'hash-1' })
  const plan = planArchiveReconciliation([{ relativePath: 'new/one.png', contentHash: 'hash-1' }], [known])
  assert.deepEqual(plan.actions, [
    { kind: 'moved', relativePath: 'new/one.png', fromEntryId: 5, fromRelativePath: 'old/one.png' },
  ])
  assert.deepEqual(plan.missing, [])
  console.log('verifyArtArchiveReconciler: same content at a new path, old path absent from the scan, is a move')
}

function testCopiedFileWhenOldPathStillPresent() {
  const known = entry({ id: 5, relativePath: 'old/one.png', contentHash: 'hash-1' })
  const plan = planArchiveReconciliation(
    [
      { relativePath: 'old/one.png', contentHash: 'hash-1' },
      { relativePath: 'new/copy-of-one.png', contentHash: 'hash-1' },
    ],
    [known],
  )
  assert.deepEqual(plan.actions, [
    { kind: 'unchanged', relativePath: 'old/one.png', entryId: 5 },
    { kind: 'copied', relativePath: 'new/copy-of-one.png', duplicateOfEntryId: 5 },
  ])
  assert.deepEqual(plan.missing, [])
  console.log('verifyArtArchiveReconciler: same content at a new path while the old path is still live is a copy')
}

function testMissingEntryNotFoundAtAnyPath() {
  const known = entry({ id: 5, relativePath: 'gone/one.png', contentHash: 'hash-1' })
  const plan = planArchiveReconciliation([], [known])
  assert.deepEqual(plan.actions, [])
  assert.deepEqual(plan.missing, [{ entryId: 5, relativePath: 'gone/one.png' }])
  console.log('verifyArtArchiveReconciler: an entry the scan finds nowhere -- same path or hash -- is reported missing')
}

function testMoveSourceIsNeverAlsoReportedMissing() {
  const known = entry({ id: 5, relativePath: 'old/one.png', contentHash: 'hash-1' })
  const plan = planArchiveReconciliation([{ relativePath: 'new/one.png', contentHash: 'hash-1' }], [known])
  assert.deepEqual(plan.missing, [])
  console.log('verifyArtArchiveReconciler: a move consumes its source entry, so it never also appears in missing')
}

function testTwoDistinctEntriesResolveIndependently() {
  const a = entry({ id: 1, relativePath: 'a.png', contentHash: 'hash-a' })
  const b = entry({ id: 2, relativePath: 'b.png', contentHash: 'hash-b' })
  const plan = planArchiveReconciliation(
    [
      { relativePath: 'a.png', contentHash: 'hash-a' },
      { relativePath: 'b-renamed.png', contentHash: 'hash-b' },
    ],
    [a, b],
  )
  assert.deepEqual(plan.actions, [
    { kind: 'unchanged', relativePath: 'a.png', entryId: 1 },
    { kind: 'moved', relativePath: 'b-renamed.png', fromEntryId: 2, fromRelativePath: 'b.png' },
  ])
  assert.deepEqual(plan.missing, [])
  console.log('verifyArtArchiveReconciler: an unrelated unchanged entry does not affect a sibling move classification')
}

function run() {
  testBrandNewFileWithNoLedgerEntry()
  testUnchangedFileAtSamePathAndHash()
  testChangedFileAtSamePathNewHash()
  testMovedFileWhenOldPathIsGone()
  testCopiedFileWhenOldPathStillPresent()
  testMissingEntryNotFoundAtAnyPath()
  testMoveSourceIsNeverAlsoReportedMissing()
  testTwoDistinctEntriesResolveIndependently()
  console.log('verifyArtArchiveReconciler: all assertions passed')
}

run()
