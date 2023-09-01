/*
  Warnings:

  - You are about to drop the column `recipient` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `recipientId` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `sender` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `Prompt` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Prompt` DROP COLUMN `recipient`,
    DROP COLUMN `recipientId`,
    DROP COLUMN `sender`,
    DROP COLUMN `senderId`;
