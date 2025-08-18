-- CreateTable
CREATE TABLE `Dominion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `title` VARCHAR(256) NOT NULL,
    `slug` VARCHAR(256) NULL,
    `description` TEXT NULL,
    `italics` VARCHAR(764) NULL,
    `color` VARCHAR(64) NULL,
    `designer` VARCHAR(256) NULL,
    `userId` INTEGER NULL DEFAULT 10,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `artId` INTEGER NULL,
    `artImageId` INTEGER NULL,
    `types` JSON NOT NULL,
    `keywords` JSON NOT NULL,
    `cardAdd` INTEGER NOT NULL DEFAULT 0,
    `actionAdd` INTEGER NOT NULL DEFAULT 0,
    `buyAdd` INTEGER NOT NULL DEFAULT 0,
    `coinAdd` INTEGER NOT NULL DEFAULT 0,
    `victoryAdd` INTEGER NOT NULL DEFAULT 0,
    `isDuration` BOOLEAN NOT NULL DEFAULT false,
    `durationJSON` JSON NULL,
    `priceCoins` INTEGER NOT NULL DEFAULT 0,
    `priceDebt` INTEGER NOT NULL DEFAULT 0,
    `pricePotion` INTEGER NOT NULL DEFAULT 0,
    `effects` JSON NOT NULL,
    `setupText` VARCHAR(764) NULL,
    `notes` VARCHAR(764) NULL,
    `setId` VARCHAR(191) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `Dominion_slug_key`(`slug`),
    INDEX `DominionCard_userId_idx`(`userId`),
    INDEX `DominionCard_setId_idx`(`setId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_DominionToTag` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_DominionToTag_AB_unique`(`A`, `B`),
    INDEX `_DominionToTag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Dominion` ADD CONSTRAINT `Dominion_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dominion` ADD CONSTRAINT `Dominion_artId_fkey` FOREIGN KEY (`artId`) REFERENCES `Art`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dominion` ADD CONSTRAINT `Dominion_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DominionToTag` ADD CONSTRAINT `_DominionToTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `Dominion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DominionToTag` ADD CONSTRAINT `_DominionToTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
