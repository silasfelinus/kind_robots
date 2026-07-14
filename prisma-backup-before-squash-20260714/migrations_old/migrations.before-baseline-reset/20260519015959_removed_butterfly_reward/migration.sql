/*
  Warnings:

  - You are about to drop the column `rewardId` on the `Butterfly` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Butterfly` DROP FOREIGN KEY `Butterfly_rewardId_fkey`;

-- DropIndex
DROP INDEX `Butterfly_rewardId_fkey` ON `Butterfly`;

-- AlterTable
ALTER TABLE `Butterfly` DROP COLUMN `rewardId`;
