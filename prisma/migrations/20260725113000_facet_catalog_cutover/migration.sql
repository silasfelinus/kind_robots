-- Canonical Facet catalog metadata and Character assignment tables.

CREATE TABLE `FacetProfile` (
  `facetId` INTEGER NOT NULL,
  `taxonomy` VARCHAR(64) NOT NULL DEFAULT 'OTHER',
  `canonicalValue` VARCHAR(255) NULL,
  `groupKey` VARCHAR(128) NULL,
  `groupLabel` VARCHAR(255) NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `isRandomizable` BOOLEAN NOT NULL DEFAULT true,
  `randomWeight` DOUBLE NOT NULL DEFAULT 1,
  `artRequired` BOOLEAN NOT NULL DEFAULT true,
  `sourceRank` INTEGER NOT NULL DEFAULT 100,
  `metadata` LONGTEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`facetId`),
  INDEX `FacetProfile_taxonomy_groupKey_sortOrder_idx` (`taxonomy`, `groupKey`, `sortOrder`),
  INDEX `FacetProfile_isRandomizable_taxonomy_idx` (`isRandomizable`, `taxonomy`),
  CONSTRAINT `FacetProfile_facetId_fkey`
    FOREIGN KEY (`facetId`) REFERENCES `Facet`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CharacterFacet` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `characterId` INTEGER NOT NULL,
  `facetId` INTEGER NOT NULL,
  `fieldKey` VARCHAR(64) NOT NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `weight` DOUBLE NOT NULL DEFAULT 1,
  `source` VARCHAR(64) NOT NULL DEFAULT 'CURATED',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `CharacterFacet_characterId_facetId_fieldKey_key` (`characterId`, `facetId`, `fieldKey`),
  INDEX `CharacterFacet_characterId_fieldKey_sortOrder_idx` (`characterId`, `fieldKey`, `sortOrder`),
  INDEX `CharacterFacet_facetId_idx` (`facetId`),
  CONSTRAINT `CharacterFacet_characterId_fkey`
    FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CharacterFacet_facetId_fkey`
    FOREIGN KEY (`facetId`) REFERENCES `Facet`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
