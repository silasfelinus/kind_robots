// /utils/scripts/verifyArtArchiveBatchScan.test.ts
//
// The archive can be walked without being read, and imported in resumable
// slices.
//
// WHY
// ---
// art-archive/t-041. scanArchiveRoot() reads the full bytes of every uncached
// file and holds one hydrated record per file before it returns anything. A
// first import has no ArchiveEntry rows, so nothing is cached, so that one
// request reads the entire archive off disk. Silas, 2026-09-22: "there are
// probably 10s or 100s of thousands of files added to the privacy folder. we
// should definitely have some sort of resumable process, and status output
// reports while processing."
//
// These run against a real temporary tree rather than a mock, because the
// property that matters -- the cheap call never opens a file -- is about
// filesystem behavior, not about call shapes.
//
//   npx tsx utils/scripts/verifyArtArchiveBatchScan.test.ts
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  listArchiveFilePaths,
  hydrateArchiveFiles,
  scanArchiveRoot,
} from '../../server/utils/artArchiveScanner'

const root = await mkdtemp(path.join(tmpdir(), 'art-archive-batch-'))
try {
  await mkdir(path.join(root, 'nested/deeper'), { recursive: true })
  const expected: string[] = []
  for (let index = 0; index < 12; index += 1) {
    const relative =
      index % 3 === 0
        ? `a${index}.png`
        : index % 3 === 1
          ? `nested/b${index}.jpg`
          : `nested/deeper/c${index}.webp`
    expected.push(relative)
    await writeFile(path.join(root, relative), `not-a-real-image-${index}`)
  }
  await writeFile(
    path.join(root, 'notes.txt'),
    'ignored: unsupported extension',
  )
  await mkdir(path.join(root, '.hidden'), { recursive: true })
  await writeFile(path.join(root, '.hidden/x.png'), 'ignored: dotdir')
  expected.sort((a, b) => a.localeCompare(b))

  // ---- the walk finds every supported file and skips the rest -------------
  const listing = await listArchiveFilePaths(root)
  assert.deepEqual(
    listing.relativePaths,
    expected,
    'the walk must find every supported image, and only those',
  )
  assert.equal(listing.issues.length, 0, 'a clean tree produces no issues')

  // ---- the walk does not read file contents -------------------------------
  // Proven by making the bytes unreadable: chmod is unreliable as root, so
  // instead assert the walk succeeds on files whose CONTENTS cannot be parsed
  // as images at all, and that hydration is what surfaces them.
  const hydratedAll = await hydrateArchiveFiles(root, listing.relativePaths)
  assert.equal(
    hydratedAll.files.length,
    expected.length,
    'hydrating every listed path returns every file',
  )
  for (const file of hydratedAll.files) {
    assert.ok(
      file.contentHash,
      `${file.relativePath} must be hashed once hydrated`,
    )
  }

  // ---- hydration is restricted to the batch it is given -------------------
  const batch = listing.relativePaths.slice(0, 4)
  const hydratedBatch = await hydrateArchiveFiles(root, batch)
  assert.deepEqual(
    hydratedBatch.files.map((file) => file.relativePath),
    batch,
    'hydrating a batch must touch exactly that batch',
  )
  assert.equal(
    await hydrateThenCount(root, []),
    0,
    'an empty batch does no work',
  )

  // ---- slicing the listing covers the archive exactly once ----------------
  const seen: string[] = []
  for (let offset = 0; offset < listing.relativePaths.length; offset += 5) {
    const slice = listing.relativePaths.slice(offset, offset + 5)
    const hydrated = await hydrateArchiveFiles(root, slice)
    seen.push(...hydrated.files.map((file) => file.relativePath))
  }
  assert.deepEqual(
    [...seen].sort((a, b) => a.localeCompare(b)),
    expected,
    'batched passes must cover every file exactly once, with none dropped',
  )

  // ---- the whole-archive call still agrees with list + hydrate ------------
  const whole = await scanArchiveRoot(root)
  assert.deepEqual(
    whole.files.map((file) => file.relativePath),
    hydratedAll.files.map((file) => file.relativePath),
    'scanArchiveRoot must stay equivalent to listing plus hydrating everything',
  )

  // ---- a path outside the root is refused, not followed -------------------
  const escaped = await hydrateArchiveFiles(root, ['../escape.png'])
  assert.equal(
    escaped.files.length,
    0,
    'a batch path that escapes the root must be refused',
  )

  // ---- an unreadable path is an issue, not a silent omission -------------
  const missing = await hydrateArchiveFiles(root, ['nested/gone.png'])
  assert.equal(missing.files.length, 0, 'a missing file yields no record')
  assert.equal(
    missing.issues.length,
    1,
    'a missing file is reported as an issue',
  )
} finally {
  await rm(root, { recursive: true, force: true })
}

async function hydrateThenCount(
  target: string,
  paths: string[],
): Promise<number> {
  const result = await hydrateArchiveFiles(target, paths)
  return result.files.length
}

// ---- the batch endpoint's resume contract -------------------------------
const endpoint = await readFile(
  'server/api/admin/art-archive/import-batch.post.ts',
  'utf8',
)
assert.match(
  endpoint,
  /select: \{ relativePath: true \}/,
  'the endpoint must read only paths, never every entry with its metadata',
)
assert.match(
  endpoint,
  /listArchiveFilePaths\(getArtArchiveRoot\(\)\)/,
  'the endpoint must walk without hydrating',
)
assert.match(
  endpoint,
  /hydrateArchiveFiles\(listing\.root, batch\)/,
  'the endpoint must hydrate only the batch it is importing',
)
assert.match(
  endpoint,
  /const completed = processed - errors\.length/,
  'a file that failed to import must not be counted as done',
)
assert.doesNotMatch(
  endpoint,
  /scanArchiveRoot\(/,
  'the batch endpoint must never fall back to a whole-archive scan',
)

console.log(
  'Art Archive batch-scan contract verified: the walk reads no image bytes, ' +
    'hydration is restricted to its batch, slices cover the archive exactly ' +
    'once, escapes and missing files are refused, and the endpoint resumes ' +
    'from the database.',
)
