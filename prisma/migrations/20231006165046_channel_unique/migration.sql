/*
  Warnings:

  - A unique constraint covering the columns `[label]` on the table `Channel` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Channel` ALTER COLUMN `label` DROP DEFAULT,
    MODIFY `description` VARCHAR(2000) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Channel_label_key` ON `Channel`(`label`);
