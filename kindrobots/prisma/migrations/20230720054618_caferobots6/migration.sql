/*
  Warnings:

  - Added the required column `currentPrompt` to the `Bot` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Bot` DROP FOREIGN KEY `Bot_designerId_fkey`;

-- AlterTable
ALTER TABLE `Bot` ADD COLUMN `currentPrompt` VARCHAR(191) NOT NULL,
    MODIFY `training` VARCHAR(191) NULL DEFAULT '[{role=''SYSTEM'', content=''You are alive''}]',
    MODIFY `designerId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Bot` ADD CONSTRAINT `Bot_designerId_fkey` FOREIGN KEY (`designerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
