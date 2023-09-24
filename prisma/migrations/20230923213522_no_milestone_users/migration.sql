/*
  Warnings:

  - You are about to drop the column `milestoneIds` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `MilestoneRecord` DROP FOREIGN KEY `MilestoneRecord_userId_fkey`;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `milestoneIds`;
