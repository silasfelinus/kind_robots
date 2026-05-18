-- CreateTable
CREATE TABLE `SmartIcon` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `title` VARCHAR(255) NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `designer` VARCHAR(255) NULL,
    `userId` INTEGER NULL DEFAULT 10,
    `icon` VARCHAR(255) NULL,
    `label` VARCHAR(255) NULL,
    `link` VARCHAR(512) NULL,
    `component` VARCHAR(255) NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,

    INDEX `SmartIcon_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SmartIcon` ADD CONSTRAINT `SmartIcon_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
