/*
  Warnings:

  - You are about to drop the column `hashedPassword` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - Added the required column `hashedPass` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `User` DROP COLUMN `hashedPassword`,
    DROP COLUMN `name`,
    ADD COLUMN `hashedPass` VARCHAR(191) NOT NULL,
    ADD COLUMN `realName` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `userName` VARCHAR(191) NULL;
