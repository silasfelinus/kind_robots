// /utils/scripts/verifyModelBuilderLinkCoverage.ts
//
// Regression guard (model-builder/t-032, kaizen from t-029 / kind_robots PR
// #1079 -- a Character->Scenario link gap, same shape as PR #1005's earlier
// Dream->Bot gap). linkSourceToTarget in
// server/api/model-builder/items/[id]/commit.post.ts is a hand-maintained
// if-chain over (sourceType, targetType) pairs, with no structural guarantee
// it covers every CREATE_TARGETS entry (stores/helpers/modelBuilderFields.ts)
// that corresponds to a real bidirectional Prisma relation between the two
// models. Two such gaps have been found by manual read-through across
// separate cycles -- this walks the actual schema relation graph and CREATE_
// TARGETS output types and fails if a real relation has no matching case.
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

export interface LinkPair {
  sourceType: string
  targetType: string
}

function pairKey(pair: LinkPair): string {
  return `${pair.sourceType}->${pair.targetType}`
}

// The commit route's `isSourceType` type guard is the canonical list of
// model-builder source types -- parsed from its literal array so this check
// self-updates if a new source type is added.
export function extractSourceTypes(commitRouteContent: string): string[] {
  const match = commitRouteContent.match(
    /function isSourceType[^{]*\{\s*return \[([\s\S]*?)\]\.includes/,
  )
  if (!match) {
    throw new Error(
      'Could not find isSourceType(...) literal array in commit.post.ts -- ' +
        'has its shape changed?',
    )
  }
  return [...match[1]!.matchAll(/'(\w+)'/g)].map((m) => m[1]!)
}

// CREATE_TARGETS maps a build outputKey to the model it creates. We only
// need the distinct target model names it can produce.
export function extractCreateTargetTypes(fieldsFileContent: string): string[] {
  const match = fieldsFileContent.match(
    /CREATE_TARGETS:\s*Record<string,\s*SourceTypeKey>\s*=\s*\{([\s\S]*?)\n\}/,
  )
  if (!match) {
    throw new Error(
      'Could not find CREATE_TARGETS object literal in modelBuilderFields.ts ' +
        '-- has its shape changed?',
    )
  }
  const targets = [...match[1]!.matchAll(/:\s*'(\w+)'/g)].map((m) => m[1]!)
  return [...new Set(targets)]
}

// The literal `if (sourceType === 'X' && targetType === 'Y')` cases already
// handled by linkSourceToTarget.
export function extractLinkedPairs(commitRouteContent: string): LinkPair[] {
  const matches = commitRouteContent.matchAll(
    /if \(sourceType === '(\w+)' && targetType === '(\w+)'\)/g,
  )
  return [...matches].map((m) => ({
    sourceType: m[1]!,
    targetType: m[2]!,
  }))
}

function findModelBlock(schema: string, modelName: string): string | null {
  const match = schema.match(new RegExp(`^model\\s+${modelName}\\s*\\{`, 'm'))
  if (!match || match.index === undefined) return null
  const start = match.index + match[0].length
  const end = schema.indexOf('\n}', start)
  if (end === -1) return null
  return schema.slice(start, end)
}

// True if the Prisma schema declares a relation field on either model
// pointing at the other -- Prisma relations always declare a field on both
// sides, so checking one direction is enough, but we check both for safety.
export function schemaHasRelation(
  schema: string,
  modelA: string,
  modelB: string,
): boolean {
  const fieldPattern = (target: string) =>
    new RegExp(`^\\s*\\w+\\s+${target}(\\[\\])?(\\?)?\\b`, 'm')

  const blockA = findModelBlock(schema, modelA)
  if (blockA && fieldPattern(modelB).test(blockA)) return true

  const blockB = findModelBlock(schema, modelB)
  if (blockB && fieldPattern(modelA).test(blockB)) return true

  return false
}

// Every (sourceType, targetType) pair the schema's relation graph says
// linkSourceToTarget SHOULD handle: a real relation exists between the two
// models, and they are not the same model.
export function expectedLinkPairs(
  schema: string,
  sourceTypes: string[],
  targetTypes: string[],
): LinkPair[] {
  const expected: LinkPair[] = []
  for (const sourceType of sourceTypes) {
    for (const targetType of targetTypes) {
      if (sourceType === targetType) continue
      if (schemaHasRelation(schema, sourceType, targetType)) {
        expected.push({ sourceType, targetType })
      }
    }
  }
  return expected
}

export function findMissingLinkPairs(
  schema: string,
  fieldsFileContent: string,
  commitRouteContent: string,
): LinkPair[] {
  const sourceTypes = extractSourceTypes(commitRouteContent)
  const targetTypes = extractCreateTargetTypes(fieldsFileContent)
  const expected = expectedLinkPairs(schema, sourceTypes, targetTypes)
  const covered = new Set(extractLinkedPairs(commitRouteContent).map(pairKey))
  return expected.filter((pair) => !covered.has(pairKey(pair)))
}

function main(): void {
  const schema = readFileSync(SCHEMA_PATH, 'utf8')
  const fieldsFileContent = readFileSync(MODEL_BUILDER_FIELDS_PATH, 'utf8')
  const commitRouteContent = readFileSync(COMMIT_ROUTE_PATH, 'utf8')

  const missing = findMissingLinkPairs(schema, fieldsFileContent, commitRouteContent)

  if (missing.length) {
    console.error(
      `Model Builder link-coverage contract failed: ${missing.length} ` +
        '(sourceType, targetType) pair(s) have a real Prisma relation but no ' +
        'matching case in linkSourceToTarget ' +
        '(server/api/model-builder/items/[id]/commit.post.ts):',
    )
    for (const pair of missing) {
      console.error(
        `- ${pair.sourceType} -> ${pair.targetType}: a relation exists in ` +
          'prisma/schema.prisma between these models, so a CREATE commit ' +
          `from a ${pair.sourceType} source that produces a ${pair.targetType} ` +
          'is silently left unlinked. Add a matching `if (sourceType === ' +
          `'${pair.sourceType}' && targetType === '${pair.targetType}')\` case.`,
      )
    }
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder link-coverage contract passed: every CREATE_TARGETS ' +
      'output type with a real schema relation to a possible source type is ' +
      'handled by linkSourceToTarget.',
  )
}

main()
