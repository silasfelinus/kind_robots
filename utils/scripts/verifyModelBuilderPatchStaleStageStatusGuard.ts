// /utils/scripts/verifyModelBuilderPatchStaleStageStatusGuard.ts
//
// Regression guard (model-builder/t-029, kaizen) -- prepareItemUpdate() in
// server/api/model-builder/runs/index.ts is the shared body behind both
// items/[id].patch.ts and items/batch.patch.ts. modelBuilderStore.ts always
// sends the item's ENTIRE local `stages` object as body.stageStatuses on
// every write (pushItem, batchPushItems' per-entry payloads, recordArtifact's
// callers -- it's simply what the client's own reactive state looks like at
// click time), never just the one stage key an action actually changed.
//
// Before this fix, prepareItemUpdate wrote that whole blob straight to the
// `stageStatuses` column (`data.stageStatuses = stageStatuses`). Any OTHER
// stage key a concurrent request changed in the window between THIS
// request's `existing` read and its own eventual write got silently
// discarded. items/[id]/commit.post.ts already had (and still has) an
// almost identical bug fixed for its own COMMIT-only write -- see
// verifyModelBuilderCommitStaleSnapshotGuard.ts -- but that fix never
// extended to the PATCH / batch-PATCH routes, which write stageStatuses far
// more often and (for batch.patch.ts especially) hold a much wider window:
// every entry in a batch does its own findUnique + assertArtImageAttachable
// round trip *before* the shared transaction even starts, so a same-item
// concurrent write (e.g. an async art job's pollAsyncArtJob -> pushItem
// landing mid-batch) has real room to land in between.
//
// Concrete repro: a user opens a quantity group and clicks "Set field on
// group" (batchSetField), which snapshots every item's local `.stages` and
// sends them as part of a single batch PATCH. Meanwhile one item in that
// same group has an async art job (generateItemAssetAsync) that finishes
// mid-batch-request and PATCHes its own item with a freshly-'ready'
// GENERATE_ASSETS status. If that single PATCH commits before the batch's
// shared transaction reaches that item, the batch's write -- built from its
// pre-request snapshot -- silently reverts GENERATE_ASSETS back to whatever
// it was when the batch was sent, discarding the just-finished render's
// status with no error, no re-review trigger, no toast.
//
// Fixed the same way commit.post.ts was: diff the request's stageStatuses
// against its own `existing` snapshot to find which keys it actually
// intends to change (diffStageStatusChanges), then re-read the item's live
// stageStatuses immediately before each write and merge only those changed
// keys onto it (mergeStageStatusChanges) -- never write the stale blob
// wholesale.
//
// This asserts the textual shape of the fix stays in place:
//   1. prepareItemUpdate() no longer contains a direct
//      `data.stageStatuses = stageStatuses` assignment.
//   2. Both items/[id].patch.ts and items/batch.patch.ts call
//      mergeStageStatusChanges(...) with a value sourced from a `findUnique`
//      call, immediately assigned to `data.stageStatuses`, before their
//      respective `tx.modelBuildItem.update(...)` write.
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

const BLIND_OVERWRITE = 'data.stageStatuses = stageStatuses'
const MERGE_ASSIGNMENT = 'data.stageStatuses = mergeStageStatusChanges('

// Checks runs/index.ts: prepareItemUpdate must no longer contain the blind
// wholesale-overwrite assignment.
export function checkRunsIndexNoBlindOverwrite(content: string): string[] {
  const errors: string[] = []
  if (content.includes(BLIND_OVERWRITE)) {
    errors.push(
      `runs/index.ts still contains \`${BLIND_OVERWRITE}\` -- prepareItemUpdate() ` +
        'appears to write the request-start stageStatuses blob wholesale again, ' +
        'reintroducing the stale-overwrite bug this guard exists to catch.',
    )
  }
  if (!content.includes('export function diffStageStatusChanges')) {
    errors.push(
      'runs/index.ts no longer exports diffStageStatusChanges() -- has the ' +
        'stageStatuses-diff fix been renamed or removed?',
    )
  }
  if (!content.includes('export function mergeStageStatusChanges')) {
    errors.push(
      'runs/index.ts no longer exports mergeStageStatusChanges() -- has the ' +
        'stageStatuses-merge fix been renamed or removed?',
    )
  }
  return errors
}

// Checks a PATCH route file: it must call mergeStageStatusChanges with a
// value read via a fresh `findUnique` (not the request-start snapshot),
// before a `tx.modelBuildItem.update(` write.
//
// Not a fixed character-distance window (model-builder/t-029, cycle 17):
// the earlier version of this check required `findUnique` and
// `stageStatuses: true` to appear within 400 characters before the merge
// assignment, which was true when this fix first landed but broke the
// moment legitimate per-write validation grew that gap -- e.g. the
// contentStageChecks re-validation this same cycle added between the fresh
// read and the merge, to close the sibling staleness bug in
// assertContentStageEditable (see verifyModelBuilderItemPatchStageGuard.ts).
// Checked instead as three distance-independent invariants: (1) the merge's
// own first argument text isn't `existing.stageStatuses` (the literal
// regression signal), (2) a `findUnique(...)` selecting `stageStatuses:
// true` appears anywhere before the merge, and (3) no
// `tx.modelBuildItem.update(` write happens between that read and the
// merge -- i.e. the read genuinely precedes this write, however much
// validation now sits in between.
export function checkPatchRouteFreshMerge(
  content: string,
  label: string,
): string[] {
  const errors: string[] = []

  const mergeIndex = content.indexOf(MERGE_ASSIGNMENT)
  if (mergeIndex === -1) {
    errors.push(
      `${label} does not call \`${MERGE_ASSIGNMENT}...)\` -- it appears to ` +
        'write stageStatuses without merging onto a fresh read, reintroducing ' +
        'the stale-overwrite bug this guard exists to catch.',
    )
    return errors
  }

  const argStart = mergeIndex + MERGE_ASSIGNMENT.length
  const argEnd = content.indexOf(',', argStart)
  const firstArg = content
    .slice(argStart, argEnd === -1 ? argStart + 120 : argEnd)
    .trim()
  if (/\bexisting\b/.test(firstArg)) {
    errors.push(
      `${label} calls mergeStageStatusChanges(${firstArg}, ...) -- its first ` +
        'argument references `existing`, the stale request-start snapshot, ' +
        'instead of a value read fresh immediately before this write.',
    )
  }

  const beforeMerge = content.slice(0, mergeIndex)
  const findUniqueIndex = beforeMerge.lastIndexOf('findUnique')
  const stageTrueIndex = beforeMerge.lastIndexOf('stageStatuses: true')
  if (findUniqueIndex === -1 || stageTrueIndex < findUniqueIndex) {
    errors.push(
      `${label} calls mergeStageStatusChanges(...) but no ` +
        '`findUnique({ ... select: { stageStatuses: true } })` precedes it -- ' +
        'the merge must be based on a value read immediately before the ' +
        'write, not an older snapshot.',
    )
  } else {
    const lastWriteIndex = beforeMerge.lastIndexOf('tx.modelBuildItem.update(')
    if (lastWriteIndex > findUniqueIndex) {
      errors.push(
        `${label} writes the item (tx.modelBuildItem.update(...)) before ` +
          'its own stageStatuses fresh-read/merge -- the read (and merge) ' +
          'must happen before any write, not after.',
      )
    }
  }

  // The merge assignment must itself land before the actual DB write it
  // feeds, not after.
  const updateIndex = content.indexOf('tx.modelBuildItem.update({', mergeIndex)
  if (updateIndex === -1) {
    errors.push(
      `${label} calls mergeStageStatusChanges(...) but no ` +
        '`tx.modelBuildItem.update({` write follows it -- the merged value ' +
        "doesn't appear to feed an actual write.",
    )
  }

  return errors
}

function main(): void {
  const runsIndexContent = readFileSync(RUNS_INDEX_PATH, 'utf8')
  const singlePatchContent = readFileSync(SINGLE_PATCH_PATH, 'utf8')
  const batchPatchContent = readFileSync(BATCH_PATCH_PATH, 'utf8')

  const errors = [
    ...checkRunsIndexNoBlindOverwrite(runsIndexContent),
    ...checkPatchRouteFreshMerge(singlePatchContent, 'items/[id].patch.ts'),
    ...checkPatchRouteFreshMerge(batchPatchContent, 'items/batch.patch.ts'),
  ]

  if (errors.length) {
    console.error(
      'Model Builder PATCH stale stage-status guard contract failed:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder PATCH stale stage-status guard contract passed: ' +
      'prepareItemUpdate() diffs requested stageStatuses against its own ' +
      'request-start snapshot, and both PATCH routes merge only the changed ' +
      'keys onto a freshly re-read value immediately before each write.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
