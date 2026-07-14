/*
  Warnings:

  - You are about to drop the column `genderIdentity` on the `Character` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Character` DROP COLUMN `genderIdentity`,
    ADD COLUMN `gender` VARCHAR(256) NULL;
