/*
  Warnings:

  - You are about to drop the column `trainingDataId` on the `TrainingLine` table. All the data in the column will be lost.
  - You are about to alter the column `role` on the `TrainingLine` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `VarChar(191)`.

*/
-- DropForeignKey
ALTER TABLE `TrainingLine` DROP FOREIGN KEY `TrainingLine_trainingDataId_fkey`;

-- AlterTable
ALTER TABLE `TrainingLine` DROP COLUMN `trainingDataId`,
    MODIFY `role` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `_TrainingDataToTrainingLine` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_TrainingDataToTrainingLine_AB_unique`(`A`, `B`),
    INDEX `_TrainingDataToTrainingLine_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_TrainingDataToTrainingLine` ADD CONSTRAINT `_TrainingDataToTrainingLine_A_fkey` FOREIGN KEY (`A`) REFERENCES `TrainingData`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_TrainingDataToTrainingLine` ADD CONSTRAINT `_TrainingDataToTrainingLine_B_fkey` FOREIGN KEY (`B`) REFERENCES `TrainingLine`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
