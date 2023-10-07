/*
  Warnings:

  - A unique constraint covering the columns `[prompt]` on the table `ArtPrompt` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `ArtPrompt` MODIFY `prompt` VARCHAR(2000) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ArtPrompt_prompt_key` ON `ArtPrompt`(`prompt`);
