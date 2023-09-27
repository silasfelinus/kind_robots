-- AlterTable
ALTER TABLE `Art` ADD COLUMN `artPromptId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Tag` ADD COLUMN `artPromptId` INTEGER NULL;

-- CreateTable
CREATE TABLE `ArtPrompt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` INTEGER NOT NULL DEFAULT 0,
    `prompt` TEXT NOT NULL,

    UNIQUE INDEX `ArtPrompt_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Art` ADD CONSTRAINT `Art_artPromptId_fkey` FOREIGN KEY (`artPromptId`) REFERENCES `ArtPrompt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtPrompt` ADD CONSTRAINT `ArtPrompt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tag` ADD CONSTRAINT `Tag_artPromptId_fkey` FOREIGN KEY (`artPromptId`) REFERENCES `ArtPrompt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
