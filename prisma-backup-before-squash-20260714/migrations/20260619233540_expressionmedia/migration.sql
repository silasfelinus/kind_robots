/*
  Warnings:

  - You are about to drop the `EmotionImage` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Bot` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Character` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `EmotionImage` DROP FOREIGN KEY `EmotionImage_artImageId_fkey`;

-- DropForeignKey
ALTER TABLE `EmotionImage` DROP FOREIGN KEY `EmotionImage_botId_fkey`;

-- DropForeignKey
ALTER TABLE `EmotionImage` DROP FOREIGN KEY `EmotionImage_characterId_fkey`;

-- AlterTable
ALTER TABLE `Bot` ADD COLUMN `slug` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `Character` ADD COLUMN `slug` VARCHAR(255) NULL;

-- DropTable
DROP TABLE `EmotionImage`;

-- CreateTable
CREATE TABLE `ExpressionMedia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expression` ENUM('NEUTRAL', 'JOYFUL', 'SORROWFUL', 'AFRAID', 'DISGUSTED', 'ENRAGED', 'SURPRISED', 'ANXIOUS', 'PROUD', 'LOVING', 'LAUGHING', 'CRYING', 'SLEEPING', 'THINKING', 'SHRUGGING', 'WINKING', 'FACEPALMING', 'CHEERING', 'WHISPERING', 'SHOUTING', 'CUSTOM') NOT NULL DEFAULT 'NEUTRAL',
    `kind` ENUM('EMOTION', 'ACTION') NOT NULL DEFAULT 'EMOTION',
    `label` VARCHAR(256) NULL,
    `emoticon` VARCHAR(32) NULL,
    `expressionKey` VARCHAR(128) NOT NULL,
    `imagePath` VARCHAR(764) NULL,
    `videoPath` VARCHAR(764) NULL,
    `artImageId` INTEGER NULL,
    `botId` INTEGER NULL,
    `characterId` INTEGER NULL,
    `message` TEXT NULL,
    `additionalPhrases` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `designer` VARCHAR(256) NULL,
    `artPrompt` TEXT NULL,

    UNIQUE INDEX `ExpressionMedia_artImageId_key`(`artImageId`),
    INDEX `ExpressionMedia_artImageId_idx`(`artImageId`),
    INDEX `ExpressionMedia_botId_idx`(`botId`),
    INDEX `ExpressionMedia_characterId_idx`(`characterId`),
    INDEX `ExpressionMedia_kind_idx`(`kind`),
    INDEX `ExpressionMedia_expressionKey_idx`(`expressionKey`),
    INDEX `ExpressionMedia_botId_kind_idx`(`botId`, `kind`),
    INDEX `ExpressionMedia_characterId_kind_idx`(`characterId`, `kind`),
    INDEX `ExpressionMedia_botId_isActive_idx`(`botId`, `isActive`),
    INDEX `ExpressionMedia_characterId_isActive_idx`(`characterId`, `isActive`),
    UNIQUE INDEX `ExpressionMedia_botId_expressionKey_key`(`botId`, `expressionKey`),
    UNIQUE INDEX `ExpressionMedia_characterId_expressionKey_key`(`characterId`, `expressionKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Bot_slug_key` ON `Bot`(`slug`);

-- CreateIndex
CREATE UNIQUE INDEX `Character_slug_key` ON `Character`(`slug`);

-- AddForeignKey
ALTER TABLE `ExpressionMedia` ADD CONSTRAINT `ExpressionMedia_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpressionMedia` ADD CONSTRAINT `ExpressionMedia_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpressionMedia` ADD CONSTRAINT `ExpressionMedia_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
