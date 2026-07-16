-- Standalone fixture for facet-alias-smoke.yml.
-- Mirrors the FacetAlias table + FK exactly as defined in
-- prisma/migrations/00000000000000_squashed/migration.sql, since the original
-- standalone migration (20260711021500_add_facet_aliases) was folded into that
-- squash and no longer exists as its own file. Keep this in sync if FacetAlias's
-- shape changes in the squashed migration.
CREATE TABLE `FacetAlias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `facetId` INTEGER NOT NULL,
    `alias` VARCHAR(255) NOT NULL,
    `lookupKey` VARCHAR(255) NOT NULL,
    `isCanonical` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `FacetAlias_lookupKey_key`(`lookupKey`),
    INDEX `FacetAlias_facetId_idx`(`facetId`),
    INDEX `FacetAlias_isActive_idx`(`isActive`),
    UNIQUE INDEX `FacetAlias_facetId_alias_key`(`facetId`, `alias`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `FacetAlias` ADD CONSTRAINT `FacetAlias_facetId_fkey` FOREIGN KEY (`facetId`) REFERENCES `Facet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO `FacetAlias` (
  `facetId`,
  `alias`,
  `lookupKey`,
  `isCanonical`,
  `isActive`,
  `createdAt`,
  `updatedAt`
)
SELECT
  `id`,
  `slug`,
  LOWER(REPLACE(REPLACE(REPLACE(`slug`, '-', ''), '_', ''), ' ', '')),
  true,
  true,
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
FROM `Facet`
WHERE `slug` IS NOT NULL AND `slug` <> '';
