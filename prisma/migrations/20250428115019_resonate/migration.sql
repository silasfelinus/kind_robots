-- CreateTable
CREATE TABLE `Resonate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `title` VARCHAR(255) NOT NULL,
    `description` VARCHAR(512) NULL,
    `imagePath` VARCHAR(764) NOT NULL,
    `audioPath` VARCHAR(764) NULL,
    `userId` INTEGER NULL DEFAULT 10,
    `chapterData` LONGTEXT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `genres` VARCHAR(512) NULL,

    INDEX `Resonate_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Resonate` ADD CONSTRAINT `Resonate_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
