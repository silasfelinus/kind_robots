/*
  Warnings:

  - A unique constraint covering the columns `[outputDreamId]` on the table `Composition` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Composition` ADD COLUMN `approvedAt` DATETIME(3) NULL,
    ADD COLUMN `bountyId` INTEGER NULL,
    ADD COLUMN `manaCharged` INTEGER NULL,
    ADD COLUMN `outputDreamId` INTEGER NULL,
    ADD COLUMN `status` ENUM('DRAFT', 'PENDING', 'RUNNING', 'DONE', 'FAILED') NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN `stepLog` JSON NULL,
    ADD COLUMN `userApproved` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `wishText` TEXT NULL;

-- CreateTable
CREATE TABLE `LifeRun` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `status` ENUM('ACTIVE', 'COMPLETE', 'ABANDONED') NOT NULL DEFAULT 'ACTIVE',
    `seed` VARCHAR(255) NOT NULL,
    `protagonistName` VARCHAR(255) NULL,
    `currentAge` INTEGER NULL,
    `currentChapter` INTEGER NOT NULL DEFAULT 1,
    `genre` VARCHAR(255) NULL,
    `dreamId` INTEGER NULL,
    `characterId` INTEGER NULL,
    `botId` INTEGER NULL,
    `artCollectionId` INTEGER NULL,
    `endingId` INTEGER NULL,
    `outcomeKey` VARCHAR(16) NULL,
    `summary` TEXT NULL,
    `statsSnapshot` JSON NULL,

    INDEX `LifeRun_userId_idx`(`userId`),
    INDEX `LifeRun_status_idx`(`status`),
    INDEX `LifeRun_dreamId_idx`(`dreamId`),
    INDEX `LifeRun_characterId_idx`(`characterId`),
    INDEX `LifeRun_botId_idx`(`botId`),
    INDEX `LifeRun_artCollectionId_idx`(`artCollectionId`),
    INDEX `LifeRun_endingId_idx`(`endingId`),
    INDEX `LifeRun_outcomeKey_idx`(`outcomeKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LifeChoice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lifeRunId` INTEGER NOT NULL,
    `chatId` INTEGER NULL,
    `chapter` INTEGER NOT NULL,
    `prompt` TEXT NOT NULL,
    `choiceText` TEXT NOT NULL,
    `resultText` TEXT NULL,
    `effects` JSON NULL,

    INDEX `LifeChoice_lifeRunId_idx`(`lifeRunId`),
    INDEX `LifeChoice_chatId_idx`(`chatId`),
    INDEX `LifeChoice_chapter_idx`(`chapter`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LifeStat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lifeRunId` INTEGER NOT NULL,
    `key` VARCHAR(64) NOT NULL,
    `value` INTEGER NOT NULL DEFAULT 0,

    INDEX `LifeStat_key_idx`(`key`),
    UNIQUE INDEX `LifeStat_lifeRunId_key_key`(`lifeRunId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LifeEnding` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `outcomeKey` VARCHAR(16) NOT NULL,
    `summary` TEXT NOT NULL,
    `victoryType` ENUM('VICTORY', 'FAILURE', 'MIXED', 'SECRET') NOT NULL DEFAULT 'MIXED',
    `icon` VARCHAR(764) NULL,
    `heroImage` VARCHAR(764) NULL,
    `iconArtImageId` INTEGER NULL,
    `heroArtImageId` INTEGER NULL,
    `milestoneId` INTEGER NULL,
    `artPrompt` TEXT NULL,
    `metadata` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `LifeEnding_slug_key`(`slug`),
    UNIQUE INDEX `LifeEnding_outcomeKey_key`(`outcomeKey`),
    INDEX `LifeEnding_victoryType_idx`(`victoryType`),
    INDEX `LifeEnding_milestoneId_idx`(`milestoneId`),
    INDEX `LifeEnding_iconArtImageId_idx`(`iconArtImageId`),
    INDEX `LifeEnding_heroArtImageId_idx`(`heroArtImageId`),
    INDEX `LifeEnding_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LifeAchievement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `achievementType` ENUM('CHOICE', 'CHAPTER', 'STAT_THRESHOLD', 'ENDING', 'SECRET', 'FAILURE', 'VICTORY', 'COLLECTION') NOT NULL,
    `conditionKey` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(764) NULL,
    `imagePath` VARCHAR(764) NULL,
    `artImageId` INTEGER NULL,
    `milestoneId` INTEGER NULL,
    `endingId` INTEGER NULL,
    `metadata` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `LifeAchievement_slug_key`(`slug`),
    INDEX `LifeAchievement_achievementType_idx`(`achievementType`),
    INDEX `LifeAchievement_conditionKey_idx`(`conditionKey`),
    INDEX `LifeAchievement_artImageId_idx`(`artImageId`),
    INDEX `LifeAchievement_milestoneId_idx`(`milestoneId`),
    INDEX `LifeAchievement_endingId_idx`(`endingId`),
    INDEX `LifeAchievement_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LifeAchievementUnlock` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `lifeRunId` INTEGER NULL,
    `achievementId` INTEGER NOT NULL,
    `milestoneRecordId` INTEGER NULL,
    `data` JSON NULL,

    INDEX `LifeAchievementUnlock_userId_idx`(`userId`),
    INDEX `LifeAchievementUnlock_lifeRunId_idx`(`lifeRunId`),
    INDEX `LifeAchievementUnlock_achievementId_idx`(`achievementId`),
    INDEX `LifeAchievementUnlock_milestoneRecordId_idx`(`milestoneRecordId`),
    UNIQUE INDEX `LifeAchievementUnlock_userId_achievementId_lifeRunId_key`(`userId`, `achievementId`, `lifeRunId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LifeRunArt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lifeRunId` INTEGER NOT NULL,
    `artImageId` INTEGER NOT NULL,
    `chapter` INTEGER NULL,
    `sceneType` ENUM('MOMENT', 'DREAM', 'CHARACTER', 'CHOICE', 'THRESHOLD', 'ENDING', 'ICON', 'HERO') NOT NULL DEFAULT 'MOMENT',
    `prompt` TEXT NOT NULL,

    INDEX `LifeRunArt_lifeRunId_idx`(`lifeRunId`),
    INDEX `LifeRunArt_artImageId_idx`(`artImageId`),
    INDEX `LifeRunArt_sceneType_idx`(`sceneType`),
    INDEX `LifeRunArt_chapter_idx`(`chapter`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Composition_outputDreamId_key` ON `Composition`(`outputDreamId`);

-- AddForeignKey
ALTER TABLE `Composition` ADD CONSTRAINT `Composition_outputDreamId_fkey` FOREIGN KEY (`outputDreamId`) REFERENCES `Dream`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeRun` ADD CONSTRAINT `LifeRun_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeRun` ADD CONSTRAINT `LifeRun_dreamId_fkey` FOREIGN KEY (`dreamId`) REFERENCES `Dream`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeRun` ADD CONSTRAINT `LifeRun_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeRun` ADD CONSTRAINT `LifeRun_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeRun` ADD CONSTRAINT `LifeRun_artCollectionId_fkey` FOREIGN KEY (`artCollectionId`) REFERENCES `ArtCollection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeRun` ADD CONSTRAINT `LifeRun_endingId_fkey` FOREIGN KEY (`endingId`) REFERENCES `LifeEnding`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeChoice` ADD CONSTRAINT `LifeChoice_lifeRunId_fkey` FOREIGN KEY (`lifeRunId`) REFERENCES `LifeRun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeChoice` ADD CONSTRAINT `LifeChoice_chatId_fkey` FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeStat` ADD CONSTRAINT `LifeStat_lifeRunId_fkey` FOREIGN KEY (`lifeRunId`) REFERENCES `LifeRun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeEnding` ADD CONSTRAINT `LifeEnding_iconArtImageId_fkey` FOREIGN KEY (`iconArtImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeEnding` ADD CONSTRAINT `LifeEnding_heroArtImageId_fkey` FOREIGN KEY (`heroArtImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeEnding` ADD CONSTRAINT `LifeEnding_milestoneId_fkey` FOREIGN KEY (`milestoneId`) REFERENCES `Milestone`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeAchievement` ADD CONSTRAINT `LifeAchievement_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeAchievement` ADD CONSTRAINT `LifeAchievement_milestoneId_fkey` FOREIGN KEY (`milestoneId`) REFERENCES `Milestone`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeAchievement` ADD CONSTRAINT `LifeAchievement_endingId_fkey` FOREIGN KEY (`endingId`) REFERENCES `LifeEnding`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeAchievementUnlock` ADD CONSTRAINT `LifeAchievementUnlock_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeAchievementUnlock` ADD CONSTRAINT `LifeAchievementUnlock_lifeRunId_fkey` FOREIGN KEY (`lifeRunId`) REFERENCES `LifeRun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeAchievementUnlock` ADD CONSTRAINT `LifeAchievementUnlock_achievementId_fkey` FOREIGN KEY (`achievementId`) REFERENCES `LifeAchievement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeAchievementUnlock` ADD CONSTRAINT `LifeAchievementUnlock_milestoneRecordId_fkey` FOREIGN KEY (`milestoneRecordId`) REFERENCES `MilestoneRecord`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeRunArt` ADD CONSTRAINT `LifeRunArt_lifeRunId_fkey` FOREIGN KEY (`lifeRunId`) REFERENCES `LifeRun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LifeRunArt` ADD CONSTRAINT `LifeRunArt_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
