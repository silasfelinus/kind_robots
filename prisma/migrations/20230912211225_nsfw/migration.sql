/*
  Warnings:

  - You are about to drop the column `isNSFW` on the `ChatRoom` table. All the data in the column will be lost.
  - You are about to drop the column `isNSFW` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `isNSFW` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `isNSFW` on the `Resource` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ChatRoom` DROP COLUMN `isNSFW`,
    ADD COLUMN `isNsfw` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Gallery` DROP COLUMN `isNSFW`,
    ADD COLUMN `isNsfw` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Media` DROP COLUMN `isNSFW`,
    ADD COLUMN `isNsfw` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Resource` DROP COLUMN `isNSFW`,
    ADD COLUMN `isNsfw` BOOLEAN NOT NULL DEFAULT false;
