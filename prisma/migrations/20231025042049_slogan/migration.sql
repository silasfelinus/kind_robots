-- AlterTable
ALTER TABLE `Tag` ADD COLUMN `sloganId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Slogan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `contentType` VARCHAR(191) NOT NULL DEFAULT 'slogan',
    `purpose` VARCHAR(191) NOT NULL DEFAULT 'Anti-Malaria Fundraiser',
    `url` VARCHAR(191) NULL DEFAULT 'https://www.againstmalaria.org/amibot',
    `characterLimit` INTEGER NOT NULL DEFAULT 300,
    `content` VARCHAR(2000) NOT NULL,
    `likes` INTEGER NOT NULL DEFAULT 0,
    `dislikes` INTEGER NOT NULL DEFAULT 0,
    `hates` INTEGER NOT NULL DEFAULT 0,
    `loves` INTEGER NOT NULL DEFAULT 0,
    `isLiked` BOOLEAN NOT NULL DEFAULT false,
    `isLoved` BOOLEAN NOT NULL DEFAULT false,
    `wasKept` BOOLEAN NULL,
    `wasDiscarded` BOOLEAN NULL,
    `username` VARCHAR(191) NOT NULL DEFAULT 'Kind Guest',
    `userId` INTEGER NOT NULL DEFAULT 0,
    `model` VARCHAR(191) NOT NULL DEFAULT '3.5',
    `kindRobot` VARCHAR(191) NOT NULL DEFAULT 'amibot',
    `botId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Slogan` ADD CONSTRAINT `Slogan_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Slogan` ADD CONSTRAINT `Slogan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tag` ADD CONSTRAINT `Tag_sloganId_fkey` FOREIGN KEY (`sloganId`) REFERENCES `Slogan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
