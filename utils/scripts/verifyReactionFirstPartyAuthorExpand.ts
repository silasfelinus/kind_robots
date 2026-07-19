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
// MariaDB rejects a CHECK constraint on a column that also carries a
// FOREIGN KEY (error 1901), in either statement order, so the "at most one
// first-party author" invariant is enforced with BEFORE INSERT/UPDATE
// triggers instead of a CHECK clause. See the migration's own comment for
// the reproduction.
assert.match(
  sql,
  /CREATE TRIGGER `Reaction_firstPartyAuthor_check_ins` BEFORE INSERT ON `Reaction`[\s\S]*?NEW\.`authorBotId` IS NOT NULL AND NEW\.`authorCharacterId` IS NOT NULL[\s\S]*?SIGNAL SQLSTATE '45000'/,
  'a Reaction must never claim both a Bot and Character display author on insert',
)
assert.match(
  sql,
  /CREATE TRIGGER `Reaction_firstPartyAuthor_check_upd` BEFORE UPDATE ON `Reaction`[\s\S]*?NEW\.`authorBotId` IS NOT NULL AND NEW\.`authorCharacterId` IS NOT NULL[\s\S]*?SIGNAL SQLSTATE '45000'/,
  'a Reaction must never claim both a Bot and Character display author on update',
)
assert.doesNotMatch(
  sql,
  /\bCHECK\s*\(/i,
  'CHECK constraints on FK columns fail on MariaDB (error 1901) — use triggers instead',
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
