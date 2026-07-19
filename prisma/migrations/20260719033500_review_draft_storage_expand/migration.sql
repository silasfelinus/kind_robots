-- Expand-only storage for editorially reviewed first-party Component commentary.
-- No generation or publication path is introduced by this migration.

CREATE TABLE `ReviewDraft` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NULL,
  `status` ENUM('PROPOSED', 'APPROVED', 'REJECTED', 'PUBLISHED', 'FAILED', 'SUPERSEDED') NOT NULL DEFAULT 'PROPOSED',
  `draftKey` VARCHAR(191) NOT NULL,
  `componentId` INTEGER NOT NULL,
  `authorBotId` INTEGER NULL,
  `authorCharacterId` INTEGER NULL,
  `publisherUserId` INTEGER NULL,
  `publishedReactionId` INTEGER NULL,
  `promptVersion` VARCHAR(64) NOT NULL,
  `promptHash` VARCHAR(191) NOT NULL,
  `promptPayload` JSON NULL,
  `generatedComment` TEXT NOT NULL,
  `editedComment` TEXT NULL,
  `rating` INTEGER NOT NULL DEFAULT 0,
  `reactionType` VARCHAR(64) NULL,
  `generationModel` VARCHAR(191) NULL,
  `generationProvider` VARCHAR(64) NULL,
  `generationAttempt` INTEGER NOT NULL DEFAULT 1,
  `approvedAt` DATETIME(3) NULL,
  `rejectedAt` DATETIME(3) NULL,
  `publishedAt` DATETIME(3) NULL,
  `failureReason` TEXT NULL,

  UNIQUE INDEX `ReviewDraft_draftKey_key`(`draftKey`),
  INDEX `ReviewDraft_componentId_status_idx`(`componentId`, `status`),
  INDEX `ReviewDraft_authorBotId_idx`(`authorBotId`),
  INDEX `ReviewDraft_authorCharacterId_idx`(`authorCharacterId`),
  INDEX `ReviewDraft_publisherUserId_idx`(`publisherUserId`),
  INDEX `ReviewDraft_publishedReactionId_idx`(`publishedReactionId`),
  CONSTRAINT `ReviewDraft_rating_range_chk`
    CHECK (`rating` >= 0 AND `rating` <= 5),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ReviewDraft`
  ADD CONSTRAINT `ReviewDraft_componentId_fkey`
  FOREIGN KEY (`componentId`) REFERENCES `Component`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ReviewDraft`
  ADD CONSTRAINT `ReviewDraft_authorBotId_fkey`
  FOREIGN KEY (`authorBotId`) REFERENCES `Bot`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `ReviewDraft`
  ADD CONSTRAINT `ReviewDraft_authorCharacterId_fkey`
  FOREIGN KEY (`authorCharacterId`) REFERENCES `Character`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `ReviewDraft`
  ADD CONSTRAINT `ReviewDraft_publisherUserId_fkey`
  FOREIGN KEY (`publisherUserId`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `ReviewDraft`
  ADD CONSTRAINT `ReviewDraft_publishedReactionId_fkey`
  FOREIGN KEY (`publishedReactionId`) REFERENCES `Reaction`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- MariaDB rejects a CHECK constraint on a column that also carries a FOREIGN
-- KEY (error 1901, "Function or expression '<col>' cannot be used in the
-- CHECK clause"), regardless of statement order (see the sibling
-- 20260719031500_reaction_first_party_author_expand fix for the repro).
-- Enforce the original "exactly one first-party author" invariant with
-- triggers instead of the CHECK this table was created with above.
CREATE TRIGGER `ReviewDraft_single_author_chk_ins` BEFORE INSERT ON `ReviewDraft`
FOR EACH ROW
BEGIN
  IF (NEW.`authorBotId` IS NULL) = (NEW.`authorCharacterId` IS NULL) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'ReviewDraft_single_author_chk: exactly one of authorBotId/authorCharacterId must be set';
  END IF;
END;

CREATE TRIGGER `ReviewDraft_single_author_chk_upd` BEFORE UPDATE ON `ReviewDraft`
FOR EACH ROW
BEGIN
  IF (NEW.`authorBotId` IS NULL) = (NEW.`authorCharacterId` IS NULL) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'ReviewDraft_single_author_chk: exactly one of authorBotId/authorCharacterId must be set';
  END IF;
END;
