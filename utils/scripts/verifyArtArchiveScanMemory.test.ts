// /utils/scripts/verifyArtArchiveScanMemory.test.ts
//
// The archive scan must not re-read the Resource pool per file, and must not
// fan out over the whole archive at once.
//
// WHY
// ---
// art-archive/t-041, 2026-09-22. Running the dry run against the real archive
// on Alexandria returned exit 137 -- SIGKILL, with no HTTP response, because
// the container died mid-scan. Both admin endpoints mapped every scanned file
// through an unbounded `Promise.all`, and matchArchiveResources() does its own
// `findMany()` of the entire active checkpoint+LoRA pool. That is one full
// table load per file, all in flight simultaneously, all retained until the
// last file finished. It reads as an infrastructure problem and is a code one.
//
//   npx tsx utils/scripts/verifyArtArchiveScanMemory.test.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createCachedResourcePool } from '../../server/utils/artArchiveResourceMatch'
import {
  mapWithConcurrency,
  ARCHIVE_SCAN_CONCURRENCY,
} from '../../server/utils/artArchiveScanConcurrency'
import { sampleResourceMatches } from '../../server/utils/artArchiveMatchSample'

// ---- the pool is read once per run, however many files ask for it ---------
let poolReads = 0
const pool = createCachedResourcePool({
  findMany: async () => {
    poolReads += 1
    return []
  },
} as Parameters<typeof createCachedResourcePool>[0])

const args = {
  where: { resourceType: { in: [] }, isActive: true },
  select: {
    id: true,
    resourceType: true,
    name: true,
    customLabel: true,
    localPath: true,
    hash: true,
  },
} as Parameters<ReturnType<typeof createCachedResourcePool>['findMany']>[0]

await Promise.all(Array.from({ length: 500 }, () => pool.findMany(args)))
assert.equal(
  poolReads,
  1,
  `500 concurrent files must share one pool read, saw ${poolReads}`,
)
await pool.findMany(args)
assert.equal(poolReads, 1, 'a later file must still reuse the cached pool')

// ---- fan-out stays bounded, and order is preserved ------------------------
let inFlight = 0
let peakInFlight = 0
const input = Array.from({ length: 200 }, (_, index) => index)
const output = await mapWithConcurrency(input, async (item) => {
  inFlight += 1
  peakInFlight = Math.max(peakInFlight, inFlight)
  await new Promise((resolve) => setTimeout(resolve, 1))
  inFlight -= 1
  return item * 2
})
assert.ok(
  peakInFlight <= ARCHIVE_SCAN_CONCURRENCY,
  `fan-out must stay within ${ARCHIVE_SCAN_CONCURRENCY}, peaked at ${peakInFlight}`,
)
assert.deepEqual(
  output,
  input.map((item) => item * 2),
  'bounded mapping must preserve input order',
)
assert.deepEqual(await mapWithConcurrency([], async () => 1), [])

// ---- the response never carries one entry per file ------------------------
const entries = Array.from({ length: 5000 }, (_, index) => ({
  relativePath: `f${index}.png`,
  matches: { checkpoint: index % 100 === 0 ? { id: index } : null, loras: [] },
}))
const sampled = sampleResourceMatches(entries)
assert.ok(sampled.resourceMatches.length <= 50, 'sample must be capped')
assert.equal(
  sampled.resourceMatchesTotal,
  5000,
  'the true total is still reported',
)
assert.equal(sampled.resourceMatchesTruncated, true)
assert.ok(
  sampled.resourceMatches.every((entry) => entry.matches.checkpoint !== null),
  'files carrying evidence must fill the sample before files without it',
)
const small = sampleResourceMatches(entries.slice(0, 10))
assert.equal(
  small.resourceMatchesTruncated,
  false,
  'a small scan is not truncated',
)
assert.equal(
  small.resourceMatches.length,
  10,
  'a small scan reports every file',
)

// ---- neither endpoint may go back to the unbounded shape ------------------
for (const file of [
  'server/api/admin/art-archive/dry-run.post.ts',
  'server/api/admin/art-archive/import.post.ts',
]) {
  const source = readFileSync(file, 'utf8')
  assert.doesNotMatch(
    source,
    /Promise\.all\(\s*scan\.files\.map/,
    `${file} must not fan out over every scanned file at once`,
  )
  assert.match(
    source,
    /createCachedResourcePool\(prisma\.resource\)/,
    `${file} must share one Resource pool read across the scan`,
  )
  assert.doesNotMatch(
    source,
    /\n\s*resourceMatches,\n/,
    `${file} must not return one match entry per scanned file`,
  )
}

console.log(
  'Art Archive scan-memory contract verified: one pooled Resource read, ' +
    `fan-out capped at ${ARCHIVE_SCAN_CONCURRENCY}, response sample capped at 50.`,
)
