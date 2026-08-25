// /utils/scripts/schemaMigrationParity.test.ts
//
// Self-test for schemaMigrationParity.ts's pure decision logic. Run:
//   npx tsx utils/scripts/schemaMigrationParity.test.ts
import assert from 'node:assert/strict'

import { checkSchemaMigrationParity } from './schemaMigrationParity.js'

// No schema.prisma change at all -- the common case, must always pass with
// no opinion on migrations either way.
{
  const result = checkSchemaMigrationParity({
    schemaDiffs: [],
    addedMigrationPaths: [],
  })
  assert.equal(result.ok, true)
  assert.equal(result.structuralSchemaChange, false)
}

// A structural change (a real added field) with a matching new migration --
// exactly what kind-robots/t-035 did. Must pass.
{
  const diff = [
    '--- a/prisma/schema.prisma',
    '+++ b/prisma/schema.prisma',
    '@@ -10,6 +10,7 @@ model Creature {',
    '   name  String',
    '+  tier  Rarity @default(COMMON)',
    ' }',
  ].join('\n')
  const result = checkSchemaMigrationParity({
    schemaDiffs: [diff],
    addedMigrationPaths: [
      'prisma/migrations/20260825120000_add_creature_model/migration.sql',
    ],
  })
  assert.equal(result.ok, true)
  assert.equal(result.structuralSchemaChange, true)
}

// The actual regression this check exists to catch: a structural change with
// no new migration file anywhere in the diff.
{
  const diff = [
    '--- a/prisma/schema.prisma',
    '+++ b/prisma/schema.prisma',
    '@@ -10,6 +10,7 @@ model Character {',
    '   name  String',
    '+  size  Int @default(1)',
    ' }',
  ].join('\n')
  const result = checkSchemaMigrationParity({
    schemaDiffs: [diff],
    addedMigrationPaths: [],
  })
  assert.equal(result.ok, false)
  assert.equal(result.structuralSchemaChange, true)
  assert.match(
    result.message ?? '',
    /no new file was added under prisma\/migrations/,
  )
}

// Comment-only / doc-comment-only / reordering edits need no migration, even
// with zero added migration files -- this is the false-positive this check
// must not produce, or it trains people to ignore it.
{
  const diff = [
    '--- a/prisma/schema.prisma',
    '+++ b/prisma/schema.prisma',
    '@@ -10,7 +10,8 @@ model Creature {',
    '   name  String',
    '-  /// old wording',
    '+  /// new, better wording explaining this field',
    '+  ///',
    '   size  Int @default(1)',
    ' }',
  ].join('\n')
  const result = checkSchemaMigrationParity({
    schemaDiffs: [diff],
    addedMigrationPaths: [],
  })
  assert.equal(result.ok, true)
  assert.equal(result.structuralSchemaChange, false)
}

// A blank-line-only reflow (no doc comment, no field) is exempt too.
{
  const diff = [
    '--- a/prisma/schema.prisma',
    '+++ b/prisma/schema.prisma',
    '@@ -10,6 +10,7 @@ model Creature {',
    '   name  String',
    '+',
    '   size  Int @default(1)',
    ' }',
  ].join('\n')
  const result = checkSchemaMigrationParity({
    schemaDiffs: [diff],
    addedMigrationPaths: [],
  })
  assert.equal(result.ok, true)
  assert.equal(result.structuralSchemaChange, false)
}

// Multiple schema files (this repo's multi-file prisma/ schema) -- a
// structural change in ANY of them needs a migration, not just schema.prisma.
{
  const cosmeticSchema = [
    '--- a/prisma/schema.prisma',
    '+++ b/prisma/schema.prisma',
    '@@ -1,1 +1,1 @@',
    '-// old header',
    '+// new header',
  ].join('\n')
  const structuralBrainstorm = [
    '--- a/prisma/brainstorm.prisma',
    '+++ b/prisma/brainstorm.prisma',
    '@@ -5,6 +5,7 @@ model BrainstormSession {',
    '   name String',
    '+  newField String?',
    ' }',
  ].join('\n')
  const result = checkSchemaMigrationParity({
    schemaDiffs: [cosmeticSchema, structuralBrainstorm],
    addedMigrationPaths: [],
  })
  assert.equal(result.ok, false)
  assert.equal(result.structuralSchemaChange, true)
}

console.log('schemaMigrationParity: all assertions passed')
