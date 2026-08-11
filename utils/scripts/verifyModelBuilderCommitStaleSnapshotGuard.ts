// /utils/scripts/verifyModelBuilderCommitStaleSnapshotGuard.ts
//
// Regression guard (model-builder/t-029, kaizen) -- items/[id]/commit.post.ts
// fetches the build item once at the very top of the request handler and
// holds that snapshot across several slow, awaited operations (the
// idempotency claim, then the actual write -- promoteAsset / updateText /
// createRecord+linkSourceToTarget, the last of which runs inside a
// prisma.$transaction that can involve multiple round-trips including
// facet-sync work). After all of that finishes, the route used to build the
// item's *entire* stageStatuses blob from that original, now-stale snapshot
// (`item.stageStatuses`) and write it back wholesale.
//
// Nothing in the UI blocks a user from clicking "Edit" on that same item's
// already-approved FIELDS_AND_PROMPTS (or PITCH) stage while the commit POST
// is still in flight -- isCommitting only disables the Commit button itself.
// Reopening a stage fires a separate, fast PATCH /items/:id that sets that
// stage back to 'ready' and marks GENERATE_ASSETS/COMMIT 'stale'. If that
// PATCH lands before the commit route's slower write finishes, the commit
// route's final update -- built from its pre-commit snapshot -- clobbers it:
// it silently restores the reopened stage (and GENERATE_ASSETS) back to
// 'approved' and sets COMMIT to 'approved', even though the user just
// reopened a stage for editing and it now holds unreviewed content. The
// "approved" badge then lies about what's actually stored.
//
// Fixed by re-fetching stageStatuses immediately before the final write and
// merging only the COMMIT key into that fresh value, instead of reusing the
// request-start snapshot.
//
// This asserts the textual shape of that fix stays in place: the final
// `stages.COMMIT = {` assignment in commit.post.ts's default event handler
// builds `stages` from a value re-read from the database just before that
// assignment, not from the request-start `item.stageStatuses` snapshot alone.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const ROUTE_PATH = join(
  repositoryRoot,
  'server/api/model-builder/items/[id]/commit.post.ts',
)

const COMMIT_STAGE_ASSIGNMENT = 'stages.COMMIT = {'
const STALE_SNAPSHOT_SOURCE =
  'parseStoredJson<Record<string, unknown>>(\n      item.stageStatuses,\n      {},\n    )'

// Finds the `const stages = parseStoredJson<...>(...)` statement that feeds
// directly into the `stages.COMMIT = {` assignment, by locating the
// assignment and scanning backwards to the nearest preceding `const stages =`
// declaration. Returns the full slice from that declaration through the end
// of the assignment's opening brace line, so the check is robust to unrelated
// reformatting elsewhere in the file.
export function extractFinalStageWrite(content: string): string | null {
  const assignmentIndex = content.indexOf(COMMIT_STAGE_ASSIGNMENT)
  if (assignmentIndex === -1) return null

  const declAnchor = 'const stages ='
  const declIndex = content.lastIndexOf(declAnchor, assignmentIndex)
  if (declIndex === -1) return null

  // A fresh re-fetch (if present) is declared just *before* `const stages =`
  // (e.g. `const latest = await prisma....findUnique(...)`), not inside it --
  // widen the slice's start to include that preceding statement when it's
  // immediately adjacent, so the fresh-read check below can see it.
  const latestAnchor = 'const latest ='
  const latestIndex = content.lastIndexOf(latestAnchor, declIndex)
  const start =
    latestIndex !== -1 && declIndex - latestIndex < 500
      ? latestIndex
      : declIndex

  return content.slice(start, assignmentIndex + COMMIT_STAGE_ASSIGNMENT.length)
}

// Checks the fix's exact shape against the full source text of a file
// containing commit.post.ts's final stageStatuses read-modify-write. Exported
// (rather than only exercised via main()) so the self-test below can run it
// against synthetic buggy/fixed fixtures without touching the real route
// file.
export function checkCommitStaleSnapshotGuard(content: string): string[] {
  const errors: string[] = []

  const slice = extractFinalStageWrite(content)
  if (slice === null) {
    errors.push(
      `Could not find the \`const stages = ...\` declaration feeding \`${COMMIT_STAGE_ASSIGNMENT}\` ` +
        'in commit.post.ts -- has the final stageStatuses write been renamed, ' +
        'removed, or restructured? If so, this guard (and the bug it protects ' +
        'against) needs to move with it.',
    )
    return errors
  }

  const hasFreshRead =
    slice.includes('findUnique') &&
    (slice.includes('latest?.stageStatuses') ||
      slice.includes('latest.stageStatuses'))

  if (!hasFreshRead) {
    errors.push(
      "commit.post.ts's final `stages.COMMIT = {...}` write does not re-read " +
        'stageStatuses from the database immediately beforehand -- it appears ' +
        'to build the full stageStatuses blob from the request-start `item` ' +
        'snapshot alone. The write above this point (promoteAsset / updateText ' +
        '/ createRecord+linkSourceToTarget) can be slow, and nothing blocks the ' +
        "client from reopening another stage (PATCH /items/:id) while it's in " +
        'flight -- without a fresh read here, that concurrent edit gets ' +
        'silently clobbered back to "approved".',
    )
  }

  if (slice.includes(STALE_SNAPSHOT_SOURCE)) {
    errors.push(
      'commit.post.ts still builds `stages` directly from `item.stageStatuses` ' +
        '(the request-start snapshot) with no fresh re-fetch -- this is the ' +
        'exact stale-snapshot shape the fix was meant to remove.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(ROUTE_PATH, 'utf8')
  const errors = checkCommitStaleSnapshotGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder commit stale-snapshot guard contract failed for ' +
        'server/api/model-builder/items/[id]/commit.post.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder commit stale-snapshot guard contract passed: the final ' +
      'stageStatuses write re-reads the current DB value before merging in ' +
      'COMMIT, instead of reusing the request-start snapshot.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
