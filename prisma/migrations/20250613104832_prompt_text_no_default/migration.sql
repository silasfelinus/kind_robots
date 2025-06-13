-- AlterTable
ALTER TABLE `Art` ALTER COLUMN `promptString` DROP DEFAULT;

-- AlterTable
ALTER TABLE `Prompt` MODIFY `prompt` TEXT NOT NULL;
