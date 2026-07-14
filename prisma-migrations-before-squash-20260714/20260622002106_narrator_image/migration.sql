-- AlterTable
ALTER TABLE `Bot` ADD COLUMN `chatBorderImage` VARCHAR(764) NULL;

-- AlterTable
ALTER TABLE `SocialPost` ADD COLUMN `audience` ENUM('PUBLIC', 'SOCIAL', 'WORK', 'FRIENDS', 'FAMILY', 'PRIVATE') NOT NULL DEFAULT 'SOCIAL';

-- CreateTable
CREATE TABLE `NarratorTopic` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `subtitle` VARCHAR(764) NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(255) NULL,
    `prompt` TEXT NOT NULL,
    `sampleUserPrompt` VARCHAR(764) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `NarratorTopic_slug_key`(`slug`),
    INDEX `NarratorTopic_sortOrder_idx`(`sortOrder`),
    INDEX `NarratorTopic_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NarratorThread` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `botId` INTEGER NOT NULL,
    `topicId` INTEGER NOT NULL,
    `title` VARCHAR(255) NULL,
    `openingText` TEXT NOT NULL,
    `guidance` TEXT NULL,
    `starterPrompts` JSON NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    INDEX `NarratorThread_botId_idx`(`botId`),
    INDEX `NarratorThread_topicId_idx`(`topicId`),
    INDEX `NarratorThread_sortOrder_idx`(`sortOrder`),
    INDEX `NarratorThread_isActive_idx`(`isActive`),
    UNIQUE INDEX `NarratorThread_botId_topicId_key`(`botId`, `topicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `SocialPost_audience_idx` ON `SocialPost`(`audience`);

-- AddForeignKey
ALTER TABLE `NarratorThread` ADD CONSTRAINT `NarratorThread_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NarratorThread` ADD CONSTRAINT `NarratorThread_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `NarratorTopic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
