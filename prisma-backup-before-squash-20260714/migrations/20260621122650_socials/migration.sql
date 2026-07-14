-- AlterTable
ALTER TABLE `Dream` MODIFY `dreamType` ENUM('ARTDREAM', 'BRAINSTORM', 'WEIRDLANDIA', 'RANDOMLIST', 'TITLE', 'VIBE', 'BOT', 'PROMPTBOT', 'NARRATOR', 'INSPIRATION', 'CHARACTER', 'REWARD', 'SCENARIO', 'TEXT', 'LOCATION', 'PITCH', 'GENRE', 'CONCEPT') NOT NULL DEFAULT 'ARTDREAM',
    MODIFY `artPrompt` TEXT NULL;

-- CreateTable
CREATE TABLE `SocialPost` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `designer` VARCHAR(256) NULL,
    `title` VARCHAR(255) NOT NULL,
    `body` TEXT NOT NULL,
    `mediaUrls` JSON NULL,
    `status` ENUM('DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED') NOT NULL DEFAULT 'DRAFT',
    `sourceType` VARCHAR(191) NULL,
    `sourceId` INTEGER NULL,
    `scheduledAt` DATETIME(3) NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `userId` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isMature` BOOLEAN NOT NULL DEFAULT false,

    INDEX `SocialPost_userId_idx`(`userId`),
    INDEX `SocialPost_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SocialTarget` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `postId` INTEGER NOT NULL,
    `platform` ENUM('DISCORD', 'MASTODON', 'BLUESKY', 'REDDIT', 'FACEBOOK', 'INSTAGRAM', 'RSS') NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'FAILED', 'SKIPPED', 'COPIED') NOT NULL DEFAULT 'PENDING',
    `remoteId` VARCHAR(191) NULL,
    `remoteUrl` VARCHAR(191) NULL,
    `errorMessage` VARCHAR(191) NULL,
    `sentAt` DATETIME(3) NULL,

    INDEX `SocialTarget_postId_idx`(`postId`),
    INDEX `SocialTarget_platform_idx`(`platform`),
    INDEX `SocialTarget_status_idx`(`status`),
    UNIQUE INDEX `SocialTarget_postId_platform_key`(`postId`, `platform`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SocialPost` ADD CONSTRAINT `SocialPost_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SocialTarget` ADD CONSTRAINT `SocialTarget_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `SocialPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
