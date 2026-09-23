// /utils/scripts/verifyArtImageSeedColumn.test.ts
//
// The seed column is UNSIGNED, and the risk in that is not the range -- it is
// the -1 sentinel.
//
// -1 meant "pick a seed for me" and was the old column default. An unsigned
// column cannot store it. It is written in ~19 places, and MOST OF THOSE MUST
// KEEP WRITING IT: they are ComfyUI/A1111 request payloads (server/api/comfy/**,
// artStore's generate body) where -1 genuinely randomises. Editing call sites
// one at a time would mean judging, nineteen times, whether each -1 is bound
// for the database or the generator -- and being wrong once means a runtime
// insert failure exactly like the overflow this replaced.
//
// So the conversion lives at the database boundary. This pins that: the rule
// itself, that the boundary applies it, that the migration nulls the old rows
// BEFORE widening the column, and that the generator payloads were left alone.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  UINT32_MAX,
  seedColumnOrNull,
  seedNeedsNormalising,
} from '../../server/utils/artImageSeedColumn'

// ---- the range the live data actually uses -------------------------------
// Measured, not assumed: these are the largest seeds seen in production.
for (const seed of [4286545361, 4263410656, 4253715645, 3832090215]) {
  assert.equal(seedColumnOrNull(seed), seed, `${seed} must be stored as-is`)
}
assert.equal(seedColumnOrNull(UINT32_MAX), UINT32_MAX, 'the top of the range')
assert.equal(seedColumnOrNull(0), 0, 'zero is a seed, not absence')

// ---- never bent into range -----------------------------------------------
assert.equal(seedColumnOrNull(UINT32_MAX + 1), null, 'never wrapped')
assert.equal(seedColumnOrNull(-1), null, 'the randomise sentinel is absence')
assert.equal(seedColumnOrNull(-2147483648), null, 'no negative is a seed')
assert.equal(seedColumnOrNull(1.5), null, 'a seed is a whole number')
for (const notANumber of [null, undefined, '4286545361', Number.NaN, {}, []]) {
  assert.equal(seedColumnOrNull(notANumber), null, 'nothing is invented')
}

// ---- absence is distinguished from an unusable value ---------------------
// A row that simply has no seed must not be rewritten as though it did.
assert.equal(seedNeedsNormalising(undefined), false, 'absent stays absent')
assert.equal(seedNeedsNormalising(null), false, 'null stays null')
assert.equal(seedNeedsNormalising(4286545361), false, 'a good seed is left be')
assert.equal(seedNeedsNormalising(-1), true, '-1 must be normalised away')
assert.equal(seedNeedsNormalising(UINT32_MAX + 1), true, 'so must an overflow')

// ---- the boundary actually applies it ------------------------------------
const client = readFileSync('server/utils/prisma.ts', 'utf8')
assert.match(
  client,
  /artImage: \{/,
  'the normalisation must be scoped to artImage writes',
)
for (const shape of [
  /shaped\?\.data/,
  /shaped\?\.create/,
  /shaped\?\.update/,
]) {
  assert.match(
    client,
    shape,
    'create, update and upsert all carry a seed and must all be normalised -- ' +
      'an upsert that skipped `update` would fail on its second run only',
  )
}

// ---- the migration nulls BEFORE it widens --------------------------------
// Order is the whole safety argument: widening while -1 is still present would
// error, or silently clamp those rows to 0 -- a fabricated seed that looks real,
// which is worse than a missing one.
const migration = readFileSync(
  'prisma/migrations/20260923060000_art_image_seed_unsigned/migration.sql',
  'utf8',
)
const nullOut = migration.indexOf('UPDATE `ArtImage` SET `seed` = NULL')
const widen = migration.indexOf('MODIFY `seed` INT UNSIGNED')
assert.ok(nullOut > -1, 'the migration must null the old sentinel rows')
assert.ok(widen > -1, 'the migration must widen the column')
assert.ok(
  nullOut < widen,
  'the rows holding -1 must be nulled BEFORE the column is made unsigned',
)
assert.match(
  migration,
  /WHERE `seed` < 0/,
  'only rows already holding an unusable value may be touched',
)

// ---- the schema matches the migration ------------------------------------
const schema = readFileSync('prisma/schema.prisma', 'utf8')
assert.match(
  schema,
  /seed\s+Int\?\s+@db\.UnsignedInt/,
  'the Prisma column must be unsigned Int -- NOT BigInt, which would change ' +
    'the TypeScript type from number to bigint across 911 read sites',
)
assert.doesNotMatch(
  schema,
  /seed\s+Int\?[^\n]*@default\(-1\)/,
  'the -1 default must be gone; an unsigned column cannot hold it',
)

// ---- generator payloads were NOT touched ---------------------------------
// The thing most likely to be broken by a careless sweep: in a ComfyUI or
// A1111 request, -1 means "randomise" and is correct.
const generatorPayloads = [
  'server/api/comfy/flux/utils/workflow.ts',
  'server/api/comfy/sdxl/generate.post.ts',
  'stores/artStore.ts',
]
for (const file of generatorPayloads) {
  assert.match(
    readFileSync(file, 'utf8'),
    /seed: (input|body|requestData|form)\.seed \?\? -1/,
    `${file} sends -1 to the GENERATOR, where it means randomise -- it must ` +
      'not have been rewritten to null',
  )
}

console.log(
  'ArtImage seed-column contract verified: the unsigned range covers the real ' +
    'production seeds, -1 and overflow become null rather than being wrapped ' +
    'or clamped, absence is left alone, the Prisma boundary normalises every ' +
    'artImage write so no call site can forget, the migration nulls the old ' +
    'sentinel rows before widening the column, and the ComfyUI/A1111 request ' +
    'payloads keep the -1 that correctly means "randomise".',
)
