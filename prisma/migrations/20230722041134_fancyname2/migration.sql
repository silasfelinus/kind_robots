/*
  Warnings:

  - The values [MODEL,PAYWALL,VIBE] on the enum `Reaction_modelType` will be removed. If these variants are still used in the database, this will fail.
  - The values [MODEL,PAYWALL,VIBE] on the enum `Reaction_modelType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Message` MODIFY `recipient` ENUM('BOT', 'GALLERY', 'IMAGE', 'MESSAGE', 'PROJECT', 'PROMPT', 'QUEST', 'REACTION', 'RESOURCE', 'REVIEW', 'USER') NOT NULL;

-- AlterTable
ALTER TABLE `Reaction` MODIFY `modelType` ENUM('BOT', 'GALLERY', 'IMAGE', 'MESSAGE', 'PROJECT', 'PROMPT', 'QUEST', 'REACTION', 'RESOURCE', 'REVIEW', 'USER') NOT NULL;
