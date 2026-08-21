// /utils/scripts/verifyModelBuilderCommitNameWidthGuard.test.ts
//
// Regression test for the pure functions in
// verifyModelBuilderCommitNameWidthGuard.ts (model-builder/t-029, cycle 35).
// Exercises extraction/comparison logic against synthetic fixtures rather
// than the real repo files, so it stays fast and independent of future edits
// to the real schema/route/fields files (same convention as
// verifyModelBuilderCommitTextTruncationGuard.test.ts).
import assert from 'node:assert/strict'

import {
  extractCreateTargetModels,
  extractIdentifierWidth,
  extractNameMax,
  findNameWidthProblems,
  nameCapUsesNameMax,
} from './verifyModelBuilderCommitNameWidthGuard.js'

const FIELDS_FIXTURE = `
export const CREATE_TARGETS: Record<string, SourceTypeKey> = {
  'expand-characters': 'Character',
  'expand-signature-rewards': 'Reward',
  'expand-rewards': 'Reward',
  'expand-scenarios': 'Scenario',
  'expand-manager-bot': 'Bot',
  'expand-narrator-bot': 'Bot',
}
`

const SCHEMA_FIXTURE = `
model Bot {
  id                   Int                    @id @default(autoincrement())
  name                 String                 @db.VarChar(256)
}

model Character {
  id                   Int                    @id @default(autoincrement())
  name                 String                 @db.VarChar(256)
}

model Reward {
  id             Int           @id @default(autoincrement())
  name           String        @db.VarChar(256)
}

model Scenario {
  id                   Int                   @id @default(autoincrement())
  title                String
  description          String                @db.Text
}
`

const FIXED_COMMIT_FIXTURE = `
const NAME_MAX: Partial<Record<SourceType, number>> = {
  Character: 256,
  Reward: 256,
  Bot: 256,
  Scenario: 191,
}
    ).slice(0, NAME_MAX[fieldModelType] ?? 255)
`

const BUGGY_COMMIT_FIXTURE = `
const NAME_MAX: Partial<Record<SourceType, number>> = {
  Character: 256,
  Reward: 256,
  Bot: 256,
  Scenario: 191,
}
    ).slice(0, 255)
`

const MISSING_ENTRY_COMMIT_FIXTURE = `
const NAME_MAX: Partial<Record<SourceType, number>> = {
  Character: 256,
  Reward: 256,
  Bot: 256,
}
    ).slice(0, NAME_MAX[fieldModelType] ?? 255)
`

function run(): void {
  // --- extraction sanity ---
  const models = extractCreateTargetModels(FIELDS_FIXTURE)
  assert.deepEqual(
    [...models].sort(),
    ['Bot', 'Character', 'Reward', 'Scenario'],
    `expected exactly the four live CREATE targets, got: ${JSON.stringify(models)}`,
  )

  const nameMax = extractNameMax(FIXED_COMMIT_FIXTURE)
  assert.deepEqual(nameMax, {
    Character: 256,
    Reward: 256,
    Bot: 256,
    Scenario: 191,
  })

  assert.equal(extractIdentifierWidth(SCHEMA_FIXTURE, 'Character'), 256)
  assert.equal(extractIdentifierWidth(SCHEMA_FIXTURE, 'Bot'), 256)
  assert.equal(extractIdentifierWidth(SCHEMA_FIXTURE, 'Reward'), 256)
  // Scenario.title has no @db.VarChar override -> Prisma's implicit MySQL
  // default of 191.
  assert.equal(extractIdentifierWidth(SCHEMA_FIXTURE, 'Scenario'), 191)

  // --- cap-shape check ---
  assert.equal(nameCapUsesNameMax(FIXED_COMMIT_FIXTURE), true)
  assert.equal(
    nameCapUsesNameMax(BUGGY_COMMIT_FIXTURE),
    false,
    'a bare `.slice(0, 255)` with no NAME_MAX lookup should fail this check',
  )

  // --- combined check: fixed fixture passes ---
  const fixedProblems = findNameWidthProblems(
    SCHEMA_FIXTURE,
    FIELDS_FIXTURE,
    FIXED_COMMIT_FIXTURE,
  )
  assert.deepEqual(
    fixedProblems,
    [],
    `expected the fixed fixture to have no problems, got: ${JSON.stringify(fixedProblems)}`,
  )

  // --- combined check: pre-fix bug (flat 255 for Scenario) is caught ---
  // Reuses FIXED_COMMIT_FIXTURE's NAME_MAX (which is already correct) but
  // simulates the pre-fix world by checking a NAME_MAX that still claims 255
  // for Scenario, the exact real bug this guard exists to catch.
  const PRE_FIX_COMMIT_FIXTURE = FIXED_COMMIT_FIXTURE.replace(
    'Scenario: 191,',
    'Scenario: 255,',
  )
  const preFixProblems = findNameWidthProblems(
    SCHEMA_FIXTURE,
    FIELDS_FIXTURE,
    PRE_FIX_COMMIT_FIXTURE,
  )
  assert.equal(
    preFixProblems.length,
    1,
    `expected exactly one problem (Scenario), got: ${JSON.stringify(preFixProblems)}`,
  )
  assert.equal(preFixProblems[0]!.model, 'Scenario')
  assert.equal(preFixProblems[0]!.schemaWidth, 191)
  assert.equal(preFixProblems[0]!.nameMaxValue, 255)

  // --- combined check: a live target missing from NAME_MAX entirely ---
  const missingEntryProblems = findNameWidthProblems(
    SCHEMA_FIXTURE,
    FIELDS_FIXTURE,
    MISSING_ENTRY_COMMIT_FIXTURE,
  )
  assert.equal(
    missingEntryProblems.length,
    1,
    `expected exactly one problem (Scenario missing), got: ${JSON.stringify(missingEntryProblems)}`,
  )
  assert.equal(missingEntryProblems[0]!.model, 'Scenario')
  assert.equal(missingEntryProblems[0]!.nameMaxValue, undefined)

  console.log(
    'Model Builder commit name-width guard self-test passed: extraction, ' +
      'cap-shape, and combined-problem checks all behave as expected.',
  )
}

run()
