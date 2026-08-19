// /utils/scripts/verifyModelBuilderContentStageFreshnessGuard.ts
//
// Regression guard (model-builder/t-029, cycle 17) -- runs/index.ts's
// assertContentStageEditable() gate (added by an earlier cycle, see
// verifyModelBuilderItemPatchStageGuard.ts) refuses to write body.pitch /
// body.fieldsDraft / body.promptDraft / body.artImageId onto an item whose
// owning stage (PITCH / FIELDS_AND_PROMPTS / GENERATE_ASSETS) is not
// ready/stale/rejected -- but until this fix, that check ran exactly once,
// against `existing`, a single findUnique read done at the very top of the
// request handler, before readBody, artImageId attachability validation, or
// the transaction even opened. A sibling cycle (kind_robots PR #1900)
// already hardened the neighboring stageStatuses *merge* to re-read
// immediately before its write; this check -- the *gate that decides
// whether the content write is even allowed at all* -- was never given the
// same treatment.
//
// Concrete repro: an item's PITCH stage is 'ready'. Two concurrent PATCH
// /items/:id requests target it -- request A is approveStage('PITCH') (sends
// only { stageStatuses: {...PITCH: approved...} }, no content field, exactly
// what modelBuilderStore.ts's approveStage() sends); request B is
// updatePitch(itemId, 'edited text') (sends { stageStatuses: <B's own,
// still-'ready' local snapshot>, pitch: 'edited text', error: null }, exactly
// what updatePitch() sends). Both requests' own `existing` findUnique read
// PITCH as 'ready'. A's transaction commits first, writing PITCH: 'approved'.
// B's assertContentStageEditable call already ran (synchronously, before
// either transaction opened) against B's now-stale `existing.stageStatuses`
// showing 'ready' -- it passed. B's own diffStageStatusChanges found no
// difference between its local 'ready' and its own stale existing-read
// 'ready', so stageStatusChanges is null and B's write never touches
// stageStatuses at all. B's transaction then applies data.pitch = 'edited
// text' unconditionally. Final DB state: PITCH stays 'approved' (from A),
// but item.pitch is silently overwritten with B's edit -- the approved
// badge lies about what's actually stored, exactly the outcome
// assertContentStageEditable exists to prevent, just reached through its own
// staleness rather than its absence.
//
// Fixed by re-running assertContentStageEditable a second time, against a
// value read via findUnique immediately before the actual write, for every
// content field a request intends to change (contentStageChecks, threaded
// through PreparedItemUpdate) -- both in items/[id].patch.ts and, per-entry
// so one item's staleness doesn't abort the rest of an unrelated batch, in
// items/batch.patch.ts.
//
// This asserts the textual shape of that fix stays in place:
//   1. runs/index.ts exports assertContentStageEditable (so route files can
//      call it a second time) and PreparedItemUpdate's contentStageChecks
//      field is actually populated by prepareItemUpdate.
//   2. Both items/[id].patch.ts and items/batch.patch.ts call
//      assertContentStageEditable a second time, inside their transaction,
//      with a value sourced from a `findUnique` -- not `existing` -- as the
//      first argument.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const RUNS_INDEX_PATH = join(
  repositoryRoot,
  'server/api/model-builder/runs/index.ts',
)
const SINGLE_PATCH_PATH = join(
  repositoryRoot,
  'server/api/model-builder/items/[id].patch.ts',
)
const BATCH_PATCH_PATH = join(
  repositoryRoot,
  'server/api/model-builder/items/batch.patch.ts',
)

// Checks runs/index.ts: assertContentStageEditable must be exported, and
// prepareItemUpdate must actually populate contentStageChecks (not just
// declare the field and leave it always empty).
export function checkRunsIndexExportsFreshnessPieces(
  content: string,
): string[] {
  const errors: string[] = []

  if (!content.includes('export function assertContentStageEditable')) {
    errors.push(
      'runs/index.ts no longer exports assertContentStageEditable() -- ' +
        'route files can no longer re-run this gate a second time against a ' +
        'fresh read, reintroducing the staleness bug this guard exists to catch.',
    )
  }

  if (
    !content.includes(
      "contentStageChecks: PreparedItemUpdate['contentStageChecks'] = []",
    )
  ) {
    errors.push(
      'prepareItemUpdate() no longer initializes a contentStageChecks ' +
        'accumulator -- has the fix been renamed, removed, or reworked?',
    )
  }

  const pushCount = (content.match(/contentStageChecks\.push\(/g) ?? []).length
  if (pushCount < 4) {
    errors.push(
      `prepareItemUpdate() only pushes onto contentStageChecks ${pushCount} ` +
        'time(s) -- expected 4 (pitch, fieldsDraft, promptDraft, artImageId), ' +
        "one per gated field. A missing push means that field's eager check " +
        "is no longer replayed at write time, silently reopening this field's " +
        'own staleness window.',
    )
  }

  return errors
}

// Checks a PATCH route file: it must call assertContentStageEditable with a
// value sourced from a fresh read (never `existing`), inside its
// transaction, before the item write it protects.
export function checkPatchRouteFreshContentCheck(
  content: string,
  label: string,
): string[] {
  const errors: string[] = []

  // Every call to assertContentStageEditable(...) in this file -- there may
  // be more than one in batch.patch.ts's per-entry loop shape, but each
  // must pass a non-`existing` first argument.
  const callPattern = /assertContentStageEditable\(\s*([^,]+),/g
  const calls = [...content.matchAll(callPattern)]

  if (calls.length === 0) {
    errors.push(
      `${label} never calls assertContentStageEditable(...) -- the write-time ` +
        're-validation this guard exists to enforce is missing entirely.',
    )
    return errors
  }

  for (const call of calls) {
    const firstArg = call[1]!.trim()
    if (/\bexisting\b/.test(firstArg)) {
      errors.push(
        `${label} calls assertContentStageEditable(${firstArg}, ...) -- its ` +
          'first argument references `existing`, the request-start snapshot, ' +
          'instead of a value read fresh (via findUnique) immediately before ' +
          'the write it gates. This is the exact staleness bug this guard ' +
          'exists to catch: a concurrent approveStage landing in between is ' +
          'invisible to a check run against `existing`.',
      )
    }
  }

  // At least one of those calls must sit inside a transaction callback
  // (`prisma.$transaction(async (tx) => {`), not only in the pre-transaction
  // eager check inside prepareItemUpdate (which this file merely calls, and
  // whose own internal `existing`-based call is expected and fine).
  const txIndex = content.indexOf('prisma.$transaction(async (tx)')
  const hasCallAfterTx = calls.some((call) => call.index! > txIndex)
  if (txIndex === -1 || !hasCallAfterTx) {
    errors.push(
      `${label} does not call assertContentStageEditable(...) inside its ` +
        '`prisma.$transaction(async (tx) => { ... })` callback -- the write-time ' +
        're-check must run immediately before the write, inside the same ' +
        'transaction, not only once eagerly at request start.',
    )
  }

  // A `findUnique` selecting stageStatuses must precede that in-transaction
  // call (the fresh read it's meant to validate against).
  if (hasCallAfterTx) {
    const inTxCall = calls.find((call) => call.index! > txIndex)!
    const beforeCall = content.slice(0, inTxCall.index)
    const findUniqueIndex = beforeCall.lastIndexOf('findUnique')
    const stageTrueIndex = beforeCall.lastIndexOf('stageStatuses: true')
    if (findUniqueIndex === -1 || stageTrueIndex < findUniqueIndex) {
      errors.push(
        `${label}'s in-transaction assertContentStageEditable(...) call has no ` +
          '`findUnique({ ... select: { stageStatuses: true } })` preceding it -- ' +
          'there is no fresh value for it to actually validate against.',
      )
    }
  }

  return errors
}

function main(): void {
  const runsIndexContent = readFileSync(RUNS_INDEX_PATH, 'utf8')
  const singlePatchContent = readFileSync(SINGLE_PATCH_PATH, 'utf8')
  const batchPatchContent = readFileSync(BATCH_PATCH_PATH, 'utf8')

  const errors = [
    ...checkRunsIndexExportsFreshnessPieces(runsIndexContent),
    ...checkPatchRouteFreshContentCheck(
      singlePatchContent,
      'items/[id].patch.ts',
    ),
    ...checkPatchRouteFreshContentCheck(
      batchPatchContent,
      'items/batch.patch.ts',
    ),
  ]

  if (errors.length) {
    console.error(
      'Model Builder content-stage freshness guard contract failed:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder content-stage freshness guard contract passed: ' +
      'assertContentStageEditable() is re-run against a freshly re-read ' +
      'stageStatuses value, inside the write transaction, immediately before ' +
      'every content field write it gates -- in both items/[id].patch.ts and ' +
      'items/batch.patch.ts.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
