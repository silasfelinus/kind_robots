// /utils/scripts/verifyModelBuilderPatchTextCapGuard.ts
//
// Regression guard (model-builder/t-029, cycle 45). server/api/model-builder/
// runs/index.ts's normalizeText() writes plain strings into
// ModelBuildRun/ModelBuildItem columns. Most callers write into a real
// fixed-width MySQL `@db.VarChar(n)` column (prisma/model-builder.prisma),
// but before this fix normalizeText took no length option at all -- three
// call sites (`sourceLabel` on the run PATCH route, `staleReason` and
// `targetType` on the item PATCH path) passed a value straight to Prisma
// with no cap, even though the run CREATE route (runs/index.post.ts)
// already truncates `sourceLabel` to 255 chars, and every similarly-typed
// sibling field in the same file (`label`, `generation`, `outputKey`,
// `recipeVersion`, `stage`, `reason`) is validated with an explicit cap via
// requiredString or `.slice(0, N)`. An oversized value on any of the three
// unguarded call sites reached Prisma unchecked and MySQL would reject the
// write with a raw "Data too long for column" error (strict mode; a silent
// truncation otherwise) -- an opaque 500 instead of the clean 400 every
// sibling field already returns.
//
// This walks prisma/model-builder.prisma for each guarded field's real
// column width and runs/index.ts + runs/[id].patch.ts for the
// `normalizeText(..., { maxLength: N, ... })` call sites, and fails if any
// guarded field's call site is missing a `maxLength` option, or if its value
// no longer matches the field's real schema width.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const SCHEMA_PATH = join(repositoryRoot, 'prisma/model-builder.prisma')
const RUNS_INDEX_PATH = join(
  repositoryRoot,
  'server/api/model-builder/runs/index.ts',
)
const RUN_PATCH_PATH = join(
  repositoryRoot,
  'server/api/model-builder/runs/[id].patch.ts',
)

// Which model each guarded field's VarChar width is declared on, and which
// source file's normalizeText call site to check it against.
export const GUARDED_VARCHAR_FIELDS = [
  { model: 'ModelBuildRun', field: 'sourceLabel', file: 'runPatch' as const },
  { model: 'ModelBuildItem', field: 'staleReason', file: 'runsIndex' as const },
  { model: 'ModelBuildItem', field: 'targetType', file: 'runsIndex' as const },
] as const

// --- schema column width extraction -----------------------------------------

function findModelBlock(schema: string, modelName: string): string | null {
  const match = schema.match(new RegExp(`^model\\s+${modelName}\\s*\\{`, 'm'))
  if (!match || match.index === undefined) return null
  const start = match.index + match[0].length
  const end = schema.indexOf('\n}', start)
  if (end === -1) return null
  return schema.slice(start, end)
}

// The real `@db.VarChar(n)` width for `model.field`, or undefined if the
// field/model isn't found or isn't a VarChar column.
export function extractVarCharWidth(
  schema: string,
  model: string,
  field: string,
): number | undefined {
  const block = findModelBlock(schema, model)
  if (!block) {
    throw new Error(
      `Could not find model ${model} in prisma/model-builder.prisma -- has ` +
        'it been renamed or moved?',
    )
  }
  const line = block
    .split('\n')
    .find((l) => new RegExp(`^\\s*${field}\\s+String`).test(l))
  if (!line) return undefined
  const explicit = line.match(/@db\.VarChar\((\d+)\)/)
  return explicit ? Number(explicit[1]) : undefined
}

// --- normalizeText call-site maxLength extraction ---------------------------

// Finds `data.<field> = normalizeText(body.<field>, { ... })` and extracts
// the `maxLength: N` option from inside those braces, or `null` if the call
// site has no options object (no cap) at all, or `undefined` if the call
// site itself can't be found.
export function extractCallSiteMaxLength(
  sourceContent: string,
  field: string,
): number | null | undefined {
  const anchor = `normalizeText(body.${field}`
  const start = sourceContent.indexOf(anchor)
  if (start === -1) return undefined
  const afterCall = sourceContent.slice(start + anchor.length)
  const closeParen = afterCall.indexOf(')')
  const optionsChunk = afterCall.slice(
    0,
    closeParen === -1 ? undefined : closeParen,
  )
  const maxLength = optionsChunk.match(/maxLength:\s*(\d+)/)
  return maxLength ? Number(maxLength[1]) : null
}

// --- combined check -----------------------------------------------------------

export interface PatchTextCapProblem {
  model: string
  field: string
  schemaWidth: number
  callSiteMaxLength: number | null | undefined
}

export function findPatchTextCapProblems(
  schema: string,
  runsIndexContent: string,
  runPatchContent: string,
): PatchTextCapProblem[] {
  const problems: PatchTextCapProblem[] = []
  for (const { model, field, file } of GUARDED_VARCHAR_FIELDS) {
    const schemaWidth = extractVarCharWidth(schema, model, field)
    if (schemaWidth === undefined) {
      throw new Error(
        `${model}.${field} is no longer a \`@db.VarChar(n)\` column in ` +
          'prisma/model-builder.prisma -- update GUARDED_VARCHAR_FIELDS if ' +
          'the column widened to an unbounded type or was removed.',
      )
    }
    const content = file === 'runsIndex' ? runsIndexContent : runPatchContent
    const callSiteMaxLength = extractCallSiteMaxLength(content, field)
    if (callSiteMaxLength !== schemaWidth) {
      problems.push({ model, field, schemaWidth, callSiteMaxLength })
    }
  }
  return problems
}

function main(): void {
  const schema = readFileSync(SCHEMA_PATH, 'utf8')
  const runsIndexContent = readFileSync(RUNS_INDEX_PATH, 'utf8')
  const runPatchContent = readFileSync(RUN_PATCH_PATH, 'utf8')

  const problems = findPatchTextCapProblems(
    schema,
    runsIndexContent,
    runPatchContent,
  )

  if (problems.length) {
    console.error(
      `Model Builder patch text-cap contract failed: ${problems.length} ` +
        'guarded VarChar field(s) have a normalizeText() call site with a ' +
        "missing or mismatched maxLength -- a value over the field's real " +
        'column width would reach Prisma unchecked and fail at the DB with ' +
        'a raw "Data too long for column" error instead of a clean 400:',
    )
    for (const problem of problems) {
      const found =
        problem.callSiteMaxLength === undefined
          ? 'could not find its normalizeText() call site'
          : problem.callSiteMaxLength === null
            ? 'no maxLength option at all'
            : `maxLength: ${problem.callSiteMaxLength}`
      console.error(
        `- ${problem.model}.${problem.field} is @db.VarChar(${problem.schemaWidth}) ` +
          `in prisma/model-builder.prisma, but its call site has ${found}.`,
      )
    }
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder patch text-cap contract passed: every guarded VarChar ' +
      "field's normalizeText() call site caps at its real schema width.",
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
