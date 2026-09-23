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
  classifyIntColumnValue,
  intColumnOrNull,
  splitHalfStepCfg,
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

// ---- the two faults are named apart, never merged ------------------------
// Reporting a fractional CFG as "too large for its column" is false, and a
// report that says so teaches the reader the wrong thing about their archive.
assert.equal(
  classifyIntColumnValue(3832090215),
  'out-of-range',
  'an unsigned 32-bit A1111 seed is too big for the column',
)
assert.equal(
  classifyIntColumnValue(1049274193847562),
  'out-of-range',
  'a 64-bit ComfyUI seed is too big for the column',
)
assert.equal(
  classifyIntColumnValue(7.5),
  'not-an-integer',
  'CFG scale 7.5 is fractional, NOT too large -- never report it as too large',
)
assert.equal(
  classifyIntColumnValue(42),
  null,
  'a storable number is not a loss',
)
assert.equal(
  classifyIntColumnValue(undefined),
  null,
  'an absent field is not a loss',
)
assert.equal(
  classifyIntColumnValue('3832090215'),
  null,
  'a non-number is not a loss',
)
assert.equal(
  classifyIntColumnValue(Number.NaN),
  null,
  'NaN is not a reportable loss',
)

// ---- the value is dropped, never bent into range -------------------------
// ---- CFG keeps its half step via the column pair that already exists ------
// cfgHalf has been in the schema all along and image-card.vue already renders
// `${cfg}.5` from it. Dropping 12.5 for being fractional cost over half the
// archive its CFG for want of a boolean.
assert.deepEqual(
  splitHalfStepCfg(12.5),
  { cfg: 12, cfgHalf: true },
  '12.5 must survive as 12 + half, not be dropped',
)
assert.deepEqual(
  splitHalfStepCfg(7),
  { cfg: 7, cfgHalf: false },
  'a whole CFG must not be flagged as half',
)
assert.deepEqual(
  splitHalfStepCfg(0.5),
  { cfg: 0, cfgHalf: true },
  'a half below one still splits',
)
assert.equal(
  splitHalfStepCfg(7.25),
  null,
  'a quarter step cannot be represented by cfg+cfgHalf and must be reported',
)
for (const notCfg of [null, undefined, '12.5', Number.NaN, Infinity]) {
  assert.equal(
    splitHalfStepCfg(notCfg),
    null,
    'nothing is invented from a non-number',
  )
}

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

// ---- and the loss is reported with evidence, not as a bare count ---------
// A count alone cannot distinguish "ordinary 32-bit A1111 seeds" from "this
// archive is ComfyUI"; the value has to travel with it.
assert.match(
  source,
  /droppedValues\.push\(\{ field: name, fault, value: raw as number \}\)/,
  'a dropped value must be recorded WITH its fault and its true value',
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
  /largestMagnitude = Math\.abs\(dropped\.value\)/,
  'the batch must keep the largest magnitude seen -- it is the evidence that ' +
    'says whether a 32-bit column was ever viable for this archive',
)
assert.match(
  endpoint,
  /\n\s*droppedFields,\n/,
  'the batch response must expose the per-field drop report',
)

const client = readFileSync('scripts/art-archive-ingest.sh', 'utf8')
assert.match(
  client,
  /not whole numbers/,
  'the runner must report a fractional value as fractional, never as too large',
)
assert.doesNotMatch(
  client,
  /too large for its column/,
  'the old wording called a fractional CFG "too large", which is simply false',
)

console.log(
  'Art Archive int-column contract verified: the two faults are named apart ' +
    '(a fractional CFG is never reported as too large), production seeds past ' +
    'the signed 32-bit limit are dropped rather than bent, the -1 sentinel ' +
    'still fits, nothing is invented from a non-number, and every drop carries ' +
    'its true value so the archive can be told apart from a 32-bit one.',
)
