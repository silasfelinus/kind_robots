-- cthulhuquarium/t-032: extend the Aquarium schema for every design decision
-- made after t-007 shipped (capacity, genetics, set pieces, the
-- Ichthyonomicon). Purely additive -- no DROP of any table/column/data, no
-- edits to prior migrations. See projects/cthulhuquarium/roadmap.yaml t-032
-- and SYSTEMS.md in conductor for the design this implements.
--
-- Generated via `prisma migrate diff` against a scratch shadow database, then
-- hand-trimmed to drop unrelated pre-existing drift the diff also surfaced
-- (a stray FacetProfile FK and two `updatedAt` DEFAULT CURRENT_TIMESTAMP
-- backfills from an unrelated Prisma-version-driven SQL emission change) --
-- that drift is real but out of scope for this task; flagged separately
-- rather than folded in here.

-- AlterTable: Aquarium capacity (two distinct pools -- see SYSTEMS.md
-- "Capacity: two pools, two units") and debris tracking (t-027).
ALTER TABLE `Aquarium`
    ADD COLUMN `setSlotsCap` INTEGER NOT NULL DEFAULT 3,
    ADD COLUMN `sizeCap` INTEGER NOT NULL DEFAULT 10,
    ADD COLUMN `debrisLevel` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lastCleanedAt` DATETIME(3) NULL;

-- AlterTable: fix Aquarium.slug being globally unique instead of per-owner
-- (t-025's own recommendation; the shipped t-007 migration used a global
-- unique by mistake). A live bug the moment a second user names a tank
-- anything obvious -- cheap to fix now, before real rows exist.
DROP INDEX `Aquarium_slug_key` ON `Aquarium`;
CREATE UNIQUE INDEX `Aquarium_userId_slug_key` ON `Aquarium`(`userId`, `slug`);

-- AlterTable: Character gets a required capacity weight per species, used
-- against Aquarium.sizeCap. Existing rows default to the smallest unit.
ALTER TABLE `Character`
    ADD COLUMN `size` INTEGER NOT NULL DEFAULT 1;

-- AlterTable: AquariumStock gets hidden per-individual stats (mirroring
-- Character's six public Rarity stats, numeric and rolled per fish rather
-- than per species) and nullable parentage for breeding. See SYSTEMS.md
-- "Genetics: hidden stats, breeding, and secret evolutions".
ALTER TABLE `AquariumStock`
    ADD COLUMN `statCharm` INTEGER NULL,
    ADD COLUMN `statEmpathy` INTEGER NULL,
    ADD COLUMN `statGrace` INTEGER NULL,
    ADD COLUMN `statLuck` INTEGER NULL,
    ADD COLUMN `statMight` INTEGER NULL,
    ADD COLUMN `statWits` INTEGER NULL,
    ADD COLUMN `parentAId` INTEGER NULL,
    ADD COLUMN `parentBId` INTEGER NULL;

CREATE INDEX `AquariumStock_parentAId_idx` ON `AquariumStock`(`parentAId`);
CREATE INDEX `AquariumStock_parentBId_idx` ON `AquariumStock`(`parentBId`);

-- Breeding never consumes the parents (progress never degrades), and losing
-- a parent must not cascade-delete its offspring's own record -- SET NULL.
ALTER TABLE `AquariumStock` ADD CONSTRAINT `AquariumStock_parentAId_fkey`
    FOREIGN KEY (`parentAId`) REFERENCES `AquariumStock`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `AquariumStock` ADD CONSTRAINT `AquariumStock_parentBId_fkey`
    FOREIGN KEY (`parentBId`) REFERENCES `AquariumStock`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: a set piece equipped in one Aquarium, counted against
-- Aquarium.setSlotsCap -- a distinct pool from fish, which are weighed by
-- size instead. `kind` keys into economy.yaml's `set_pieces` catalogue.
CREATE TABLE `AquariumSet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `aquariumId` INTEGER NOT NULL,
    `kind` VARCHAR(64) NOT NULL,
    `equippedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AquariumSet_aquariumId_idx`(`aquariumId`),
    INDEX `AquariumSet_kind_idx`(`kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: the Ichthyonomicon. One row per user per species ever bought
-- or raised, whether or not currently owned -- survives a sell. Makes
-- t-030's rotating shop and sell-back safe (rotation governs discovery, not
-- access). See SYSTEMS.md "The shop rotates; the book is forever".
CREATE TABLE `AquariumCodexEntry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `userId` INTEGER NOT NULL,
    `characterId` INTEGER NOT NULL,
    `firstAcquiredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `bestStatCharm` INTEGER NULL,
    `bestStatEmpathy` INTEGER NULL,
    `bestStatGrace` INTEGER NULL,
    `bestStatLuck` INTEGER NULL,
    `bestStatMight` INTEGER NULL,
    `bestStatWits` INTEGER NULL,

    INDEX `AquariumCodexEntry_userId_idx`(`userId`),
    INDEX `AquariumCodexEntry_characterId_idx`(`characterId`),
    UNIQUE INDEX `AquariumCodexEntry_userId_characterId_key`(`userId`, `characterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AquariumSet` ADD CONSTRAINT `AquariumSet_aquariumId_fkey`
    FOREIGN KEY (`aquariumId`) REFERENCES `Aquarium`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AquariumCodexEntry` ADD CONSTRAINT `AquariumCodexEntry_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AquariumCodexEntry` ADD CONSTRAINT `AquariumCodexEntry_characterId_fkey`
    FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
