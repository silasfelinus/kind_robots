/*
  Warnings:

  - You are about to drop the column `avatarMedia` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `promoMedias` on the `Gallery` table. All the data in the column will be lost.
  - The values [Media_URL,MASK_URL] on the enum `Prompt_StringType` will be removed. If these variants are still used in the database, this will fail.
  - The values [Media] on the enum `Reaction_modelType` will be removed. If these variants are still used in the database, this will fail.
  - The values [Media] on the enum `Reaction_modelType` will be removed. If these variants are still used in the database, this will fail.
  - The values [Media] on the enum `Reaction_modelType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `avatarMedia` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Bot` DROP COLUMN `avatarMedia`,
    ADD COLUMN `avatarImage` VARCHAR(191) NOT NULL DEFAULT '/images/wonderchest/wonderchest304_(23).webp';

-- AlterTable
ALTER TABLE `Gallery` DROP COLUMN `promoMedias`,
    ADD COLUMN `mediaId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Prompt` MODIFY `StringType` ENUM('TAG', 'PROMPT', 'WILDCARD', 'RESPONSE', 'MEDIA_URL', 'URL', 'CODE', 'ERROR') NOT NULL,
    MODIFY `recipient` ENUM('BOT', 'GALLERY', 'MEDIA', 'MESSAGE', 'PROJECT', 'PROMPT', 'QUEST', 'REACTION', 'RESOURCE', 'REVIEW', 'USER') NULL,
    MODIFY `sender` ENUM('BOT', 'GALLERY', 'MEDIA', 'MESSAGE', 'PROJECT', 'PROMPT', 'QUEST', 'REACTION', 'RESOURCE', 'REVIEW', 'USER') NULL;

-- AlterTable
ALTER TABLE `Reaction` MODIFY `modelType` ENUM('BOT', 'GALLERY', 'MEDIA', 'MESSAGE', 'PROJECT', 'PROMPT', 'QUEST', 'REACTION', 'RESOURCE', 'REVIEW', 'USER') NOT NULL;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `avatarMedia`,
    ADD COLUMN `avatarImage` VARCHAR(191) NOT NULL DEFAULT '/images/botcafe.png';
