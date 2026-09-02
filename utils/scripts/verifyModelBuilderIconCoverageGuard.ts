// /utils/scripts/verifyModelBuilderIconCoverageGuard.ts
//
// Regression guard (model-builder/t-029, cycle 82) -- BUILD_STAGES,
// SOURCE_TYPES, and RECIPES (stores/helpers/modelBuilderRecipes.ts) each
// carry a hand-written `icon: 'kind-icon:<name>'` string, rendered directly
// by the Model Builder UI (model-builder-source-picker.vue,
// model-builder-recipe-selector.vue, and the stage stepper) via the
// `kind-icon` Iconify collection registered in nuxt.config.ts
// (`prefix: 'kind-icon', dir: './assets/icons'`). Nothing ties that string
// to the actual icon set: a typo'd or renamed icon silently resolves to a
// missing/blank glyph in the picker with no error anywhere, the same failure
// shape this task's own history already hit twice for other hand-typed
// field names (Bot's stale `botType` subtitleField, Facet's stale `kind`
// subtitleField -- both cycle 22, both a silent blank rather than a thrown
// error).
//
// This reads every `icon: 'kind-icon:<name>'` literal out of the three
// arrays and asserts assets/icons/<name>.svg actually exists, so a future
// rename or typo fails loudly here instead of shipping a blank icon.
// Deliberately scoped to this one file/collection pairing, mirroring this
// project's other narrow textual guards over a general-purpose static
// analyzer (see verifyModelBuilderSourceBlurbCoverageGuard.ts's header for
// the same rationale).
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const MODEL_BUILDER_RECIPES_PATH = join(
  repositoryRoot,
  'stores/helpers/modelBuilderRecipes.ts',
)
const ICONS_DIRECTORY = join(repositoryRoot, 'assets/icons')

const ICON_ARRAYS: { name: string; pattern: RegExp }[] = [
  {
    name: 'BUILD_STAGES',
    pattern: /BUILD_STAGES:\s*BuildStageConfig\[\]\s*=\s*\[([\s\S]*?)\n\]\n/,
  },
  {
    name: 'SOURCE_TYPES',
    pattern: /SOURCE_TYPES:\s*SourceTypeConfig\[\]\s*=\s*\[([\s\S]*?)\n\]\n/,
  },
  {
    name: 'RECIPES',
    pattern: /RECIPES:\s*RecipeConfig\[\]\s*=\s*\[([\s\S]*?)\n\]\n/,
  },
]

export interface IconEntry {
  array: string
  key: string
  icon: string
}

// Every `{ key: '...', ..., icon: 'kind-icon:...', ... }` entry across the
// three arrays that carry an `icon` field. Exported so the self-test can
// exercise it against a synthetic fixture.
export function extractIconEntries(recipesFileContent: string): IconEntry[] {
  const entries: IconEntry[] = []

  for (const { name, pattern } of ICON_ARRAYS) {
    const match = recipesFileContent.match(pattern)
    if (!match) {
      throw new Error(
        `Could not find ${name} array literal in modelBuilderRecipes.ts -- ` +
          'has its shape changed?',
      )
    }
    for (const objMatch of match[1]!.matchAll(/\{[^{}]*\}/g)) {
      const obj = objMatch[0]
      const keyMatch = obj.match(/key:\s*'([\w-]+)'/)
      const iconMatch = obj.match(/icon:\s*'kind-icon:([\w-]+)'/)
      if (!keyMatch || !iconMatch) continue
      entries.push({ array: name, key: keyMatch![1]!, icon: iconMatch![1]! })
    }
  }

  return entries
}

// Checks the real contract: every extracted icon name resolves to a real
// file in the given available-icons set. Takes the set as a parameter
// (rather than reading the filesystem directly) so the self-test can
// exercise the logic against a synthetic set without touching disk.
export function checkIconCoverageGuard(
  entries: IconEntry[],
  availableIcons: Set<string>,
): string[] {
  const errors: string[] = []

  for (const entry of entries) {
    if (!availableIcons.has(entry.icon)) {
      errors.push(
        `${entry.array}['${entry.key}'].icon references 'kind-icon:${entry.icon}' ` +
          `but assets/icons/${entry.icon}.svg does not exist -- the picker/stepper ` +
          'renders a blank icon instead of erroring anywhere.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(MODEL_BUILDER_RECIPES_PATH, 'utf8')
  const entries = extractIconEntries(content)

  const availableIcons = new Set(
    readdirSync(ICONS_DIRECTORY)
      .filter((file) => file.endsWith('.svg'))
      .map((file) => file.slice(0, -'.svg'.length)),
  )

  const errors = checkIconCoverageGuard(entries, availableIcons)

  if (errors.length) {
    console.error(
      `Model Builder icon coverage guard failed: ${errors.length} icon ` +
        'reference(s) in modelBuilderRecipes.ts have no matching svg file:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Model Builder icon coverage guard passed: all ${entries.length} ` +
      'icon references in BUILD_STAGES/SOURCE_TYPES/RECIPES resolve to a ' +
      'real assets/icons/*.svg file.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
