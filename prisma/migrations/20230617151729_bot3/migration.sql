-- AlterTable
ALTER TABLE `Bot` MODIFY `maxTokens` INTEGER NULL DEFAULT 500,
    MODIFY `model` VARCHAR(191) NULL DEFAULT 'gpt-3.5-turbo',
    MODIFY `post` VARCHAR(191) NULL DEFAULT 'https://api.openai.com/v1/completions',
    MODIFY `temperature` DOUBLE NULL DEFAULT 1.0,
    MODIFY `n` INTEGER NULL DEFAULT 1;
