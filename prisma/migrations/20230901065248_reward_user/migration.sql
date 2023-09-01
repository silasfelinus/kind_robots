/*
  Warnings:

  - You are about to drop the column `userId` on the `Reward` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[icon]` on the table `Reward` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[text]` on the table `Reward` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `Reward` DROP FOREIGN KEY `Reward_userId_fkey`;

-- AlterTable
ALTER TABLE `Reward` DROP COLUMN `userId`;

-- CreateTable
CREATE TABLE `_RewardToUser` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_RewardToUser_AB_unique`(`A`, `B`),
    INDEX `_RewardToUser_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Reward_icon_key` ON `Reward`(`icon`);

-- CreateIndex
CREATE UNIQUE INDEX `Reward_text_key` ON `Reward`(`text`);

-- AddForeignKey
ALTER TABLE `_RewardToUser` ADD CONSTRAINT `_RewardToUser_A_fkey` FOREIGN KEY (`A`) REFERENCES `Reward`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_RewardToUser` ADD CONSTRAINT `_RewardToUser_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
