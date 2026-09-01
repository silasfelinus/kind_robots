// /utils/scripts/verifyModelBuilderRunCreateItemsCapGuard.ts
//
// Regression guard (model-builder/t-029, cycle 73). runs/index.post.ts (the
// build-run CREATE route) rejects an empty `items` array but had no upper
// bound at all -- modelBuilderStore.ts's own MAX_BATCH (12) is a client-side
// stepper clamp on `setOutputQuantity` only, never enforced server-side. A
// direct API call bypassing the UI could hand this route an arbitrarily
// large `items` array and create a run with thousands of ModelBuildItem rows
// in one request. Flagged as a real but out-of-scope observation in cycle
// 72's investigation notes; addressed here.
//
// This walks runs/index.post.ts and fails if: the file no longer imports
// MAX_BATCH_ITEMS from ./index, or the length check against it is missing.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const RUNS_CREATE_PATH = join(
  repositoryRoot,
  'server/api/model-builder/runs/index.post.ts',
)

export interface RunCreateItemsCapProblem {
  reason: 'missing-import' | 'missing-length-check'
}

export function findRunCreateItemsCapProblems(
  sourceContent: string,
): RunCreateItemsCapProblem[] {
  const problems: RunCreateItemsCapProblem[] = []

  const importsConstant =
    /import\s*\{[^}]*\bMAX_BATCH_ITEMS\b[^}]*\}\s*from\s*['"]\.\/index['"]/.test(
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
  const sourceContent = readFileSync(RUNS_CREATE_PATH, 'utf8')
  const problems = findRunCreateItemsCapProblems(sourceContent)

  if (problems.length) {
    console.error(
      `Model Builder run-create items-cap contract failed: runs/index.post.ts ` +
        'is missing its server-side cap on `items.length` against ' +
        'MAX_BATCH_ITEMS -- an oversized `items` array from a direct API ' +
        'call would reach Prisma unchecked instead of a clean 400:',
    )
    for (const problem of problems) {
      console.error(`- ${problem.reason}`)
    }
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder run-create items-cap contract passed: runs/index.post.ts ' +
      'caps `items.length` against MAX_BATCH_ITEMS.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
