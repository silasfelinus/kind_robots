/*
  Warnings:

  - You are about to drop the column `playerId` on the `Pitch` table. All the data in the column will be lost.
  - You are about to drop the column `playerId` on the `Prompt` table. All the data in the column will be lost.
  - You are about to drop the `Cart` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CartItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Customer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Game` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Player` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Todo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ArtToGame` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ArtToPlayer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_GameToPrompt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_GameToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Cart` DROP FOREIGN KEY `Cart_customerId_fkey`;

-- DropForeignKey
ALTER TABLE `CartItem` DROP FOREIGN KEY `CartItem_cartId_fkey`;

-- DropForeignKey
ALTER TABLE `CartItem` DROP FOREIGN KEY `CartItem_productId_fkey`;

-- DropForeignKey
ALTER TABLE `Customer` DROP FOREIGN KEY `Customer_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Pitch` DROP FOREIGN KEY `Pitch_playerId_fkey`;

-- DropForeignKey
ALTER TABLE `Player` DROP FOREIGN KEY `Player_channelId_fkey`;

-- DropForeignKey
ALTER TABLE `Player` DROP FOREIGN KEY `Player_gameId_fkey`;

-- DropForeignKey
ALTER TABLE `Player` DROP FOREIGN KEY `Player_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Product` DROP FOREIGN KEY `Product_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Prompt` DROP FOREIGN KEY `Prompt_playerId_fkey`;

-- DropForeignKey
ALTER TABLE `Todo` DROP FOREIGN KEY `Todo_userId_fkey`;

-- DropForeignKey
ALTER TABLE `_ArtToGame` DROP FOREIGN KEY `_ArtToGame_A_fkey`;

-- DropForeignKey
ALTER TABLE `_ArtToGame` DROP FOREIGN KEY `_ArtToGame_B_fkey`;

-- DropForeignKey
ALTER TABLE `_ArtToPlayer` DROP FOREIGN KEY `_ArtToPlayer_A_fkey`;

-- DropForeignKey
ALTER TABLE `_ArtToPlayer` DROP FOREIGN KEY `_ArtToPlayer_B_fkey`;

-- DropForeignKey
ALTER TABLE `_GameToPrompt` DROP FOREIGN KEY `_GameToPrompt_A_fkey`;

-- DropForeignKey
ALTER TABLE `_GameToPrompt` DROP FOREIGN KEY `_GameToPrompt_B_fkey`;

-- DropForeignKey
ALTER TABLE `_GameToUser` DROP FOREIGN KEY `_GameToUser_A_fkey`;

-- DropForeignKey
ALTER TABLE `_GameToUser` DROP FOREIGN KEY `_GameToUser_B_fkey`;

-- AlterTable
ALTER TABLE `Pitch` DROP COLUMN `playerId`;

-- AlterTable
ALTER TABLE `Prompt` DROP COLUMN `playerId`;

-- DropTable
DROP TABLE `Cart`;

-- DropTable
DROP TABLE `CartItem`;

-- DropTable
DROP TABLE `Customer`;

-- DropTable
DROP TABLE `Game`;

-- DropTable
DROP TABLE `Player`;

-- DropTable
DROP TABLE `Product`;

-- DropTable
DROP TABLE `Todo`;

-- DropTable
DROP TABLE `_ArtToGame`;

-- DropTable
DROP TABLE `_ArtToPlayer`;

-- DropTable
DROP TABLE `_GameToPrompt`;

-- DropTable
DROP TABLE `_GameToUser`;
