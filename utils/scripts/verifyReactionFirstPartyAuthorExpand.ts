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
assert.match(
  sql,
  /CHECK \(`authorBotId` IS NULL OR `authorCharacterId` IS NULL\)/,
  'a Reaction must never claim both a Bot and Character display author',
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
