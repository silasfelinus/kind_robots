-- AlterTable
ALTER TABLE `ArtCollection` ADD COLUMN `artPrompt` TEXT NULL;

-- AlterTable
ALTER TABLE `ArtImage` ADD COLUMN `artPrompt` TEXT NULL;

-- AlterTable
ALTER TABLE `Bot` ADD COLUMN `artPrompt` TEXT NULL;

-- AlterTable
ALTER TABLE `Character` MODIFY `artPrompt` TEXT NULL;

-- AlterTable
ALTER TABLE `Dream` ADD COLUMN `artPrompt` TEXT NULL;

-- AlterTable
ALTER TABLE `Milestone` ADD COLUMN `artPrompt` TEXT NULL;

-- AlterTable
ALTER TABLE `Pitch` ADD COLUMN `artPrompt` TEXT NULL;

-- AlterTable
ALTER TABLE `Prompt` ADD COLUMN `artPrompt` TEXT NULL;

-- AlterTable
ALTER TABLE `Resource` ADD COLUMN `artPrompt` TEXT NULL;

-- AlterTable
ALTER TABLE `Reward` ADD COLUMN `artPrompt` TEXT NULL;

-- AlterTable
ALTER TABLE `Server` ADD COLUMN `artPrompt` TEXT NULL;

-- AlterTable
ALTER TABLE `Tag` ADD COLUMN `artPrompt` TEXT NULL;

-- AlterTable
ALTER TABLE `Theme` ADD COLUMN `artPrompt` TEXT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `artPrompt` TEXT NULL;
