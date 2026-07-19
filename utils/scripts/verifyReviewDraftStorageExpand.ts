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
  'CONSTRAINT `ReviewDraft_single_author_chk`',
  'CONSTRAINT `ReviewDraft_rating_range_chk`',
  'FOREIGN KEY (`componentId`) REFERENCES `Component`(`id`)',
  'FOREIGN KEY (`authorBotId`) REFERENCES `Bot`(`id`)',
  'FOREIGN KEY (`authorCharacterId`) REFERENCES `Character`(`id`)',
  'FOREIGN KEY (`publisherUserId`) REFERENCES `User`(`id`)',
  'FOREIGN KEY (`publishedReactionId`) REFERENCES `Reaction`(`id`)',
]) {
  assert.match(sql, new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
}

assert.match(
  sql,
  /CHECK \(\(`authorBotId` IS NULL\) <> \(`authorCharacterId` IS NULL\)\)/,
  'each draft must have exactly one Bot or Character author',
)
assert.match(sql, /CHECK \(`rating` >= 0 AND `rating` <= 5\)/)

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
