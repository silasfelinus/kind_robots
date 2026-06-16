/*
  Warnings:

  - You are about to drop the column `pitchBlurb` on the `Composition` table. All the data in the column will be lost.
  - You are about to drop the column `pitchId` on the `Composition` table. All the data in the column will be lost.
  - You are about to drop the column `accessMode` on the `Dream` table. All the data in the column will be lost.
  - You are about to drop the column `artServerId` on the `Dream` table. All the data in the column will be lost.
  - You are about to drop the column `currentPrompt` on the `Dream` table. All the data in the column will be lost.
  - You are about to drop the column `currentVibe` on the `Dream` table. All the data in the column will be lost.
  - You are about to drop the column `pitchId` on the `Dream` table. All the data in the column will be lost.
  - You are about to drop the column `privacyCode` on the `Dream` table. All the data in the column will be lost.
  - You are about to drop the column `textServerId` on the `Dream` table. All the data in the column will be lost.
  - You are about to drop the column `pitchId` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `pitchId` on the `Reaction` table. All the data in the column will be lost.
  - The values [PITCH] on the enum `Reaction_reactionCategory` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Pitch` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Composition` DROP FOREIGN KEY `Composition_pitchId_fkey`;

-- DropForeignKey
ALTER TABLE `Dream` DROP FOREIGN KEY `Dream_pitchId_fkey`;

-- DropForeignKey
ALTER TABLE `Pitch` DROP FOREIGN KEY `Pitch_artImageId_fkey`;

-- DropForeignKey
ALTER TABLE `Pitch` DROP FOREIGN KEY `Pitch_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Prompt` DROP FOREIGN KEY `Prompt_pitchId_fkey`;

-- DropForeignKey
ALTER TABLE `Reaction` DROP FOREIGN KEY `Reaction_pitchId_fkey`;

-- DropIndex
DROP INDEX `Composition_pitchId_idx` ON `Composition`;

-- DropIndex
DROP INDEX `Dream_accessMode_idx` ON `Dream`;

-- DropIndex
DROP INDEX `Dream_pitchId_idx` ON `Dream`;

-- DropIndex
DROP INDEX `Prompt_pitchId_fkey` ON `Prompt`;

-- DropIndex
DROP INDEX `Reaction_pitchId_fkey` ON `Reaction`;

-- AlterTable
ALTER TABLE `ArtCollection` ADD COLUMN `imagePath` VARCHAR(764) NULL;

-- AlterTable
ALTER TABLE `Bot` ADD COLUMN `imagePath` VARCHAR(764) NULL;

-- AlterTable
ALTER TABLE `Composition` DROP COLUMN `pitchBlurb`,
    DROP COLUMN `pitchId`,
    ADD COLUMN `imagePath` VARCHAR(764) NULL;

-- AlterTable
ALTER TABLE `Dream` DROP COLUMN `accessMode`,
    DROP COLUMN `artServerId`,
    DROP COLUMN `currentPrompt`,
    DROP COLUMN `currentVibe`,
    DROP COLUMN `pitchId`,
    DROP COLUMN `privacyCode`,
    DROP COLUMN `textServerId`,
    ADD COLUMN `creationSource` ENUM('HUMAN', 'AI', 'HYBRID', 'UPLOAD', 'UNKNOWN') NOT NULL DEFAULT 'HUMAN',
    ADD COLUMN `designer` VARCHAR(256) NULL,
    ADD COLUMN `dreamType` ENUM('ARTDREAM', 'BRAINSTORM', 'WEIRDLANDIA', 'RANDOMLIST', 'TITLE', 'VIBE', 'BOT', 'INSPIRATION', 'CHARACTER', 'REWARD', 'SCENARIO', 'TEXT', 'LOCATION', 'PITCH', 'GENRE') NOT NULL DEFAULT 'ARTDREAM',
    ADD COLUMN `examples` LONGTEXT NULL,
    ADD COLUMN `flavorText` VARCHAR(512) NULL,
    ADD COLUMN `highlightImage` VARCHAR(256) NULL,
    ADD COLUMN `icon` VARCHAR(191) NULL,
    ADD COLUMN `imagePath` TEXT NULL,
    ADD COLUMN `pitch` TEXT NULL,
    MODIFY `artPrompt` VARCHAR(764) NULL;

-- AlterTable
ALTER TABLE `Milestone` ADD COLUMN `imagePath` VARCHAR(764) NULL;

-- AlterTable
ALTER TABLE `Prompt` DROP COLUMN `pitchId`,
    ADD COLUMN `imagePath` VARCHAR(764) NULL;

-- AlterTable
ALTER TABLE `Reaction` DROP COLUMN `pitchId`,
    MODIFY `reactionCategory` ENUM('ART_IMAGE', 'ART_COLLECTION', 'BOT', 'BUTTERFLY', 'CHARACTER', 'CHAT_EXCHANGE', 'COMPONENT', 'COMPOSITION', 'DREAM', 'MESSAGE', 'POST', 'PROMPT', 'RESOURCE', 'REWARD', 'SCENARIO', 'THEME') NOT NULL DEFAULT 'ART_IMAGE';

-- DropTable
DROP TABLE `Pitch`;

-- CreateTable
CREATE TABLE `_DreamToArtImage` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_DreamToArtImage_AB_unique`(`A`, `B`),
    INDEX `_DreamToArtImage_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_DreamToArtCollection` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_DreamToArtCollection_AB_unique`(`A`, `B`),
    INDEX `_DreamToArtCollection_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Dream_dreamType_idx` ON `Dream`(`dreamType`);

-- AddForeignKey
ALTER TABLE `_DreamToArtImage` ADD CONSTRAINT `_DreamToArtImage_A_fkey` FOREIGN KEY (`A`) REFERENCES `ArtImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToArtImage` ADD CONSTRAINT `_DreamToArtImage_B_fkey` FOREIGN KEY (`B`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToArtCollection` ADD CONSTRAINT `_DreamToArtCollection_A_fkey` FOREIGN KEY (`A`) REFERENCES `ArtCollection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToArtCollection` ADD CONSTRAINT `_DreamToArtCollection_B_fkey` FOREIGN KEY (`B`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
