-- Rename the gamification Milestone system to Achievement.
-- The project-roadmap "milestone" concept lives in Conductor, not in this DB,
-- and is unaffected. This migration renames tables, foreign-key columns,
-- indexes, and constraints while preserving all existing rows.

-- 1. Drop foreign keys that reference the tables/columns being renamed.
ALTER TABLE `MilestoneRecord` DROP FOREIGN KEY `MilestoneRecord_milestoneId_fkey`;
ALTER TABLE `MilestoneRecord` DROP FOREIGN KEY `MilestoneRecord_userId_fkey`;
ALTER TABLE `Milestone` DROP FOREIGN KEY `Milestone_artImageId_fkey`;
ALTER TABLE `LifeEnding` DROP FOREIGN KEY `LifeEnding_milestoneId_fkey`;
ALTER TABLE `LifeAchievement` DROP FOREIGN KEY `LifeAchievement_milestoneId_fkey`;
ALTER TABLE `LifeAchievementUnlock` DROP FOREIGN KEY `LifeAchievementUnlock_milestoneRecordId_fkey`;

-- 2. Rename the tables.
RENAME TABLE `Milestone` TO `Achievement`;
RENAME TABLE `MilestoneRecord` TO `AchievementRecord`;

-- 3. Rename the foreign-key columns.
ALTER TABLE `AchievementRecord` CHANGE `milestoneId` `achievementId` INTEGER NOT NULL;
ALTER TABLE `LifeEnding` CHANGE `milestoneId` `achievementId` INTEGER NULL;
ALTER TABLE `LifeAchievement` CHANGE `milestoneId` `achievementId` INTEGER NULL;
ALTER TABLE `LifeAchievementUnlock` CHANGE `milestoneRecordId` `achievementRecordId` INTEGER NULL;

-- 4. Rename the indexes to match Prisma's naming conventions.
ALTER TABLE `Achievement` RENAME INDEX `Milestone_artImageId_fkey` TO `Achievement_artImageId_fkey`;
ALTER TABLE `AchievementRecord` RENAME INDEX `MilestoneRecord_milestoneId_fkey` TO `AchievementRecord_achievementId_fkey`;
ALTER TABLE `AchievementRecord` RENAME INDEX `MilestoneRecord_userId_fkey` TO `AchievementRecord_userId_fkey`;
ALTER TABLE `LifeEnding` RENAME INDEX `LifeEnding_milestoneId_idx` TO `LifeEnding_achievementId_idx`;
ALTER TABLE `LifeAchievement` RENAME INDEX `LifeAchievement_milestoneId_idx` TO `LifeAchievement_achievementId_idx`;
ALTER TABLE `LifeAchievementUnlock` RENAME INDEX `LifeAchievementUnlock_milestoneRecordId_idx` TO `LifeAchievementUnlock_achievementRecordId_idx`;

-- 5. Re-add the foreign keys with the new names, tables, and columns.
ALTER TABLE `Achievement` ADD CONSTRAINT `Achievement_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `AchievementRecord` ADD CONSTRAINT `AchievementRecord_achievementId_fkey` FOREIGN KEY (`achievementId`) REFERENCES `Achievement`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `AchievementRecord` ADD CONSTRAINT `AchievementRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `LifeEnding` ADD CONSTRAINT `LifeEnding_achievementId_fkey` FOREIGN KEY (`achievementId`) REFERENCES `Achievement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `LifeAchievement` ADD CONSTRAINT `LifeAchievement_achievementId_fkey` FOREIGN KEY (`achievementId`) REFERENCES `Achievement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `LifeAchievementUnlock` ADD CONSTRAINT `LifeAchievementUnlock_achievementRecordId_fkey` FOREIGN KEY (`achievementRecordId`) REFERENCES `AchievementRecord`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
