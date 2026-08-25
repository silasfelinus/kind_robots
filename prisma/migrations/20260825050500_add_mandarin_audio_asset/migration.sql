-- CreateTable
CREATE TABLE `MandarinAudioAsset` (
    `id` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `cardKey` VARCHAR(255) NOT NULL,
    `text` VARCHAR(255) NOT NULL,
    `pinyin` VARCHAR(512) NOT NULL,
    `provider` VARCHAR(64) NOT NULL,
    `model` VARCHAR(128) NOT NULL,
    `voice` VARCHAR(64) NOT NULL,
    `format` VARCHAR(16) NOT NULL,
    `recipeVersion` VARCHAR(32) NOT NULL,
    `contentType` VARCHAR(64) NOT NULL,
    `byteLength` INTEGER NOT NULL,
    `audioData` MEDIUMBLOB NOT NULL,

    INDEX `MandarinAudioAsset_cardKey_idx`(`cardKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
