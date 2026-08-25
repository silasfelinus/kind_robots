-- cthulhuquarium/t-035: give monsters their own model. Character is this
-- site's chattable-personality table (people you can talk to, story NPCs);
-- fish and other tank creatures have no dialogue, no personality, and no
-- chat surface. Reusing Character for them because its columns happened to
-- fit is what put a tank-capacity `Character.size` column on Character, and
-- when that migration shipped unapplied it took every unselected
-- `prisma.character.findUnique()` down with it (kind-robots/t-071).
--
-- Purely additive -- CREATE TABLE only, no DROP, no ALTER of any existing
-- table, no edits to prior migrations. AquariumStock.characterId,
-- AquariumCodexEntry.characterId, and Character.size are all left exactly
-- as they are; repointing those and dropping Character.size are follow-on
-- work, deliberately kept out of this migration -- see
-- projects/cthulhuquarium/roadmap.yaml t-035's note for the full ordering
-- and why the drop specifically waits on kind-robots/t-071 being resolved
-- first.
--
-- Hand-authored to match `prisma migrate diff`'s emission for this schema
-- (this sandbox has no MIGRATION_DATABASE_URL / local shadow database --
-- see docs/runbooks/migration-credential-boundary.md); cross-checked
-- column-for-column against schema.prisma's Creature model and against the
-- squashed baseline's rendering of the same Rarity enum / plain-String /
-- Boolean-with-default column shapes used elsewhere in this file (e.g.
-- Reward, Character).

-- CreateTable
CREATE TABLE `Creature` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,
    `slug` VARCHAR(255) NOT NULL,
    `name` VARCHAR(256) NOT NULL,
    `species` VARCHAR(764) NULL,
    `class` VARCHAR(764) NULL,
    `fieldNote` TEXT NULL,
    `quirks` TEXT NULL,
    `alignment` VARCHAR(256) NULL,
    `tier` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    `charm` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    `empathy` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    `grace` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    `luck` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    `might` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    `wits` ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC') NOT NULL DEFAULT 'COMMON',
    `size` INTEGER NOT NULL DEFAULT 1,
    `yieldPerTick` INTEGER NULL,
    `tickIntervalSeconds` INTEGER NULL,
    `unlockCost` INTEGER NULL,
    `behavior` VARCHAR(255) NULL,
    `hue` INTEGER NULL,
    `games` VARCHAR(764) NULL,
    `artPrompt` TEXT NULL,
    `evolutionKind` ENUM('GROWTH', 'BREEDING') NULL,
    `evolvesToId` INTEGER NULL,
    `icon` VARCHAR(191) NULL,
    `iconPath` TEXT NULL,
    `imagePath` VARCHAR(764) NULL,
    `cardPath` TEXT NULL,
    `heroPath` TEXT NULL,
    `artImageId` INTEGER NULL,
    `cardArtImageId` INTEGER NULL,
    `heroArtImageId` INTEGER NULL,
    `iconArtImageId` INTEGER NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `allowReviews` BOOLEAN NOT NULL DEFAULT true,
    `userId` INTEGER NULL DEFAULT 10,
    `packId` INTEGER NULL,

    UNIQUE INDEX `Creature_slug_key`(`slug`),
    INDEX `Creature_slug_idx`(`slug`),
    INDEX `Creature_tier_idx`(`tier`),
    INDEX `Creature_evolvesToId_idx`(`evolvesToId`),
    INDEX `Creature_userId_idx`(`userId`),
    INDEX `Creature_packId_idx`(`packId`),
    INDEX `Creature_isPublic_idx`(`isPublic`),
    INDEX `Creature_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Creature` ADD CONSTRAINT `Creature_evolvesToId_fkey`
    FOREIGN KEY (`evolvesToId`) REFERENCES `Creature`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Creature` ADD CONSTRAINT `Creature_artImageId_fkey`
    FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Creature` ADD CONSTRAINT `Creature_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Creature` ADD CONSTRAINT `Creature_packId_fkey`
    FOREIGN KEY (`packId`) REFERENCES `Pack`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
