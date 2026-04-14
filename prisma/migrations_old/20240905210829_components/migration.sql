-- CreateTable
CREATE TABLE `Component` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `folderName` VARCHAR(191) NOT NULL,
    `componentName` VARCHAR(191) NOT NULL,
    `isWorking` BOOLEAN NOT NULL DEFAULT true,
    `underConstruction` BOOLEAN NOT NULL DEFAULT false,
    `isBroken` BOOLEAN NOT NULL DEFAULT false,
    `title` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ComponentToTag` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ComponentToTag_AB_unique`(`A`, `B`),
    INDEX `_ComponentToTag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_ComponentToTag` ADD CONSTRAINT `_ComponentToTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `Component`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ComponentToTag` ADD CONSTRAINT `_ComponentToTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
