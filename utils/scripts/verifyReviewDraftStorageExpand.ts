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

// No author-exclusivity CHECK: MariaDB rejects (error 1901,
// ER_CHECK_CONSTRAINT_FUNCTION_IS_NOT_ALLOWED) a CHECK constraint that
// references a column which also carries an ON DELETE SET NULL / ON UPDATE
// CASCADE foreign-key action, which both authorBotId and authorCharacterId
// get below. A prior version of this migration paired
// `ReviewDraft_single_author_chk` with those FKs and would have failed
// `prisma migrate deploy` with the same P3018 error as the Reaction
// migration in this same PR. Enforce "exactly one of Bot/Character author"
// in application code at the ReviewDraft write path instead.
assert.doesNotMatch(
  sql,
  /ReviewDraft_single_author_chk/,
  'author-exclusivity CHECK on authorBotId/authorCharacterId is invalid under MariaDB alongside their ON DELETE SET NULL foreign keys (error 1901)',
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
