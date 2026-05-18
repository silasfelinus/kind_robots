-- AlterTable
ALTER TABLE `Art` ADD COLUMN `serverId` INTEGER NULL,
    ADD COLUMN `serverName` VARCHAR(191) NULL,
    ADD COLUMN `serverUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `preferredArtServerId` INTEGER NULL,
    ADD COLUMN `preferredTextServerId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Server` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `serverType` ENUM('ART', 'TEXT', 'COMFY', 'A1111', 'OPENAI_COMPATIBLE', 'OTHER') NOT NULL DEFAULT 'ART',
    `category` VARCHAR(191) NULL,
    `baseUrl` VARCHAR(191) NOT NULL,
    `endpointPath` VARCHAR(191) NULL,
    `healthPath` VARCHAR(191) NULL,
    `userId` INTEGER NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `isOfficial` BOOLEAN NOT NULL DEFAULT false,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `requiresApiKey` BOOLEAN NOT NULL DEFAULT false,
    `apiKeyName` VARCHAR(191) NULL,
    `supportsTxt2Img` BOOLEAN NOT NULL DEFAULT false,
    `supportsImg2Img` BOOLEAN NOT NULL DEFAULT false,
    `supportsChat` BOOLEAN NOT NULL DEFAULT false,
    `supportsComfyWorkflow` BOOLEAN NOT NULL DEFAULT false,
    `supportsCheckpointOverride` BOOLEAN NOT NULL DEFAULT false,
    `supportsSampler` BOOLEAN NOT NULL DEFAULT false,
    `supportsNegativePrompt` BOOLEAN NOT NULL DEFAULT false,
    `supportsSeed` BOOLEAN NOT NULL DEFAULT false,
    `supportsSteps` BOOLEAN NOT NULL DEFAULT false,
    `designer` VARCHAR(191) NULL,
    `version` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `lastCheckedAt` DATETIME(3) NULL,
    `lastStatus` ENUM('ONLINE', 'OFFLINE', 'DEGRADED', 'UNKNOWN') NULL,

    INDEX `Server_serverType_idx`(`serverType`),
    INDEX `Server_isPublic_idx`(`isPublic`),
    INDEX `Server_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Art` ADD CONSTRAINT `Art_serverId_fkey` FOREIGN KEY (`serverId`) REFERENCES `Server`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Server` ADD CONSTRAINT `Server_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
