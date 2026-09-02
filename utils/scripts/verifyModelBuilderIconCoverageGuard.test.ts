// /utils/scripts/verifyModelBuilderIconCoverageGuard.test.ts
//
// Regression test for checkIconCoverageGuard()/extractIconEntries() in
// verifyModelBuilderIconCoverageGuard.ts (model-builder/t-029, cycle 82).
// Exercises the real check against a synthetic modelBuilderRecipes.ts-shaped
// fixture covering: a typo'd icon name, a renamed/removed icon, the clean
// shape with every icon present, and (cycle 84) a leading comment
// containing literal `{`/`}` characters, which broke the original
// brace-matching extraction by hiding the real Facet-shaped entry entirely.
import assert from 'node:assert/strict'

import {
  checkIconCoverageGuard,
  extractIconEntries,
} from './verifyModelBuilderIconCoverageGuard.js'

const AVAILABLE_ICONS = new Set([
  'lightbulb',
  'list',
  'sparkles',
  'check',
  'blueprint',
  'user',
  'robot',
  'megaphone',
  'trophy',
  'link',
])

function fixture(options: {
  stageIcon?: string
  sourceIcon?: string
  recipeIcon?: string
  sourceLeadingComment?: string
}): string {
  const stageIcon = options.stageIcon ?? 'lightbulb'
  const sourceIcon = options.sourceIcon ?? 'blueprint'
  const recipeIcon = options.recipeIcon ?? 'megaphone'
  const sourceLeadingComment = options.sourceLeadingComment ?? ''
  return `
export const BUILD_STAGES: BuildStageConfig[] = [
  { key: 'PITCH', label: 'Pitch', short: 'Pitch', description: 'x', icon: 'kind-icon:${stageIcon}' },
  { key: 'COMMIT', label: 'Commit', short: 'Commit', description: 'x', icon: 'kind-icon:check' },
]

export const SOURCE_TYPES: SourceTypeConfig[] = [
  {${sourceLeadingComment}
    key: 'Project',
    label: 'Project',
    plural: 'Projects',
    icon: 'kind-icon:${sourceIcon}',
    endpoint: '/api/projects',
    titleField: 'title',
    defaultRecipe: 'marketing-deck',
    recipes: ['marketing-deck'],
    blurb: 'x',
  },
]

export const RECIPES: RecipeConfig[] = [
  {
    key: 'marketing-deck',
    label: 'Marketing Deck',
    icon: 'kind-icon:${recipeIcon}',
    summary: 'x',
    sourceTypes: ['Project'],
  },
]
`
}

// --- extraction ------------------------------------------------------------

const cleanFixture = fixture({})
const entries = extractIconEntries(cleanFixture)
assert.equal(
  entries.length,
  4,
  `expected 4 parsed icon entries, got ${entries.length}`,
)
assert.deepEqual(
  entries.map((e) => `${e.array}:${e.key}:${e.icon}`),
  [
    'BUILD_STAGES:PITCH:lightbulb',
    'BUILD_STAGES:COMMIT:check',
    'SOURCE_TYPES:Project:blueprint',
    'RECIPES:marketing-deck:megaphone',
  ],
)

// --- the real check ----------------------------------------------------

const cleanErrors = checkIconCoverageGuard(entries, AVAILABLE_ICONS)
assert.equal(
  cleanErrors.length,
  0,
  `expected the clean shape to raise no errors, got: ${JSON.stringify(cleanErrors)}`,
)

const typoEntries = extractIconEntries(fixture({ sourceIcon: 'bluepirnt' }))
const typoErrors = checkIconCoverageGuard(typoEntries, AVAILABLE_ICONS)
assert.equal(
  typoErrors.length,
  1,
  `expected exactly 1 error for the typo'd source icon, got: ${JSON.stringify(typoErrors)}`,
)
assert.ok(
  typoErrors[0]!.includes("SOURCE_TYPES['Project']") &&
    typoErrors[0]!.includes('bluepirnt'),
  `expected the error to name the SOURCE_TYPES Project entry and the typo'd icon, got: ${typoErrors[0]}`,
)

const multipleMissingEntries = extractIconEntries(
  fixture({ stageIcon: 'lightbulbb', recipeIcon: 'megaphonee' }),
)
const multipleMissingErrors = checkIconCoverageGuard(
  multipleMissingEntries,
  AVAILABLE_ICONS,
)
assert.equal(
  multipleMissingErrors.length,
  2,
  `expected 2 errors for the two missing icons, got: ${JSON.stringify(multipleMissingErrors)}`,
)

// A leading comment mentioning a brace-containing path (the real Facet
// entry's actual shape in modelBuilderRecipes.ts) must not hide the entry
// that follows it, and the comment's own `{`/`}` characters must not be
// mistaken for a phantom entry (cycle 84 -- see this file's header note).
const braceCommentEntries = extractIconEntries(
  fixture({
    sourceLeadingComment:
      '\n    // see server/api/{dreams,scenarios}/[id]/facets.put.ts for context',
  }),
)
assert.equal(
  braceCommentEntries.length,
  4,
  `expected the brace-containing comment not to swallow or duplicate any entry, got: ${JSON.stringify(braceCommentEntries)}`,
)
assert.deepEqual(
  braceCommentEntries.find((e) => e.array === 'SOURCE_TYPES'),
  { array: 'SOURCE_TYPES', key: 'Project', icon: 'blueprint' },
  `expected the Project entry to survive a brace-containing leading comment, got: ${JSON.stringify(braceCommentEntries)}`,
)

console.log(
  'Model Builder icon coverage guard checker verified: parses all three ' +
    'icon-carrying arrays, passes on the clean shape, and flags a typo in ' +
    'any of BUILD_STAGES/SOURCE_TYPES/RECIPES individually.',
)
