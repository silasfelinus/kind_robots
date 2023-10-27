-- AlterTable
ALTER TABLE `Tag` ADD COLUMN `postId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Post` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `userId` INTEGER NULL,
    `username` VARCHAR(191) NOT NULL DEFAULT 'anonymous',
    `content` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `label` VARCHAR(191) NOT NULL DEFAULT 'blog',
    `imagePath` VARCHAR(191) NULL,
    `artId` INTEGER NULL,
    `pitchId` INTEGER NULL,
    `pitchname` VARCHAR(191) NULL,
    `sloganContent` VARCHAR(191) NULL,
    `sloganId` INTEGER NULL,
    `botId` INTEGER NULL,
    `botname` VARCHAR(191) NULL,
    `channelId` INTEGER NULL,
    `likes` INTEGER NOT NULL DEFAULT 0,
    `dislikes` INTEGER NOT NULL DEFAULT 0,
    `hates` INTEGER NOT NULL DEFAULT 0,
    `loves` INTEGER NOT NULL DEFAULT 0,
    `jellybeanClaps` INTEGER NOT NULL DEFAULT 0,
    `isFavorite` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Post_id_key`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_artId_fkey` FOREIGN KEY (`artId`) REFERENCES `Art`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_pitchId_fkey` FOREIGN KEY (`pitchId`) REFERENCES `Pitch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_sloganId_fkey` FOREIGN KEY (`sloganId`) REFERENCES `Slogan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tag` ADD CONSTRAINT `Tag_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
