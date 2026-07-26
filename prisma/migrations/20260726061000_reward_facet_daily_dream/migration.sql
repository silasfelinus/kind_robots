CREATE TABLE `RewardFacet` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `rewardId` INTEGER NOT NULL,
  `facetId` INTEGER NOT NULL,
  `fieldKey` VARCHAR(64) NOT NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `weight` DOUBLE NOT NULL DEFAULT 1,
  `source` VARCHAR(64) NOT NULL DEFAULT 'CURATED',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `RewardFacet_rewardId_facetId_fieldKey_key`(`rewardId`, `facetId`, `fieldKey`),
  INDEX `RewardFacet_rewardId_fieldKey_sortOrder_idx`(`rewardId`, `fieldKey`, `sortOrder`),
  INDEX `RewardFacet_facetId_idx`(`facetId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `RewardFacet`
  ADD CONSTRAINT `RewardFacet_rewardId_fkey`
  FOREIGN KEY (`rewardId`) REFERENCES `Reward`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RewardFacet`
  ADD CONSTRAINT `RewardFacet_facetId_fkey`
  FOREIGN KEY (`facetId`) REFERENCES `Facet`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
