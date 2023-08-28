/*
  Warnings:

  - You are about to drop the column `botType` on the `Bot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Bot` DROP COLUMN `botType`,
    ADD COLUMN `botTypeEnum` ENUM('PROMPTBOT', 'CHATBOT', 'ARTBOT') NOT NULL DEFAULT 'PROMPTBOT';
