/*
  Warnings:

  - You are about to drop the `Server` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Art` DROP FOREIGN KEY `Art_serverId_fkey`;

-- DropForeignKey
ALTER TABLE `Bot` DROP FOREIGN KEY `Bot_serverId_fkey`;

-- DropForeignKey
ALTER TABLE `Chat` DROP FOREIGN KEY `Chat_serverId_fkey`;

-- DropForeignKey
ALTER TABLE `Server` DROP FOREIGN KEY `Server_userId_fkey`;

-- DropTable
DROP TABLE `Server`;
