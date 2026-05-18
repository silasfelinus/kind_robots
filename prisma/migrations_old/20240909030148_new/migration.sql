/*
  Warnings:

  - You are about to drop the column `ReactionType` on the `Reaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Reaction` DROP COLUMN `ReactionType`,
    ADD COLUMN `ReactionCategory` ENUM('COMPONENT', 'ART', 'CHANNEL', 'USER', 'PITCH') NOT NULL DEFAULT 'CHANNEL';
