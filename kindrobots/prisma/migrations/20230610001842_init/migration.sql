/*
  Warnings:

  - You are about to drop the column `userID` on the `Image` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Image` DROP COLUMN `userID`,
    ADD COLUMN `creatorID` INTEGER NULL,
    ADD COLUMN `description` VARCHAR(191) NULL,
    MODIFY `prompt` VARCHAR(191) NULL,
    MODIFY `negative` VARCHAR(191) NULL,
    MODIFY `seed` INTEGER NULL;
