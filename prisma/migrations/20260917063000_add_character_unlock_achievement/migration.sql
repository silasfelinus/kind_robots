-- storybook/t-038: give Character the same gating hook EndingDeck already has
-- (EndingDeck.unlockAchievementId, migration 20260912120000), so a Character
-- can be locked behind an Achievement the same way a genre deck can.
--
-- PURELY ADDITIVE. A nullable column with no default rewrites no existing
-- rows, and enforcement stays behind STORYBOOK_ENFORCE_DECK_GATES either way
-- (server/utils/storybookGating.ts) -- this migration only opens the column
-- up, it does not turn any gate on. No DROP, no MODIFY of an existing column,
-- no edit to a prior migration.
--
-- Hand-authored to match `prisma migrate diff`'s emission for this schema
-- (this sandbox has no MIGRATION_DATABASE_URL / local shadow database -- see
-- docs/runbooks/migration-credential-boundary.md); shaped identically to
-- EndingDeck.unlockAchievementId's own column + index + FK in
-- 20260912120000_add_ending_deck_and_story_run_columns/migration.sql.

-- AlterTable
ALTER TABLE `Character` ADD COLUMN `unlockAchievementId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Character_unlockAchievementId_idx` ON `Character`(`unlockAchievementId`);

-- AddForeignKey
ALTER TABLE `Character` ADD CONSTRAINT `Character_unlockAchievementId_fkey`
    FOREIGN KEY (`unlockAchievementId`) REFERENCES `Achievement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
