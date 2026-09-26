CREATE TABLE `TzaddikCandidate` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `displayName` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `lifeState` ENUM('LIVING','MEMORIAL','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  `deathDate` DATETIME(3) NULL,
  `rationale` TEXT NOT NULL,
  `biography` TEXT NULL,
  `objections` TEXT NULL,
  `objectionsSourceUrl` VARCHAR(2048) NULL,
  `wikipediaUrl` VARCHAR(2048) NOT NULL,
  `wikipediaPageId` VARCHAR(64) NULL,
  `wikipediaRevisionId` VARCHAR(64) NULL,
  `sourceSnapshotJson` LONGTEXT NULL,
  `sourceCheckedAt` DATETIME(3) NULL,
  `imageSourceUrl` VARCHAR(2048) NULL,
  `imageFileUrl` VARCHAR(2048) NULL,
  `imageLicense` VARCHAR(255) NULL,
  `imageAttribution` TEXT NULL,
  `imageRevisionId` VARCHAR(64) NULL,
  `countryCode` VARCHAR(2) NULL,
  `region` VARCHAR(128) NULL,
  `curationState` ENUM('PENDING','APPROVED','ARCHIVED') NOT NULL DEFAULT 'PENDING',
  `submittedByUserId` INTEGER NULL,
  `suggestedBy` VARCHAR(255) NULL,
  `acceptedByUserId` INTEGER NULL,
  `displayNameOverride` VARCHAR(255) NULL,
  `biographyOverride` TEXT NULL,
  `rationaleOverride` TEXT NULL,
  `objectionsOverride` TEXT NULL,
  `imageUrlOverride` VARCHAR(2048) NULL,
  `overrideNote` TEXT NULL,
  `overrideUpdatedByUserId` INTEGER NULL,
  `overrideUpdatedAt` DATETIME(3) NULL,
  UNIQUE INDEX `TzaddikCandidate_slug_key`(`slug`),
  INDEX `TzaddikCandidate_lifeState_curationState_idx`(`lifeState`,`curationState`),
  INDEX `TzaddikCandidate_curationState_createdAt_idx`(`curationState`,`createdAt`),
  INDEX `TzaddikCandidate_submittedByUserId_idx`(`submittedByUserId`),
  INDEX `TzaddikCandidate_countryCode_region_idx`(`countryCode`,`region`),
  INDEX `TzaddikCandidate_sourceCheckedAt_idx`(`sourceCheckedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TzaddikCandidateTag` (
  `candidateId` INTEGER NOT NULL,
  `tag` ENUM('POLITICS','POP_CULTURE','HUMANITARIAN','SCIENCE_MEDICINE','EDUCATION','ENVIRONMENT','CIVIL_RIGHTS_JUSTICE','PEACE_DIPLOMACY','COMMUNITY_MUTUAL_AID','ARTS_CULTURE','JOURNALISM_TRUTH','COURAGE_RESCUE') NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `TzaddikCandidateTag_tag_idx`(`tag`),
  PRIMARY KEY (`candidateId`,`tag`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TzaddikRecheckRequest` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `candidateId` INTEGER NOT NULL,
  `requestedByUserId` INTEGER NOT NULL,
  `status` ENUM('PENDING','CHECKING','NO_CHANGE','UPDATED','NEEDS_REVIEW','FAILED') NOT NULL DEFAULT 'PENDING',
  `startedAt` DATETIME(3) NULL,
  `completedAt` DATETIME(3) NULL,
  `sourceRevisionBefore` VARCHAR(64) NULL,
  `sourceRevisionAfter` VARCHAR(64) NULL,
  `resultJson` LONGTEXT NULL,
  `error` TEXT NULL,
  INDEX `TzaddikRecheckRequest_candidateId_status_createdAt_idx`(`candidateId`,`status`,`createdAt`),
  INDEX `TzaddikRecheckRequest_requestedByUserId_createdAt_idx`(`requestedByUserId`,`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `TzaddikCandidateTag` ADD CONSTRAINT `TzaddikCandidateTag_candidateId_fkey` FOREIGN KEY (`candidateId`) REFERENCES `TzaddikCandidate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `TzaddikRecheckRequest` ADD CONSTRAINT `TzaddikRecheckRequest_candidateId_fkey` FOREIGN KEY (`candidateId`) REFERENCES `TzaddikCandidate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
