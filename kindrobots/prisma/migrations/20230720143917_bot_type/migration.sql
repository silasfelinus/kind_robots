/*
  Warnings:

  - You are about to alter the column `BotType` on the `Bot` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(5))` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `Bot` ADD COLUMN `botIntro` VARCHAR(191) NULL DEFAULT 'You are a Kind Robot',
    MODIFY `BotType` ENUM('CHATBOT', 'PROMPTMAKER', 'ARTMAKER', 'ARTREMIXER', 'ARTDESIGNER', 'STORYTELLER', 'QUESTMASTER', 'PROJECTMANAGER') NOT NULL DEFAULT 'CHATBOT';
