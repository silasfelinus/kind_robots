// /utils/scripts/verifyStorybookDuplicateArtCarryoverGuard.mjs
//
// Regression guard (storybook/t-010, front-end polish). `remapDuplicate()` in
// storybookLibraryHelper.ts is what `duplicateStory()` uses to build the copy
// that becomes the new active session -- and the "Duplicate" button that
// calls it is enabled the moment `isWeaving()` goes false, long before that
// story's most recent beat's background illustration job actually resolves
// (art generation runs independently of `isWeaving`). Duplicating while a
// beat's art was still 'queued'/'rendering', or had previously 'failed', used
// to drop that beat's `art` straight to `undefined` on the copy -- only a
// `status === 'done'` illustration was carried forward. `NarrativeArtStatus`
// renders nothing at all when `art` is unset (`v-if="art"`), and
// `retryBeatArt()` requires a truthy `beat.art` to do anything, so the
// duplicate was left with no image, no busy indicator, and no retry
// affordance for that beat -- permanently, with no way for the reader to ever
// get an illustration there again.
//
// The fix carries the art state forward (rekeyed to the duplicate's own
// session/beat ids) for every status except 'queueing' -- the one gap with no
// `jobId` assigned yet, where rekeying would send a later recovery GET
// looking for a job filed under the ORIGINAL's ids, find nothing, and fall
// through to submitting a second real job for one beat. This asserts that
// shape stays in place: `remapDuplicate()` still special-cases only
// 'queueing' for the drop, and still rekeys everything else's identity
// fields rather than blanket-dropping any non-'done' status.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractTsFunctionBody } from './lib/extractTsFunctionBody.mjs'

const HELPER_PATH = 'stores/helpers/storybookLibraryHelper.ts'
const FN_NAME = 'remapDuplicate'

const content = readFileSync(resolve(process.cwd(), HELPER_PATH), 'utf8')
const body = extractTsFunctionBody(content, FN_NAME, {
  path: HELPER_PATH,
  notFoundHint:
    'has remapDuplicate() been renamed, removed, or inlined? If so, this ' +
    'guard (and the duplicate-art-loss bug it protects against) needs to ' +
    'move with it.',
})

assert.ok(
  !body.includes("beat.art?.status === 'done'"),
  `${FN_NAME}() must not gate art carryover on \`beat.art?.status === 'done'\` ` +
    "alone -- that blanket-drops every 'queued'/'rendering'/'failed'/" +
    "'cancelled' illustration on the duplicate, permanently and with no " +
    'retry path.',
)

assert.ok(
  body.includes("beat.art && beat.art.status !== 'queueing'"),
  `${FN_NAME}() no longer guards art carryover with ` +
    "`beat.art && beat.art.status !== 'queueing'` -- without this exact " +
    'condition, either a real illustration gets dropped again (too strict), ' +
    "or the unresolved 'queueing' gap (no jobId assigned yet) gets rekeyed " +
    'and risks a second real submission once the original job actually ' +
    'resolves under ids the duplicate no longer matches (too loose).',
)

assert.ok(
  body.includes(
    "jobId: beat.art.status === 'done' ? undefined : beat.art.jobId",
  ),
  `${FN_NAME}() must preserve a carried-over illustration's real \`jobId\` ` +
    "for every non-'done' status -- clearing it would make resume() treat " +
    "an already-submitted 'queued'/'rendering' job as needing recovery, " +
    'risking the exact double-submission this guard exists to prevent.',
)

console.log(
  'Storybook duplicate-art-carryover guard contract passed: remapDuplicate() ' +
    'still carries a queued, rendering, failed, or cancelled illustration ' +
    'forward onto the duplicate (rekeyed, jobId intact) instead of silently ' +
    'and permanently dropping it, while still refusing to rekey the one ' +
    "genuinely unsafe 'queueing' (no jobId yet) window.",
)
