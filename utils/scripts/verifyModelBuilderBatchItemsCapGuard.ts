// /utils/scripts/verifyModelBuilderBatchItemsCapGuard.ts
//
// Regression guard (model-builder/t-029, cycle 74). Cycle 73 capped
// runs/index.post.ts's (the build-run CREATE route) `items` array against
// MAX_BATCH_ITEMS, but left items/batch.patch.ts (the batch item-update
// route added by t-030) unaudited for the identical gap. The client-side
// caller (batchPushItems in stores/modelBuilderStore.ts) only ever sends one
// run's worth of items, itself bounded by MAX_BATCH at run creation -- but a
// direct API call bypasses that entirely. Without a server-side cap, an
// oversized `items` array here forces this route's per-entry sequential
// findUnique + assertArtImageAttachable checks, plus the single
// all-or-nothing transaction, over an unbounded amount of work in one
// request -- the same shape of gap cycle 73 fixed for the CREATE route.
//
// This walks items/batch.patch.ts and fails if: the file no longer imports
// MAX_BATCH_ITEMS from ../runs/index, or the length check against it is
// missing.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const ITEMS_BATCH_PATCH_PATH = join(
  repositoryRoot,
  'server/api/model-builder/items/batch.patch.ts',
)

export interface BatchItemsCapProblem {
  reason: 'missing-import' | 'missing-length-check'
}

export function findBatchItemsCapProblems(
  sourceContent: string,
): BatchItemsCapProblem[] {
  const problems: BatchItemsCapProblem[] = []

  const importsConstant =
    /import\s*\{[^}]*\bMAX_BATCH_ITEMS\b[^}]*\}\s*from\s*['"]\.\.\/runs\/index['"]/.test(
      sourceContent,
    )
  if (!importsConstant) {
    problems.push({ reason: 'missing-import' })
  }

  const hasLengthCheck = /body\.items\.length\s*>\s*MAX_BATCH_ITEMS/.test(
    sourceContent,
  )
  if (!hasLengthCheck) {
    problems.push({ reason: 'missing-length-check' })
  }

  return problems
}

function main(): void {
  const sourceContent = readFileSync(ITEMS_BATCH_PATCH_PATH, 'utf8')
  const problems = findBatchItemsCapProblems(sourceContent)

  if (problems.length) {
    console.error(
      `Model Builder batch-items-cap contract failed: items/batch.patch.ts ` +
        'is missing its server-side cap on `items.length` against ' +
        'MAX_BATCH_ITEMS -- an oversized `items` array from a direct API ' +
        'call would force unbounded sequential per-entry work instead of a ' +
        'clean 400:',
    )
    for (const problem of problems) {
      console.error(`- ${problem.reason}`)
    }
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder batch-items-cap contract passed: items/batch.patch.ts ' +
      'caps `items.length` against MAX_BATCH_ITEMS.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
