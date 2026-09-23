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
// A1111 seeds are UNSIGNED 32-bit, and ArtImage.seed WAS a signed Int capped
// at 2,147,483,647, so about half of every A1111 image ever made carried a seed
// it could not store. The seeds in the failing filenames (3832090215,
// 4273445571) are ordinary seeds, not corruption.
//
// seed is now UNSIGNED (20260923060000_art_image_seed_unsigned), so those are
// KEPT. .cfg and .steps remain signed `Int?`, and cfg's half step is carried by
// the cfgHalf flag that was always in the schema -- so this file now pins two
// different rules, and which column uses which is the point.
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
import {
  UINT32_MAX,
  seedColumnOrNull,
} from '../../server/utils/artImageSeedColumn'

const INT32_MAX = 2_147_483_647
const INT32_MIN = -2_147_483_648

// ---- the seeds that actually failed in production -------------------------
// These are now KEPT, not dropped: ArtImage.seed is an UNSIGNED column as of
// 20260923060000_art_image_seed_unsigned, and every one of these fits it.
for (const seed of [3832090215, 4273445571, 4286545361, 4263410656]) {
  assert.equal(
    seedColumnOrNull(seed),
    seed,
    `${seed} came off a real archive file and now fits the unsigned column`,
  )
  assert.ok(
    seed > INT32_MAX,
    `${seed} would NOT have fitted the old signed column -- that is the point`,
  )
}

// ---- the whole unsigned 32-bit seed space is handled ----------------------
assert.equal(
  seedColumnOrNull(UINT32_MAX),
  UINT32_MAX,
  'the largest possible A1111 seed is storable',
)
assert.equal(
  seedColumnOrNull(UINT32_MAX + 1),
  null,
  'one past the unsigned range is still refused, never wrapped',
)
assert.equal(seedColumnOrNull(0), 0, 'zero is a real seed, not absence')

// ---- -1 is absence, not a seed -------------------------------------------
// It was the old column default, meaning "pick one for me". An unsigned column
// cannot hold it and null says it properly.
assert.equal(
  seedColumnOrNull(-1),
  null,
  'the -1 randomise sentinel is stored as null, never as a seed',
)
assert.equal(seedColumnOrNull(-12345), null, 'no negative is a seed')
assert.equal(seedColumnOrNull(7.5), null, 'a fractional value is not a seed')
for (const notASeed of [null, undefined, '42', Number.NaN, Infinity, {}]) {
  assert.equal(
    seedColumnOrNull(notASeed),
    null,
    'nothing is invented from a non-number',
  )
}

// ---- steps/cfg still use the SIGNED rule ----------------------------------
// seed moved to an unsigned column; .steps and .cfg did NOT, so the signed
// boundaries still bind for them and are still worth pinning. (These
// assertions were lost when the seed block was rewritten, which is how
// INT32_MIN briefly became an unused constant.)
assert.equal(
  intColumnOrNull(INT32_MAX),
  INT32_MAX,
  'the largest signed value is storable for a still-signed column',
)
assert.equal(
  intColumnOrNull(INT32_MAX + 1),
  null,
  'one past the signed maximum is refused, never wrapped',
)
assert.equal(
  intColumnOrNull(INT32_MIN),
  INT32_MIN,
  'the lowest signed value is storable -- unlike seed, these columns keep it',
)
assert.equal(
  intColumnOrNull(INT32_MIN - 1),
  null,
  'one below the signed minimum is refused',
)
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
  'Art Archive int-column contract verified: the unsigned seed column keeps ' +
    'the real production seeds that used to abort the insert, refuses -1 and ' +
    'anything past 2^32 without wrapping, CFG keeps its half step through the ' +
    'cfgHalf flag rather than being dropped, the two faults are named apart ' +
    '(a fractional CFG is never "too large"), and every drop still carries ' +
    'its true value.',
)
