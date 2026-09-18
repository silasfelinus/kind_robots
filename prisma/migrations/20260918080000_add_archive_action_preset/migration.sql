-- art-archive/t-014: persisted archive action presets for generation modifiers.
--
-- Add ArchiveActionPreset, a reusable named edit (add/replace a LoRA, swap
-- checkpoint, append/replace prompt text, change generation settings, create
-- an additional render, or replace the source) that the admin curation board
-- (t-015) will apply to selected archive entries. `modifiers` reuses ArtJob's
-- own payload vocabulary rather than a second renderer -- see
-- server/utils/artArchivePresetModifiers.ts.
--
-- `userId` is a loose reference with no formal FK, matching ArchiveEntry's
-- own artImageId/folderCollectionId convention (see
-- 20260918023500_add_archive_entry/migration.sql) -- purely per-admin-author
-- metadata, not a foreign-keyed ownership relationship.
--
-- PURELY ADDITIVE: one new table, no existing table touched.
--
-- Hand-authored to match `prisma migrate diff`'s emission for this schema
-- (this sandbox has no MIGRATION_DATABASE_URL / shadow database -- see
-- docs/runbooks/migration-credential-boundary.md). Enum value order below is
-- schema.prisma's order, which is what Prisma renders.

-- CreateTable
CREATE TABLE `ArchiveActionPreset` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `actionType` ENUM('ADD_LORA', 'REPLACE_LORA', 'REPLACE_CHECKPOINT', 'APPEND_PROMPT', 'REPLACE_PROMPT', 'CHANGE_SETTINGS', 'ADDITIONAL_RENDER', 'REPLACE_SOURCE') NOT NULL,
    `modifiers` TEXT NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    INDEX `ArchiveActionPreset_userId_idx` (`userId`),
    INDEX `ArchiveActionPreset_actionType_idx` (`actionType`),
    INDEX `ArchiveActionPreset_isActive_idx` (`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
