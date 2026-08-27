-- cthulhuquarium/t-017: tank decoration and layout editing. Purely
-- additive -- CREATE TABLE only, no DROP, no ALTER of any existing table,
-- no edits to prior migrations. See projects/cthulhuquarium/roadmap.yaml
-- t-017 and DESIGN-BRIEF.md in conductor.

-- CreateTable: one purchased-and-placed decor object in one Aquarium.
-- Purely cosmetic (no economy effect, no slot cap) -- decor never competes
-- with setSlotsCap/sizeCap's two-pool balance. `kind` keys into
-- server/utils/aquariumEconomy.ts's DECOR_CATALOG, same free-form-string
-- convention as AquariumSet.kind. x/y are percentages (0-100) of the canvas
-- stage, not pixels, so placement survives a stage-size change untouched.
CREATE TABLE `AquariumDecor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `aquariumId` INTEGER NOT NULL,
    `kind` VARCHAR(64) NOT NULL,
    `x` DOUBLE NOT NULL DEFAULT 50,
    `y` DOUBLE NOT NULL DEFAULT 50,
    `zIndex` INTEGER NOT NULL DEFAULT 0,

    INDEX `AquariumDecor_aquariumId_idx`(`aquariumId`),
    INDEX `AquariumDecor_kind_idx`(`kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AquariumDecor` ADD CONSTRAINT `AquariumDecor_aquariumId_fkey`
    FOREIGN KEY (`aquariumId`) REFERENCES `Aquarium`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
