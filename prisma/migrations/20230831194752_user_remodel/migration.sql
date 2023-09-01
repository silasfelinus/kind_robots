/*
  Warnings:

  - You are about to drop the column `address1` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `address2` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `allowCookies` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `avatarImage` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `birthday` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `defaultTheme` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `discordUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `facebookUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `fancyName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `hideBio` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `hideComments` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `hideSocialNetworks` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `instagramUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isPrivate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `kindrobotsUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `languages` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `likes` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `realName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `salt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `showNsfw` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `themeOverride` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `twitterUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `visits` on the `User` table. All the data in the column will be lost.
  - Added the required column `reward` to the `Todo` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Todo` ADD COLUMN `reward` VARCHAR(191) NOT NULL,
    ADD COLUMN `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `address1`,
    DROP COLUMN `address2`,
    DROP COLUMN `allowCookies`,
    DROP COLUMN `avatarImage`,
    DROP COLUMN `bio`,
    DROP COLUMN `birthday`,
    DROP COLUMN `city`,
    DROP COLUMN `country`,
    DROP COLUMN `defaultTheme`,
    DROP COLUMN `discordUrl`,
    DROP COLUMN `facebookUrl`,
    DROP COLUMN `fancyName`,
    DROP COLUMN `hideBio`,
    DROP COLUMN `hideComments`,
    DROP COLUMN `hideSocialNetworks`,
    DROP COLUMN `instagramUrl`,
    DROP COLUMN `isPrivate`,
    DROP COLUMN `kindrobotsUrl`,
    DROP COLUMN `languages`,
    DROP COLUMN `likes`,
    DROP COLUMN `password`,
    DROP COLUMN `phone`,
    DROP COLUMN `realName`,
    DROP COLUMN `salt`,
    DROP COLUMN `showNsfw`,
    DROP COLUMN `state`,
    DROP COLUMN `themeOverride`,
    DROP COLUMN `timezone`,
    DROP COLUMN `twitterUrl`,
    DROP COLUMN `visits`;

-- CreateTable
CREATE TABLE `UserAuth` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `salt` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `UserAuth_id_key`(`id`),
    UNIQUE INDEX `UserAuth_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `realName` VARCHAR(191) NULL,
    `fancyName` VARCHAR(191) NULL,
    `bio` VARCHAR(191) NULL DEFAULT 'I was born and then things happened and now I''m here.',
    `birthday` VARCHAR(191) NULL,
    `address1` VARCHAR(191) NULL,
    `address2` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `timezone` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `languages` VARCHAR(191) NULL,
    `avatarImage` VARCHAR(191) NOT NULL DEFAULT '/images/botcafe.webp',
    `instagramUrl` VARCHAR(191) NULL,
    `twitterUrl` VARCHAR(191) NULL,
    `facebookUrl` VARCHAR(191) NULL,
    `discordUrl` VARCHAR(191) NULL,
    `kindrobotsUrl` VARCHAR(191) NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `UserProfile_id_key`(`id`),
    UNIQUE INDEX `UserProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Todo` ADD CONSTRAINT `Todo_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserAuth` ADD CONSTRAINT `UserAuth_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserProfile` ADD CONSTRAINT `UserProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
