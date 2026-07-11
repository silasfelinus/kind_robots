-- Add indexed, globally unambiguous aliases for Facet lookup.
-- Canonical Facet slugs are seeded as alias rows so all resolution uses the same
-- normalized lookup path. Legacy Facet rows and relations remain untouched.

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
  UNIQUE INDEX `FacetAlias_facetId_alias_key`(`facetId`, `alias`),
  INDEX `FacetAlias_facetId_idx`(`facetId`),
  INDEX `FacetAlias_isActive_idx`(`isActive`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `FacetAlias`
  ADD CONSTRAINT `FacetAlias_facetId_fkey`
  FOREIGN KEY (`facetId`) REFERENCES `Facet`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

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
