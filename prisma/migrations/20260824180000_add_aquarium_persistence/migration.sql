-- cthulhuquarium/t-007: persistence for the idle aquarium game (/play/aquarium).
-- Three brand-new tables plus their indexes and foreign keys. Fish species
-- are Character rows -- AquariumStock references Character, it does not
-- duplicate species data. No DROP/ALTER of any pre-existing table; the
-- Aquariums/AquariumStock back-reference fields added to the User/Character
-- models in prisma/schema.prisma are virtual Prisma relation fields only
-- (no column, nothing to migrate on that side) -- the real FKs live on the
-- new tables below.

-- CreateTable
CREATE TABLE `Aquarium` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `userId` INTEGER NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `coins` INTEGER NOT NULL DEFAULT 0,
    `backgroundKey` VARCHAR(255) NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `lastTickAt` DATETIME(3) NULL,

    UNIQUE INDEX `Aquarium_slug_key`(`slug`),
    INDEX `Aquarium_userId_idx`(`userId`),
    INDEX `Aquarium_isPublic_idx`(`isPublic`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AquariumStock` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `aquariumId` INTEGER NOT NULL,
    `characterId` INTEGER NOT NULL,
    `nickname` VARCHAR(255) NULL,
    `hunger` INTEGER NOT NULL DEFAULT 100,
    `mood` VARCHAR(64) NULL,
    `placedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AquariumStock_aquariumId_idx`(`aquariumId`),
    INDEX `AquariumStock_characterId_idx`(`characterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AquariumEvent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aquariumId` INTEGER NOT NULL,
    `kind` VARCHAR(64) NOT NULL,
    `payload` LONGTEXT NULL,
    `occurredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AquariumEvent_aquariumId_idx`(`aquariumId`),
    INDEX `AquariumEvent_kind_idx`(`kind`),
    INDEX `AquariumEvent_occurredAt_idx`(`occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Aquarium` ADD CONSTRAINT `Aquarium_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AquariumStock` ADD CONSTRAINT `AquariumStock_aquariumId_fkey` FOREIGN KEY (`aquariumId`) REFERENCES `Aquarium`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AquariumStock` ADD CONSTRAINT `AquariumStock_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AquariumEvent` ADD CONSTRAINT `AquariumEvent_aquariumId_fkey` FOREIGN KEY (`aquariumId`) REFERENCES `Aquarium`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
