/*
  Warnings:

  - You are about to drop the `Dominion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_DominionToTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Dominion` DROP FOREIGN KEY `Dominion_artId_fkey`;

-- DropForeignKey
ALTER TABLE `Dominion` DROP FOREIGN KEY `Dominion_artImageId_fkey`;

-- DropForeignKey
ALTER TABLE `Dominion` DROP FOREIGN KEY `Dominion_userId_fkey`;

-- DropForeignKey
ALTER TABLE `_DominionToTag` DROP FOREIGN KEY `_DominionToTag_A_fkey`;

-- DropForeignKey
ALTER TABLE `_DominionToTag` DROP FOREIGN KEY `_DominionToTag_B_fkey`;

-- AlterTable
ALTER TABLE `Reaction` MODIFY `reactionCategory` ENUM('ART', 'ART_IMAGE', 'PITCH', 'COMPONENT', 'CHAT_EXCHANGE', 'DREAM', 'BOT', 'GALLERY', 'MESSAGE', 'POST', 'PROMPT', 'RESOURCE', 'REWARD', 'SCENARIO', 'TAG', 'THEME') NOT NULL DEFAULT 'ART';

-- DropTable
DROP TABLE `Dominion`;

-- DropTable
DROP TABLE `_DominionToTag`;
