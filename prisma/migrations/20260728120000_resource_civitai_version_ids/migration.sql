-- AlterTable
ALTER TABLE `Resource` ADD COLUMN IF NOT EXISTS `civitaiModelId` INTEGER NULL,
    ADD COLUMN IF NOT EXISTS `civitaiModelVersionId` INTEGER NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS `Resource_civitaiModelId_idx` ON `Resource`(`civitaiModelId`);

-- CreateIndex
CREATE INDEX IF NOT EXISTS `Resource_civitaiModelVersionId_idx` ON `Resource`(`civitaiModelVersionId`);
