/*
  Warnings:

  - You are about to drop the column `gender` on the `Character` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Character` DROP COLUMN `gender`,
    ADD COLUMN `goalStat1Name` VARCHAR(191) NULL DEFAULT 'Principled|Chaotic',
    ADD COLUMN `goalStat1Value` INTEGER NULL DEFAULT 0,
    ADD COLUMN `goalStat2Name` VARCHAR(191) NULL DEFAULT 'Introvert|Extrovert',
    ADD COLUMN `goalStat2Value` INTEGER NULL DEFAULT 0,
    ADD COLUMN `goalStat3Name` VARCHAR(191) NULL DEFAULT 'Passive|Aggressive',
    ADD COLUMN `goalStat3Value` INTEGER NULL DEFAULT 0,
    ADD COLUMN `goalStat4Name` VARCHAR(191) NULL DEFAULT 'Optimist|Pessimist',
    ADD COLUMN `goalStat4Value` INTEGER NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `_CharacterToReward` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_CharacterToReward_AB_unique`(`A`, `B`),
    INDEX `_CharacterToReward_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_CharacterToReward` ADD CONSTRAINT `_CharacterToReward_A_fkey` FOREIGN KEY (`A`) REFERENCES `Character`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CharacterToReward` ADD CONSTRAINT `_CharacterToReward_B_fkey` FOREIGN KEY (`B`) REFERENCES `Reward`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
