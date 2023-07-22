/*
  Warnings:

  - You are about to drop the column `intro` on the `Bot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Bot` DROP COLUMN `intro`,
    ADD COLUMN `userIntro` VARCHAR(191) NULL DEFAULT 'Let''s make a difference. Here''s my idea:',
    MODIFY `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `updatedAt` DATETIME(3) NULL,
    MODIFY `BotType` ENUM('CHATBOT', 'RAPBOT', 'PROMPTMAKER', 'ARTMAKER', 'ARTREMIXER', 'ARTDESIGNER', 'STORYTELLER', 'QUESTMASTER', 'PROJECTMANAGER') NOT NULL DEFAULT 'CHATBOT';

-- CreateTable
CREATE TABLE `BotInput` (
    `BotType` ENUM('CHATBOT', 'RAPBOT', 'PROMPTMAKER', 'ARTMAKER', 'ARTREMIXER', 'ARTDESIGNER', 'STORYTELLER', 'QUESTMASTER', 'PROJECTMANAGER') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `subtitle` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `avatarImage` VARCHAR(191) NOT NULL,
    `theme` VARCHAR(191) NOT NULL,
    `temperature` VARCHAR(191) NOT NULL,
    `botIntro` VARCHAR(191) NOT NULL,
    `userIntro` VARCHAR(191) NOT NULL,
    `startingPrompt` VARCHAR(191) NOT NULL,
    `modules` VARCHAR(191) NULL,

    UNIQUE INDEX `BotInput_name_key`(`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
