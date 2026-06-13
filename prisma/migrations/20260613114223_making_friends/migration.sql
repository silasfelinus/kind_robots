-- CreateTable
CREATE TABLE `UserRelation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `relatedUserId` INTEGER NOT NULL,
    `type` ENUM('FRIEND', 'BLOCK', 'PARENT', 'CHILD', 'REFEREE') NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED') NOT NULL DEFAULT 'ACCEPTED',
    `note` TEXT NULL,

    INDEX `UserRelation_userId_fkey`(`userId`),
    INDEX `UserRelation_relatedUserId_fkey`(`relatedUserId`),
    INDEX `UserRelation_type_idx`(`type`),
    INDEX `UserRelation_status_idx`(`status`),
    UNIQUE INDEX `UserRelation_userId_relatedUserId_type_key`(`userId`, `relatedUserId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserRelation` ADD CONSTRAINT `UserRelation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRelation` ADD CONSTRAINT `UserRelation_relatedUserId_fkey` FOREIGN KEY (`relatedUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
