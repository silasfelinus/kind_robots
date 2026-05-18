/*
  Warnings:

  - You are about to alter the column `ReactionType` on the `Reaction` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `Enum(EnumId(2))`.

*/
-- AlterTable
ALTER TABLE `Reaction` MODIFY `ReactionType` ENUM('COMPONENT', 'ART', 'CHANNEL', 'USER', 'PITCH') NOT NULL DEFAULT 'CHANNEL';
