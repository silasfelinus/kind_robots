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

// An intentional expand-then-client rollout: the migration landed on the
// base branch first, and the repository-aware verifier has validated a newly
// added provenance marker that points to that existing migration. Must pass.
{
  const diff = [
    '--- a/prisma/schema.prisma',
    '+++ b/prisma/schema.prisma',
    '@@ -10,6 +10,7 @@ model Monster {',
    '   name  String',
    '+  depth Int?',
    ' }',
  ].join('\n')
  const result = checkSchemaMigrationParity({
    schemaDiffs: [diff],
    addedMigrationPaths: [],
    preexpandedMigrationPaths: [
      'prisma/migrations/20260826045500_extend_monster_bestiary_fields/migration.sql',
    ],
  })
  assert.equal(result.ok, true)
  assert.equal(result.structuralSchemaChange, true)
}

// An intentional contract-then-migration rollout: the client/schema removes
// a field first, while the destructive migration is deliberately deferred
// until the narrowed client is deployed. A validated pending marker covers
// this removal-only shape.
{
  const diff = [
    '--- a/prisma/schema.prisma',
    '+++ b/prisma/schema.prisma',
    '@@ -10,7 +10,6 @@ model Character {',
    '   slug  String?',
    '-  size  Int @default(1)',
    '   theme String?',
    ' }',
  ].join('\n')
  const result = checkSchemaMigrationParity({
    schemaDiffs: [diff],
    addedMigrationPaths: [],
    deferredMigrationPaths: [
      'prisma/migrations/20260827233000_drop_character_size/migration.sql',
    ],
  })
  assert.equal(result.ok, true)
  assert.equal(result.structuralSchemaChange, true)
}

// A pending marker must NEVER waive the original t-071 failure shape. Schema
// additions still require migration-first coverage.
{
  const diff = [
    '--- a/prisma/schema.prisma',
    '+++ b/prisma/schema.prisma',
    '@@ -10,6 +10,7 @@ model Character {',
    '   slug  String?',
    '+  size  Int @default(1)',
    '   theme String?',
    ' }',
  ].join('\n')
  const result = checkSchemaMigrationParity({
    schemaDiffs: [diff],
    addedMigrationPaths: [],
    deferredMigrationPaths: [
      'prisma/migrations/20260827233000_drop_character_size/migration.sql',
    ],
  })
  assert.equal(result.ok, false)
  assert.equal(result.structuralSchemaChange, true)
  assert.match(result.message ?? '', /contract-first schema contraction/)
}

// A rename or other mixed add/remove change is not a pure contraction either.
// The pending path is deliberately narrower than a generic migration waiver.
{
  const diff = [
    '--- a/prisma/schema.prisma',
    '+++ b/prisma/schema.prisma',
    '@@ -10,7 +10,7 @@ model Character {',
    '-  oldName String?',
    '+  newName String?',
    ' }',
  ].join('\n')
  const result = checkSchemaMigrationParity({
    schemaDiffs: [diff],
    addedMigrationPaths: [],
    deferredMigrationPaths: [
      'prisma/migrations/20260827233000_rename_character_field/migration.sql',
    ],
  })
  assert.equal(result.ok, false)
  assert.equal(result.structuralSchemaChange, true)
  assert.match(result.message ?? '', /zero structural additions/)
}

// The actual regression this check exists to catch: a structural change with
// no new migration file and no validated migration provenance.
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
  assert.match(result.message ?? '', /neither a migration file move nor/)
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
// structural change in ANY of them needs migration coverage, not just
// schema.prisma.
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

// A structural change that REMOVES a field, paired with a REMOVED migration
// file -- the shape of a clean `git revert` of a migration that was never
// applied to production. Must pass: this is exactly as sound as the forward
// case above, just in the opposite direction.
{
  const diff = [
    '--- a/prisma/schema.prisma',
    '+++ b/prisma/schema.prisma',
    '@@ -10,7 +10,6 @@ model Creature {',
    '   name  String',
    '-  tier  Rarity @default(COMMON)',
    ' }',
  ].join('\n')
  const result = checkSchemaMigrationParity({
    schemaDiffs: [diff],
    addedMigrationPaths: [],
    removedMigrationPaths: [
      'prisma/migrations/20260825120000_add_creature_model/migration.sql',
    ],
  })
  assert.equal(result.ok, true)
  assert.equal(result.structuralSchemaChange, true)
}

// Optional coverage arrays omitted entirely (existing callers/tests) must
// keep behaving exactly as before -- no migration movement, no free pass.
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
}

console.log('schemaMigrationParity: all assertions passed')
