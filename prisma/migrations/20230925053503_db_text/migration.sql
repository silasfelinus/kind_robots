-- DropIndex
DROP INDEX `Reward_text_key` ON `Reward`;

-- AlterTable
ALTER TABLE `Art` MODIFY `prompt` TEXT NULL;

-- AlterTable
ALTER TABLE `ArtReaction` MODIFY `comment` TEXT NULL;

-- AlterTable
ALTER TABLE `Channel` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `Gallery` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `Game` MODIFY `content` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `Message` MODIFY `content` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `Project` MODIFY `content` TEXT NOT NULL DEFAULT 'Here''s the idea...';

-- AlterTable
ALTER TABLE `Resource` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `Reward` ADD COLUMN `label` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `bio` TEXT NULL DEFAULT 'I was born and then things happened and now I''m here.';
