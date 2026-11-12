// Art slots: many renders per slot, one chosen, true duplicates removable.
//
// Silas, 2026-11-11 PT: "support having multiple art sources for art ...
// manageable from a back end, so that the admin interfaces can choose a better
// choice. If the art is actually duplicated (same seed), they can be deleted."
// This pins what "the same picture" means and which copy survives a dedupe.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  normalizeSlotKey,
  normalizeVerdict,
  parseCandidateInputs,
  planDuplicates,
  renderFingerprint,
} from '../../server/utils/artSlotRules'

const base = {
  seed: 1196001,
  promptString: 'Union Millwright, a broad sandy-tan iguana engineer.',
  negativePrompt: null,
  checkpoint: 'krea2',
  sampler: 'euler',
  steps: 8,
  cfg: 1,
}

// Same picture: whitespace and case in the prompt do not matter.
const fp = renderFingerprint(base)
assert.ok(fp && fp.length === 64)
assert.equal(
  renderFingerprint({
    ...base,
    promptString: '  union   millwright, a broad sandy-tan IGUANA engineer. ',
  }),
  fp,
)
// A different seed, model or sampler setting is a different picture.
assert.notEqual(renderFingerprint({ ...base, seed: 1196002 }), fp)
assert.notEqual(renderFingerprint({ ...base, checkpoint: 'flux' }), fp)
assert.notEqual(renderFingerprint({ ...base, steps: 20 }), fp)
assert.notEqual(renderFingerprint({ ...base, negativePrompt: 'blurry' }), fp)
// No seed or no prompt: undecidable, never auto-removed.
assert.equal(renderFingerprint({ ...base, seed: null }), null)
assert.equal(renderFingerprint({ ...base, promptString: '  ' }), null)

const c = (
  id: number,
  artImageId: number,
  f: string | null,
  verdict = 'none',
) => ({
  id,
  artImageId,
  renderFingerprint: f,
  verdict,
})

// Oldest copy kept when nothing is chosen; distinct renders untouched.
assert.deepEqual(
  planDuplicates(
    [c(1, 30, 'a'), c(2, 10, 'a'), c(3, 20, 'a'), c(4, 40, 'b')],
    null,
  ),
  [{ renderFingerprint: 'a', keepArtImageId: 10, removeArtImageIds: [20, 30] }],
)
// The chosen image always survives.
assert.deepEqual(
  planDuplicates([c(1, 10, 'a'), c(2, 20, 'a')], 20)[0]?.keepArtImageId,
  20,
)
// A copy a game manifest uses is kept over an older one, and never removed.
assert.deepEqual(
  planDuplicates(
    [c(1, 10, 'a'), c(2, 20, 'a'), c(3, 30, 'a')],
    null,
    new Set([30, 20]),
  ),
  [{ renderFingerprint: 'a', keepArtImageId: 20, removeArtImageIds: [10] }],
)
// A liked copy beats an older unjudged one.
assert.equal(
  planDuplicates([c(1, 10, 'a'), c(2, 20, 'a', 'liked')], null)[0]
    ?.keepArtImageId,
  20,
)
// Already-removed duplicates and unfingerprinted renders are ignored.
assert.deepEqual(
  planDuplicates(
    [c(1, 10, 'a'), c(2, 20, 'a', 'duplicate'), c(3, 30, null), c(4, 40, null)],
    null,
  ),
  [],
)

// Input validation.
assert.equal(
  normalizeSlotKey(' slime-city/evolutions/union-millwright@2 '),
  'slime-city/evolutions/union-millwright@2',
)
for (const bad of ['', 'has space', 'x'.repeat(301), '/leading-slash']) {
  assert.throws(
    () => normalizeSlotKey(bad),
    (e: { statusCode?: number }) => e.statusCode === 400,
  )
}
assert.equal(normalizeVerdict('Liked'), 'liked')
assert.throws(
  () => normalizeVerdict('selected'),
  (e: { statusCode?: number }) => e.statusCode === 400,
)
const parsed = parseCandidateInputs([
  {
    slotKey: 'ruler-hooked:characters/druid-sela',
    projectSlug: 'Ruler-Hooked',
    artImageId: '269379',
    source: 'conductor-request',
    selectIfEmpty: true,
  },
])
assert.equal(parsed[0]?.artImageId, 269379)
assert.equal(parsed[0]?.projectSlug, 'ruler-hooked')
assert.equal(parsed[0]?.selectIfEmpty, true)
assert.throws(
  () => parseCandidateInputs([]),
  (e: { statusCode?: number }) => e.statusCode === 400,
)
assert.throws(
  () =>
    parseCandidateInputs([
      { slotKey: 'a', artImageId: 1, source: 'somewhere' },
    ]),
  (e: { statusCode?: number }) => e.statusCode === 400,
)

// Removal is the Recycle Bin (restorable), never a hard delete.
const util = readFileSync('server/utils/artSlots.ts', 'utf8')
assert.match(util, /recycleArtImage\(artImageId, options\.actor\)/)
assert.doesNotMatch(util, /artImage\.delete\(/)
// Curation routes are admin/server-key only; the chosen-art read is the one public route.
for (const route of [
  'server/api/art/slots/index.get.ts',
  'server/api/art/slots/candidates/index.post.ts',
  'server/api/art/slots/candidates/[id].patch.ts',
  'server/api/art/slots/[id]/select.post.ts',
  'server/api/art/slots/dedupe.post.ts',
]) {
  assert.match(readFileSync(route, 'utf8'), /assertCurator\(auth\)/, route)
}
// The migration is additive only.
const sql = readFileSync(
  'prisma/migrations/20261112020000_art_slots/migration.sql',
  'utf8',
)
for (const statement of sql
  .replace(/^--.*$/gm, '')
  .split(';')
  .map((part) => part.trim())
  .filter(Boolean)) {
  assert.match(
    statement,
    /^(CREATE TABLE `Art(Slot|Candidate)`|ALTER TABLE `ArtCandidate` ADD CONSTRAINT)/,
    statement.slice(0, 60),
  )
}

console.log('art slots: ok')
