// /utils/scripts/verifyModelBuilderSourceBlurbCoverageGuard.test.ts
//
// Regression test for checkSourceBlurbCoverageGuard() in
// verifyModelBuilderSourceBlurbCoverageGuard.ts (model-builder/t-029, cycle
// 81). Exercises the real check against a synthetic modelBuilderRecipes.ts-
// shaped fixture covering: the actual pre-fix drift found in the real file
// (Scenario falsely promising "rewards", Character omitting "scenarios",
// Reward omitting "characters"), the fixed shape, and a source type with no
// relationship-expansion recipe at all (must be skipped entirely).
import assert from 'node:assert/strict'

import {
  checkSourceBlurbCoverageGuard,
  extractOutputCatalogEntries,
  extractSourceTypeEntries,
} from './verifyModelBuilderSourceBlurbCoverageGuard.js'

const OUTPUT_CATALOG_BLOCK = `
export const OUTPUT_CATALOG: BuildOutputConfig[] = [
  { key: 'primary-image', label: 'Primary image', recipe: 'art-upgrade', action: 'ASSET_ONLY', generation: 'image', description: 'x', defaultOn: true },
  { key: 'expand-characters', label: 'Characters', recipe: 'relationship-expansion', action: 'CREATE', generation: 'text', quantity: true, description: 'x', sourceTypes: ['Dream', 'Reward', 'Scenario'] },
  { key: 'expand-rewards', label: 'Rewards', recipe: 'relationship-expansion', action: 'CREATE', generation: 'text', quantity: true, description: 'x', sourceTypes: ['Dream', 'Character'] },
  { key: 'expand-scenarios', label: 'Scenarios', recipe: 'relationship-expansion', action: 'CREATE', generation: 'text', quantity: true, description: 'x', sourceTypes: ['Dream', 'Character'] },
  { key: 'expand-narrator-bot', label: 'Narrator bot', recipe: 'relationship-expansion', action: 'CREATE', generation: 'text', description: 'x', sourceTypes: ['Dream'] },
  { key: 'expand-manager-bot', label: 'Manager bot', recipe: 'relationship-expansion', action: 'CREATE', generation: 'text', description: 'x', sourceTypes: ['Project'] },
  { key: 'expand-signature-rewards', label: 'Signature rewards', recipe: 'relationship-expansion', action: 'CREATE', generation: 'text', quantity: true, description: 'x', sourceTypes: ['Character'] },
]
`

function fixtureWith(sourceTypesBlock: string): string {
  return `
export const SOURCE_TYPES: SourceTypeConfig[] = [
${sourceTypesBlock}
]
${OUTPUT_CATALOG_BLOCK}
`
}

const BUGGY_FIXTURE = fixtureWith(`
  {
    key: 'Character',
    label: 'Character',
    defaultRecipe: 'character-deck',
    recipes: ['character-deck', 'art-upgrade', 'relationship-expansion'],
    blurb: 'Full character deck, signature rewards, or an art upgrade.',
  },
  {
    key: 'Reward',
    label: 'Reward',
    defaultRecipe: 'reward-deck',
    recipes: ['reward-deck', 'art-upgrade', 'relationship-expansion'],
    blurb: 'Reward deck with type-aware art and optional 3D reference.',
  },
  {
    key: 'Scenario',
    label: 'Scenario',
    defaultRecipe: 'art-upgrade',
    recipes: ['art-upgrade', 'relationship-expansion'],
    blurb: 'Art upgrade, or expand into cast characters and rewards.',
  },
  {
    key: 'Bot',
    label: 'Bot',
    defaultRecipe: 'character-deck',
    recipes: ['character-deck', 'art-upgrade'],
    blurb: 'Character deck with expressions, transitions, and an art upgrade.',
  },
`)

const FIXED_FIXTURE = fixtureWith(`
  {
    key: 'Character',
    label: 'Character',
    defaultRecipe: 'character-deck',
    recipes: ['character-deck', 'art-upgrade', 'relationship-expansion'],
    blurb: 'Full character deck, signature rewards, scenarios, or an art upgrade.',
  },
  {
    key: 'Reward',
    label: 'Reward',
    defaultRecipe: 'reward-deck',
    recipes: ['reward-deck', 'art-upgrade', 'relationship-expansion'],
    blurb: 'Reward deck with type-aware art, optional 3D reference, or expand into characters.',
  },
  {
    key: 'Scenario',
    label: 'Scenario',
    defaultRecipe: 'art-upgrade',
    recipes: ['art-upgrade', 'relationship-expansion'],
    blurb: 'Art upgrade, or expand into cast characters.',
  },
  {
    key: 'Bot',
    label: 'Bot',
    defaultRecipe: 'character-deck',
    recipes: ['character-deck', 'art-upgrade'],
    blurb: 'Character deck with expressions, transitions, and an art upgrade.',
  },
`)

// --- extraction helpers ------------------------------------------------

const parsedSources = extractSourceTypeEntries(FIXED_FIXTURE)
assert.equal(parsedSources.length, 4, 'expected 4 parsed SOURCE_TYPES entries')
assert.deepEqual(parsedSources.find((s) => s.key === 'Character')?.recipes, [
  'character-deck',
  'art-upgrade',
  'relationship-expansion',
])

const parsedOutputs = extractOutputCatalogEntries(FIXED_FIXTURE)
assert.equal(
  parsedOutputs.length,
  7,
  'expected 7 parsed OUTPUT_CATALOG entries',
)
assert.deepEqual(
  parsedOutputs.find((o) => o.key === 'expand-rewards')?.sourceTypes,
  ['Dream', 'Character'],
)
assert.equal(
  parsedOutputs.find((o) => o.key === 'primary-image')?.sourceTypes,
  null,
)

// --- the real check ------------------------------------------------------

const buggyErrors = checkSourceBlurbCoverageGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  3,
  'expected the pre-fix shape to raise exactly 3 errors -- Character omits ' +
    '"scenario", Reward omits "character", Scenario falsely promises ' +
    `"reward" -- got ${buggyErrors.length}: ${JSON.stringify(buggyErrors)}`,
)
// Order follows SOURCE_TYPES array order: Character (omits scenario), then
// Reward (omits character), then Scenario (false-promises reward).
assert.ok(
  buggyErrors.some((e) => e.includes('Character\'s blurb omits "scenario"')),
  `expected a Character/scenario omission error, got: ${JSON.stringify(buggyErrors)}`,
)
assert.ok(
  buggyErrors.some((e) => e.includes('Reward\'s blurb omits "character"')),
  `expected a Reward/character omission error, got: ${JSON.stringify(buggyErrors)}`,
)
assert.ok(
  buggyErrors.some((e) => e.includes('Scenario\'s blurb mentions "reward"')),
  `expected a Scenario/reward false-promise error, got: ${JSON.stringify(buggyErrors)}`,
)

const fixedErrors = checkSourceBlurbCoverageGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

console.log(
  'Model Builder source-blurb coverage guard checker verified: flags the ' +
    'real pre-fix drift (Character omitting scenarios, Scenario falsely ' +
    'promising rewards), clears the fixed shape, and correctly skips a ' +
    'source type (Bot) with no relationship-expansion recipe.',
)
