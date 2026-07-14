/*
  Warnings:

  - You are about to drop the column `emotion` on the `EmotionImage` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[botId,expression]` on the table `EmotionImage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[characterId,expression]` on the table `EmotionImage` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `EmotionImage` DROP FOREIGN KEY `EmotionImage_botId_fkey`;

-- DropForeignKey
ALTER TABLE `EmotionImage` DROP FOREIGN KEY `EmotionImage_characterId_fkey`;

-- DropIndex
DROP INDEX `EmotionImage_botId_emotion_key` ON `EmotionImage`;

-- DropIndex
DROP INDEX `EmotionImage_characterId_emotion_key` ON `EmotionImage`;

-- AlterTable
ALTER TABLE `EmotionImage` DROP COLUMN `emotion`,
    ADD COLUMN `expression` ENUM('NEUTRAL', 'JOYFUL', 'SORROWFUL', 'AFRAID', 'DISGUSTED', 'ENRAGED', 'SURPRISED', 'ANXIOUS', 'PROUD', 'LOVING', 'LAUGHING', 'CRYING', 'SLEEPING', 'THINKING', 'SHRUGGING', 'WINKING', 'FACEPALMING', 'CHEERING', 'WHISPERING', 'SHOUTING') NOT NULL DEFAULT 'NEUTRAL',
    ADD COLUMN `kind` ENUM('EMOTION', 'ACTION') NOT NULL DEFAULT 'EMOTION';

-- CreateIndex
CREATE INDEX `EmotionImage_kind_idx` ON `EmotionImage`(`kind`);

-- CreateIndex
CREATE UNIQUE INDEX `EmotionImage_botId_expression_key` ON `EmotionImage`(`botId`, `expression`);

-- CreateIndex
CREATE UNIQUE INDEX `EmotionImage_characterId_expression_key` ON `EmotionImage`(`characterId`, `expression`);

-- AddForeignKey
ALTER TABLE `EmotionImage` ADD CONSTRAINT `EmotionImage_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

