/*
  Warnings:

  - You are about to drop the column `botTypeEnum` on the `Bot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Bot` DROP COLUMN `botTypeEnum`,
    ADD COLUMN `BotType` ENUM('PROMPTBOT', 'CHATBOT', 'ARTBOT') NOT NULL DEFAULT 'PROMPTBOT';
