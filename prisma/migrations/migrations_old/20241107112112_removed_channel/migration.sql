/*
  Warnings:

  - You are about to drop the column `channelId` on the `Art` table. All the data in the column will be lost.
  - You are about to drop the column `channelId` on the `ArtImage` table. All the data in the column will be lost.
  - You are about to drop the column `channelId` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `channelId` on the `Gallery` table. All the data in the column will be lost.
  - You are about to drop the column `channelId` on the `Pitch` table. All the data in the column will be lost.
  - You are about to drop the column `channelId` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the column `channelId` on the `Reaction` table. All the data in the column will be lost.
  - The values [CHANNEL] on the enum `Reaction_reactionCategory` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `channelId` on the `Tag` table. All the data in the column will be lost.
  - You are about to drop the `Channel` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[channel]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `Art` DROP FOREIGN KEY `Art_channelId_fkey`;

-- DropForeignKey
ALTER TABLE `ArtImage` DROP FOREIGN KEY `ArtImage_channelId_fkey`;

-- DropForeignKey
ALTER TABLE `Channel` DROP FOREIGN KEY `Channel_componentId_fkey`;

-- DropForeignKey
ALTER TABLE `Channel` DROP FOREIGN KEY `Channel_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Chat` DROP FOREIGN KEY `Chat_channelId_fkey`;

-- DropForeignKey
ALTER TABLE `Gallery` DROP FOREIGN KEY `Gallery_channelId_fkey`;

-- DropForeignKey
ALTER TABLE `Pitch` DROP FOREIGN KEY `Pitch_channelId_fkey`;

-- DropForeignKey
ALTER TABLE `Prompt` DROP FOREIGN KEY `Prompt_channelId_fkey`;

-- DropForeignKey
ALTER TABLE `Reaction` DROP FOREIGN KEY `Reaction_channelId_fkey`;

-- DropForeignKey
ALTER TABLE `Tag` DROP FOREIGN KEY `Tag_channelId_fkey`;

-- DropIndex
DROP INDEX `ArtImage_channelId_key` ON `ArtImage`;

-- DropIndex
DROP INDEX `Reaction_messageId_fkey` ON `Reaction`;

-- DropIndex
DROP INDEX `Reaction_postId_fkey` ON `Reaction`;

-- AlterTable
ALTER TABLE `Art` DROP COLUMN `channelId`;

-- AlterTable
ALTER TABLE `ArtImage` DROP COLUMN `channelId`;

-- AlterTable
ALTER TABLE `Chat` DROP COLUMN `channelId`,
    DROP COLUMN `label`,
    ADD COLUMN `channel` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `Gallery` DROP COLUMN `channelId`;

-- AlterTable
ALTER TABLE `Pitch` DROP COLUMN `channelId`;

-- AlterTable
ALTER TABLE `Prompt` DROP COLUMN `channelId`;

-- AlterTable
ALTER TABLE `Reaction` DROP COLUMN `channelId`,
    MODIFY `reactionCategory` ENUM('ART', 'ART_IMAGE', 'PITCH', 'COMPONENT', 'CHAT_EXCHANGE', 'BOT', 'GALLERY', 'MESSAGE', 'POST', 'PROMPT', 'RESOURCE', 'REWARD', 'TAG', 'TITLE') NOT NULL DEFAULT 'ART';

-- AlterTable
ALTER TABLE `Tag` DROP COLUMN `channelId`;

-- DropTable
DROP TABLE `Channel`;

-- CreateIndex
CREATE UNIQUE INDEX `Chat_channel_key` ON `Chat`(`channel`);
