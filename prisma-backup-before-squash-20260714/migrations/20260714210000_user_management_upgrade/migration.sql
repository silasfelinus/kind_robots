-- User-management & consent upgrade.
-- Additive only: new consent/newsletter/restrict columns on User plus
-- AuthToken, Conversation, ConversationParticipant, DirectMessage, Notification.

-- AlterTable
ALTER TABLE `User` ADD COLUMN `allowFriendRequests` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `brevoContactId` VARCHAR(64) NULL,
    ADD COLUMN `isRestricted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `listInDirectory` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `messagePolicy` ENUM('EVERYONE', 'FRIENDS', 'NONE') NOT NULL DEFAULT 'EVERYONE',
    ADD COLUMN `newsletterConfirmedAt` DATETIME(3) NULL,
    ADD COLUMN `newsletterFrequency` ENUM('NEVER', 'SPECIAL', 'MONTHLY', 'WEEKLY', 'DAILY') NOT NULL DEFAULT 'NEVER',
    ADD COLUMN `restrictedAt` DATETIME(3) NULL,
    ADD COLUMN `restrictedById` INTEGER NULL,
    ADD COLUMN `restrictedReason` TEXT NULL;

-- CreateTable
CREATE TABLE `AuthToken` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,
    `userId` INTEGER NOT NULL,
    `token` VARCHAR(128) NOT NULL,
    `purpose` ENUM('EMAIL_VERIFY', 'PASSWORD_RESET', 'NEWSLETTER_CONFIRM') NOT NULL,
    `consumedAt` DATETIME(3) NULL,

    UNIQUE INDEX `AuthToken_token_key`(`token`),
    INDEX `AuthToken_userId_idx`(`userId`),
    INDEX `AuthToken_purpose_idx`(`purpose`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Conversation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isGroup` BOOLEAN NOT NULL DEFAULT false,
    `title` VARCHAR(255) NULL,
    `lastMessageAt` DATETIME(3) NULL,

    INDEX `Conversation_lastMessageAt_idx`(`lastMessageAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConversationParticipant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conversationId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastReadAt` DATETIME(3) NULL,
    `isMuted` BOOLEAN NOT NULL DEFAULT false,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,

    INDEX `ConversationParticipant_userId_idx`(`userId`),
    UNIQUE INDEX `ConversationParticipant_conversationId_userId_key`(`conversationId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DirectMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `conversationId` INTEGER NOT NULL,
    `senderId` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `editedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `DirectMessage_conversationId_createdAt_idx`(`conversationId`, `createdAt`),
    INDEX `DirectMessage_senderId_idx`(`senderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `type` ENUM('MESSAGE', 'FRIEND_REQUEST', 'FRIEND_ACCEPT', 'ADMIN', 'SYSTEM') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `body` TEXT NULL,
    `linkPath` VARCHAR(512) NULL,
    `actorId` INTEGER NULL,
    `entityId` INTEGER NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,

    INDEX `Notification_userId_isRead_idx`(`userId`, `isRead`),
    INDEX `Notification_actorId_idx`(`actorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AuthToken` ADD CONSTRAINT `AuthToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConversationParticipant` ADD CONSTRAINT `ConversationParticipant_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConversationParticipant` ADD CONSTRAINT `ConversationParticipant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DirectMessage` ADD CONSTRAINT `DirectMessage_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DirectMessage` ADD CONSTRAINT `DirectMessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

