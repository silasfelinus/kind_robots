/*
  Warnings:

  - You are about to drop the `BotInput` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `BotInput`;

-- CreateTable
CREATE TABLE `BotSimple` (
    `name` VARCHAR(191) NOT NULL,
    `BotType` ENUM('CHATBOT', 'RAPBOT', 'CODEBOT', 'PRODUCTBOT', 'FORTUNEBOT', 'PROMPTMAKER', 'ARTBOT', 'ARTMIXER', 'ARTEDITOR', 'STORYTELLER', 'QUESTMASTER', 'GAMESMASTER', 'PROJECTMANAGER') NOT NULL,
    `personality` VARCHAR(191) NULL,
    `subtitle` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `avatarImage` VARCHAR(191) NOT NULL,
    `theme` VARCHAR(191) NOT NULL,
    `temperature` DOUBLE NULL,
    `botIntro` VARCHAR(191) NOT NULL,
    `userIntro` VARCHAR(191) NOT NULL,
    `startingPrompt` VARCHAR(191) NOT NULL,
    `modules` VARCHAR(191) NULL,
    `isUnderConstruction` BOOLEAN NULL,

    UNIQUE INDEX `BotSimple_name_key`(`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
