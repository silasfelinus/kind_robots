/*
  Warnings:

  - You are about to alter the column `birthday` on the `UserProfile` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `DateTime(3)`.

*/
-- DropIndex
DROP INDEX `UserProfile_id_key` ON `UserProfile`;

-- AlterTable
ALTER TABLE `UserProfile` MODIFY `birthday` DATETIME(3) NULL;
