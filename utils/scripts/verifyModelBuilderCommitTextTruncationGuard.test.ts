// /utils/scripts/verifyModelBuilderCommitTextTruncationGuard.test.ts
//
// Regression test for verifyModelBuilderCommitTextTruncationGuard.ts
// (model-builder/t-029, cycle 33). Exercises the real checks against
// synthetic schema/fields/commit-route fixtures covering: the pre-fix
// buggy maxLen precedence (isLongText gated ahead of SHORT_TEXT_MAX), the
// fixed precedence, a long-text-classified field with a bounded VarChar
// column and no SHORT_TEXT_MAX override (Bot's pre-fix
// description/botIntro/userIntro/prompt), the fixed shape with matching
// overrides, and a drifted override value that no longer matches the
// schema's declared width.
import assert from 'node:assert/strict'

import {
  extractLongTextFields,
  extractMaxLenExpression,
  extractProseFields,
  extractShortTextMax,
  extractVarCharWidths,
  findTruncationProblems,
  maxLenPrefersShortTextMax,
} from './verifyModelBuilderCommitTextTruncationGuard.js'

const SCHEMA_FIXTURE = `
model Bot {
  id          Int     @id @default(autoincrement())
  name        String  @db.VarChar(256)
  subtitle    String? @db.VarChar(764)
  description String? @db.VarChar(764)
  botIntro    String  @db.VarChar(3000)
  personality String? @db.Text
}

model Reward {
  id         Int     @id @default(autoincrement())
  name       String  @db.VarChar(256)
  flavorText String? @db.VarChar(512)
  effect     String? @db.Text
}
`

const FIELDS_FIXTURE_BOT_UNCLASSIFIED = `
export const MODEL_FIELDS: Record<string, ModelFieldSpec[]> = {
  Bot: [
    { key: 'name', label: 'Name', required: true },
    { key: 'subtitle', label: 'Subtitle' },
    { key: 'description', label: 'Description', prose: true },
    { key: 'botIntro', label: 'Bot intro', prose: true },
    { key: 'personality', label: 'Personality', prose: true },
  ],
  Reward: [
    { key: 'name', label: 'Name', required: true },
    { key: 'flavorText', label: 'Flavor text', prose: true },
    { key: 'effect', label: 'Effect', prose: true },
  ],
}
`

// --- extractProseFields / extractVarCharWidths -----------------------------

const proseFields = extractProseFields(FIELDS_FIXTURE_BOT_UNCLASSIFIED)
assert.deepEqual(
  proseFields.Bot,
  ['description', 'botIntro', 'personality'],
  `expected Bot's prose keys parsed in order, got: ${JSON.stringify(proseFields.Bot)}`,
)
assert.deepEqual(
  proseFields.Reward,
  ['flavorText', 'effect'],
  `expected Reward's prose keys parsed in order, got: ${JSON.stringify(proseFields.Reward)}`,
)

const botWidths = extractVarCharWidths(SCHEMA_FIXTURE, 'Bot')
assert.equal(botWidths.description, 764)
assert.equal(botWidths.botIntro, 3000)
assert.equal(
  botWidths.personality,
  undefined,
  'expected Bot.personality (a Text column) to have no bounded width',
)

assert.throws(
  () => extractVarCharWidths(SCHEMA_FIXTURE, 'Character'),
  /Could not find model Character/,
  'expected a missing model to throw a descriptive error',
)

// --- extractMaxLenExpression / maxLenPrefersShortTextMax --------------------

const BUGGY_MAXLEN_ROUTE = `
function pickText() {
  const isLongText = true
  const maxLen = isLongText
    ? LONG_TEXT_MAX
    : (SHORT_TEXT_MAX[type]?.[key] ?? DEFAULT_TEXT_MAX)
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed
}
`

const FIXED_MAXLEN_ROUTE = `
function pickText() {
  const isLongText = true
  const maxLen =
    SHORT_TEXT_MAX[type]?.[key] ?? (isLongText ? LONG_TEXT_MAX : DEFAULT_TEXT_MAX)
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed
}
`

const buggyExpr = extractMaxLenExpression(BUGGY_MAXLEN_ROUTE)
assert.ok(buggyExpr, 'expected the buggy maxLen expression to be found')
assert.equal(
  maxLenPrefersShortTextMax(buggyExpr!),
  false,
  'expected the pre-fix isLongText-first shape to fail the precedence check',
)

const fixedExpr = extractMaxLenExpression(FIXED_MAXLEN_ROUTE)
assert.ok(fixedExpr, 'expected the fixed maxLen expression to be found')
assert.equal(
  maxLenPrefersShortTextMax(fixedExpr!),
  true,
  'expected the fixed SHORT_TEXT_MAX-first shape to pass the precedence check',
)

assert.equal(
  extractMaxLenExpression('no maxLen assignment here'),
  null,
  'expected a missing maxLen assignment to return null rather than throw',
)

// --- extractShortTextMax / extractLongTextFields ----------------------------

const COMMIT_ROUTE_FIXTURE = `
const LONG_TEXT_MAX = 20000
const DEFAULT_TEXT_MAX = 256
const SHORT_TEXT_MAX: Partial<Record<SourceType, Record<string, number>>> = {
  Bot: { subtitle: 764 },
  Reward: { flavorText: 512 },
}
const LONG_TEXT_FIELDS: Partial<Record<SourceType, Set<string>>> = {
  Dream: new Set(['examples']),
}
`

const shortTextMax = extractShortTextMax(COMMIT_ROUTE_FIXTURE)
assert.deepEqual(shortTextMax, {
  Bot: { subtitle: 764 },
  Reward: { flavorText: 512 },
})

const longTextFields = extractLongTextFields(COMMIT_ROUTE_FIXTURE)
assert.deepEqual(longTextFields, { Dream: ['examples'] })

// --- findTruncationProblems --------------------------------------------------

// Pre-fix shape: Bot.description/botIntro are prose-classified real
// VarChar(764)/VarChar(3000) columns with no SHORT_TEXT_MAX entry at all;
// Reward.flavorText is prose-classified and real (VarChar(512)) but its
// override is present and correct.
const PARTIALLY_BUGGY_ROUTE = `
const SHORT_TEXT_MAX: Partial<Record<SourceType, Record<string, number>>> = {
  Reward: { flavorText: 512 },
}
const LONG_TEXT_FIELDS: Partial<Record<SourceType, Set<string>>> = {
}
`

const partiallyBuggyProblems = findTruncationProblems(
  SCHEMA_FIXTURE,
  FIELDS_FIXTURE_BOT_UNCLASSIFIED,
  PARTIALLY_BUGGY_ROUTE,
)
assert.equal(
  partiallyBuggyProblems.length,
  2,
  `expected Bot.description and Bot.botIntro to be flagged (missing override), ` +
    `got ${partiallyBuggyProblems.length}: ${JSON.stringify(partiallyBuggyProblems)}`,
)
assert.ok(
  partiallyBuggyProblems.some(
    (p) =>
      p.model === 'Bot' && p.field === 'description' && p.schemaWidth === 764,
  ),
)
assert.ok(
  partiallyBuggyProblems.some(
    (p) =>
      p.model === 'Bot' && p.field === 'botIntro' && p.schemaWidth === 3000,
  ),
)
assert.ok(
  !partiallyBuggyProblems.some((p) => p.field === 'personality'),
  'expected Bot.personality (a Text column, no bounded width) not to be flagged',
)
assert.ok(
  !partiallyBuggyProblems.some((p) => p.field === 'flavorText'),
  'expected Reward.flavorText (already correctly overridden) not to be flagged',
)

// Fixed shape: every long-text-classified bounded VarChar field has a
// matching override.
const FIXED_ROUTE = `
const SHORT_TEXT_MAX: Partial<Record<SourceType, Record<string, number>>> = {
  Bot: { description: 764, botIntro: 3000 },
  Reward: { flavorText: 512 },
}
const LONG_TEXT_FIELDS: Partial<Record<SourceType, Set<string>>> = {
}
`

const fixedProblems = findTruncationProblems(
  SCHEMA_FIXTURE,
  FIELDS_FIXTURE_BOT_UNCLASSIFIED,
  FIXED_ROUTE,
)
assert.equal(
  fixedProblems.length,
  0,
  `expected the fixed shape to raise no problems, got: ${JSON.stringify(fixedProblems)}`,
)

// A drifted override (schema width changed since the override was written)
// must still be flagged even though an entry exists.
const DRIFTED_ROUTE = `
const SHORT_TEXT_MAX: Partial<Record<SourceType, Record<string, number>>> = {
  Bot: { description: 256, botIntro: 3000 },
  Reward: { flavorText: 512 },
}
const LONG_TEXT_FIELDS: Partial<Record<SourceType, Set<string>>> = {
}
`

const driftedProblems = findTruncationProblems(
  SCHEMA_FIXTURE,
  FIELDS_FIXTURE_BOT_UNCLASSIFIED,
  DRIFTED_ROUTE,
)
assert.equal(
  driftedProblems.length,
  1,
  `expected the drifted description override to be flagged, got ${driftedProblems.length}: ` +
    JSON.stringify(driftedProblems),
)
assert.equal(driftedProblems[0]!.field, 'description')
assert.equal(driftedProblems[0]!.shortTextMaxValue, 256)
assert.equal(driftedProblems[0]!.schemaWidth, 764)

console.log(
  'Model Builder commit text-truncation guard checker verified: parses ' +
    "MODEL_FIELDS' prose keys and schema VarChar widths, flags the pre-fix " +
    'isLongText-first maxLen precedence and the fixed SHORT_TEXT_MAX-first ' +
    'shape correctly, flags a long-text-classified bounded column with a ' +
    'missing or drifted SHORT_TEXT_MAX override, and clears Text columns ' +
    'and already-correct overrides.',
)
