// /utils/scripts/verifyReviewDraftStorageExpand.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const migrationPath =
  'prisma/migrations/20260719033500_review_draft_storage_expand/migration.sql'
const sql = await readFile(migrationPath, 'utf8')

for (const fragment of [
  'CREATE TABLE `ReviewDraft`',
  "ENUM('PROPOSED', 'APPROVED', 'REJECTED', 'PUBLISHED', 'FAILED', 'SUPERSEDED')",
  '`draftKey` VARCHAR(191) NOT NULL',
  '`componentId` INTEGER NOT NULL',
  '`authorBotId` INTEGER NULL',
  '`authorCharacterId` INTEGER NULL',
  '`publisherUserId` INTEGER NULL',
  '`publishedReactionId` INTEGER NULL',
  '`promptVersion` VARCHAR(64) NOT NULL',
  '`promptHash` VARCHAR(191) NOT NULL',
  '`promptPayload` JSON NULL',
  '`generatedComment` TEXT NOT NULL',
  '`editedComment` TEXT NULL',
  'UNIQUE INDEX `ReviewDraft_draftKey_key`',
  'CONSTRAINT `ReviewDraft_rating_range_chk`',
  'FOREIGN KEY (`componentId`) REFERENCES `Component`(`id`)',
  'FOREIGN KEY (`authorBotId`) REFERENCES `Bot`(`id`)',
  'FOREIGN KEY (`authorCharacterId`) REFERENCES `Character`(`id`)',
  'FOREIGN KEY (`publisherUserId`) REFERENCES `User`(`id`)',
  'FOREIGN KEY (`publishedReactionId`) REFERENCES `Reaction`(`id`)',
]) {
  assert.match(sql, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
}

// MariaDB rejects a CHECK constraint on a column that also carries a
// FOREIGN KEY (error 1901), in either statement order — authorBotId and
// authorCharacterId both get FOREIGN KEYs below, so the "exactly one
// first-party author" invariant is enforced with BEFORE INSERT/UPDATE
// triggers instead of a CHECK clause on those columns. `rating` carries no
// FOREIGN KEY, so its CHECK is unaffected and stays as-is.
assert.match(
  sql,
  /CREATE TRIGGER `ReviewDraft_single_author_chk_ins` BEFORE INSERT ON `ReviewDraft`[\s\S]*?\(NEW\.`authorBotId` IS NULL\) = \(NEW\.`authorCharacterId` IS NULL\)[\s\S]*?SIGNAL SQLSTATE '45000'/,
  'each draft must have exactly one Bot or Character author on insert',
)
assert.match(
  sql,
  /CREATE TRIGGER `ReviewDraft_single_author_chk_upd` BEFORE UPDATE ON `ReviewDraft`[\s\S]*?\(NEW\.`authorBotId` IS NULL\) = \(NEW\.`authorCharacterId` IS NULL\)[\s\S]*?SIGNAL SQLSTATE '45000'/,
  'each draft must have exactly one Bot or Character author on update',
)
assert.match(sql, /CHECK \(`rating` >= 0 AND `rating` <= 5\)/)
assert.doesNotMatch(
  sql,
  /CHECK\s*\(\(?`authorBotId`/i,
  'CHECK constraints on FK columns fail on MariaDB (error 1901) — use triggers instead',
)

for (const destructive of [
  /DROP\s+TABLE/i,
  /DROP\s+COLUMN/i,
  /DELETE\s+FROM/i,
  /UPDATE\s+`?(?:Reaction|Component|Bot|Character|User)`?/i,
  /ALTER\s+TABLE\s+`?(?:Reaction|Component|Bot|Character|User)`?\s+DROP/i,
]) {
  assert.doesNotMatch(sql, destructive)
}

assert.doesNotMatch(
  sql,
  /INSERT\s+INTO\s+`?Reaction`?/i,
  'draft migration must not publish live Reactions',
)

console.log('ReviewDraft expand migration contract passed.')
