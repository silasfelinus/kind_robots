/*
  Warnings:

  - You are about to drop the column `intro` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `training` on the `Bot` table. All the data in the column will be lost.
  - Added the required column `maxTokens` to the `Bot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `messages` to the `Bot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `model` to the `Bot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `post` to the `Bot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `temperature` to the `Bot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Bot` DROP COLUMN `intro`,
    DROP COLUMN `training`,
    ADD COLUMN `maxTokens` INTEGER NOT NULL,
    ADD COLUMN `messages` JSON NOT NULL,
    ADD COLUMN `model` VARCHAR(191) NOT NULL,
    ADD COLUMN `post` VARCHAR(191) NOT NULL,
    ADD COLUMN `temperature` DOUBLE NOT NULL,
    ALTER COLUMN `type` DROP DEFAULT,
    ALTER COLUMN `description` DROP DEFAULT,
    ALTER COLUMN `avatarImage` DROP DEFAULT;
