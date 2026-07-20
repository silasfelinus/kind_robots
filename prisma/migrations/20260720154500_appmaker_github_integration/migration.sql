-- AppMaker GitHub App integration (appmaker/t-008, GITHUB-APP-DESIGN.md §4).
-- Additive only: two new tables, no changes to existing tables/columns.

-- CreateTable
CREATE TABLE `GithubInstallation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `installationId` BIGINT NOT NULL,
    `userId` INTEGER NOT NULL,
    `accountLogin` VARCHAR(255) NOT NULL,
    `suspendedAt` DATETIME(3) NULL,

    UNIQUE INDEX `GithubInstallation_installationId_key`(`installationId`),
    INDEX `GithubInstallation_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AppRepo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `slug` VARCHAR(255) NOT NULL,
    `owner` VARCHAR(255) NOT NULL,
    `repo` VARCHAR(255) NOT NULL,
    `subPath` VARCHAR(512) NOT NULL DEFAULT '',
    `installationId` INTEGER NULL,
    `dreamId` INTEGER NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `AppRepo_slug_userId_key`(`slug`, `userId`),
    INDEX `AppRepo_userId_idx`(`userId`),
    INDEX `AppRepo_installationId_idx`(`installationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GithubInstallation` ADD CONSTRAINT `GithubInstallation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AppRepo` ADD CONSTRAINT `AppRepo_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AppRepo` ADD CONSTRAINT `AppRepo_installationId_fkey` FOREIGN KEY (`installationId`) REFERENCES `GithubInstallation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
