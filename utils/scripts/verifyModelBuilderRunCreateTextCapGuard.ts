// /utils/scripts/verifyModelBuilderRunCreateTextCapGuard.ts
//
// Regression guard (model-builder/t-029, cycle 46). pitch/fieldsDraft/
// promptDraft are `@db.Text` (prisma/model-builder.prisma, a real 65,535-byte
// MySQL TEXT limit). The item PATCH path (prepareItemUpdate in runs/index.ts)
// already caps all three at MAX_DRAFT_TEXT_LENGTH via normalizeText -- but
// the run CREATE route's own `items` mapping (runs/index.post.ts) had no cap
// at all before this fix, so a run created with an oversized draft in its
// initial payload sailed through uncapped and was only caught later, on the
// first PATCH that re-saved the same field.
//
// This walks runs/index.post.ts and fails if: the file no longer imports
// MAX_DRAFT_TEXT_LENGTH from ./index, any of the three guarded fields'
// `text(item.<field>, ...)` call site is missing, or the cap's own
// implementation no longer compares against MAX_DRAFT_TEXT_LENGTH (e.g. a
// drifted hardcoded number).
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const RUNS_CREATE_PATH = join(
  repositoryRoot,
  'server/api/model-builder/runs/index.post.ts',
)

export const GUARDED_ITEM_TEXT_FIELDS = [
  'pitch',
  'fieldsDraft',
  'promptDraft',
] as const

export interface RunCreateTextCapProblem {
  field: string
  reason: 'missing-call-site' | 'not-capped-against-constant'
}

// Extracts the body of the local `text(...)` helper function defined in
// runs/index.post.ts (between its `const text = (` opener and the matching
// closing `}` of its arrow function), or null if it can't be found.
export function extractTextHelperBody(sourceContent: string): string | null {
  const anchor = 'const text = ('
  const start = sourceContent.indexOf(anchor)
  if (start === -1) return null
  const braceStart = sourceContent.indexOf('{', start)
  if (braceStart === -1) return null
  let depth = 0
  for (let i = braceStart; i < sourceContent.length; i++) {
    if (sourceContent[i] === '{') depth++
    else if (sourceContent[i] === '}') {
      depth--
      if (depth === 0) return sourceContent.slice(braceStart, i + 1)
    }
  }
  return null
}

export function findRunCreateTextCapProblems(
  sourceContent: string,
): RunCreateTextCapProblem[] {
  const problems: RunCreateTextCapProblem[] = []

  const importsConstant =
    /import\s*\{[^}]*\bMAX_DRAFT_TEXT_LENGTH\b[^}]*\}\s*from\s*['"]\.\/index['"]/.test(
      sourceContent,
    )

  const helperBody = extractTextHelperBody(sourceContent)
  const helperCapsAgainstConstant =
    importsConstant &&
    helperBody !== null &&
    /MAX_DRAFT_TEXT_LENGTH/.test(helperBody)

  for (const field of GUARDED_ITEM_TEXT_FIELDS) {
    const hasCallSite = new RegExp(`text\\(item\\.${field}\\b`).test(
      sourceContent,
    )
    if (!hasCallSite) {
      problems.push({ field, reason: 'missing-call-site' })
      continue
    }
    if (!helperCapsAgainstConstant) {
      problems.push({ field, reason: 'not-capped-against-constant' })
    }
  }

  return problems
}

function main(): void {
  const sourceContent = readFileSync(RUNS_CREATE_PATH, 'utf8')
  const problems = findRunCreateTextCapProblems(sourceContent)

  if (problems.length) {
    console.error(
      `Model Builder run-create text-cap contract failed: ${problems.length} ` +
        'guarded field(s) in runs/index.post.ts are missing a cap against ' +
        "MAX_DRAFT_TEXT_LENGTH -- a value over the TEXT column's real limit " +
        'would reach Prisma unchecked and fail at the DB with a raw "Data too ' +
        'long for column" error instead of a clean 400:',
    )
    for (const problem of problems) {
      console.error(`- ${problem.field}: ${problem.reason}`)
    }
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder run-create text-cap contract passed: pitch/fieldsDraft/' +
      'promptDraft are all capped against MAX_DRAFT_TEXT_LENGTH in ' +
      'runs/index.post.ts.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
