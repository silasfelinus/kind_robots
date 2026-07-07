-- Additive: record a collection's parent path under public/images/ so nested
-- folder locations round-trip (slug stays the leaf; subFolder is the prefix).

-- AlterTable
ALTER TABLE `ArtCollection` ADD COLUMN `subFolder` VARCHAR(512) NULL;
