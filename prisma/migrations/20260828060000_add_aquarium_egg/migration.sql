-- cthulhuquarium/t-041: hidden egg purchases. Purely additive -- CREATE
-- TABLE only, no DROP, no ALTER of any existing table, no edits to prior
-- migrations. See projects/cthulhuquarium/roadmap.yaml t-041 in conductor.

-- CreateTable: one purchased-but-not-yet-hatched egg in one Aquarium. An
-- ITEM, not a Monster/species row -- `rarity` grades the LINE the egg
-- seeds, `size` is the tank-capacity weight reserved from the moment of
-- purchase (the weighed pool, same unit as Monster.size). Consumed on
-- hatch: hatchedAt + hatchedMonsterId are set, the row is never deleted.
CREATE TABLE `AquariumEgg` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `aquariumId` INTEGER NOT NULL,
    `rarity` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL,
    `size` INTEGER NOT NULL,
    `purchasedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `hatchedAt` DATETIME(3) NULL,
    `hatchedMonsterId` INTEGER NULL,

    INDEX `AquariumEgg_aquariumId_idx`(`aquariumId`),
    INDEX `AquariumEgg_hatchedAt_idx`(`hatchedAt`),
    INDEX `AquariumEgg_hatchedMonsterId_idx`(`hatchedMonsterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AquariumEgg` ADD CONSTRAINT `AquariumEgg_aquariumId_fkey`
    FOREIGN KEY (`aquariumId`) REFERENCES `Aquarium`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AquariumEgg` ADD CONSTRAINT `AquariumEgg_hatchedMonsterId_fkey`
    FOREIGN KEY (`hatchedMonsterId`) REFERENCES `Monster`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
