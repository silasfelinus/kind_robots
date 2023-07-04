/*
  Warnings:

  - Made the column `nVariations` on table `Bot` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Bot` MODIFY `type` VARCHAR(191) NOT NULL DEFAULT 'chatbot',
    MODIFY `description` VARCHAR(191) NOT NULL DEFAULT 'KindRobot',
    MODIFY `avatarImage` VARCHAR(191) NULL,
    MODIFY `maxTokens` INTEGER NOT NULL DEFAULT 200,
    MODIFY `model` VARCHAR(191) NOT NULL DEFAULT 'gpt-3.5-turbo',
    MODIFY `post` VARCHAR(191) NOT NULL DEFAULT 'https://api.openai.com/v1/completions',
    MODIFY `temperature` DOUBLE NOT NULL DEFAULT 0.5,
    MODIFY `nVariations` INTEGER NOT NULL DEFAULT 1,
    MODIFY `prompt` VARCHAR(191) NOT NULL DEFAULT 'Say hello';
