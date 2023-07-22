/*
  Warnings:

  - You are about to drop the column `designerId` on the `Bot` table. All the data in the column will be lost.
  - You are about to drop the `BotSimple` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Bot` DROP FOREIGN KEY `Bot_designerId_fkey`;

-- AlterTable
ALTER TABLE `Bot` DROP COLUMN `designerId`;

-- DropTable
DROP TABLE `BotSimple`;

-- CreateTable
CREATE TABLE `_BotToUser` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_BotToUser_AB_unique`(`A`, `B`),
    INDEX `_BotToUser_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_BotToUser` ADD CONSTRAINT `_BotToUser_A_fkey` FOREIGN KEY (`A`) REFERENCES `Bot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BotToUser` ADD CONSTRAINT `_BotToUser_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
