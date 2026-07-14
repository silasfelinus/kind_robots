/*
  Warnings:

  - You are about to drop the column `scenarioId` on the `Dream` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Dream` DROP FOREIGN KEY `Dream_scenarioId_fkey`;

-- DropIndex
DROP INDEX `Dream_scenarioId_idx` ON `Dream`;

-- AlterTable
ALTER TABLE `Dream` DROP COLUMN `scenarioId`;

-- AlterTable
ALTER TABLE `Scenario` ADD COLUMN `cast` JSON NULL;

-- CreateTable
CREATE TABLE `_DreamToScenario` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_DreamToScenario_AB_unique`(`A`, `B`),
    INDEX `_DreamToScenario_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_DreamToScenario` ADD CONSTRAINT `_DreamToScenario_A_fkey` FOREIGN KEY (`A`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToScenario` ADD CONSTRAINT `_DreamToScenario_B_fkey` FOREIGN KEY (`B`) REFERENCES `Scenario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
