// /utils/scripts/verifyStorybookDuplicateResumeGuard.mjs
//
// Regression guard (storybook/t-010, cycle 27). `remapDuplicate()` in
// storybookLibraryHelper.ts deliberately carries a 'queued'/'rendering'
// beat's real `jobId` forward onto the duplicate it builds, rekeyed to the
// duplicate's own session/beat ids (see verifyStorybookDuplicateArtCarryoverGuard.mjs).
// Its own comment explains why that's safe: "'queued'/'rendering'/'failed'/
// 'cancelled' all already carry a real `jobId` ... so rekeying their ids is
// safe: resume() polls purely by jobId with no re-submission" -- i.e. the fix
// assumes something calls `resume()` (resumeNarrativeArtJobs()) on the
// duplicate afterward.
//
// duplicateStory() never did. `openStory()` and storybookStore.ts's own
// restoreFromLocalStorage() both call `bridge.resumeNarrativeArtJobs()`
// immediately after swapping the active session in, for exactly this reason,
// but duplicateStory() called `bridge.setSession(duplicate)` and stopped --
// setSession() alone starts no polling. Concrete failure: the "Duplicate"
// button is enabled the moment `isWeaving()` goes false, long before that
// story's most recent beat's background illustration job actually resolves
// (art generation runs independently of `isWeaving`), so duplicating with a
// beat's art still 'queued' or 'rendering' is routine, not an edge case. The
// duplicate's copy of that beat carried a live jobId with nothing polling
// it: NarrativeArtStatus (`v-if="art"`, busy branch on 'queued'/'rendering')
// showed the illustration stuck "queued"/"rendering" forever, with no retry
// affordance either -- `NarrativeArtStatus` only offers Retry once a job
// reaches 'failed'/'cancelled'. Only an unrelated page reload (which re-runs
// resumeNarrativeArtJobs() via restoreFromLocalStorage()) would ever pick
// the real, still-rendering job back up.
//
// Fixed by calling `bridge.resumeNarrativeArtJobs()` right after
// `bridge.setSession(duplicate)` inside duplicateStory() -- the same shape
// openStory() already uses. Safe against the double-submission class the
// sibling guards (verifyStorybookActiveStoryResumeGuard.ts,
// verifyStorybookLibraryMountReopenGuard.mjs) protect against: those guard a
// REDUNDANT second resume for a session already resumed once, whereas this
// is the ONLY resume call for a brand-new duplicate session, and
// remapDuplicate() already drops the one status ('queueing', no jobId yet)
// where resuming would risk a second real submission.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractTsFunctionBody } from './lib/extractTsFunctionBody.mjs'

const HELPER_PATH = 'stores/helpers/storybookLibraryHelper.ts'
const FN_NAME = 'duplicateStory'

const content = readFileSync(resolve(process.cwd(), HELPER_PATH), 'utf8')
const body = extractTsFunctionBody(content, FN_NAME, {
  path: HELPER_PATH,
  notFoundHint:
    'has duplicateStory() been renamed, removed, or restructured? If so, ' +
    'this guard (and the orphaned-polling bug it protects against) needs ' +
    'to move with it.',
})

const setSessionIndex = body.indexOf('bridge.setSession(duplicate)')
assert.ok(
  setSessionIndex !== -1,
  `${FN_NAME}() in ${HELPER_PATH} no longer calls ` +
    '`bridge.setSession(duplicate)` -- has the duplicate no longer become ' +
    'the active session directly? If so, this guard needs to move with it.',
)

const resumeIndex = body.indexOf('bridge.resumeNarrativeArtJobs()')
assert.ok(
  resumeIndex !== -1,
  `${FN_NAME}() in ${HELPER_PATH} must call \`bridge.resumeNarrativeArtJobs()\` ` +
    '-- without it, a beat duplicated while its illustration is still ' +
    "'queued'/'rendering' carries a live jobId onto the duplicate that " +
    'nothing ever polls again, leaving the illustration stuck with no ' +
    'retry affordance until an unrelated page reload happens to resume it.',
)

assert.ok(
  resumeIndex > setSessionIndex,
  `${FN_NAME}() in ${HELPER_PATH} must call \`bridge.resumeNarrativeArtJobs()\` ` +
    'AFTER `bridge.setSession(duplicate)` -- calling it before the duplicate ' +
    "is the active session would resume polling for the WRONG session's beats.",
)

console.log(
  'Storybook duplicate-resume guard contract passed: duplicateStory() ' +
    'resumes art-job polling for the new duplicate session right after ' +
    "making it active, so a beat's still in-flight illustration keeps " +
    'updating instead of freezing until an unrelated page reload.',
)
