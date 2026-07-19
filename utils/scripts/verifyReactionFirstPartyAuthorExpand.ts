// /utils/scripts/verifyReactionFirstPartyAuthorExpand.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const migrationPath =
  'prisma/migrations/20260719031500_reaction_first_party_author_expand/migration.sql'
const sql = await readFile(migrationPath, 'utf8')

assert.match(sql, /ALTER TABLE `Reaction`/)
assert.match(sql, /ADD COLUMN `authorBotId` INTEGER NULL/)
assert.match(sql, /ADD COLUMN `authorCharacterId` INTEGER NULL/)
assert.match(sql, /CREATE INDEX `Reaction_authorBotId_idx`/)
assert.match(sql, /CREATE INDEX `Reaction_authorCharacterId_idx`/)
assert.match(
  sql,
  /FOREIGN KEY \(`authorBotId`\) REFERENCES `Bot`\(`id`\)[\s\S]*?ON DELETE SET NULL ON UPDATE CASCADE/,
)
assert.match(
  sql,
  /FOREIGN KEY \(`authorCharacterId`\) REFERENCES `Character`\(`id`\)[\s\S]*?ON DELETE SET NULL ON UPDATE CASCADE/,
)

// No CHECK constraint: MariaDB rejects (error 1901,
// ER_CHECK_CONSTRAINT_FUNCTION_IS_NOT_ALLOWED) a CHECK that references a
// column which also carries an ON DELETE SET NULL / ON UPDATE CASCADE
// foreign-key action, which both author columns have above. A prior version
// of this migration paired a CHECK with those FKs in the same ALTER TABLE
// and failed `prisma migrate deploy` in production with P3018 on every
// subsequent deploy. Mutual exclusivity is enforced in application code
// instead — see the runtime contract below.
assert.doesNotMatch(
  sql,
  /CHECK\s*\(/i,
  'a CHECK constraint on authorBotId/authorCharacterId is invalid under MariaDB alongside their ON DELETE SET NULL foreign keys (error 1901)',
)

for (const destructiveStatement of [
  /DROP TABLE/i,
  /DROP COLUMN/i,
  /DELETE FROM/i,
  /TRUNCATE/i,
  /UPDATE `Reaction`/i,
]) {
  assert.doesNotMatch(sql, destructiveStatement)
}

assert.doesNotMatch(
  sql,
  /\bMODIFY\b|\bCHANGE\b/i,
  'the expand migration must not rewrite existing Reaction columns',
)

console.log('Reaction first-party author expand migration contract passed.')
