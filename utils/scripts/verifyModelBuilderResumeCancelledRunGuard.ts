// /utils/scripts/verifyModelBuilderResumeCancelledRunGuard.ts
//
// Regression guard (model-builder/t-029, kaizen) -- resumeRun()'s own doc
// comment claims it resumes "the remembered run id if still present, else
// the newest non-cancelled run for this user." The "non-cancelled" part was
// only ever true on the *fallback* path (`GET /api/model-builder/runs?take=1`,
// which excludes status: CANCELLED server-side by default) -- the
// remembered-id path (`GET /api/model-builder/runs/:id`) has no status
// filter at all and returns any run the caller owns, cancelled or not.
// `modelBuilder:runId` is a single origin-wide localStorage key, and
// cancelRun() only clears it when the run being cancelled is *this tab's*
// currently active run (`if (state.run?.id === runId) resetRun()`) -- so
// cancelling a different run than the one currently open (e.g. from the
// Run History panel) can leave a now-CANCELLED id sitting in that shared
// key. Before this fix, a later resumeRun() (e.g. on page reload) would
// silently resume that dead run: the UI shows it as a normal, fully
// interactive run with no cancelled indicator anywhere, every stage-mutating
// action optimistically updates local state, and the background PATCH/POST
// then 409s server-side on assertRunWritable's "this build run was
// cancelled" check -- leaving the UI durably out of sync with the server for
// the rest of the session.
//
// Fixed by checking `response.data.status !== 'CANCELLED'` before accepting
// the remembered-id fetch's result, and forgetting the id (`safeRemove`) when
// it turns out to be cancelled.
//
// This asserts the textual shape of that fix stays in place: resumeRun's
// `if (remembered)` branch checks `.status !== 'CANCELLED'` on the
// remembered-id response before assigning `data`, and the branch calls
// `safeRemove(runIdKey)` for a run that fails that check. Deliberately
// scoped to this one function/bug, mirroring
// verifyModelBuilderCancelledRunGuard.ts's own narrow textual check over a
// general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'resumeRun'
const REMEMBERED_BRANCH = 'if (remembered)'
const STATUS_CHECK = "status !== 'CANCELLED'"
const FORGET_CALL = 'safeRemove(runIdKey)'
const FALLBACK_BRANCH = 'if (!data)'

// Checks the fix's exact shape against the full source text of a file
// containing a `resumeRun`-named async function. Exported (rather than only
// exercised via main()) so the self-test below can run it against synthetic
// buggy/fixed fixtures without touching the real store file.
export function checkResumeCancelledRunGuard(content: string): string[] {
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

  const rememberedIndex = fn.body.indexOf(REMEMBERED_BRANCH)
  if (rememberedIndex === -1) {
    errors.push(
      `${FN_NAME}() no longer has an ${REMEMBERED_BRANCH} branch -- this ` +
        'guard assumes the remembered-run-id fetch is still a distinct ' +
        'code path from the newest-non-cancelled-run fallback.',
    )
    return errors
  }

  const fallbackIndex = fn.body.indexOf(FALLBACK_BRANCH, rememberedIndex)
  const rememberedBranchEnd =
    fallbackIndex === -1 ? fn.body.length : fallbackIndex

  const statusCheckIndex = fn.body.indexOf(STATUS_CHECK, rememberedIndex)
  if (statusCheckIndex === -1 || statusCheckIndex >= rememberedBranchEnd) {
    errors.push(
      `${FN_NAME}()'s ${REMEMBERED_BRANCH} branch does not check ` +
        `\`${STATUS_CHECK}\` on the fetched run before accepting it. ` +
        'GET /api/model-builder/runs/:id has no status filter, unlike the ' +
        'take=1 fallback -- without this check, a cancelled run left in ' +
        'the shared modelBuilder:runId localStorage key (e.g. cancelled ' +
        "from a different tab's currently-active run) gets silently " +
        'resumed into a fully-interactive UI whose every mutation then ' +
        "409s server-side on assertRunWritable's cancelled check.",
    )
  }

  const forgetCallIndex = fn.body.indexOf(FORGET_CALL, rememberedIndex)
  if (forgetCallIndex === -1 || forgetCallIndex >= rememberedBranchEnd) {
    errors.push(
      `${FN_NAME}()'s ${REMEMBERED_BRANCH} branch does not call ` +
        `${FORGET_CALL} when the remembered run turns out to be ` +
        'cancelled -- without this, the same dead id stays remembered and ' +
        'every future resumeRun() call keeps re-fetching and re-rejecting ' +
        'it instead of falling through to a live run.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkResumeCancelledRunGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder resume-cancelled-run guard contract failed for ' +
        `${FN_NAME}() in modelBuilderStore.ts:`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder resume-cancelled-run guard contract passed: ' +
      `${FN_NAME}()'s remembered-id branch rejects and forgets a ` +
      'cancelled run instead of silently resuming it.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
