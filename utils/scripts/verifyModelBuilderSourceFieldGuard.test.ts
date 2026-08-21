// /utils/scripts/verifyModelBuilderSourceFieldGuard.test.ts
//
// Regression test for findSourceFieldProblems() and its helpers in
// verifyModelBuilderSourceFieldGuard.ts (model-builder/t-029, cycle 22).
// Exercises the real checks against synthetic schema/recipes/facet-summary
// fixtures covering: the pre-fix shape (Bot's wrong-case 'botType', Facet's
// dropped 'kind' column), the fixed shape, a titleField typo, and a
// hydrated-summary field that's legitimately absent from the raw Facet
// model but present on FacetSummary's own computed additions.
//
// Cycle 31 adds coverage for findSourceFieldTypeProblems() and its two new
// helpers (extractScalarFieldTypes, extractEnumNames): a field can exist
// (pass every check above) yet still be unrenderable, e.g. Scenario's real
// subtitleField 'difficulty' is a Prisma `Int?` column that model-builder-
// source-picker.vue's pre-fix subtitle() silently discarded.
import assert from 'node:assert/strict'

import {
  extractEnumNames,
  extractFacetSummaryExtraFields,
  extractScalarFieldNames,
  extractScalarFieldTypes,
  extractSourceFieldEntries,
  findSourceFieldProblems,
  findSourceFieldTypeProblems,
} from './verifyModelBuilderSourceFieldGuard.js'

const SCHEMA_FIXTURE = `
model Bot {
  id       Int     @id @default(autoincrement())
  name     String  @db.VarChar(256)
  BotType  String  @db.VarChar(764)
  imagePath String? @db.VarChar(764)
  ArtImage ArtImage? @relation(fields: [artImageId], references: [id])
  Chats    Chat[]
}

model Facet {
  id        Int     @id @default(autoincrement())
  title     String  @db.VarChar(255)
  imagePath String? @db.Text
  User      User?   @relation(fields: [userId], references: [id])
}

model Scenario {
  id         Int      @id @default(autoincrement())
  title      String   @db.VarChar(255)
  difficulty Int?
  isActive   Boolean  @default(true)
  outputType ScenarioType @default(STORY)
}

enum ScenarioType {
  STORY
  QUEST
}
`

const FACET_ASSIGNMENTS_FIXTURE = `
export type FacetSummary = Pick<
  Facet,
  | 'id'
  | 'title'
  | 'imagePath'
> & {
  aliases: string[]
  taxonomy: FacetTaxonomy
  sortOrder: number
}
`

const BUGGY_RECIPES_FIXTURE = `
export const SOURCE_TYPES: SourceTypeConfig[] = [
  {
    key: 'Bot',
    label: 'Bot',
    titleField: 'name',
    subtitleField: 'botType',
    defaultRecipe: 'character-deck',
  },
  {
    key: 'Facet',
    label: 'Facet',
    titleField: 'title',
    subtitleField: 'kind',
    defaultRecipe: 'art-upgrade',
  },
]
`

const FIXED_RECIPES_FIXTURE = `
export const SOURCE_TYPES: SourceTypeConfig[] = [
  {
    key: 'Bot',
    label: 'Bot',
    titleField: 'name',
    subtitleField: 'BotType',
    defaultRecipe: 'character-deck',
  },
  {
    key: 'Facet',
    label: 'Facet',
    titleField: 'title',
    subtitleField: 'taxonomy',
    defaultRecipe: 'art-upgrade',
  },
]
`

const TITLE_FIELD_TYPO_FIXTURE = `
export const SOURCE_TYPES: SourceTypeConfig[] = [
  {
    key: 'Bot',
    label: 'Bot',
    titleField: 'nam',
    subtitleField: 'BotType',
    defaultRecipe: 'character-deck',
  },
]
`

// The real, live shape (model-builder/t-029, cycle 31): 'difficulty' is a
// real Scenario column (findSourceFieldProblems sees no problem here), an
// `Int?`, not a String -- must clear the type check now that subtitle()
// renders finite numbers too.
const SCENARIO_TYPE_INT_RECIPES_FIXTURE = `
export const SOURCE_TYPES: SourceTypeConfig[] = [
  {
    key: 'Scenario',
    label: 'Scenario',
    titleField: 'title',
    subtitleField: 'difficulty',
    defaultRecipe: 'art-upgrade',
  },
]
`

// A String subtitleField clears the type check.
const SCENARIO_TYPE_FIXED_RECIPES_FIXTURE = `
export const SOURCE_TYPES: SourceTypeConfig[] = [
  {
    key: 'Scenario',
    label: 'Scenario',
    titleField: 'title',
    subtitleField: 'title',
    defaultRecipe: 'art-upgrade',
  },
]
`

// A genuinely non-renderable column (Boolean) must still be flagged.
const SCENARIO_BOOLEAN_RECIPES_FIXTURE = `
export const SOURCE_TYPES: SourceTypeConfig[] = [
  {
    key: 'Scenario',
    label: 'Scenario',
    titleField: 'title',
    subtitleField: 'isActive',
    defaultRecipe: 'art-upgrade',
  },
]
`

// A Prisma enum column (transports as a JSON string) must clear the check,
// same as a real String column.
const SCENARIO_ENUM_RECIPES_FIXTURE = `
export const SOURCE_TYPES: SourceTypeConfig[] = [
  {
    key: 'Scenario',
    label: 'Scenario',
    titleField: 'title',
    subtitleField: 'outputType',
    defaultRecipe: 'art-upgrade',
  },
]
`

// --- extractScalarFieldNames -----------------------------------------------

const botFields = extractScalarFieldNames(SCHEMA_FIXTURE, 'Bot')
assert.ok(botFields.includes('BotType'), 'expected Bot.BotType to be found')
assert.ok(botFields.includes('imagePath'), 'expected Bot.imagePath to be found')
assert.ok(
  !botFields.includes('ArtImage'),
  'expected the single relation field ArtImage to be excluded',
)
assert.ok(
  !botFields.includes('Chats'),
  'expected the list relation field Chats to be excluded',
)

assert.throws(
  () => extractScalarFieldNames(SCHEMA_FIXTURE, 'Reward'),
  /Could not find model Reward/,
  'expected a missing model to throw a descriptive error',
)

// --- extractFacetSummaryExtraFields -----------------------------------------

const facetExtras = extractFacetSummaryExtraFields(FACET_ASSIGNMENTS_FIXTURE)
assert.deepEqual(
  facetExtras,
  ['aliases', 'taxonomy', 'sortOrder'],
  `expected exactly the hydrated FacetSummary additions, got: ${JSON.stringify(facetExtras)}`,
)

// --- extractSourceFieldEntries ----------------------------------------------

const entries = extractSourceFieldEntries(FIXED_RECIPES_FIXTURE)
assert.deepEqual(
  entries,
  [
    { key: 'Bot', titleField: 'name', subtitleField: 'BotType' },
    { key: 'Facet', titleField: 'title', subtitleField: 'taxonomy' },
  ],
  `expected both SOURCE_TYPES entries parsed independent of order, got: ${JSON.stringify(entries)}`,
)

// --- findSourceFieldProblems -------------------------------------------------

const buggyProblems = findSourceFieldProblems(
  SCHEMA_FIXTURE,
  BUGGY_RECIPES_FIXTURE,
  FACET_ASSIGNMENTS_FIXTURE,
)
assert.equal(
  buggyProblems.length,
  2,
  `expected the pre-fix shape (Bot's wrong-case 'botType', Facet's dropped ` +
    `'kind') to raise 2 problems, got ${buggyProblems.length}: ` +
    `${JSON.stringify(buggyProblems)}`,
)
assert.ok(
  buggyProblems.some(
    (p) =>
      p.key === 'Bot' && p.which === 'subtitleField' && p.field === 'botType',
  ),
)
assert.ok(
  buggyProblems.some(
    (p) =>
      p.key === 'Facet' && p.which === 'subtitleField' && p.field === 'kind',
  ),
)

const fixedProblems = findSourceFieldProblems(
  SCHEMA_FIXTURE,
  FIXED_RECIPES_FIXTURE,
  FACET_ASSIGNMENTS_FIXTURE,
)
assert.equal(
  fixedProblems.length,
  0,
  `expected the fixed shape to raise no problems, got: ${JSON.stringify(fixedProblems)}`,
)

const titleTypoProblems = findSourceFieldProblems(
  SCHEMA_FIXTURE,
  TITLE_FIELD_TYPO_FIXTURE,
  FACET_ASSIGNMENTS_FIXTURE,
)
assert.equal(
  titleTypoProblems.length,
  1,
  `expected a titleField typo to raise 1 problem, got ${titleTypoProblems.length}: ` +
    `${JSON.stringify(titleTypoProblems)}`,
)
assert.equal(titleTypoProblems[0]!.which, 'titleField')
assert.equal(titleTypoProblems[0]!.field, 'nam')

// --- extractScalarFieldTypes / extractEnumNames -----------------------------

const scenarioTypes = extractScalarFieldTypes(SCHEMA_FIXTURE, 'Scenario')
assert.equal(scenarioTypes.title, 'String')
assert.equal(scenarioTypes.difficulty, 'Int')
assert.equal(scenarioTypes.isActive, 'Boolean')
assert.equal(scenarioTypes.outputType, 'ScenarioType')

const enumNames = extractEnumNames(SCHEMA_FIXTURE)
assert.ok(
  enumNames.has('ScenarioType'),
  `expected ScenarioType to be recognized as an enum, got: ${JSON.stringify([...enumNames])}`,
)

// --- findSourceFieldTypeProblems ---------------------------------------------

// Int is renderable (model-builder-source-picker.vue's subtitle() was fixed
// this same cycle to also stringify finite numbers) -- Scenario's real
// subtitleField 'difficulty' must clear the type check post-fix, exactly
// matching the live SOURCE_TYPES config this guard runs against in CI.
const scenarioIntProblems = findSourceFieldTypeProblems(
  SCHEMA_FIXTURE,
  SCENARIO_TYPE_INT_RECIPES_FIXTURE,
)
assert.equal(
  scenarioIntProblems.length,
  0,
  "expected Scenario's Int subtitleField 'difficulty' to raise no type " +
    `problems now that the renderer handles numbers, got ` +
    `${scenarioIntProblems.length}: ${JSON.stringify(scenarioIntProblems)}`,
)

const scenarioStringProblems = findSourceFieldTypeProblems(
  SCHEMA_FIXTURE,
  SCENARIO_TYPE_FIXED_RECIPES_FIXTURE,
)
assert.equal(
  scenarioStringProblems.length,
  0,
  `expected a String subtitleField to raise no type problems, got: ` +
    JSON.stringify(scenarioStringProblems),
)

const scenarioBooleanProblems = findSourceFieldTypeProblems(
  SCHEMA_FIXTURE,
  SCENARIO_BOOLEAN_RECIPES_FIXTURE,
)
assert.equal(
  scenarioBooleanProblems.length,
  1,
  'expected a Boolean subtitleField to raise 1 type problem, got ' +
    `${scenarioBooleanProblems.length}: ${JSON.stringify(scenarioBooleanProblems)}`,
)
assert.equal(scenarioBooleanProblems[0]!.fieldType, 'Boolean')

const scenarioEnumProblems = findSourceFieldTypeProblems(
  SCHEMA_FIXTURE,
  SCENARIO_ENUM_RECIPES_FIXTURE,
)
assert.equal(
  scenarioEnumProblems.length,
  0,
  'expected an enum subtitleField (transports as a string) to raise no ' +
    `type problems, got: ${JSON.stringify(scenarioEnumProblems)}`,
)

// A field that doesn't exist at all is findSourceFieldProblems' job, not
// this one's -- must not double-report the same root cause.
const titleTypoTypeProblems = findSourceFieldTypeProblems(
  SCHEMA_FIXTURE,
  TITLE_FIELD_TYPO_FIXTURE,
)
assert.equal(
  titleTypoTypeProblems.length,
  0,
  'expected a nonexistent field to raise 0 type problems (existence is ' +
    `findSourceFieldProblems' job), got: ${JSON.stringify(titleTypoTypeProblems)}`,
)

// Facet is skipped entirely (hydrated summary, no raw schema column to
// type-check) -- must not throw even though the fixture Facet model has no
// 'kind'/'taxonomy' field at all.
const facetTypeProblems = findSourceFieldTypeProblems(
  SCHEMA_FIXTURE,
  FIXED_RECIPES_FIXTURE,
)
assert.equal(
  facetTypeProblems.length,
  0,
  `expected Facet to be skipped by the type check, got: ${JSON.stringify(facetTypeProblems)}`,
)

console.log(
  'Model Builder source-field guard checker verified: finds Bot.BotType ' +
    'and Facet.imagePath as real scalar fields, excludes relation fields, ' +
    "parses FacetSummary's hydrated additions, flags the pre-fix " +
    'wrong-case/dropped-column shape, clears the fixed shape, flags a ' +
    'titleField typo, and (cycle 31) flags a real field whose Prisma type ' +
    "(Boolean) the renderer can't turn into text while clearing " +
    'renderable String/Int/enum-typed fields and skipping Facet entirely.',
)
