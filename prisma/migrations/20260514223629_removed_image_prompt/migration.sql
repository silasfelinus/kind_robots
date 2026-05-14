/*
  Warnings:

  - You are about to drop the column `imagePrompt` on the `Pitch` table. All the data in the column will be lost.
  - You are about to drop the column `imagePrompt` on the `Reward` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Pitch` DROP COLUMN `imagePrompt`;

-- AlterTable
ALTER TABLE `Reward` DROP COLUMN `imagePrompt`;
