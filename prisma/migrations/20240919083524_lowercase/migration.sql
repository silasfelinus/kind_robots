/*
  Warnings:

  - You are about to drop the column `ReactionCategory` on the `Reaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Reaction` DROP COLUMN `ReactionCategory`,
    ADD COLUMN `reactionCategory` ENUM('ART', 'PITCH', 'COMPONENT', 'CHANNEL', 'TITLE') NOT NULL DEFAULT 'CHANNEL';
