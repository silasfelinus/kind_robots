-- Canonical Bot Facet assignments for Bot type and reusable personality traits.

CREATE TABLE `BotFacet` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `botId` INTEGER NOT NULL,
  `facetId` INTEGER NOT NULL,
  `fieldKey` VARCHAR(64) NOT NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `weight` DOUBLE NOT NULL DEFAULT 1,
  `source` VARCHAR(64) NOT NULL DEFAULT 'CURATED',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE INDEX `BotFacet_botId_facetId_fieldKey_key` (`botId`, `facetId`, `fieldKey`),
  INDEX `BotFacet_botId_fieldKey_sortOrder_idx` (`botId`, `fieldKey`, `sortOrder`),
  INDEX `BotFacet_facetId_idx` (`facetId`),
  CONSTRAINT `BotFacet_botId_fkey`
    FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `BotFacet_facetId_fkey`
    FOREIGN KEY (`facetId`) REFERENCES `Facet`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
