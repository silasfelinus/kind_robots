/*
  Warnings:

  - You are about to drop the column `channelId` on the `Art` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Art` DROP FOREIGN KEY `Art_channelId_fkey`;

-- AlterTable
ALTER TABLE `Art` DROP COLUMN `channelId`;
