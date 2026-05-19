/*
  Warnings:

  - You are about to drop the column `artCollectionId` on the `Butterfly` table. All the data in the column will be lost.
  - You are about to drop the column `artImageId` on the `Butterfly` table. All the data in the column will be lost.
  - You are about to drop the column `botId` on the `Butterfly` table. All the data in the column will be lost.
  - You are about to drop the column `characterId` on the `Butterfly` table. All the data in the column will be lost.
  - You are about to drop the column `pitchId` on the `Butterfly` table. All the data in the column will be lost.
  - You are about to drop the column `promptId` on the `Butterfly` table. All the data in the column will be lost.
  - You are about to drop the column `scenarioId` on the `Butterfly` table. All the data in the column will be lost.
  - You are about to drop the column `tagId` on the `Butterfly` table. All the data in the column will be lost.
  - You are about to drop the column `galleryId` on the `Dream` table. All the data in the column will be lost.
  - The values [ARTGALLERY] on the enum `Pitch_PitchType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `galleryId` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `galleryId` on the `Reaction` table. All the data in the column will be lost.
  - You are about to drop the column `tagId` on the `Reaction` table. All the data in the column will be lost.
  - You are about to alter the column `reactionCategory` on the `Reaction` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(5))` to `Enum(EnumId(12))`.
  - You are about to drop the `Gallery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ArtImageToTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ComponentToTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_DreamToTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_MilestoneToUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PitchToTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ReactionToTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_RewardToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Butterfly` DROP FOREIGN KEY `Butterfly_artCollectionId_fkey`;

-- DropForeignKey
ALTER TABLE `Butterfly` DROP FOREIGN KEY `Butterfly_artImageId_fkey`;

-- DropForeignKey
ALTER TABLE `Butterfly` DROP FOREIGN KEY `Butterfly_botId_fkey`;

-- DropForeignKey
ALTER TABLE `Butterfly` DROP FOREIGN KEY `Butterfly_pitchId_fkey`;

-- DropForeignKey
ALTER TABLE `Butterfly` DROP FOREIGN KEY `Butterfly_promptId_fkey`;

-- DropForeignKey
ALTER TABLE `Butterfly` DROP FOREIGN KEY `Butterfly_scenarioId_fkey`;

-- DropForeignKey
ALTER TABLE `Butterfly` DROP FOREIGN KEY `Butterfly_tagId_fkey`;

-- DropForeignKey
ALTER TABLE `Dream` DROP FOREIGN KEY `Dream_galleryId_fkey`;

-- DropForeignKey
ALTER TABLE `Gallery` DROP FOREIGN KEY `Gallery_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Prompt` DROP FOREIGN KEY `Prompt_galleryId_fkey`;

-- DropForeignKey
ALTER TABLE `Reaction` DROP FOREIGN KEY `Reaction_galleryId_fkey`;

-- DropForeignKey
ALTER TABLE `Reaction` DROP FOREIGN KEY `Reaction_tagId_fkey`;

-- DropForeignKey
ALTER TABLE `Tag` DROP FOREIGN KEY `Tag_artImageId_fkey`;

-- DropForeignKey
ALTER TABLE `Tag` DROP FOREIGN KEY `Tag_userId_fkey`;

-- DropForeignKey
ALTER TABLE `_ArtImageToTag` DROP FOREIGN KEY `_ArtImageToTag_A_fkey`;

-- DropForeignKey
ALTER TABLE `_ArtImageToTag` DROP FOREIGN KEY `_ArtImageToTag_B_fkey`;

-- DropForeignKey
ALTER TABLE `_ComponentToTag` DROP FOREIGN KEY `_ComponentToTag_A_fkey`;

-- DropForeignKey
ALTER TABLE `_ComponentToTag` DROP FOREIGN KEY `_ComponentToTag_B_fkey`;

-- DropForeignKey
ALTER TABLE `_DreamToTag` DROP FOREIGN KEY `_DreamToTag_A_fkey`;

-- DropForeignKey
ALTER TABLE `_DreamToTag` DROP FOREIGN KEY `_DreamToTag_B_fkey`;

-- DropForeignKey
ALTER TABLE `_PitchToTag` DROP FOREIGN KEY `_PitchToTag_A_fkey`;

-- DropForeignKey
ALTER TABLE `_PitchToTag` DROP FOREIGN KEY `_PitchToTag_B_fkey`;

-- DropIndex
DROP INDEX `Butterfly_artCollectionId_fkey` ON `Butterfly`;

-- DropIndex
DROP INDEX `Butterfly_artImageId_fkey` ON `Butterfly`;

-- DropIndex
DROP INDEX `Butterfly_botId_fkey` ON `Butterfly`;

-- DropIndex
DROP INDEX `Butterfly_characterId_fkey` ON `Butterfly`;

-- DropIndex
DROP INDEX `Butterfly_pitchId_fkey` ON `Butterfly`;

-- DropIndex
DROP INDEX `Butterfly_promptId_fkey` ON `Butterfly`;

-- DropIndex
DROP INDEX `Butterfly_scenarioId_fkey` ON `Butterfly`;

-- DropIndex
DROP INDEX `Butterfly_tagId_fkey` ON `Butterfly`;

-- DropIndex
DROP INDEX `Dream_galleryId_idx` ON `Dream`;

-- DropIndex
DROP INDEX `Prompt_galleryId_fkey` ON `Prompt`;

-- DropIndex
DROP INDEX `Reaction_galleryId_fkey` ON `Reaction`;

-- DropIndex
DROP INDEX `Reaction_tagId_fkey` ON `Reaction`;

-- AlterTable
ALTER TABLE `Butterfly` DROP COLUMN `artCollectionId`,
    DROP COLUMN `artImageId`,
    DROP COLUMN `botId`,
    DROP COLUMN `characterId`,
    DROP COLUMN `pitchId`,
    DROP COLUMN `promptId`,
    DROP COLUMN `scenarioId`,
    DROP COLUMN `tagId`;

-- AlterTable
ALTER TABLE `Dream` DROP COLUMN `galleryId`;

-- AlterTable
ALTER TABLE `Pitch` MODIFY `PitchType` ENUM('ARTPITCH', 'BRAINSTORM', 'WEIRDLANDIA', 'RANDOMLIST', 'TITLE', 'VIBE', 'BOT', 'INSPIRATION', 'DREAM') NOT NULL DEFAULT 'ARTPITCH';

-- AlterTable
ALTER TABLE `Prompt` DROP COLUMN `galleryId`;

-- AlterTable
ALTER TABLE `Reaction` DROP COLUMN `galleryId`,
    DROP COLUMN `tagId`,
    MODIFY `reactionCategory` ENUM('ART_IMAGE', 'ART_COLLECTION', 'BOT', 'BUTTERFLY', 'CHARACTER', 'CHAT_EXCHANGE', 'COMPONENT', 'DREAM', 'MESSAGE', 'PITCH', 'POST', 'PROMPT', 'RESOURCE', 'REWARD', 'SCENARIO', 'THEME') NOT NULL DEFAULT 'ART_IMAGE';

-- DropTable
DROP TABLE `Gallery`;

-- DropTable
DROP TABLE `Tag`;

-- DropTable
DROP TABLE `_ArtImageToTag`;

-- DropTable
DROP TABLE `_ComponentToTag`;

-- DropTable
DROP TABLE `_DreamToTag`;

-- DropTable
DROP TABLE `_MilestoneToUser`;

-- DropTable
DROP TABLE `_PitchToTag`;

-- DropTable
DROP TABLE `_ReactionToTag`;

-- DropTable
DROP TABLE `_RewardToUser`;
