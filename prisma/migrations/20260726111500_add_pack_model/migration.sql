-- AlterTable
ALTER TABLE `Grant` MODIFY `subjectType` ENUM('PROJECT', 'RESOURCE', 'PACK') NOT NULL;

-- CreateTable
CREATE TABLE `Pack` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `ownerId` INTEGER NOT NULL,

    UNIQUE INDEX `Pack_slug_key`(`slug`),
    INDEX `Pack_ownerId_idx`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Pack` ADD CONSTRAINT `Pack_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `Character` ADD COLUMN `packId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Dream` ADD COLUMN `packId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Facet` ADD COLUMN `packId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Reward` ADD COLUMN `packId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Character_packId_idx` ON `Character`(`packId`);

-- CreateIndex
CREATE INDEX `Dream_packId_idx` ON `Dream`(`packId`);

-- CreateIndex
CREATE INDEX `Facet_packId_idx` ON `Facet`(`packId`);

-- CreateIndex
CREATE INDEX `Reward_packId_idx` ON `Reward`(`packId`);

-- AddForeignKey
ALTER TABLE `Character` ADD CONSTRAINT `Character_packId_fkey` FOREIGN KEY (`packId`) REFERENCES `Pack`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_packId_fkey` FOREIGN KEY (`packId`) REFERENCES `Pack`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Facet` ADD CONSTRAINT `Facet_packId_fkey` FOREIGN KEY (`packId`) REFERENCES `Pack`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reward` ADD CONSTRAINT `Reward_packId_fkey` FOREIGN KEY (`packId`) REFERENCES `Pack`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
