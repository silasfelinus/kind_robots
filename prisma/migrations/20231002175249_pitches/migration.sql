/*
  Warnings:

  - You are about to drop the column `pitch` on the `Art` table. All the data in the column will be lost.
  - You are about to drop the `TrainingData` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TrainingLine` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_BotToTrainingData` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TrainingDataToTrainingLine` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `designer` to the `Pitch` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Media` DROP FOREIGN KEY `Media_botId_fkey`;

-- DropForeignKey
ALTER TABLE `_BotToTrainingData` DROP FOREIGN KEY `_BotToTrainingData_A_fkey`;

-- DropForeignKey
ALTER TABLE `_BotToTrainingData` DROP FOREIGN KEY `_BotToTrainingData_B_fkey`;

-- DropForeignKey
ALTER TABLE `_TrainingDataToTrainingLine` DROP FOREIGN KEY `_TrainingDataToTrainingLine_A_fkey`;

-- DropForeignKey
ALTER TABLE `_TrainingDataToTrainingLine` DROP FOREIGN KEY `_TrainingDataToTrainingLine_B_fkey`;

-- DropIndex
DROP INDEX `Channel_tagId_fkey` ON `Channel`;

-- AlterTable
ALTER TABLE `Art` DROP COLUMN `pitch`,
    ADD COLUMN `cfg` VARCHAR(191) NULL,
    ADD COLUMN `checkpoint` VARCHAR(191) NULL,
    ADD COLUMN `sampler` VARCHAR(191) NULL,
    ADD COLUMN `seed` INTEGER NULL,
    ADD COLUMN `steps` INTEGER NULL;

-- AlterTable
ALTER TABLE `Pitch` ADD COLUMN `designer` VARCHAR(191) NOT NULL,
    ADD COLUMN `flavorText` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `TrainingData`;

-- DropTable
DROP TABLE `TrainingLine`;

-- DropTable
DROP TABLE `_BotToTrainingData`;

-- DropTable
DROP TABLE `_TrainingDataToTrainingLine`;
