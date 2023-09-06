/*
  Warnings:

  - You are about to drop the column `milestoneId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `userProfileId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `UserMilestones` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserProfile` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[username]` on the table `UserAuth` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `UserAuth` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `UserMilestones` DROP FOREIGN KEY `UserMilestones_userId_fkey`;

-- DropForeignKey
ALTER TABLE `UserProfile` DROP FOREIGN KEY `UserProfile_userId_fkey`;

-- DropIndex
DROP INDEX `User_email_key` ON `User`;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `milestoneId`,
    DROP COLUMN `userProfileId`,
    ADD COLUMN `address1` VARCHAR(191) NULL,
    ADD COLUMN `address2` VARCHAR(191) NULL,
    ADD COLUMN `avatarImage` VARCHAR(191) NULL DEFAULT '/images/botcafe.webp',
    ADD COLUMN `bio` VARCHAR(191) NULL DEFAULT 'I was born and then things happened and now I''m here.',
    ADD COLUMN `birthday` DATETIME(3) NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `discordUrl` VARCHAR(191) NULL,
    ADD COLUMN `facebookUrl` VARCHAR(191) NULL,
    ADD COLUMN `instagramUrl` VARCHAR(191) NULL,
    ADD COLUMN `kindrobotsUrl` VARCHAR(191) NULL,
    ADD COLUMN `languages` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `state` VARCHAR(191) NULL,
    ADD COLUMN `timezone` VARCHAR(191) NULL,
    ADD COLUMN `twitterUrl` VARCHAR(191) NULL,
    MODIFY `email` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `UserAuth` ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `username` VARCHAR(191) NOT NULL,
    MODIFY `password` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `UserMilestones`;

-- DropTable
DROP TABLE `UserProfile`;

-- CreateIndex
CREATE UNIQUE INDEX `UserAuth_username_key` ON `UserAuth`(`username`);
