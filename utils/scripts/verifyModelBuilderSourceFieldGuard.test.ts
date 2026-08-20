// /utils/scripts/verifyModelBuilderSourceFieldGuard.test.ts
//
// Regression test for findSourceFieldProblems() and its helpers in
// verifyModelBuilderSourceFieldGuard.ts (model-builder/t-029, cycle 22).
// Exercises the real checks against synthetic schema/recipes/facet-summary
// fixtures covering: the pre-fix shape (Bot's wrong-case 'botType', Facet's
// dropped 'kind' column), the fixed shape, a titleField typo, and a
// hydrated-summary field that's legitimately absent from the raw Facet
// model but present on FacetSummary's own computed additions.
import assert from 'node:assert/strict'

import {
  extractFacetSummaryExtraFields,
  extractScalarFieldNames,
  extractSourceFieldEntries,
  findSourceFieldProblems,
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

console.log(
  'Model Builder source-field guard checker verified: finds Bot.BotType ' +
    'and Facet.imagePath as real scalar fields, excludes relation fields, ' +
    "parses FacetSummary's hydrated additions, flags the pre-fix " +
    'wrong-case/dropped-column shape, clears the fixed shape, and flags a ' +
    'titleField typo.',
)
