-- Project <-> Facet join, mirroring DreamFacet/ScenarioFacet: Project is
-- first-class in the art and gallery systems and was the last of those
-- objects with no Facet expansion table at all.
--
-- SAFETY: purely additive. New table + new foreign keys only; no existing
-- table, column, or data is touched.

-- CreateTable
CREATE TABLE `ProjectFacet` (
    `projectId` INTEGER NOT NULL,
    `facetId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProjectFacet_facetId_idx`(`facetId`),
    PRIMARY KEY (`projectId`, `facetId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProjectFacet` ADD CONSTRAINT `ProjectFacet_facetId_fkey` FOREIGN KEY (`facetId`) REFERENCES `Facet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectFacet` ADD CONSTRAINT `ProjectFacet_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
