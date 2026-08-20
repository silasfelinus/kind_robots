// /utils/scripts/verifyModelBuilderArtifactStageGuard.ts
//
// Regression guard (model-builder/t-029 cycle 28) -- every other write that
// touches an item's GENERATE_ASSETS content goes through prepareItemUpdate's
// assertContentStageEditable(..., 'GENERATE_ASSETS', ...) gate (items/
// [id].patch.ts and items/batch.patch.ts, for body.artImageId, both re-
// checked against a fresh read immediately before the write -- see
// verifyModelBuilderItemPatchStageGuard.ts / verifyModelBuilderContentStage
// FreshnessGuard.ts). items/[id]/artifacts.post.ts never did, even though
// it's the route that actually persists each generated candidate as a
// durable ModelBuildArtifact row.
//
// modelBuilderStore.ts's generateItemAsset/pollAsyncArtJob only check their
// OWN in-memory item.stages.GENERATE_ASSETS before calling this route
// (verifyModelBuilderApprovedAssetGuard.ts) -- a second browser tab, or a
// slow in-flight render that resolves after a *different* tab already
// approved the stage, has stale local state that still reads
// 'ready'/'in-progress', so it sails past that client-side check regardless
// of the item's actual server-side stage. The follow-up PATCH that sets
// item.artImageId is correctly rejected once the stage is 'approved' (that
// field IS gated), so item.artImageId itself never gets corrupted -- but
// this route already created the orphaned ModelBuildArtifact row for the
// stale render by then. adaptItem's imagePath reads
// Artifacts[Artifacts.length - 1]?.promotedPath ?? draftPath (stores/
// modelBuilderStore.ts) -- whichever artifact row was created LAST, with no
// relation to which one artImageId actually points at -- so on the next
// resume/reload the item's displayed candidate silently becomes the
// orphaned, never-reviewed render instead of the one actually approved and
// committed, with the stage badge still reading 'approved'.
//
// Fixed by gating this route the same way every sibling GENERATE_ASSETS
// write already is: an eager assertContentStageEditable check against the
// request-start item read, and a second check against a fresh read inside
// the same prisma.$transaction that creates the artifact row, so a
// concurrent approveStage landing in between can't slip through either.
//
// This asserts the textual shape of that fix stays in place: two
// assertContentStageEditable(..., 'GENERATE_ASSETS', 'Art image') calls, and
// the artifact create happens via `tx.modelBuildArtifact.create` inside a
// `prisma.$transaction` block that also re-reads stageStatuses -- not a bare
// `prisma.modelBuildArtifact.create` outside any gate, which is the exact
// shape a future "simplification" could easily reintroduce.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const ROUTE_PATH = join(
  repositoryRoot,
  'server/api/model-builder/items/[id]/artifacts.post.ts',
)

const GATE_CALL = 'assertContentStageEditable('
const GATE_ARGS_RE =
  /assertContentStageEditable\(\s*[\w.?]+,\s*\n?\s*'GENERATE_ASSETS',\s*\n?\s*'Art image',?\s*\n?\s*\)/g

export function checkArtifactStageGuard(content: string): string[] {
  const errors: string[] = []

  const gateMatches = content.match(GATE_ARGS_RE) ?? []
  if (gateMatches.length < 2) {
    errors.push(
      `artifacts.post.ts calls assertContentStageEditable(..., ` +
        `'GENERATE_ASSETS', 'Art image') ${gateMatches.length} time(s), ` +
        'expected at least 2 -- one eager check against the request-start ' +
        'item read, one re-check against a fresh read immediately before ' +
        'the write. Without both, a stale second tab (or a render that ' +
        'resolves after a concurrent approval) can create an orphaned ' +
        'ModelBuildArtifact row for an item whose GENERATE_ASSETS stage is ' +
        'already approved -- adaptItem then reconstructs imagePath from ' +
        'that orphaned row on the next resume/reload instead of the ' +
        'actually-approved one.',
    )
  }

  const transactionIndex = content.indexOf('prisma.$transaction')
  const freshReadIndex = content.indexOf('tx.modelBuildItem.findUnique')
  const createIndex = content.indexOf('tx.modelBuildArtifact.create')
  const bareCreateIndex = content.indexOf('prisma.modelBuildArtifact.create')

  if (transactionIndex === -1 || freshReadIndex === -1 || createIndex === -1) {
    errors.push(
      'artifacts.post.ts does not wrap a `tx.modelBuildItem.findUnique` ' +
        '(fresh stageStatuses re-read) and a `tx.modelBuildArtifact.create` ' +
        'inside `prisma.$transaction` -- the artifact create must happen ' +
        'in the same transaction as the fresh stage re-check, or the ' +
        'TOCTOU gap the re-check exists to close reopens.',
    )
  } else if (!(
    transactionIndex < freshReadIndex && freshReadIndex < createIndex
  )) {
    errors.push(
      'artifacts.post.ts has `prisma.$transaction`, `tx.modelBuildItem.' +
        'findUnique`, and `tx.modelBuildArtifact.create`, but not in that ' +
        'order -- the fresh stageStatuses read must happen before the ' +
        'artifact create, both inside the transaction.',
    )
  }

  if (bareCreateIndex !== -1) {
    errors.push(
      'artifacts.post.ts still calls `prisma.modelBuildArtifact.create` ' +
        'directly (outside `tx.`) -- this is the exact ungated shape the ' +
        'fix was meant to replace.',
    )
  }

  void GATE_CALL
  return errors
}

function main(): void {
  const content = readFileSync(ROUTE_PATH, 'utf8')
  const errors = checkArtifactStageGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder artifact-stage guard contract failed for ' +
        'server/api/model-builder/items/[id]/artifacts.post.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder artifact-stage guard contract passed: artifacts.post.ts ' +
      'gates ModelBuildArtifact creation on GENERATE_ASSETS stage ' +
      'editability, eagerly and against a fresh read inside the write ' +
      'transaction.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
