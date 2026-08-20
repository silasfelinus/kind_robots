// /utils/scripts/verifyModelBuilderSourceFieldGuard.ts
//
// Regression guard (model-builder/t-029, cycle 22) -- SOURCE_TYPES in
// stores/helpers/modelBuilderRecipes.ts names a titleField/subtitleField per
// source type: the record property model-builder-source-picker.vue reads
// for a record's display name (store.sourceLabel) and secondary Grid/List
// line (its own subtitle()). Both are plain `record[field]` lookups with no
// compile-time link to the Prisma schema or to what the source type's list
// endpoint actually returns -- a typo or a stale field name left behind by a
// schema rename fails completely silently: `record[field]` is simply
// `undefined`, sourceLabel() falls back to `#<id>` and subtitle() falls back
// to '', with no error or console warning anywhere. The subtitle line for
// every record of that source type just never renders.
//
// Found by inspection: Bot's subtitleField was 'botType', but the Prisma
// field is `BotType` (capital B -- see Bot.BotType in prisma/schema.prisma)
// -- every Bot record's Grid/List subtitle was blank. Facet's subtitleField
// was 'kind' -- Facet.kind was dropped from the schema in t-072 (see
// server/utils/facetAssignments.ts's own comment), and /api/facets has
// returned a hydrated `taxonomy` field instead ever since -- so every Facet
// record's subtitle had been silently blank since that migration landed,
// long before this recurring task's watch began.
//
// This walks prisma/schema.prisma for the schema-backed source types (every
// key except Facet, whose list endpoint returns a computed FacetSummary, not
// a raw Facet row) and asserts titleField/subtitleField are real scalar
// fields on that Prisma model. Facet is checked against its actual response
// shape instead: the raw scalar Facet fields plus hydrateFacetSummaries' own
// computed additions, parsed from the FacetSummary type in
// server/utils/facetAssignments.ts so a future summary-shape change keeps
// this guard honest without a hand-maintained duplicate field list.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const SCHEMA_PATH = join(repositoryRoot, 'prisma/schema.prisma')
const MODEL_BUILDER_RECIPES_PATH = join(
  repositoryRoot,
  'stores/helpers/modelBuilderRecipes.ts',
)
const FACET_ASSIGNMENTS_PATH = join(
  repositoryRoot,
  'server/utils/facetAssignments.ts',
)

// Facet's list endpoint hydrates a computed summary rather than returning a
// raw Facet row -- see FACET_ASSIGNMENTS_PATH's FacetSummary type.
const HYDRATED_SUMMARY_SOURCE_TYPES = new Set(['Facet'])

export interface SourceFieldEntry {
  key: string
  titleField: string
  subtitleField?: string
}

// Every entry object literal in SOURCE_TYPES (modelBuilderRecipes.ts),
// independent of field order within the object and of array order -- split
// on each `key: 'X'` occurrence so every chunk holds exactly one source
// type's config through to (but not including) the next one's key.
export function extractSourceFieldEntries(
  recipesFileContent: string,
): SourceFieldEntry[] {
  const arrayMatch = recipesFileContent.match(
    /export const SOURCE_TYPES: SourceTypeConfig\[\] = \[([\s\S]*?)\n\]/,
  )
  if (!arrayMatch) {
    throw new Error(
      'Could not find SOURCE_TYPES array literal in modelBuilderRecipes.ts ' +
        '-- has its shape changed?',
    )
  }
  const body = arrayMatch[1]!
  const keyMatches = [...body.matchAll(/key:\s*'(\w+)'/g)]
  if (!keyMatches.length) {
    throw new Error(
      'Found the SOURCE_TYPES array literal but no key: entries inside it ' +
        '-- has its shape changed?',
    )
  }

  return keyMatches.map((match, index) => {
    const start = match.index!
    const end =
      index + 1 < keyMatches.length
        ? keyMatches[index + 1]!.index!
        : body.length
    const chunk = body.slice(start, end)
    const titleField = chunk.match(/titleField:\s*'(\w+)'/)?.[1]
    const subtitleField = chunk.match(/subtitleField:\s*'(\w+)'/)?.[1]
    if (!titleField) {
      throw new Error(
        `SOURCE_TYPES entry '${match[1]}' has no titleField -- has its ` +
          'shape changed?',
      )
    }
    return { key: match[1]!, titleField, subtitleField }
  })
}

function findModelBlock(schema: string, modelName: string): string | null {
  const match = schema.match(new RegExp(`^model\\s+${modelName}\\s*\\{`, 'm'))
  if (!match) return null
  if (match.index === undefined) return null
  const start = match.index + match[0].length
  const end = schema.indexOf('\n}', start)
  if (end === -1) return null
  return schema.slice(start, end)
}

// Scalar column names declared directly on a Prisma model -- excludes
// relation fields (list relations end in `[]`; single relations carry
// `@relation`), which `prisma.<model>.findMany()` never returns without an
// explicit `include`/`select`, and excludes `@@`-prefixed block attributes
// and comment lines, which never match the leading `\w+` at all.
export function extractScalarFieldNames(
  schemaContent: string,
  modelName: string,
): string[] {
  const block = findModelBlock(schemaContent, modelName)
  if (!block) {
    throw new Error(
      `Could not find model ${modelName} in prisma/schema.prisma -- has it ` +
        'been renamed?',
    )
  }
  const names: string[] = []
  for (const line of block.split('\n')) {
    const match = line.match(/^\s*(\w+)\s+([\w[\].?]+)(.*)$/)
    if (!match) continue
    const [, fieldName, type, rest] = match
    if (!fieldName || !type) continue
    if (type.endsWith('[]')) continue // list relation
    if (rest && rest.includes('@relation')) continue // single relation object
    names.push(fieldName)
  }
  return names
}

// The computed fields hydrateFacetSummaries adds on top of the raw scalar
// Facet columns -- parsed from FacetSummary's own `& { ... }` type literal
// so a future summary-shape change (a field renamed or removed) keeps this
// guard honest without a hand-maintained duplicate list.
export function extractFacetSummaryExtraFields(
  facetAssignmentsContent: string,
): string[] {
  const match = facetAssignmentsContent.match(
    /export type FacetSummary = Pick<[\s\S]*?>\s*&\s*\{([\s\S]*?)\n\}/,
  )
  if (!match) {
    throw new Error(
      'Could not find the FacetSummary type literal in ' +
        'server/utils/facetAssignments.ts -- has its shape changed?',
    )
  }
  const names: string[] = []
  for (const line of match[1]!.split('\n')) {
    const fieldMatch = line.match(/^\s*(\w+)\s*:/)
    const name = fieldMatch?.[1]
    if (name) names.push(name)
  }
  return names
}

export interface SourceFieldProblem {
  key: string
  field: string
  which: 'titleField' | 'subtitleField'
}

export function findSourceFieldProblems(
  schemaContent: string,
  recipesFileContent: string,
  facetAssignmentsContent: string,
): SourceFieldProblem[] {
  const entries = extractSourceFieldEntries(recipesFileContent)
  const facetExtraFields = extractFacetSummaryExtraFields(
    facetAssignmentsContent,
  )
  const problems: SourceFieldProblem[] = []

  for (const entry of entries) {
    const scalarFields = extractScalarFieldNames(schemaContent, entry.key)
    const allowedFields = HYDRATED_SUMMARY_SOURCE_TYPES.has(entry.key)
      ? [...scalarFields, ...facetExtraFields]
      : scalarFields

    const checks: Array<['titleField' | 'subtitleField', string | undefined]> =
      [
        ['titleField', entry.titleField],
        ['subtitleField', entry.subtitleField],
      ]
    for (const [which, field] of checks) {
      if (field && !allowedFields.includes(field)) {
        problems.push({ key: entry.key, field, which })
      }
    }
  }

  return problems
}

function main(): void {
  const schemaContent = readFileSync(SCHEMA_PATH, 'utf8')
  const recipesFileContent = readFileSync(MODEL_BUILDER_RECIPES_PATH, 'utf8')
  const facetAssignmentsContent = readFileSync(FACET_ASSIGNMENTS_PATH, 'utf8')

  const problems = findSourceFieldProblems(
    schemaContent,
    recipesFileContent,
    facetAssignmentsContent,
  )

  if (problems.length) {
    console.error(
      `Model Builder source-field contract failed: ${problems.length} ` +
        'SOURCE_TYPES entry(s) in stores/helpers/modelBuilderRecipes.ts ' +
        "name a field that doesn't exist on what their list endpoint " +
        'actually returns:',
    )
    for (const problem of problems) {
      console.error(
        `- ${problem.key}.${problem.which} = '${problem.field}' is not a ` +
          `real property of what /api/${problem.key.toLowerCase()}... ` +
          `returns -- model-builder-source-picker.vue's ` +
          `${problem.which === 'titleField' ? 'store.sourceLabel()' : 'subtitle()'} ` +
          `will silently render blank for every ${problem.key} record.`,
      )
    }
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder source-field contract passed: every SOURCE_TYPES ' +
      'titleField/subtitleField names a real property of what its source ' +
      "type's list endpoint actually returns.",
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
