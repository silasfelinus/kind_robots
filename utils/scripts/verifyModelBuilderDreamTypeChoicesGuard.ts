// /utils/scripts/verifyModelBuilderDreamTypeChoicesGuard.ts
//
// Regression guard (model-builder/t-029, cycle 34). modelBuilderFields.ts's
// MODEL_FIELDS.Dream.dreamType field spec offers a `choices` list for the
// Dream model's dreamType enum. Before this fix that list was a hand-typed
// literal array that had drifted from dreamHelper.ts's canonical
// CREATABLE_DREAM_TYPES (itself `as const satisfies readonly
// PrismaDreamType[]`, i.e. checked against the real Prisma DreamType enum):
// it was missing PROMPTBOT and NARRATOR, two DreamType values dreamHelper.ts
// already treats as normal, user-creatable dream types.
//
// Currently zero live impact -- Dream is never a CREATE_TARGETS output (see
// verifyModelBuilderLinkCoverage.ts), so this choices list only backs an
// as-yet-unreachable field spec -- but the fix removes the drift class
// itself: modelBuilderFields.ts's local DREAM_TYPES now spreads
// dreamHelper.ts's canonical CREATABLE_DREAM_TYPES instead of re-typing the
// enum values, so the two can no longer independently drift.
//
// This guard fails if modelBuilderFields.ts ever goes back to a
// hand-typed/hardcoded DREAM_TYPES literal instead of sourcing it from
// dreamHelper.ts -- i.e. it protects the *shape* of the fix, not just a
// point-in-time value comparison (a value-set comparison would pass even for
// a second hand-duplicated list that happens to still match today, right up
// until the next time either list is edited alone).
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const MODEL_BUILDER_FIELDS_PATH = join(
  repositoryRoot,
  'stores/helpers/modelBuilderFields.ts',
)

const IMPORT_PATTERN =
  /import\s*\{\s*CREATABLE_DREAM_TYPES\s*\}\s*from\s*['"]@\/stores\/helpers\/dreamHelper['"]/
const ASSIGNMENT_PATTERN =
  /const DREAM_TYPES(?:\s*:[^=]*)?=\s*\[\s*\.\.\.CREATABLE_DREAM_TYPES\s*\]/

export interface DreamTypeChoicesProblem {
  missingImport: boolean
  missingSpreadAssignment: boolean
}

// null when modelBuilderFields.ts both imports the canonical
// CREATABLE_DREAM_TYPES from dreamHelper.ts and assigns its local
// DREAM_TYPES as a spread of it; a problem object otherwise.
export function findDreamTypeChoicesProblem(
  fieldsFileContent: string,
): DreamTypeChoicesProblem | null {
  const missingImport = !IMPORT_PATTERN.test(fieldsFileContent)
  const missingSpreadAssignment = !ASSIGNMENT_PATTERN.test(fieldsFileContent)
  if (!missingImport && !missingSpreadAssignment) return null
  return { missingImport, missingSpreadAssignment }
}

function main(): void {
  const fieldsFileContent = readFileSync(MODEL_BUILDER_FIELDS_PATH, 'utf8')
  const problem = findDreamTypeChoicesProblem(fieldsFileContent)

  if (problem) {
    process.exitCode = 1
    console.error(
      'Model Builder Dream-type choices contract failed: ' +
        "modelBuilderFields.ts's local DREAM_TYPES is no longer sourced from " +
        "dreamHelper.ts's canonical CREATABLE_DREAM_TYPES.",
    )
    if (problem.missingImport) {
      console.error(
        '- expected `import { CREATABLE_DREAM_TYPES } from ' +
          "'@/stores/helpers/dreamHelper'` in modelBuilderFields.ts",
      )
    }
    if (problem.missingSpreadAssignment) {
      console.error(
        '- expected `const DREAM_TYPES = [...CREATABLE_DREAM_TYPES]` (or with a ' +
          'type annotation) in modelBuilderFields.ts',
      )
    }
    console.error(
      'A hand-typed literal list here can silently drift from the real ' +
        'Prisma DreamType enum -- see cycle 34 (PROMPTBOT/NARRATOR were ' +
        'missing) for exactly this failure mode.',
    )
    return
  }

  console.log(
    "Model Builder Dream-type choices contract passed: modelBuilderFields.ts's " +
      "DREAM_TYPES is sourced from dreamHelper.ts's canonical " +
      'CREATABLE_DREAM_TYPES, not a hand-typed literal.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
