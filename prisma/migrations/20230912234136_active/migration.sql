/*
  Warnings:

  - You are about to drop the column `inactive` on the `ChatRoom` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ChatRoom` DROP COLUMN `inactive`,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;
