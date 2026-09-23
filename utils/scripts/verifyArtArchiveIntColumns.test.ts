// /utils/scripts/verifyArtArchiveIntColumns.test.ts
//
// A generation value the column cannot hold must become null, never a wrong
// number, and never a failed import.
//
// WHY
// ---
// art-archive/t-041, 2026-09-23. The first real import batch: 1,092 files in,
// 908 failed, every sampled one with
//
//   Value out of range for the type: Out of range value for column 'seed'
//
// ArtImage.seed, .cfg and .steps are `Int?` -- MySQL signed 32-bit, max
// 2,147,483,647. A1111 seeds are UNSIGNED 32-bit, so about half of every
// A1111 image ever made carries a seed this column cannot store. The seeds in
// the failing filenames (3832090215, 4273445571) are ordinary seeds, not
// corruption.
//
// Clamping or wrapping would be worse than dropping: a wrong seed still looks
// usable and would regenerate the wrong image. The real value survives in the
// entry's extractedMetadata either way.
//
//   npx tsx utils/scripts/verifyArtArchiveIntColumns.test.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  intColumnOrNull,
  isOutOfRangeNumber,
} from '../../server/utils/artArchiveIntColumns'

const INT32_MAX = 2_147_483_647
const INT32_MIN = -2_147_483_648

// ---- the seeds that actually failed in production ------------------------
for (const seed of [3832090215, 3832090216, 3832090217, 4273445571]) {
  assert.equal(
    intColumnOrNull(seed),
    null,
    `${seed} came off a real archive file and cannot be stored, so it must be dropped`,
  )
  assert.ok(seed > INT32_MAX, `${seed} is genuinely past the column's range`)
}

// ---- the whole unsigned 32-bit seed space is handled ---------------------
assert.equal(
  intColumnOrNull(4_294_967_295),
  null,
  'the largest A1111 seed drops',
)
assert.equal(
  intColumnOrNull(INT32_MAX),
  INT32_MAX,
  'the largest storable seed is kept',
)
assert.equal(intColumnOrNull(INT32_MAX + 1), null, 'one past the limit drops')
assert.equal(
  intColumnOrNull(INT32_MIN),
  INT32_MIN,
  'the lowest storable value is kept',
)
assert.equal(intColumnOrNull(INT32_MIN - 1), null, 'one below the limit drops')

// ---- ordinary values are untouched ---------------------------------------
assert.equal(intColumnOrNull(0), 0, 'zero is a real seed, not absence')
assert.equal(intColumnOrNull(-1), -1, "the schema's own -1 sentinel still fits")
assert.equal(intColumnOrNull(42), 42)
assert.equal(intColumnOrNull(1_234_567_890), 1_234_567_890)

// ---- nothing is ever invented --------------------------------------------
for (const value of [
  null,
  undefined,
  '3832090215',
  NaN,
  Infinity,
  -Infinity,
  1.5,
  {},
  [],
]) {
  assert.equal(
    intColumnOrNull(value),
    null,
    `${String(value)} must not be coerced into a number the column would accept`,
  )
}

// ---- present-but-unusable is distinguished from absent -------------------
assert.equal(
  isOutOfRangeNumber(3832090215),
  true,
  'a real seed too big to store',
)
assert.equal(isOutOfRangeNumber(42), false, 'a storable number is not a loss')
assert.equal(
  isOutOfRangeNumber(undefined),
  false,
  'an absent field is not a loss',
)
assert.equal(
  isOutOfRangeNumber('3832090215'),
  false,
  'a non-number is not a loss',
)

// ---- the value is dropped, never bent into range -------------------------
const source =
  readFileSync('server/utils/artArchiveIntColumns.ts', 'utf8') +
  readFileSync('server/utils/artArchiveImporter.ts', 'utf8')
for (const bending of [
  /Math\.min\([^)]*INT32_MAX/,
  /Math\.max\([^)]*INT32_MIN/,
  /%\s*INT32_MAX/,
  />>>\s*0/,
  /&\s*0x7fffffff/i,
]) {
  assert.doesNotMatch(
    source,
    bending,
    'an out-of-range value must be dropped, not clamped, wrapped or masked -- ' +
      'a wrong seed looks usable and regenerates the wrong image',
  )
}

// ---- and the loss is reported, not silent --------------------------------
assert.match(
  source,
  /outOfRangeFields\.push\(name\)/,
  'a dropped value must be recorded so the gap can be counted',
)
assert.match(
  source,
  /extractedMetadata: JSON\.stringify\(file\.metadata\)/,
  'the true value must still be preserved verbatim on the entry',
)

const endpoint = readFileSync(
  'server/api/admin/art-archive/import-batch.post.ts',
  'utf8',
)
assert.match(
  endpoint,
  /outOfRangeFields\[field\] = \(outOfRangeFields\[field\] \?\? 0\) \+ 1/,
  'the batch must count dropped fields per kind',
)
assert.match(
  endpoint,
  /\n\s*outOfRangeFields,\n/,
  'and report them in its response',
)

console.log(
  'Art Archive int-column contract verified: production seeds past the signed ' +
    '32-bit limit are dropped rather than bent, ordinary values and the -1 ' +
    'sentinel are untouched, nothing is invented from a non-number, and every ' +
    'drop is counted with the true value kept in the entry metadata.',
)
