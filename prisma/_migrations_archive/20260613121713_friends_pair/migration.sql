-- AlterTable
ALTER TABLE `UserRelation` ADD COLUMN `pairId` INTEGER NULL,
    MODIFY `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED') NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX `UserRelation_pairId_idx` ON `UserRelation`(`pairId`);
