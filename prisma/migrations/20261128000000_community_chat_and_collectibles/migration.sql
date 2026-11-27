-- Additive: shared group chat rooms and the shared collectible/daily-reward
-- system (earn-only currency). New tables only; no existing data changes.
CREATE TABLE `ChatRoom` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(80) NOT NULL,
    `projectSlug` VARCHAR(120) NULL,
    `title` VARCHAR(160) NOT NULL,
    `isOpen` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `ChatRoom_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ChatRoomMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `body` VARCHAR(600) NOT NULL,
    `hiddenAt` DATETIME(3) NULL,
    `hiddenById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ChatRoomMessage_roomId_id_idx`(`roomId`, `id`),
    INDEX `ChatRoomMessage_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ChatRoomMessage` ADD CONSTRAINT `ChatRoomMessage_roomId_fkey`
    FOREIGN KEY (`roomId`) REFERENCES `ChatRoom`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `CollectibleWallet` (
    `userId` INTEGER NOT NULL,
    `setSlug` VARCHAR(80) NOT NULL,
    `balance` INTEGER NOT NULL DEFAULT 0,
    `streak` INTEGER NOT NULL DEFAULT 0,
    `bestStreak` INTEGER NOT NULL DEFAULT 0,
    `lastClaimDay` VARCHAR(10) NULL,
    `packTickets` INTEGER NOT NULL DEFAULT 0,
    `totalPulls` INTEGER NOT NULL DEFAULT 0,
    `pullsSinceTop` INTEGER NOT NULL DEFAULT 0,
    `selectedBack` VARCHAR(80) NULL,
    `bonusState` LONGTEXT NOT NULL,
    `revision` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `CollectibleWallet_setSlug_idx`(`setSlug`),
    PRIMARY KEY (`userId`, `setSlug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CollectibleOwnership` (
    `userId` INTEGER NOT NULL,
    `setSlug` VARCHAR(80) NOT NULL,
    `itemKey` VARCHAR(80) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 1,
    `firstAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastAt` DATETIME(3) NOT NULL,
    INDEX `CollectibleOwnership_setSlug_itemKey_idx`(`setSlug`, `itemKey`),
    PRIMARY KEY (`userId`, `setSlug`, `itemKey`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CollectiblePull` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `setSlug` VARCHAR(80) NOT NULL,
    `itemKey` VARCHAR(80) NOT NULL,
    `rarity` VARCHAR(16) NOT NULL,
    `source` VARCHAR(24) NOT NULL,
    `duplicate` BOOLEAN NOT NULL DEFAULT false,
    `refund` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `CollectiblePull_userId_setSlug_id_idx`(`userId`, `setSlug`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CollectibleArt` (
    `setSlug` VARCHAR(80) NOT NULL,
    `itemKey` VARCHAR(80) NOT NULL,
    `artImageId` INTEGER NOT NULL,
    `artJobId` INTEGER NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`setSlug`, `itemKey`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
