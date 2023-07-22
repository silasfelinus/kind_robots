/*
  Warnings:

  - You are about to drop the column `humanName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `signature` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `User_signature_key` ON `User`;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `humanName`,
    DROP COLUMN `signature`,
    ADD COLUMN `realName` VARCHAR(191) NULL;
