-- AlterTable
ALTER TABLE `Bot` ADD COLUMN `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Conversation` ADD COLUMN `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Gallery` ADD COLUMN `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Image` ADD COLUMN `isFlagged` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Message` ADD COLUMN `conversationId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Tag` ADD COLUMN `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Todo` ADD COLUMN `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `isPrivate` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `theme` VARCHAR(191) NULL,
    ADD COLUMN `useCookies` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `role` ENUM('SYSTEM', 'USER', 'ASSISTANT', 'ADMIN', 'GUEST', 'BOT') NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE `Prompt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `user` VARCHAR(191) NULL DEFAULT 'kindguest',
    `bot` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Response` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` VARCHAR(191) NOT NULL,
    `dateCreated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `promptId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Bot` ADD CONSTRAINT `Bot_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Todo` ADD CONSTRAINT `Todo_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Image` ADD CONSTRAINT `Image_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Gallery` ADD CONSTRAINT `Gallery_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Prompt` ADD CONSTRAINT `Prompt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Response` ADD CONSTRAINT `Response_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tag` ADD CONSTRAINT `Tag_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
