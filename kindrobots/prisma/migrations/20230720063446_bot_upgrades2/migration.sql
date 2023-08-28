/*
  Warnings:

  - You are about to drop the column `currentPrompt` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `defaultPrompt` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `dislikes` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `embeddingPath` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `likes` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the column `hashedPass` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[loginName]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hashedPassword` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Bot` DROP COLUMN `currentPrompt`,
    DROP COLUMN `defaultPrompt`,
    DROP COLUMN `dislikes`,
    DROP COLUMN `embeddingPath`,
    DROP COLUMN `likes`,
    ADD COLUMN `initialPrompt` VARCHAR(191) NULL DEFAULT 'Arm butterflies with mini-flamethrowers to kick mosquitos butts',
    ADD COLUMN `modules` VARCHAR(191) NULL,
    ADD COLUMN `personality` VARCHAR(191) NULL,
    ADD COLUMN `resourceId` INTEGER NULL,
    ALTER COLUMN `training` DROP DEFAULT;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `hashedPass`,
    ADD COLUMN `hashType` VARCHAR(191) NOT NULL DEFAULT 'sha-256',
    ADD COLUMN `hashedPassword` VARCHAR(191) NOT NULL,
    MODIFY `avatarImage` VARCHAR(191) NULL DEFAULT '/images/botcafe.png',
    MODIFY `bio` VARCHAR(191) NULL DEFAULT 'I was born and then things happened and now I''m here.',
    MODIFY `isPrivate` BOOLEAN NULL DEFAULT false,
    MODIFY `allowCookies` BOOLEAN NULL DEFAULT false,
    MODIFY `defaultTheme` VARCHAR(191) NULL DEFAULT 'default',
    MODIFY `designerName` VARCHAR(191) NULL DEFAULT 'Kind Designer',
    MODIFY `hideBio` BOOLEAN NULL DEFAULT false,
    MODIFY `likes` INTEGER NULL DEFAULT 0,
    MODIFY `preferredName` VARCHAR(191) NULL DEFAULT '',
    MODIFY `showNsfw` BOOLEAN NULL DEFAULT false,
    MODIFY `themeOverride` BOOLEAN NULL DEFAULT false,
    MODIFY `visits` INTEGER NULL DEFAULT 0,
    MODIFY `hideComments` BOOLEAN NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `User_loginName_key` ON `User`(`loginName`);

-- AddForeignKey
ALTER TABLE `Bot` ADD CONSTRAINT `Bot_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `Resource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
