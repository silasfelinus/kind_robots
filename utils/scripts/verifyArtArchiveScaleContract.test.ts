// /utils/scripts/verifyArtArchiveScaleContract.test.ts
//
// The import must cost O(files), not O(files x batches).
//
// WHY
// ---
// art-archive/t-041, 2026-09-23. --local-scan finally measured the production
// archive: 240,856 files, 443 folders, 349 GB. At that size the batched import
// as first written was quadratic -- every batch re-walked the whole tree and
// re-read every imported row, so ~964 batches of 250 meant ~964 full walks and
// ~964 quarter-million-row reads to import 240,856 files. The overhead dwarfed
// the work.
//
// These assert the shape that keeps it linear, with counters rather than
// timings, so they mean the same thing on any machine.
//
//   npx tsx utils/scripts/verifyArtArchiveScaleContract.test.ts
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { listArchiveFilePaths } from '../../server/utils/artArchiveScanner'
import {
  collectPendingBatch,
  selectImportedAmong,
  PATH_WINDOW_SIZE,
} from '../../server/utils/artArchiveImportedPaths'
import {
  readListingCache,
  writeListingCache,
  advanceListingCursor,
  clearListingCache,
  LISTING_TTL_MS,
} from '../../server/utils/artArchiveListingCache'

// ---- the ledger is asked about windows, never about everything -----------
const TOTAL = 5000
const paths = Array.from(
  { length: TOTAL },
  (_, index) => `folder${index % 40}/file${String(index).padStart(6, '0')}.png`,
)
// Nothing imported yet: the first batch must be satisfiable from one window.
const emptyLedger = {
  findMany: async (args: { where: { relativePath?: { in: string[] } } }) => {
    assert.ok(
      args.where.relativePath?.in,
      'the ledger must be asked about a bounded set of paths, never for every row',
    )
    assert.ok(
      args.where.relativePath.in.length <= PATH_WINDOW_SIZE,
      `a window must stay within ${PATH_WINDOW_SIZE}, saw ${args.where.relativePath.in.length}`,
    )
    return []
  },
}

const first = await collectPendingBatch(emptyLedger, paths, 0, 250)
assert.equal(first.batch.length, 250, 'a full batch is returned')
assert.deepEqual(first.batch, paths.slice(0, 250), 'in listing order')
assert.equal(
  first.nextIndex,
  250,
  'the cursor stops exactly where the batch ended',
)
assert.equal(
  first.windowsRead,
  1,
  'one window suffices when nothing is imported',
)

// ---- resuming skips ground already covered, in bounded queries -----------
// Everything up to 4000 is imported: a run starting at 0 must walk past it
// using windows, not by reading the whole ledger.
let rowsReturned = 0
const partlyImported = {
  findMany: async (args: { where: { relativePath?: { in: string[] } } }) => {
    const window = args.where.relativePath?.in ?? []
    const rows = window
      .filter((relativePath) => paths.indexOf(relativePath) < 4000)
      .map((relativePath) => ({
        relativePath,
        processState: 'IMPORTED',
        isActive: true,
      }))
    rowsReturned += rows.length
    return rows
  },
}
const resumed = await collectPendingBatch(partlyImported, paths, 0, 250)
assert.deepEqual(
  resumed.batch,
  paths.slice(4000, 4250),
  'a cold start must find the first genuinely pending file',
)
assert.equal(
  resumed.windowsRead,
  Math.ceil(4250 / PATH_WINDOW_SIZE),
  'walking past imported files costs one bounded query per window, not a full read',
)
assert.ok(
  rowsReturned <= 4250,
  'a cold resume must never pull more rows than the ground it walked',
)

// A warm cursor skips that entirely.
const warm = await collectPendingBatch(partlyImported, paths, 4000, 250)
assert.equal(warm.windowsRead, 1, 'a carried cursor costs one window')
assert.deepEqual(warm.batch, paths.slice(4000, 4250))

// ---- the window query applies the state rule -----------------------------
const mixed = await selectImportedAmong(
  {
    findMany: async () => [
      { relativePath: 'a.png', processState: 'IMPORTED', isActive: true },
      { relativePath: 'b.png', processState: 'MISSING', isActive: true },
      { relativePath: 'c.png', processState: 'IMPORTED', isActive: false },
    ],
  },
  ['a.png', 'b.png', 'c.png'],
)
assert.deepEqual(
  [...mixed],
  ['a.png'],
  'a windowed check must apply the same state rule as the full read',
)
assert.equal(
  (await selectImportedAmong(emptyLedger, [])).size,
  0,
  'an empty window asks the database nothing',
)

// ---- the listing is walked once per run ----------------------------------
clearListingCache()
assert.equal(readListingCache('/archive'), null, 'a cold cache holds nothing')
writeListingCache({ root: '/archive', relativePaths: paths, issues: [] })
assert.equal(
  readListingCache('/archive')?.relativePaths.length,
  TOTAL,
  'a warm cache serves the listing without another walk',
)
assert.equal(
  readListingCache('/different-archive'),
  null,
  'a different root must not be served a stale listing',
)
assert.equal(
  readListingCache('/archive', Date.now() + LISTING_TTL_MS + 1),
  null,
  'an expired listing forces a fresh walk',
)
advanceListingCursor('/archive', 4000)
assert.equal(readListingCache('/archive')?.cursor, 4000, 'the cursor carries')
advanceListingCursor('/archive', 10)
assert.equal(
  readListingCache('/archive')?.cursor,
  4000,
  'the cursor never moves backwards',
)
advanceListingCursor('/elsewhere', 99)
assert.equal(
  readListingCache('/archive')?.cursor,
  4000,
  "another root's progress must not move this one",
)
clearListingCache()

// ---- a plain file costs no realpath, a symlink still does ----------------
const root = await mkdtemp(path.join(tmpdir(), 'art-archive-scale-'))
try {
  await mkdir(path.join(root, 'nested'), { recursive: true })
  await writeFile(path.join(root, 'plain.png'), 'x')
  await writeFile(path.join(root, 'nested/deep.png'), 'x')

  const outside = await mkdtemp(path.join(tmpdir(), 'art-archive-outside-'))
  try {
    await writeFile(path.join(outside, 'escape.png'), 'x')
    await symlink(path.join(outside, 'escape.png'), path.join(root, 'link.png'))

    const listing = await listArchiveFilePaths(root)
    assert.deepEqual(
      listing.relativePaths,
      ['nested/deep.png', 'plain.png'],
      'plain files are listed and the escaping symlink is not',
    )
    assert.ok(
      listing.issues.some((issue) => issue.reason === 'escaped-root'),
      'a symlink out of the root is still resolved and refused -- skipping ' +
        'realpath for plain files must not weaken the confinement check',
    )
  } finally {
    await rm(outside, { recursive: true, force: true })
  }
} finally {
  await rm(root, { recursive: true, force: true })
}

console.log(
  'Art Archive scale contract verified: the ledger is asked one bounded ' +
    'window at a time, the listing is walked once per run with a ' +
    'forward-only cursor, and dropping realpath for plain files leaves the ' +
    'escaped-root check intact.',
)
