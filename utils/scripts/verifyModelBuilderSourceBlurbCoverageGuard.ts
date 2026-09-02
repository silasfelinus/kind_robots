// /utils/scripts/verifyModelBuilderSourceBlurbCoverageGuard.ts
//
// Regression guard (model-builder/t-029, cycle 81) -- SOURCE_TYPES' `blurb`
// strings (stores/helpers/modelBuilderRecipes.ts) are hand-written prose
// describing what a source type's "relationship-expansion" recipe actually
// offers, rendered verbatim to the user by
// components/model-builder/model-builder-source-picker.vue
// (`{{ activeType.blurb }}`). Nothing ties that prose to OUTPUT_CATALOG, so
// it silently drifted out of sync with the real eligibility rules
// (BuildOutputConfig.sourceTypes, the same source getOutputsForRecipe()
// filters by):
//
// - Scenario's blurb promised "expand into cast characters and rewards", but
//   'expand-rewards'.sourceTypes is ['Dream', 'Character'] -- Scenario was
//   never eligible, so a Scenario-source relationship-expansion run never
//   actually offered a Rewards output. A false promise.
// - Character's blurb ("signature rewards, or an art upgrade") never
//   mentioned that 'expand-scenarios' also lists Character as an eligible
//   source -- a real, silently-omitted capability.
// - Reward's blurb didn't mention relationship-expansion at all, though
//   'expand-characters'.sourceTypes includes Reward -- another omission.
//
// This derives, from OUTPUT_CATALOG itself, which of the six relationship-
// expansion outputs each source type can actually reach, and asserts each
// output's keyword is present in that source's blurb when available and
// absent when not -- so a future OUTPUT_CATALOG.sourceTypes edit that isn't
// mirrored in the prose fails loudly here instead of shipping a silently
// wrong claim to the picker UI. The exclusion side is skipped for a source
// type's own name (e.g. Character's blurb legitimately says "character
// deck" even where expand-characters itself is not Character-eligible) --
// deliberately scoped to this one drift shape, mirroring this project's
// other narrow textual guards over a general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const MODEL_BUILDER_RECIPES_PATH = join(
  repositoryRoot,
  'stores/helpers/modelBuilderRecipes.ts',
)

interface SourceTypeEntry {
  key: string
  recipes: string[]
  blurb: string
}

interface OutputCatalogEntry {
  key: string
  recipe: string
  sourceTypes: string[] | null
}

// Every entry object literal in SOURCE_TYPES -- key, recipes[], blurb.
export function extractSourceTypeEntries(
  recipesFileContent: string,
): SourceTypeEntry[] {
  const match = recipesFileContent.match(
    /SOURCE_TYPES:\s*SourceTypeConfig\[\]\s*=\s*\[([\s\S]*?)\n\]\n/,
  )
  if (!match) {
    throw new Error(
      'Could not find SOURCE_TYPES array literal in modelBuilderRecipes.ts ' +
        '-- has its shape changed?',
    )
  }
  const entries: SourceTypeEntry[] = []
  for (const objMatch of match[1]!.matchAll(/\{(?:[^{}]|\{[^{}]*\})*\}/g)) {
    const obj = objMatch[0]
    const keyMatch = obj.match(/key:\s*'(\w+)'/)
    const recipesMatch = obj.match(/recipes:\s*\[([^\]]*)\]/)
    const blurbMatch = obj.match(/blurb:\s*'([^']*)'/)
    if (!keyMatch || !recipesMatch || !blurbMatch) continue
    entries.push({
      key: keyMatch[1]!,
      recipes: [...recipesMatch[1]!.matchAll(/'([\w-]+)'/g)].map((m) => m[1]!),
      blurb: blurbMatch[1]!,
    })
  }
  return entries
}

// Every entry object literal in OUTPUT_CATALOG -- key, recipe, sourceTypes
// (null when the output carries no sourceTypes restriction).
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
    const recipeMatch = obj.match(/recipe:\s*'([\w-]+)'/)
    if (!keyMatch || !recipeMatch) continue
    const sourceTypesMatch = obj.match(/sourceTypes:\s*\[([^\]]*)\]/)
    const sourceTypes = sourceTypesMatch
      ? [...sourceTypesMatch[1]!.matchAll(/'(\w+)'/g)].map((m) => m[1]!)
      : null
    entries.push({ key: keyMatch[1]!, recipe: recipeMatch[1]!, sourceTypes })
  }
  return entries
}

// The six relationship-expansion outputs, each paired with the keyword its
// availability should control in a source type's blurb prose. 'reward' and
// 'signature' are kept separate so expand-rewards and expand-signature-
// rewards drift independently -- a source eligible for only one of them
// still needs its own keyword covered.
const RELATIONSHIP_EXPANSION_KEYWORDS: {
  outputKey: string
  keyword: string
}[] = [
  { outputKey: 'expand-characters', keyword: 'character' },
  { outputKey: 'expand-rewards', keyword: 'reward' },
  { outputKey: 'expand-scenarios', keyword: 'scenario' },
  { outputKey: 'expand-narrator-bot', keyword: 'narrator' },
  { outputKey: 'expand-manager-bot', keyword: 'manager' },
  { outputKey: 'expand-signature-rewards', keyword: 'signature' },
]

// A source type's own name legitimately appears in its blurb for reasons
// unrelated to relationship-expansion eligibility (e.g. Character's "Full
// character deck" even when expand-characters itself excludes Character) --
// skip the exclusion (false-promise) side of the check for these.
const SELF_KEYWORDS: Record<string, string> = {
  Character: 'character',
  Reward: 'reward',
  Scenario: 'scenario',
}

export function checkSourceBlurbCoverageGuard(
  recipesFileContent: string,
): string[] {
  const sourceTypes = extractSourceTypeEntries(recipesFileContent)
  const outputs = extractOutputCatalogEntries(recipesFileContent)
  const errors: string[] = []

  for (const source of sourceTypes) {
    if (!source.recipes.includes('relationship-expansion')) continue
    const blurb = source.blurb.toLowerCase()
    const selfKeyword = SELF_KEYWORDS[source.key]

    for (const { outputKey, keyword } of RELATIONSHIP_EXPANSION_KEYWORDS) {
      const output = outputs.find(
        (o) => o.key === outputKey && o.recipe === 'relationship-expansion',
      )
      if (!output) continue
      const available =
        !output.sourceTypes || output.sourceTypes.includes(source.key)
      const mentioned = blurb.includes(keyword)

      if (available && !mentioned) {
        errors.push(
          `${source.key}'s blurb omits "${keyword}" but '${outputKey}' is ` +
            `an eligible relationship-expansion output for it (sourceTypes ` +
            `${output.sourceTypes ? JSON.stringify(output.sourceTypes) : 'unrestricted'}) -- ` +
            'the picker UI never tells the user this expansion is actually ' +
            `available. Current blurb: "${source.blurb}"`,
        )
      } else if (!available && mentioned && keyword !== selfKeyword) {
        errors.push(
          `${source.key}'s blurb mentions "${keyword}" but '${outputKey}' ` +
            `does not list ${source.key} in its sourceTypes ` +
            `(${output.sourceTypes ? JSON.stringify(output.sourceTypes) : 'unrestricted'}) -- ` +
            'a false promise: the picker UI tells the user this expansion ' +
            `is available, but it never appears. Current blurb: "${source.blurb}"`,
        )
      }
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(MODEL_BUILDER_RECIPES_PATH, 'utf8')
  const errors = checkSourceBlurbCoverageGuard(content)

  if (errors.length) {
    console.error(
      `Model Builder source-blurb coverage guard failed: ${errors.length} ` +
        'SOURCE_TYPES blurb(s) disagree with OUTPUT_CATALOG relationship-' +
        'expansion eligibility:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder source-blurb coverage guard passed: every SOURCE_TYPES ' +
      'blurb mentioning a relationship-expansion output agrees with what ' +
      "OUTPUT_CATALOG's sourceTypes actually make eligible.",
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
