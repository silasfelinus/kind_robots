-- art-archive/t-003: durable archive-entry ledger.
--
-- Add ArchiveEntry, the filesystem-identity/curation ledger the Art Archive
-- scanner and admin browser (t-004 onward) will read and write. This is
-- indexing/curation state that lives independently of ArtImage -- an entry
-- may exist before any ArtImage is imported, and stays around (marked
-- MISSING, not deleted) if a rescan can no longer find its file.
--
-- `artImageId`/`folderCollectionId` are loose references with no formal FK,
-- matching ModelBuildItem.artImageId's own convention (see the squashed
-- baseline) -- this keeps the ledger purely additive with zero changes to
-- ArtImage/ArtCollection.
--
-- PURELY ADDITIVE: one new table, no existing table touched.
--
-- Hand-authored to match `prisma migrate diff`'s emission for this schema
-- (this sandbox has no MIGRATION_DATABASE_URL / shadow database -- see
-- docs/runbooks/migration-credential-boundary.md). Enum value order below is
-- schema.prisma's order, which is what Prisma renders.

-- CreateTable
CREATE TABLE `ArchiveEntry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `contentHash` VARCHAR(64) NOT NULL,
    `relativePath` VARCHAR(764) NOT NULL,
    `parentFolder` VARCHAR(512) NULL,
    `fileSize` INTEGER NULL,
    `fileMtime` DATETIME(3) NULL,
    `artImageId` INTEGER NULL,
    `folderCollectionId` INTEGER NULL,
    `processState` ENUM('PENDING', 'IMPORTED', 'ERROR', 'MISSING') NOT NULL DEFAULT 'PENDING',
    `matchState` ENUM('UNMATCHED', 'SUGGESTED', 'CONFIRMED', 'MANUAL', 'AMBIGUOUS') NOT NULL DEFAULT 'UNMATCHED',
    `resourceMatchLocked` BOOLEAN NOT NULL DEFAULT false,
    `rating` INTEGER NULL,
    `extractedMetadata` LONGTEXT NULL,
    `matchSummary` LONGTEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `ArchiveEntry_relativePath_key` (`relativePath`),
    INDEX `ArchiveEntry_contentHash_idx` (`contentHash`),
    INDEX `ArchiveEntry_artImageId_idx` (`artImageId`),
    INDEX `ArchiveEntry_folderCollectionId_idx` (`folderCollectionId`),
    INDEX `ArchiveEntry_processState_idx` (`processState`),
    INDEX `ArchiveEntry_matchState_idx` (`matchState`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
