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
const MODEL_BUILDER_RECIPES_PATH = join(
  repositoryRoot,
  'stores/helpers/modelBuilderRecipes.ts',
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
  if (!match) return null
  if (match.index === undefined) return null
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

// key -> target model, same object findMissingLinkPairs reads via
// extractCreateTargetTypes, but keeping the key so a claimed-eligible pair can
// be traced back to the OUTPUT_CATALOG entry that made the claim.
export function extractCreateTargetMap(
  fieldsFileContent: string,
): Record<string, string> {
  const match = fieldsFileContent.match(
    /CREATE_TARGETS:\s*Record<string,\s*SourceTypeKey>\s*=\s*\{([\s\S]*?)\n\}/,
  )
  if (!match) {
    throw new Error(
      'Could not find CREATE_TARGETS object literal in modelBuilderFields.ts ' +
        '-- has its shape changed?',
    )
  }
  const map: Record<string, string> = {}
  for (const m of match[1]!.matchAll(/'([\w-]+)':\s*'(\w+)'/g)) {
    map[m[1]!] = m[2]!
  }
  return map
}

interface OutputCatalogEntry {
  key: string
  action: string
  sourceTypes: string[] | null
}

// Every entry object literal in OUTPUT_CATALOG (modelBuilderRecipes.ts),
// independent of field order within the object -- 'action' and 'sourceTypes'
// are read separately rather than assumed adjacent.
export function extractOutputCatalogEntries(
  recipesFileContent: string,
): OutputCatalogEntry[] {
  const match = recipesFileContent.match(
    /OUTPUT_CATALOG:\s*BuildOutputConfig\[\]\s*=\s*\[([\s\S]*?)\n\]/,
  )
  if (!match) {
    throw new Error(
      'Could not find OUTPUT_CATALOG array literal in modelBuilderRecipes.ts ' +
        '-- has its shape changed?',
    )
  }
  const entries: OutputCatalogEntry[] = []
  for (const objMatch of match[1]!.matchAll(/\{[^{}]*\}/g)) {
    const obj = objMatch[0]
    const keyMatch = obj.match(/key:\s*'([\w-]+)'/)
    const actionMatch = obj.match(/action:\s*'(\w+)'/)
    if (!keyMatch || !actionMatch) continue
    const sourceTypesMatch = obj.match(/sourceTypes:\s*\[([^\]]*)\]/)
    const sourceTypes = sourceTypesMatch
      ? [...sourceTypesMatch[1]!.matchAll(/'(\w+)'/g)].map((m) => m[1]!)
      : null
    entries.push({ key: keyMatch[1]!, action: actionMatch[1]!, sourceTypes })
  }
  return entries
}

// True if some OTHER model in the schema is a genuine explicit join table
// connecting modelA and modelB -- e.g. DreamFacet connecting Dream and Facet
// via two singular FKs under a composite primary key -- rather than either
// model holding a direct field pointing at the other. This is a
// tag-attachment/many-to-many join, not a parent->child creation link
// linkSourceToTarget can commit through. Returns the join model's name, or
// null if no such model exists.
//
// Deliberately requires the `@@id([...])` composite-key shape every real
// join table in this schema uses (DreamFacet, ScenarioFacet, FacetArtImage,
// FacetArtCollection, ProjectArtImage, ProjectArtCollection) -- a looser
// "any model with fields of both types" check false-positives on broad hub
// models like ArtImage, which holds list-type back-references
// (`Characters Character[]`, `FacetsPrimary Facet[]`) to dozens of unrelated
// models without being a join table for any pair of them.
export function schemaHasJoinTableRelation(
  schema: string,
  modelA: string,
  modelB: string,
): string | null {
  const singularFieldPattern = (target: string) =>
    new RegExp(`^\\s*\\w+\\s+${target}(\\?)?\\s`, 'm')
  const compositeIdPattern = /@@id\(\[\w+,\s*\w+\]\)/
  for (const m of schema.matchAll(/^model\s+(\w+)\s*\{/gm)) {
    const joinModelName = m[1]!
    if (joinModelName === modelA || joinModelName === modelB) continue
    const block = findModelBlock(schema, joinModelName)
    if (!block) continue
    if (!compositeIdPattern.test(block)) continue
    if (
      singularFieldPattern(modelA).test(block) &&
      singularFieldPattern(modelB).test(block)
    ) {
      return joinModelName
    }
  }
  return null
}

export interface JoinTableOnlyPair extends LinkPair {
  key: string
  joinModel: string
}

// Every (sourceType, targetType) pair that an OUTPUT_CATALOG CREATE output
// restricts to specific sourceTypes (model-builder/t-033's eligibility gate)
// where the schema has NO direct relation between the two models but DOES
// have a join-table-only relation -- the exact config bug t-032/t-033/t-034
// took three cycles to find manually (Facet listed as eligible to
// CREATE-link Dream/Scenario when DreamFacet/ScenarioFacet are tag-attachment
// joins, not a creation link). Distinct from findMissingLinkPairs, which only
// checks pairs the schema itself says ARE directly linkable.
export function findJoinTableOnlyEligibilityPairs(
  schema: string,
  fieldsFileContent: string,
  recipesFileContent: string,
): JoinTableOnlyPair[] {
  const targetMap = extractCreateTargetMap(fieldsFileContent)
  const outputs = extractOutputCatalogEntries(recipesFileContent)
  const found: JoinTableOnlyPair[] = []
  const seen = new Set<string>()

  for (const output of outputs) {
    if (output.action !== 'CREATE' || !output.sourceTypes) continue
    const targetType = targetMap[output.key]
    if (!targetType) continue

    for (const sourceType of output.sourceTypes) {
      if (sourceType === targetType) continue
      const dedupeKey = `${output.key}:${pairKey({ sourceType, targetType })}`
      if (seen.has(dedupeKey)) continue
      if (schemaHasRelation(schema, sourceType, targetType)) continue

      const joinModel = schemaHasJoinTableRelation(schema, sourceType, targetType)
      if (joinModel) {
        seen.add(dedupeKey)
        found.push({ sourceType, targetType, key: output.key, joinModel })
      }
    }
  }

  return found
}

function main(): void {
  const schema = readFileSync(SCHEMA_PATH, 'utf8')
  const fieldsFileContent = readFileSync(MODEL_BUILDER_FIELDS_PATH, 'utf8')
  const commitRouteContent = readFileSync(COMMIT_ROUTE_PATH, 'utf8')
  const recipesFileContent = readFileSync(MODEL_BUILDER_RECIPES_PATH, 'utf8')

  const missing = findMissingLinkPairs(schema, fieldsFileContent, commitRouteContent)
  const joinTableOnly = findJoinTableOnlyEligibilityPairs(
    schema,
    fieldsFileContent,
    recipesFileContent,
  )

  let failed = false

  if (missing.length) {
    failed = true
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
  }

  if (joinTableOnly.length) {
    failed = true
    console.error(
      `Model Builder link-coverage contract failed: ${joinTableOnly.length} ` +
        'OUTPUT_CATALOG sourceTypes entry(s) claim CREATE-link eligibility ' +
        'for a pair only connected by a join table (modelBuilderRecipes.ts):',
    )
    for (const pair of joinTableOnly) {
      console.error(
        `- '${pair.key}' lists ${pair.sourceType} as an eligible source, but ` +
          `${pair.sourceType} and ${pair.targetType} have no direct Prisma ` +
          `relation -- only ${pair.joinModel}, a tag-attachment join table. ` +
          `A CREATE commit from a ${pair.sourceType} source using '${pair.key}' ` +
          `has no real parent->child link to its new ${pair.targetType}. Remove ` +
          `${pair.sourceType} from '${pair.key}'\`s sourceTypes (see ` +
          'model-builder/t-034 for the same fix applied to Facet).',
      )
    }
  }

  if (failed) {
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder link-coverage contract passed: every CREATE_TARGETS ' +
      'output type with a real schema relation to a possible source type is ' +
      'handled by linkSourceToTarget, and no OUTPUT_CATALOG sourceTypes ' +
      'entry claims eligibility for a join-table-only pair.',
  )
}

main()
