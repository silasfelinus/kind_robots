/*
  Warnings:

  - You are about to drop the column `embedding` on the `Bot` table. All the data in the column will be lost.
  - You are about to alter the column `BotType` on the `Bot` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.
  - A unique constraint covering the columns `[name]` on the table `Bot` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Bot` DROP COLUMN `embedding`,
    ADD COLUMN `embeddingPath` VARCHAR(191) NULL,
    ALTER COLUMN `name` DROP DEFAULT,
    MODIFY `description` VARCHAR(191) NULL,
    MODIFY `avatarImage` VARCHAR(191) NULL DEFAULT '/images/wonderchest/wonderchest304_(23).webp',
    MODIFY `maxTokens` INTEGER NULL DEFAULT 500,
    MODIFY `model` VARCHAR(191) NULL DEFAULT 'gpt-3.5-turbo',
    MODIFY `post` VARCHAR(191) NULL DEFAULT 'https://api.openai.com/v1/completions',
    MODIFY `temperature` DOUBLE NULL DEFAULT 1.0,
    MODIFY `BotType` ENUM('chatbot', 'imagebot', 'variantbot', 'editbot', 'wildcard') NOT NULL DEFAULT 'chatbot',
    MODIFY `n` INTEGER NULL DEFAULT 1,
    MODIFY `intro` VARCHAR(191) NULL DEFAULT 'Let''s make a difference. Here''s my idea:',
    MODIFY `theme` VARCHAR(191) NULL DEFAULT 'default',
    MODIFY `defaultPrompt` VARCHAR(191) NULL DEFAULT 'Arm butterflies with mini-flamethrowers to kick mosquitos butts',
    MODIFY `dislikes` INTEGER NULL DEFAULT 0,
    MODIFY `isPublic` BOOLEAN NULL DEFAULT true,
    MODIFY `isUnderConstruction` BOOLEAN NULL DEFAULT false,
    MODIFY `likes` INTEGER NULL DEFAULT 0,
    MODIFY `currentPrompt` VARCHAR(191) NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX `Bot_name_key` ON `Bot`(`name`);
