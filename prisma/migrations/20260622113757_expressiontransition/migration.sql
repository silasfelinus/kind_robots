-- CreateTable
CREATE TABLE `ExpressionTransition` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fromKey` VARCHAR(128) NOT NULL,
    `toKey` VARCHAR(128) NOT NULL,
    `videoPath` VARCHAR(764) NOT NULL,
    `fps` INTEGER NOT NULL DEFAULT 16,
    `frames` INTEGER NULL,
    `botId` INTEGER NULL,
    `characterId` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `designer` VARCHAR(256) NULL,

    INDEX `ExpressionTransition_botId_idx`(`botId`),
    INDEX `ExpressionTransition_characterId_idx`(`characterId`),
    INDEX `ExpressionTransition_botId_fromKey_idx`(`botId`, `fromKey`),
    INDEX `ExpressionTransition_characterId_fromKey_idx`(`characterId`, `fromKey`),
    INDEX `ExpressionTransition_isActive_idx`(`isActive`),
    UNIQUE INDEX `ExpressionTransition_botId_fromKey_toKey_key`(`botId`, `fromKey`, `toKey`),
    UNIQUE INDEX `ExpressionTransition_characterId_fromKey_toKey_key`(`characterId`, `fromKey`, `toKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ExpressionTransition` ADD CONSTRAINT `ExpressionTransition_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExpressionTransition` ADD CONSTRAINT `ExpressionTransition_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
