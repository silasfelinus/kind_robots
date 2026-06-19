-- AlterTable
ALTER TABLE `Code` ADD COLUMN `isMature` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `Code_isActive_idx` ON `Code`(`isActive`);

-- CreateIndex
CREATE INDEX `Code_isMature_idx` ON `Code`(`isMature`);
