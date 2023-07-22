/*
  Warnings:

  - You are about to drop the column `BotType` on the `Bot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Bot` DROP COLUMN `BotType`,
    ADD COLUMN `BotTypes` ENUM('CHATBOT', 'PROMPTMAKER', 'ARTMAKER', 'ARTREMIXER', 'ARTDESIGNER', 'STORYTELLER', 'QUESTMASTER', 'PROJECTMANAGER') NOT NULL DEFAULT 'CHATBOT';
