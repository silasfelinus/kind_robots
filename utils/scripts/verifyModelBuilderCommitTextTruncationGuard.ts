// /utils/scripts/verifyModelBuilderCommitTextTruncationGuard.ts
//
// Regression guard (model-builder/t-029, cycle 33). commit.post.ts's
// pickText() decides how many characters of a FIELDS_AND_PROMPTS value to
// keep before writing it to the DB: LONG_TEXT_MAX (20000) for fields marked
// `prose: true` in MODEL_FIELDS (modelBuilderFields.ts) or listed in
// LONG_TEXT_FIELDS, DEFAULT_TEXT_MAX (256) otherwise, or an explicit
// SHORT_TEXT_MAX[type][key] override for a column narrower than either
// default.
//
// Before this fix, that choice was `isLongText ? LONG_TEXT_MAX :
// (SHORT_TEXT_MAX[type]?.[key] ?? DEFAULT_TEXT_MAX)` -- so ANY field marked
// prose/long-text took LONG_TEXT_MAX *unconditionally*, silently ignoring a
// SHORT_TEXT_MAX entry for that same field. That made the SHORT_TEXT_MAX
// entries already in place for Reward.flavorText and Dream.flavorText (both
// real `VarChar(512)` columns, both marked `prose: true`) pure dead code:
// pickText would still let up to 20000 characters through to a 512-char
// column, risking a silent MySQL truncation or a "Data too long for column"
// write failure. The same gap left Bot.description/botIntro/userIntro/
// prompt -- VarChar(764)/VarChar(3000) columns, three of them NOT NULL --
// with no SHORT_TEXT_MAX entry at all, on a live, reachable path: Bot is a
// real CREATE target via the expand-narrator-bot/expand-manager-bot outputs.
//
// This walks prisma/schema.prisma, modelBuilderFields.ts's MODEL_FIELDS, and
// commit.post.ts's SHORT_TEXT_MAX/LONG_TEXT_FIELDS maps, and fails if:
//   1. pickText's maxLen expression no longer checks SHORT_TEXT_MAX ahead of
//      (independent of) the prose/long-text classification, or
//   2. any field MODEL_FIELDS classifies as long-text (prose: true, or
//      listed in LONG_TEXT_FIELDS) maps to a real, bounded `@db.VarChar(n)`
//      schema column with no matching SHORT_TEXT_MAX[type][key] === n entry.
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

// --- pickText's maxLen precedence -------------------------------------------

const MAXLEN_ANCHOR = 'const maxLen ='
const RETURN_ANCHOR = 'return trimmed.length > maxLen'

// Extracts the `const maxLen = ...` expression (up to the following `return`
// statement) so the precedence check is robust to reformatting/comments
// around it, the same paren/anchor-matching approach used by
// verifyModelBuilderCommitNameFieldGuard.ts's extractNameAssignment.
export function extractMaxLenExpression(
  commitRouteContent: string,
): string | null {
  const start = commitRouteContent.indexOf(MAXLEN_ANCHOR)
  if (start === -1) return null
  const end = commitRouteContent.indexOf(RETURN_ANCHOR, start)
  if (end === -1) return null
  return commitRouteContent
    .slice(start + MAXLEN_ANCHOR.length, end)
    .replace(/\s+/g, ' ')
    .trim()
}

// True if the expression gives SHORT_TEXT_MAX[type]?.[key] first priority,
// independent of isLongText -- i.e. `SHORT_TEXT_MAX[type]?.[key] ?? ...`.
// The pre-fix shape instead gated on isLongText first
// (`isLongText ? LONG_TEXT_MAX : (SHORT_TEXT_MAX...`), which this correctly
// rejects.
export function maxLenPrefersShortTextMax(expression: string): boolean {
  return /^SHORT_TEXT_MAX\[type\]\?\.\[key\]\s*\?\?/.test(expression)
}

// --- SHORT_TEXT_MAX / LONG_TEXT_FIELDS extraction ---------------------------

// Finds the `const NAME: Partial<Record<SourceType, ...>> = { ... }` object
// literal's raw inner body text.
function extractOuterMapBody(content: string, constName: string): string {
  const match = content.match(
    new RegExp(`const ${constName}:[^=]*=\\s*\\{([\\s\\S]*?)\\n\\}\\n`),
  )
  if (!match) {
    throw new Error(
      `Could not find \`const ${constName}\` object literal in commit.post.ts` +
        ' -- has its shape changed?',
    )
  }
  return match[1]!
}

// SHORT_TEXT_MAX's per-model values are `Model: { field: n, ... }` object
// literals.
export function extractShortTextMax(
  commitRouteContent: string,
): Record<string, Record<string, number>> {
  const body = extractOuterMapBody(commitRouteContent, 'SHORT_TEXT_MAX')
  const result: Record<string, Record<string, number>> = {}
  for (const m of body.matchAll(/(\w+):\s*\{([^{}]*)\}/g)) {
    const fields: Record<string, number> = {}
    for (const fieldMatch of m[2]!.matchAll(/(\w+):\s*(\d+)/g)) {
      fields[fieldMatch[1]!] = Number(fieldMatch[2]!)
    }
    result[m[1]!] = fields
  }
  return result
}

// LONG_TEXT_FIELDS' per-model values are `Model: new Set([...])` calls, not
// object literals -- a distinct shape from SHORT_TEXT_MAX's, so this parses
// the body directly rather than sharing SHORT_TEXT_MAX's brace-chunking.
export function extractLongTextFields(
  commitRouteContent: string,
): Record<string, string[]> {
  const body = extractOuterMapBody(commitRouteContent, 'LONG_TEXT_FIELDS')
  const result: Record<string, string[]> = {}
  for (const m of body.matchAll(/(\w+):\s*new Set\(\[([^\]]*)\]\)/g)) {
    result[m[1]!] = [...m[2]!.matchAll(/'(\w+)'/g)].map((n) => n[1]!)
  }
  return result
}

// --- MODEL_FIELDS prose extraction ------------------------------------------

// Every field key marked `prose: true` per top-level MODEL_FIELDS model
// (modelBuilderFields.ts), independent of field order within each model's
// array and of array order between models.
export function extractProseFields(
  fieldsFileContent: string,
): Record<string, string[]> {
  const outerMatch = fieldsFileContent.match(
    /export const MODEL_FIELDS: Record<string, ModelFieldSpec\[\]> = \{([\s\S]*?)\n\}\n/,
  )
  if (!outerMatch) {
    throw new Error(
      'Could not find MODEL_FIELDS object literal in modelBuilderFields.ts ' +
        '-- has its shape changed?',
    )
  }
  const body = outerMatch[1]!
  const modelKeyMatches = [...body.matchAll(/^\s*(\w+):\s*\[/gm)]
  if (!modelKeyMatches.length) {
    throw new Error(
      'Found MODEL_FIELDS but no per-model array entries inside it -- has ' +
        'its shape changed?',
    )
  }

  const result: Record<string, string[]> = {}
  modelKeyMatches.forEach((match, index) => {
    const start = match.index!
    const end =
      index + 1 < modelKeyMatches.length
        ? modelKeyMatches[index + 1]!.index!
        : body.length
    const chunk = body.slice(start, end)
    const proseKeys: string[] = []
    for (const fieldMatch of chunk.matchAll(/\{[^{}]*\}/g)) {
      const obj = fieldMatch[0]
      if (!/prose:\s*true/.test(obj)) continue
      const keyMatch = obj.match(/key:\s*'(\w+)'/)
      if (keyMatch) proseKeys.push(keyMatch[1]!)
    }
    result[match[1]!] = proseKeys
  })
  return result
}

// --- schema VarChar width extraction -----------------------------------------

function findModelBlock(schema: string, modelName: string): string | null {
  const match = schema.match(new RegExp(`^model\\s+${modelName}\\s*\\{`, 'm'))
  if (!match || match.index === undefined) return null
  const start = match.index + match[0].length
  const end = schema.indexOf('\n}', start)
  if (end === -1) return null
  return schema.slice(start, end)
}

// Field name -> declared `@db.VarChar(n)` width, for scalar columns on
// `modelName`. A field with no such annotation (Text/LongText/no explicit
// length) is omitted -- it has no bounded width for SHORT_TEXT_MAX to match.
export function extractVarCharWidths(
  schema: string,
  modelName: string,
): Record<string, number> {
  const block = findModelBlock(schema, modelName)
  if (!block) {
    throw new Error(
      `Could not find model ${modelName} in prisma/schema.prisma -- has it ` +
        'been renamed?',
    )
  }
  const widths: Record<string, number> = {}
  for (const line of block.split('\n')) {
    const match = line.match(/^\s*(\w+)\s+\S+.*@db\.VarChar\((\d+)\)/)
    if (match) widths[match[1]!] = Number(match[2]!)
  }
  return widths
}

// --- combined check -----------------------------------------------------------

export interface TruncationProblem {
  model: string
  field: string
  schemaWidth: number
  shortTextMaxValue: number | undefined
}

// For every model/field MODEL_FIELDS classifies as long-text (prose: true,
// or listed in LONG_TEXT_FIELDS) that maps to a real, bounded VarChar schema
// column, SHORT_TEXT_MAX[model][field] must exist and equal that column's
// width -- otherwise pickText lets more characters through than the column
// can actually hold.
export function findTruncationProblems(
  schema: string,
  fieldsFileContent: string,
  commitRouteContent: string,
): TruncationProblem[] {
  const proseFields = extractProseFields(fieldsFileContent)
  const longTextFields = extractLongTextFields(commitRouteContent)
  const shortTextMax = extractShortTextMax(commitRouteContent)

  const problems: TruncationProblem[] = []

  const models = new Set([
    ...Object.keys(proseFields),
    ...Object.keys(longTextFields),
  ])

  for (const model of models) {
    const longTextKeys = new Set([
      ...(proseFields[model] ?? []),
      ...(longTextFields[model] ?? []),
    ])
    if (!longTextKeys.size) continue

    const widths = extractVarCharWidths(schema, model)
    for (const field of longTextKeys) {
      const schemaWidth = widths[field]
      if (schemaWidth === undefined) continue // Text/LongText -- unbounded enough

      const override = shortTextMax[model]?.[field]
      if (override !== schemaWidth) {
        problems.push({
          model,
          field,
          schemaWidth,
          shortTextMaxValue: override,
        })
      }
    }
  }

  return problems
}

function main(): void {
  const schema = readFileSync(SCHEMA_PATH, 'utf8')
  const fieldsFileContent = readFileSync(MODEL_BUILDER_FIELDS_PATH, 'utf8')
  const commitRouteContent = readFileSync(COMMIT_ROUTE_PATH, 'utf8')

  let failed = false

  const maxLenExpr = extractMaxLenExpression(commitRouteContent)
  if (maxLenExpr === null) {
    failed = true
    console.error(
      "Could not find pickText's `const maxLen = ...` assignment in " +
        'commit.post.ts -- has it been renamed, removed, or restructured? ' +
        'If so, this guard (and the truncation bug it protects against) ' +
        'needs to move with it.',
    )
  } else if (!maxLenPrefersShortTextMax(maxLenExpr)) {
    failed = true
    console.error(
      "Model Builder commit text-truncation contract failed: pickText's " +
        '`maxLen` no longer checks SHORT_TEXT_MAX[type]?.[key] first, ' +
        'independent of the prose/long-text classification. A field marked ' +
        '`prose: true` (or listed in LONG_TEXT_FIELDS) would silently take ' +
        'LONG_TEXT_MAX (20000 chars) even when a narrower SHORT_TEXT_MAX ' +
        'entry exists for it, making that entry dead code. ' +
        `Got: \`${maxLenExpr}\``,
    )
  }

  const problems = findTruncationProblems(
    schema,
    fieldsFileContent,
    commitRouteContent,
  )
  if (problems.length) {
    failed = true
    console.error(
      `Model Builder commit text-truncation contract failed: ${problems.length} ` +
        'long-text field(s) map to a bounded VarChar schema column with no ' +
        'matching SHORT_TEXT_MAX override:',
    )
    for (const problem of problems) {
      const found =
        problem.shortTextMaxValue === undefined
          ? 'no SHORT_TEXT_MAX entry'
          : `SHORT_TEXT_MAX = ${problem.shortTextMaxValue}`
      console.error(
        `- ${problem.model}.${problem.field} is @db.VarChar(${problem.schemaWidth}) ` +
          `in prisma/schema.prisma but is classified as long-text in ` +
          `modelBuilderFields.ts/commit.post.ts, and ${found} -- pickText ` +
          `will let more characters through than the column can hold, ` +
          'risking a silent truncation or a "Data too long for column" ' +
          'write failure.',
      )
    }
  }

  if (failed) {
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder commit text-truncation contract passed: pickText checks ' +
      'SHORT_TEXT_MAX ahead of the prose/long-text classification, and ' +
      'every long-text-classified field with a bounded VarChar schema ' +
      'column has a matching SHORT_TEXT_MAX override.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
