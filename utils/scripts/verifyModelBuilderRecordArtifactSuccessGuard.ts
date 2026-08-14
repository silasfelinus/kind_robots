// /utils/scripts/verifyModelBuilderRecordArtifactSuccessGuard.ts
//
// Regression guard (model-builder/t-029) -- recordArtifact() persists a
// GENERATE_ASSETS candidate as a durable ModelBuildArtifact row: adaptItem's
// imagePath (Artifacts[last]?.promotedPath ?? draftPath) reconstructs from
// this row on the NEXT resume/reload, independent of item.artImageId (which
// is written separately, straight onto the item, by the pushItem call right
// after this one). performFetch never rejects for an HTTP-level failure -- a
// validation error, assertArtImageAttachable's 403, or a 409 from
// assertRunWritable if the run was cancelled mid-request -- it always
// *resolves* with `{ success: false }` (see its own doc comment: "honor both
// fields so a body-level failure is never reported as a successful fetch").
// Before this fix, recordArtifact awaited performFetch inside a try/catch but
// never checked `.success` on the resolved response -- since performFetch
// doesn't throw for a body-level failure, that catch block was effectively
// dead code, and ANY failure of this POST was silently discarded with no
// error surfaced anywhere and no retry. Both call sites (generateItemAsset,
// pollAsyncArtJob) proceed straight to marking the stage 'ready' and popping
// a "Generated a candidate" success toast regardless -- so the user sees
// success while the durable Artifact row was simply never written. Concrete
// repro: generate a candidate, have this POST fail for any reason (no
// cancellation needed -- a transient DB error is enough), approve
// GENERATE_ASSETS (the just-rendered thumbnail is still showing from local
// state), reload the page -- the stage is still 'approved' and
// item.artImageId is still set (commit still works off it), but
// item.imagePath comes back null because adaptItem has no Artifact row to
// read it from, so the approved candidate silently loses its preview image
// with no error ever having been shown.
//
// This asserts the textual shape of that fix stays in place: recordArtifact()
// checks `result.success` (or an equivalent `!result.success`/`.success ===
// false` guard on the resolved performFetch response) before returning, and
// no longer performs the POST inside a try/catch that never checks it --
// deliberately scoped to this one function/bug, mirroring
// verifyModelBuilderBatchSetFieldConfirmedSuccessGuard.ts's own narrow
// textual check over a general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'recordArtifact'
const FETCH_CALL = 'performFetch('
const SUCCESS_CHECK_PATTERN =
  /!\s*result\.success|result\.success\s*===\s*false/

// Checks the fix's exact shape against the full source text of a file
// containing a `recordArtifact`-named async function. Exported (rather than
// only exercised via main()) so the self-test below can run it against
// synthetic buggy/fixed fixtures without touching the real store file.
export function checkRecordArtifactSuccessGuard(content: string): string[] {
  const errors: string[] = []

  const functions = extractFunctionBodies(content)
  const fn = functions.find((f) => f.name === FN_NAME)
  if (!fn) {
    errors.push(
      `Could not find an async function named ${FN_NAME}() -- has it been ` +
        'renamed, removed, or inlined? If so, this guard (and the bug it ' +
        'protects against) needs to move with it.',
    )
    return errors
  }

  const fetchIndex = fn.body.indexOf(FETCH_CALL)
  if (fetchIndex === -1) {
    errors.push(
      `${FN_NAME}() no longer calls ${FETCH_CALL} -- this guard's anchor ` +
        "point has moved; re-check how this function's artifact-recording " +
        'request is issued.',
    )
    return errors
  }

  if (!SUCCESS_CHECK_PATTERN.test(fn.body)) {
    errors.push(
      `${FN_NAME}() does not check the resolved response's \`.success\` ` +
        'field (expected something like `if (!result.success) { ... }`). ' +
        'performFetch never rejects for an HTTP-level failure -- it always ' +
        'resolves with `{ success: false }` -- so a bare try/catch around ' +
        'the await never actually catches a failed artifact-recording POST. ' +
        'Without a `.success` check, that failure is silently discarded: ' +
        'the caller still marks the stage ready and pops a success toast, ' +
        'but the durable Artifact row an eventual reload reconstructs ' +
        'item.imagePath from was never written.',
    )
  }

  // The pre-fix shape wrapped the fetch in a try/catch and called the
  // *unconditional* global handleError() only from that catch block -- which
  // performFetch's always-resolve behavior made unreachable in practice for
  // the exact failures this function needs to report. A bare
  // `catch (error) { handleError(error, ...) }` with no success check
  // anywhere in the body is the buggy shape even if a success check exists
  // elsewhere by coincidence, so this only flags the specific combination:
  // no success check at all (handled above). No further check needed here --
  // keeping this guard narrow, one function/bug, per the file's convention.

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkRecordArtifactSuccessGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder recordArtifact success guard contract failed for ' +
        `${FN_NAME}() in modelBuilderStore.ts:`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder recordArtifact success guard contract passed: ' +
      `${FN_NAME}() checks the resolved response's success field before ` +
      'returning, so a failed artifact-recording POST is reported instead ' +
      'of silently discarded.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
