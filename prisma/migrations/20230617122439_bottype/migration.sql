/*
  Warnings:

  - You are about to drop the column `type` on the `Bot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Bot` DROP COLUMN `type`,
    ADD COLUMN `botType` VARCHAR(191) NOT NULL DEFAULT 'chatbot';
