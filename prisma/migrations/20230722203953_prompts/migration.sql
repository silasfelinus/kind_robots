/*
  Warnings:

  - You are about to drop the column `category` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `imageId` to the `ExifData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `StringType` to the `Prompt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `label` to the `Prompt` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Image` DROP FOREIGN KEY `Image_exifDataId_fkey`;

-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_userId_fkey`;

-- AlterTable
ALTER TABLE `ExifData` ADD COLUMN `imageId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Prompt` DROP COLUMN `category`,
    DROP COLUMN `title`,
    ADD COLUMN `StringType` ENUM('TAG', 'PROMPT', 'WILDCARD', 'RESPONSE', 'IMAGE_URL', 'URL', 'MASK_URL', 'CODE', 'ERROR') NOT NULL,
    ADD COLUMN `label` VARCHAR(191) NOT NULL,
    ADD COLUMN `recipient` ENUM('BOT', 'GALLERY', 'IMAGE', 'MESSAGE', 'PROJECT', 'PROMPT', 'QUEST', 'REACTION', 'RESOURCE', 'REVIEW', 'USER') NULL,
    ADD COLUMN `recipientId` INTEGER NULL,
    ADD COLUMN `sender` ENUM('BOT', 'GALLERY', 'IMAGE', 'MESSAGE', 'PROJECT', 'PROMPT', 'QUEST', 'REACTION', 'RESOURCE', 'REVIEW', 'USER') NULL,
    ADD COLUMN `senderId` INTEGER NULL;

-- DropTable
DROP TABLE `Message`;

-- AddForeignKey
ALTER TABLE `ExifData` ADD CONSTRAINT `ExifData_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `Image`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
