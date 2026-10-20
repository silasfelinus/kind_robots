-- Additive Playbook Manager tables (conductor weird-humboldt t-033). New tables
-- only; nothing the running build reads is touched.
-- CreateTable
CREATE TABLE `PlaybookEdit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `gameSlug` VARCHAR(64) NOT NULL,
    `nodeKey` VARCHAR(128) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `live` BOOLEAN NOT NULL DEFAULT false,
    `updatedById` INTEGER NULL,

    INDEX `PlaybookEdit_gameSlug_live_idx`(`gameSlug`, `live`),
    UNIQUE INDEX `PlaybookEdit_gameSlug_nodeKey_key`(`gameSlug`, `nodeKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlaybookNote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `gameSlug` VARCHAR(64) NOT NULL,
    `nodeKey` VARCHAR(128) NOT NULL,
    `kind` VARCHAR(32) NOT NULL,
    `body` TEXT NOT NULL,
    `choiceId` VARCHAR(64) NULL,
    `artJobId` INTEGER NULL,
    `artImageId` INTEGER NULL,
    `authorId` INTEGER NOT NULL,
    `resolved` BOOLEAN NOT NULL DEFAULT false,

    INDEX `PlaybookNote_gameSlug_nodeKey_idx`(`gameSlug`, `nodeKey`),
    INDEX `PlaybookNote_gameSlug_kind_resolved_idx`(`gameSlug`, `kind`, `resolved`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
