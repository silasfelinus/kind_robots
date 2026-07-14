/*
  Warnings:

  - The values [TITLE] on the enum `Reaction_reactionCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Reaction` MODIFY `reactionCategory` ENUM('ART', 'ART_IMAGE', 'PITCH', 'COMPONENT', 'CHAT_EXCHANGE', 'DREAM', 'BOT', 'GALLERY', 'MESSAGE', 'POST', 'PROMPT', 'RESOURCE', 'REWARD', 'TAG') NOT NULL DEFAULT 'ART';
