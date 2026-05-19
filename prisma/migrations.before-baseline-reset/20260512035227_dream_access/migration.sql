-- AlterTable
ALTER TABLE `Dream` ADD COLUMN `accessMode` ENUM('OPEN', 'CODE', 'PRIVATE', 'SOLO') NOT NULL DEFAULT 'OPEN',
    ADD COLUMN `privacyCode` VARCHAR(255) NULL;

-- CreateIndex
CREATE INDEX `Dream_accessMode_idx` ON `Dream`(`accessMode`);
