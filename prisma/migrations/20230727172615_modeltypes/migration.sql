/*
  Warnings:

  - The values [REVIEW] on the enum `Reaction_modelType` will be removed. If these variants are still used in the database, this will fail.
  - The values [REVIEW] on the enum `Reaction_modelType` will be removed. If these variants are still used in the database, this will fail.
  - The values [REVIEW] on the enum `Reaction_modelType` will be removed. If these variants are still used in the database, this will fail.
  - The values [REVIEW] on the enum `Reaction_modelType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `Model` MODIFY `modelType` ENUM('BOT', 'GALLERY', 'MEDIA', 'MESSAGE', 'PROJECT', 'PROMPT', 'QUEST', 'REACTION', 'RESOURCE', 'USER', 'MODEL', 'DREAM', 'STATUS', 'ERROR', 'CONTENT', 'GAME') NOT NULL;

-- AlterTable
ALTER TABLE `Prompt` MODIFY `sender` ENUM('BOT', 'GALLERY', 'MEDIA', 'MESSAGE', 'PROJECT', 'PROMPT', 'QUEST', 'REACTION', 'RESOURCE', 'USER', 'MODEL', 'DREAM', 'STATUS', 'ERROR', 'CONTENT', 'GAME') NULL,
    MODIFY `recipient` ENUM('BOT', 'GALLERY', 'MEDIA', 'MESSAGE', 'PROJECT', 'PROMPT', 'QUEST', 'REACTION', 'RESOURCE', 'USER', 'MODEL', 'DREAM', 'STATUS', 'ERROR', 'CONTENT', 'GAME') NULL;

-- AlterTable
ALTER TABLE `Reaction` MODIFY `modelType` ENUM('BOT', 'GALLERY', 'MEDIA', 'MESSAGE', 'PROJECT', 'PROMPT', 'QUEST', 'REACTION', 'RESOURCE', 'USER', 'MODEL', 'DREAM', 'STATUS', 'ERROR', 'CONTENT', 'GAME') NOT NULL;
