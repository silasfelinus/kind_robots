-- CreateTable (additive only: new ArtJob table + FK to User; no existing data touched)
CREATE TABLE `ArtJob` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('PENDING', 'RUNNING', 'DONE', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `engine` ENUM('A1111', 'COMFY', 'OPENAI', 'ANTHROPIC', 'OLLAMA', 'CUSTOM') NOT NULL DEFAULT 'A1111',
    `payload` JSON NOT NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `claimedAt` DATETIME(3) NULL,
    `claimedBy` VARCHAR(255) NULL,
    `projectSlug` VARCHAR(255) NULL,
    `artImageId` INTEGER NULL,
    `error` TEXT NULL,
    `userId` INTEGER NOT NULL,

    INDEX `ArtJob_status_priority_id_idx`(`status`, `priority`, `id`),
    INDEX `ArtJob_userId_idx`(`userId`),
    INDEX `ArtJob_projectSlug_idx`(`projectSlug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ArtJob` ADD CONSTRAINT `ArtJob_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
