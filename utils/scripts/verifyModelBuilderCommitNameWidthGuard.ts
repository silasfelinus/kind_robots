// /utils/scripts/verifyModelBuilderCommitNameWidthGuard.ts
//
// Regression guard (model-builder/t-029, cycle 35). commit.post.ts's CREATE
// path computes the new record's name/title once, then applies a single
// length cap before writing it:
//   const name = ( ... ).slice(0, NAME_MAX[fieldModelType] ?? 255)
//
// Before this fix, that cap was a flat `.slice(0, 255)` regardless of the
// actual CREATE target. That overshoots Scenario.title, which is `String`
// with no `@db.VarChar` override in prisma/schema.prisma and therefore
// Prisma's MySQL default column width of VARCHAR(191) NOT NULL. A Scenario
// title of 192-255 characters -- reachable via the batch editor's "Set a
// field on all N" or the per-item fieldsDraft textarea, neither of which has
// a maxlength -- passed the old flat cap untouched and failed the whole
// commit transaction at INSERT time ("Data too long for column 'title'" in
// MySQL strict mode, or a silent truncation otherwise). This is the same
// drift class verifyModelBuilderCommitTextTruncationGuard.ts already
// protects against for prose/long-text fields, just for the record
// name/title, which is never `prose`-classified in MODEL_FIELDS and so falls
// entirely outside that guard's scope.
//
// This walks prisma/schema.prisma, modelBuilderFields.ts's live
// CREATE_TARGETS map, and commit.post.ts's NAME_MAX map, and fails if any
// live CREATE target's NAME_MAX entry doesn't match its actual identifier
// column's real width (explicit `@db.VarChar(n)`, or Prisma's implicit
// MySQL default of 191 for an unannotated `String` column) -- or if a live
// CREATE target has no NAME_MAX entry at all, silently falling back to the
// 255 default regardless of whether that's correct.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const SCHEMA_PATH = join(repositoryRoot, 'prisma/schema.prisma')
const MODEL_BUILDER_FIELDS_PATH = join(
  repositoryRoot,
  'stores/helpers/modelBuilderFields.ts',
)
const COMMIT_ROUTE_PATH = join(
  repositoryRoot,
  'server/api/model-builder/items/[id]/commit.post.ts',
)

// Prisma's implicit column width for an unannotated MySQL `String` field
// (no `@db.VarChar(n)`/`@db.Text`/`@db.LongText` override).
const IMPLICIT_MYSQL_VARCHAR_WIDTH = 191

// Which identifier field (per createRecord's switch in commit.post.ts) each
// SourceType writes name/title into. Deliberately explicit rather than
// inferred from the schema/fields file -- createRecord's own field choice
// (`name` vs `title`) is the actual fact being checked against, so hardcoding
// it here mirrors commit.post.ts's own switch instead of guessing.
const IDENTIFIER_FIELD: Record<string, 'name' | 'title'> = {
  Character: 'name',
  Bot: 'name',
  Reward: 'name',
  Scenario: 'title',
  Dream: 'title',
  Project: 'title',
  Facet: 'title',
}

// --- CREATE_TARGETS extraction (which SourceTypes are live CREATE targets) --

// `CREATE_TARGETS: Record<string, SourceTypeKey> = { 'output-key': 'Model', ... }`
export function extractCreateTargetModels(fieldsFileContent: string): string[] {
  const match = fieldsFileContent.match(
    /export const CREATE_TARGETS: Record<string, SourceTypeKey> = \{([\s\S]*?)\n\}\n/,
  )
  if (!match) {
    throw new Error(
      'Could not find CREATE_TARGETS object literal in ' +
        'modelBuilderFields.ts -- has its shape changed?',
    )
  }
  const models = new Set<string>()
  for (const m of match[1]!.matchAll(/:\s*'(\w+)'/g)) {
    models.add(m[1]!)
  }
  return [...models]
}

// --- NAME_MAX extraction -----------------------------------------------------

// `const NAME_MAX: Partial<Record<SourceType, number>> = { Model: n, ... }`
export function extractNameMax(
  commitRouteContent: string,
): Record<string, number> {
  const match = commitRouteContent.match(
    /const NAME_MAX: Partial<Record<SourceType, number>> = \{([\s\S]*?)\n\}\n/,
  )
  if (!match) {
    throw new Error(
      'Could not find NAME_MAX object literal in commit.post.ts -- has it ' +
        'been renamed, removed, or restructured? If so, this guard (and the ' +
        'name/title truncation bug it protects against) needs to move with it.',
    )
  }
  const result: Record<string, number> = {}
  for (const m of match[1]!.matchAll(/(\w+):\s*(\d+)/g)) {
    result[m[1]!] = Number(m[2]!)
  }
  return result
}

// True if `.slice(0, NAME_MAX[fieldModelType] ?? 255)` (or an equivalent
// direct lookup on the resolved CREATE target type) still gates the name
// assignment's cap -- i.e. the cap wasn't silently reverted back to a bare
// `.slice(0, 255)` with no per-target lookup at all.
export function nameCapUsesNameMax(commitRouteContent: string): boolean {
  return /\.slice\(0, NAME_MAX\[\w+\] \?\? 255\)/.test(commitRouteContent)
}

// --- schema identifier-column width extraction -------------------------------

function findModelBlock(schema: string, modelName: string): string | null {
  const match = schema.match(new RegExp(`^model\\s+${modelName}\\s*\\{`, 'm'))
  if (!match) return null
  if (match.index === undefined) return null
  const start = match.index + match[0].length
  const end = schema.indexOf('\n}', start)
  if (end === -1) return null
  return schema.slice(start, end)
}

// The real column width for `model`'s identifier field (name or title, per
// IDENTIFIER_FIELD): an explicit `@db.VarChar(n)` if present, otherwise
// Prisma's implicit MySQL default (191) for a plain `String`/`String?`
// column, or `undefined` if the field is unbounded (`@db.Text`/
// `@db.LongText`) or not found at all.
export function extractIdentifierWidth(
  schema: string,
  model: string,
): number | undefined {
  const field = IDENTIFIER_FIELD[model]
  if (!field) {
    throw new Error(
      `No IDENTIFIER_FIELD entry for "${model}" -- this guard's hardcoded ` +
        'name/title mapping needs a new entry before it can check this ' +
        'CREATE target.',
    )
  }
  const block = findModelBlock(schema, model)
  if (!block) {
    throw new Error(
      `Could not find model ${model} in prisma/schema.prisma -- has it ` +
        'been renamed?',
    )
  }
  const line = block
    .split('\n')
    .find((l) => new RegExp(`^\\s*${field}\\s+String`).test(l))
  if (!line) return undefined

  const explicit = line.match(/@db\.VarChar\((\d+)\)/)
  if (!explicit) {
    if (/@db\.(Text|LongText)/.test(line)) return undefined // unbounded
    return IMPLICIT_MYSQL_VARCHAR_WIDTH
  }
  return Number(explicit[1])
}

// --- combined check -----------------------------------------------------------

export interface NameWidthProblem {
  model: string
  field: 'name' | 'title'
  schemaWidth: number | undefined
  nameMaxValue: number | undefined
}

// For every live CREATE_TARGETS model, NAME_MAX[model] must exist and equal
// its identifier column's real schema width -- otherwise the flat 255
// fallback either overshoots a narrower column (write failure/silent
// truncation) or, in principle, undershoots a wider one (needlessly loses
// characters the column could hold).
export function findNameWidthProblems(
  schema: string,
  fieldsFileContent: string,
  commitRouteContent: string,
): NameWidthProblem[] {
  const liveModels = extractCreateTargetModels(fieldsFileContent)
  const nameMax = extractNameMax(commitRouteContent)

  const problems: NameWidthProblem[] = []
  for (const model of liveModels) {
    const schemaWidth = extractIdentifierWidth(schema, model)
    if (schemaWidth === undefined) continue // unbounded column, nothing to cap correctly against

    const nameMaxValue = nameMax[model]
    if (nameMaxValue !== schemaWidth) {
      problems.push({
        model,
        field: IDENTIFIER_FIELD[model]!,
        schemaWidth,
        nameMaxValue,
      })
    }
  }
  return problems
}

function main(): void {
  const schema = readFileSync(SCHEMA_PATH, 'utf8')
  const fieldsFileContent = readFileSync(MODEL_BUILDER_FIELDS_PATH, 'utf8')
  const commitRouteContent = readFileSync(COMMIT_ROUTE_PATH, 'utf8')

  let failed = false

  if (!nameCapUsesNameMax(commitRouteContent)) {
    failed = true
    console.error(
      'Model Builder commit name-width contract failed: the name/title ' +
        'cap no longer applies `NAME_MAX[fieldModelType] ?? 255` (or an ' +
        'equivalent per-target lookup) -- has it reverted to a flat ' +
        '`.slice(0, 255)` for every CREATE target regardless of its real ' +
        'column width?',
    )
  }

  const problems = findNameWidthProblems(
    schema,
    fieldsFileContent,
    commitRouteContent,
  )
  if (problems.length) {
    failed = true
    console.error(
      `Model Builder commit name-width contract failed: ${problems.length} ` +
        'live CREATE target(s) have a NAME_MAX entry that does not match ' +
        "their identifier column's real schema width:",
    )
    for (const problem of problems) {
      const found =
        problem.nameMaxValue === undefined
          ? 'no NAME_MAX entry (falls back to 255)'
          : `NAME_MAX = ${problem.nameMaxValue}`
      console.error(
        `- ${problem.model}.${problem.field} is ${problem.schemaWidth} ` +
          `characters wide in prisma/schema.prisma, but commit.post.ts has ` +
          `${found} -- a mismatch here risks a "Data too long for column" ` +
          'write failure (cap too wide) or needlessly truncates a value the ' +
          'column could actually hold (cap too narrow).',
      )
    }
  }

  if (failed) {
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder commit name-width contract passed: every live CREATE ' +
      "target's NAME_MAX entry matches its identifier column's real schema " +
      'width.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
