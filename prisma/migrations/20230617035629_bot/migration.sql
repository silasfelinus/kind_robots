/*
  Warnings:

  - You are about to drop the column `messages` on the `Bot` table. All the data in the column will be lost.
  - Added the required column `prompt` to the `Bot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Bot` DROP COLUMN `messages`,
    ADD COLUMN `image` VARCHAR(191) NULL,
    ADD COLUMN `mask` VARCHAR(191) NULL,
    ADD COLUMN `nVariations` INTEGER NULL,
    ADD COLUMN `prompt` VARCHAR(191) NOT NULL,
    ADD COLUMN `style` VARCHAR(191) NULL;
