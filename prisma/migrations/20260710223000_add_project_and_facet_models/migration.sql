-- Add Project and Facet as first-class models without deleting legacy Dream data.
-- PitchSheet permits either a Dream or Project owner during the transition; the
-- application and audit script enforce exactly one owner.

ALTER TABLE `Chat`
  ADD COLUMN `projectId` INTEGER NULL,
  MODIFY `type` ENUM('ToBot','BotResponse','ToForum','ToUser','ToCharacter','Weirdlandia','Dream','Reward','Story','Scenario','Character','Bot','Project') NOT NULL;

ALTER TABLE `Dream` ADD COLUMN `narratorId` INTEGER NULL;

CREATE TABLE `Project` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `flavorText` VARCHAR(512) NULL,
  `goal` TEXT NULL,
  `waypoints` TEXT NULL,
  `status` ENUM('ACTIVE','PAUSED','DONE','ARCHIVED','BRAINSTORM') NOT NULL DEFAULT 'BRAINSTORM',
  `priority` ENUM('LOW','NORMAL','HIGH') NOT NULL DEFAULT 'NORMAL',
  `conductorSlug` VARCHAR(255) NULL,
  `repoUrl` VARCHAR(512) NULL,
  `liveUrl` VARCHAR(512) NULL,
  `channelKey` VARCHAR(255) NULL,
  `tabKey` VARCHAR(255) NULL,
  `lastSyncedAt` DATETIME(3) NULL,
  `allowReviews` BOOLEAN NOT NULL DEFAULT false,
  `highlightImage` VARCHAR(256) NULL,
  `icon` VARCHAR(191) NULL,
  `imagePath` TEXT NULL,
  `cardPath` TEXT NULL,
  `heroPath` TEXT NULL,
  `designer` VARCHAR(256) NULL,
  `creationSource` ENUM('HUMAN','AI','HYBRID','UPLOAD','UNKNOWN') NOT NULL DEFAULT 'HUMAN',
  `userId` INTEGER NOT NULL DEFAULT 10,
  `managerBotId` INTEGER NULL,
  `artImageId` INTEGER NULL,
  `artCollectionId` INTEGER NULL,
  `isPublic` BOOLEAN NOT NULL DEFAULT true,
  `isMature` BOOLEAN NOT NULL DEFAULT false,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  UNIQUE INDEX `Project_slug_key`(`slug`),
  UNIQUE INDEX `Project_conductorSlug_key`(`conductorSlug`),
  INDEX `Project_userId_idx`(`userId`),
  INDEX `Project_managerBotId_idx`(`managerBotId`),
  INDEX `Project_artImageId_idx`(`artImageId`),
  INDEX `Project_artCollectionId_idx`(`artCollectionId`),
  INDEX `Project_status_idx`(`status`),
  INDEX `Project_priority_idx`(`priority`),
  INDEX `Project_channelKey_tabKey_idx`(`channelKey`, `tabKey`),
  INDEX `Project_isPublic_idx`(`isPublic`),
  INDEX `Project_isActive_idx`(`isActive`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Facet` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NULL,
  `kind` ENUM('GENRE','ANIMAL','COLOR','THEME','CORE','MOOD','STYLE','SETTING','ART_DIRECTION','OTHER') NOT NULL DEFAULT 'OTHER',
  `description` TEXT NULL,
  `flavorText` VARCHAR(512) NULL,
  `examples` LONGTEXT NULL,
  `artPrompt` TEXT NULL,
  `imagePath` TEXT NULL,
  `cardPath` TEXT NULL,
  `heroPath` TEXT NULL,
  `icon` VARCHAR(191) NULL,
  `designer` VARCHAR(256) NULL,
  `creationSource` ENUM('HUMAN','AI','HYBRID','UPLOAD','UNKNOWN') NOT NULL DEFAULT 'HUMAN',
  `userId` INTEGER NOT NULL DEFAULT 10,
  `artImageId` INTEGER NULL,
  `artCollectionId` INTEGER NULL,
  `isPublic` BOOLEAN NOT NULL DEFAULT true,
  `isMature` BOOLEAN NOT NULL DEFAULT false,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  UNIQUE INDEX `Facet_slug_key`(`slug`),
  INDEX `Facet_userId_idx`(`userId`),
  INDEX `Facet_kind_idx`(`kind`),
  INDEX `Facet_artImageId_idx`(`artImageId`),
  INDEX `Facet_artCollectionId_idx`(`artCollectionId`),
  INDEX `Facet_isPublic_idx`(`isPublic`),
  INDEX `Facet_isActive_idx`(`isActive`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `DreamFacet` (
  `dreamId` INTEGER NOT NULL,
  `facetId` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `DreamFacet_facetId_idx`(`facetId`),
  PRIMARY KEY (`dreamId`, `facetId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ScenarioFacet` (
  `scenarioId` INTEGER NOT NULL,
  `facetId` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ScenarioFacet_facetId_idx`(`facetId`),
  PRIMARY KEY (`scenarioId`, `facetId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProjectArtImage` (
  `projectId` INTEGER NOT NULL,
  `artImageId` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ProjectArtImage_artImageId_idx`(`artImageId`),
  PRIMARY KEY (`projectId`, `artImageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ProjectArtCollection` (
  `projectId` INTEGER NOT NULL,
  `artCollectionId` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ProjectArtCollection_artCollectionId_idx`(`artCollectionId`),
  PRIMARY KEY (`projectId`, `artCollectionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `FacetArtImage` (
  `facetId` INTEGER NOT NULL,
  `artImageId` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `FacetArtImage_artImageId_idx`(`artImageId`),
  PRIMARY KEY (`facetId`, `artImageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `FacetArtCollection` (
  `facetId` INTEGER NOT NULL,
  `artCollectionId` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `FacetArtCollection_artCollectionId_idx`(`artCollectionId`),
  PRIMARY KEY (`facetId`, `artCollectionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `FacetRelation` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fromFacetId` INTEGER NOT NULL,
  `toFacetId` INTEGER NOT NULL,
  `relationType` ENUM('IS_A','APPEARS_IN','CONTAINS','RELATED','INSPIRED_BY') NOT NULL DEFAULT 'RELATED',
  `note` VARCHAR(512) NULL,
  UNIQUE INDEX `FacetRelation_fromFacetId_toFacetId_relationType_key`(`fromFacetId`, `toFacetId`, `relationType`),
  INDEX `FacetRelation_fromFacetId_idx`(`fromFacetId`),
  INDEX `FacetRelation_toFacetId_idx`(`toFacetId`),
  INDEX `FacetRelation_relationType_idx`(`relationType`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PitchSheet`
  MODIFY `dreamId` INTEGER NULL,
  ADD COLUMN `projectId` INTEGER NULL;

ALTER TABLE `Reaction`
  ADD COLUMN `projectId` INTEGER NULL,
  ADD COLUMN `facetId` INTEGER NULL,
  MODIFY `reactionCategory` ENUM('ART_IMAGE','ART_COLLECTION','BOT','BUTTERFLY','CHALLENGE_SUBMISSION','CHARACTER','CHAT_EXCHANGE','COMPONENT','COMPOSITION','DREAM','FACET','PROJECT','MESSAGE','POST','PROMPT','RESOURCE','REWARD','SCENARIO','THEME') NOT NULL DEFAULT 'ART_IMAGE';

ALTER TABLE `Todo` ADD COLUMN `projectId` INTEGER NULL;
ALTER TABLE `ArtJob` ADD COLUMN `projectId` INTEGER NULL;

CREATE UNIQUE INDEX `PitchSheet_projectId_key` ON `PitchSheet`(`projectId`);
CREATE INDEX `PitchSheet_projectId_idx` ON `PitchSheet`(`projectId`);
CREATE INDEX `Chat_projectId_fkey` ON `Chat`(`projectId`);
CREATE INDEX `Dream_narratorId_idx` ON `Dream`(`narratorId`);
CREATE INDEX `Reaction_projectId_fkey` ON `Reaction`(`projectId`);
CREATE INDEX `Reaction_facetId_fkey` ON `Reaction`(`facetId`);
CREATE INDEX `Todo_projectId_idx` ON `Todo`(`projectId`);
CREATE INDEX `ArtJob_projectId_idx` ON `ArtJob`(`projectId`);

ALTER TABLE `Project` ADD CONSTRAINT `Project_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Project` ADD CONSTRAINT `Project_managerBotId_fkey` FOREIGN KEY (`managerBotId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Project` ADD CONSTRAINT `Project_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Project` ADD CONSTRAINT `Project_artCollectionId_fkey` FOREIGN KEY (`artCollectionId`) REFERENCES `ArtCollection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Facet` ADD CONSTRAINT `Facet_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Facet` ADD CONSTRAINT `Facet_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Facet` ADD CONSTRAINT `Facet_artCollectionId_fkey` FOREIGN KEY (`artCollectionId`) REFERENCES `ArtCollection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `DreamFacet` ADD CONSTRAINT `DreamFacet_dreamId_fkey` FOREIGN KEY (`dreamId`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `DreamFacet` ADD CONSTRAINT `DreamFacet_facetId_fkey` FOREIGN KEY (`facetId`) REFERENCES `Facet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ScenarioFacet` ADD CONSTRAINT `ScenarioFacet_scenarioId_fkey` FOREIGN KEY (`scenarioId`) REFERENCES `Scenario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ScenarioFacet` ADD CONSTRAINT `ScenarioFacet_facetId_fkey` FOREIGN KEY (`facetId`) REFERENCES `Facet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ProjectArtImage` ADD CONSTRAINT `ProjectArtImage_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ProjectArtImage` ADD CONSTRAINT `ProjectArtImage_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ProjectArtCollection` ADD CONSTRAINT `ProjectArtCollection_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ProjectArtCollection` ADD CONSTRAINT `ProjectArtCollection_artCollectionId_fkey` FOREIGN KEY (`artCollectionId`) REFERENCES `ArtCollection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `FacetArtImage` ADD CONSTRAINT `FacetArtImage_facetId_fkey` FOREIGN KEY (`facetId`) REFERENCES `Facet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `FacetArtImage` ADD CONSTRAINT `FacetArtImage_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `FacetArtCollection` ADD CONSTRAINT `FacetArtCollection_facetId_fkey` FOREIGN KEY (`facetId`) REFERENCES `Facet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `FacetArtCollection` ADD CONSTRAINT `FacetArtCollection_artCollectionId_fkey` FOREIGN KEY (`artCollectionId`) REFERENCES `ArtCollection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `FacetRelation` ADD CONSTRAINT `FacetRelation_fromFacetId_fkey` FOREIGN KEY (`fromFacetId`) REFERENCES `Facet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `FacetRelation` ADD CONSTRAINT `FacetRelation_toFacetId_fkey` FOREIGN KEY (`toFacetId`) REFERENCES `Facet`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Chat` ADD CONSTRAINT `Chat_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_narratorId_fkey` FOREIGN KEY (`narratorId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `PitchSheet` ADD CONSTRAINT `PitchSheet_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_facetId_fkey` FOREIGN KEY (`facetId`) REFERENCES `Facet`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Todo` ADD CONSTRAINT `Todo_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ArtJob` ADD CONSTRAINT `ArtJob_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
