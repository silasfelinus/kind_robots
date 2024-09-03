/*
  Warnings:

  - You are about to drop the column `pitchId` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `tagId` on the `Channel` table. All the data in the column will be lost.
  - You are about to alter the column `description` on the `Channel` table. The data in that column could be lost. The data in that column will be cast from `VarChar(8000)` to `VarChar(2000)`.

*/
-- DropForeignKey
ALTER TABLE `Product` DROP FOREIGN KEY `Product_userId_fkey`;

-- AlterTable
ALTER TABLE `Art` ALTER COLUMN `seed` DROP DEFAULT,
    ALTER COLUMN `steps` DROP DEFAULT,
    ALTER COLUMN `galleryId` DROP DEFAULT,
    ALTER COLUMN `channelId` DROP DEFAULT;

-- AlterTable
ALTER TABLE `Bot` ALTER COLUMN `userId` DROP DEFAULT;

-- AlterTable
ALTER TABLE `Channel` DROP COLUMN `pitchId`,
    DROP COLUMN `tagId`,
    ALTER COLUMN `userId` DROP DEFAULT,
    MODIFY `description` VARCHAR(2000) NULL;

-- AlterTable
ALTER TABLE `Message` ALTER COLUMN `botId` DROP DEFAULT,
    ALTER COLUMN `userId` DROP DEFAULT;

-- AlterTable
ALTER TABLE `Post` ALTER COLUMN `userId` DROP DEFAULT,
    ALTER COLUMN `botId` DROP DEFAULT,
    ALTER COLUMN `channelId` DROP DEFAULT;

-- AlterTable
ALTER TABLE `Product` MODIFY `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Prompt` ALTER COLUMN `userId` DROP DEFAULT,
    ALTER COLUMN `galleryId` DROP DEFAULT,
    ALTER COLUMN `pitchId` DROP DEFAULT;

-- AlterTable
ALTER TABLE `Tag` ALTER COLUMN `userId` DROP DEFAULT;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
