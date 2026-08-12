// /utils/scripts/verifyPartialPublishPrefix.ts
//
// A partial corpus publishes a PREFIX, and a prefix is the only partial shape
// allowed.
//
// WHY
// ---
// kind_robots#1769. The backfill was all-or-nothing: the assembler threw
// `Draft corpus covers 256/658 targets` and the publisher required
// `payload.length === eligibleTargets.length`. So 491 finished comments could
// not reach a live site until every one of 658 targets had been written, and
// the review layer stayed empty for months with the work already done.
//
// Prefix publishing is safe here for a reason specific to this pipeline: the
// publisher skips any target that already carries a first-party comment, so
// publishing 0..255 now and 256..657 later lands the same rows as publishing
// all 658 at once.
//
// What makes it UNSAFE is a hole. The publisher matches payload items to
// targets by POSITION -- `payload[index]` against `eligibleTargets[index]` --
// so a gap in the middle shifts every later comment onto the wrong object.
// Rewards would be commented as facets, characters would praise things they
// have never seen, and nothing would throw. Relaxing a length check into a
// bound is one careless edit away from relaxing it into nothing, which is why
// the boundary is pinned here rather than left to review.
//
//   npx tsx utils/scripts/verifyPartialPublishPrefix.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { stripComments } from './lib/sourceText'

const root = process.cwd()
const publisher = stripComments(
  readFileSync(join(root, 'utils/scripts/publishCommentBackfillLiveBatches.ts'), 'utf8'),
)
const assembler = stripComments(
  readFileSync(join(root, 'utils/scripts/assembleCommentBackfillDrafts.ts'), 'utf8'),
)

// ------------------------------------------------------- the prefix is bounded

assert.match(
  publisher,
  /payload\.length > eligibleTargets\.length/,
  'the publisher must reject a payload longer than the live eligible list -- more comments than objects means the target list moved under the corpus',
)
assert.doesNotMatch(
  publisher,
  /payload\.length !== eligibleTargets\.length/,
  'the publisher must not require an exact-length payload; that is the all-or-nothing gate this change removes',
)
assert.match(
  publisher,
  /if \(!payload\.length\)/,
  'an empty payload must be rejected rather than treated as a trivially valid prefix',
)

// --------------------------------------------- the slice is what gets iterated
//
// This is the specific bug the change had to avoid: the write loop originally
// walked every eligible target and did `payload[index]!`. Past the prefix that
// is undefined, and the non-null assertion carries it straight into
// `item.speakers`. Both the validation loop and the write loop must be scoped.

assert.match(
  publisher,
  /const publishTargets = eligibleTargets\.slice\(0, payload\.length\)/,
  'the publisher must derive an explicit slice rather than iterating the full eligible list against a partial payload',
)

const loopTargets = [...publisher.matchAll(/for \(const \[index, target\] of (\w+)\.entries\(\)\)/g)].map(
  (match) => match[1] as string,
)
assert.ok(
  loopTargets.length >= 2,
  'expected both the validation loop and the write loop to iterate targets by index',
)
for (const iterated of loopTargets) {
  assert.equal(
    iterated,
    'publishTargets',
    `a target loop iterates ${iterated}. With a partial payload, payload[index] past the prefix is undefined and the non-null assertion takes it into item.speakers.`,
  )
}

// ------------------------------------------------------ position still checked

assert.match(
  publisher,
  /item\.index !== index \|\| item\.key !== target\.key/,
  'the positional head check must survive: it is the only thing standing between a shifted payload and comments attached to the wrong objects',
)

// ------------------------------------------------ completeness scoped to slice

assert.match(
  publisher,
  /const remaining = publishTargets\.filter/,
  'the end-of-run completeness check must be scoped to the published slice; checking every eligible target fails any partial run by definition',
)

// ---------------------------------------- the corpus is still checked for holes
//
// Contiguity from 0 is what guarantees the payload is a prefix rather than an
// arbitrary subset, and it is enforced per packet at assembly time.

assert.match(
  assembler,
  /packet\.start !== cursor/,
  'the assembler must keep rejecting a packet whose start does not continue the previous one -- contiguity is what makes "prefix" true',
)
assert.match(
  assembler,
  /cursor > expectedTargets/,
  'the assembler must reject a corpus claiming more targets than exist',
)
assert.match(
  assembler,
  /cursor === 0/,
  'the assembler must reject an empty corpus',
)
assert.doesNotMatch(
  assembler,
  /cursor !== expectedTargets/,
  'the assembler must not require a complete corpus; that is the gate being removed',
)

// ------------------------------------------------------- provenance is honest

assert.match(
  assembler,
  /authoringModels: \[\.\.\.draftingModels\]/,
  'the assembled payload must report the models that actually wrote the corpus, aggregated from the packets, rather than asserting a single hardcoded author',
)
assert.doesNotMatch(
  assembler,
  /authoringModel: '/,
  'a hardcoded singular authoringModel is a provenance claim that stopped being true as soon as a second author contributed a packet',
)
assert.match(
  publisher,
  /batchFile\.releaseGate !== EXPECTED_RELEASE_GATE/,
  'the publisher must still gate on the release gate constant',
)
assert.match(
  publisher,
  /!batchFile\.authoringModels\?\.length/,
  'the publisher must refuse a payload that records no authorship at all',
)

// ------------------------------------------------------------------ behaviour
//
// The rule restated as outcomes, so the intent survives a rewrite of the code
// the assertions above match against.

type Target = { key: string }
const eligible: Target[] = Array.from({ length: 10 }, (_, i) => ({ key: `T:${i}` }))

function accepts(payloadKeys: string[]): boolean {
  if (!payloadKeys.length) return false
  if (payloadKeys.length > eligible.length) return false
  const slice = eligible.slice(0, payloadKeys.length)
  return slice.every((target, index) => target.key === payloadKeys[index])
}

assert.equal(accepts(eligible.map((t) => t.key)), true, 'a complete payload must publish')
assert.equal(accepts(['T:0', 'T:1', 'T:2']), true, 'a prefix must publish')
assert.equal(accepts([]), false, 'an empty payload must not publish')
assert.equal(
  accepts([...eligible.map((t) => t.key), 'T:10']),
  false,
  'a payload longer than the eligible list must not publish',
)
assert.equal(
  accepts(['T:0', 'T:2', 'T:3']),
  false,
  'a hole in the middle must not publish -- this is the shift that would silently mis-attach every later comment',
)
assert.equal(
  accepts(['T:1', 'T:0', 'T:2']),
  false,
  'reordering must not publish',
)
assert.equal(
  accepts(['T:5', 'T:6']),
  false,
  'a suffix is not a prefix; publishing must start at the beginning of the eligible list',
)

console.log(
  'Partial publish prefix verified: prefixes publish, holes and suffixes do not, both target loops are slice-scoped.',
)
