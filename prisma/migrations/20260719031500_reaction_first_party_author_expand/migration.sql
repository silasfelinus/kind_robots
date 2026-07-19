-- Expand-only migration for first-party Bot/Character review authorship.
-- Reaction.userId remains the authenticated publisher/accountability identity.
-- Existing human and target-relation fields are unchanged.

ALTER TABLE `Reaction`
  ADD COLUMN `authorBotId` INTEGER NULL,
  ADD COLUMN `authorCharacterId` INTEGER NULL;

CREATE INDEX `Reaction_authorBotId_idx` ON `Reaction`(`authorBotId`);
CREATE INDEX `Reaction_authorCharacterId_idx` ON `Reaction`(`authorCharacterId`);

ALTER TABLE `Reaction`
  ADD CONSTRAINT `Reaction_authorBotId_fkey`
    FOREIGN KEY (`authorBotId`) REFERENCES `Bot`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Reaction_authorCharacterId_fkey`
    FOREIGN KEY (`authorCharacterId`) REFERENCES `Character`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- MariaDB rejects a CHECK constraint on a column that also carries a FOREIGN
-- KEY (error 1901, "Function or expression '<col>' cannot be used in the
-- CHECK clause"), in either statement order. Enforce the same "at most one
-- first-party author" invariant with triggers instead.
CREATE TRIGGER `Reaction_firstPartyAuthor_check_ins` BEFORE INSERT ON `Reaction`
FOR EACH ROW
BEGIN
  IF NEW.`authorBotId` IS NOT NULL AND NEW.`authorCharacterId` IS NOT NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Reaction_firstPartyAuthor_check: authorBotId and authorCharacterId cannot both be set';
  END IF;
END;

CREATE TRIGGER `Reaction_firstPartyAuthor_check_upd` BEFORE UPDATE ON `Reaction`
FOR EACH ROW
BEGIN
  IF NEW.`authorBotId` IS NOT NULL AND NEW.`authorCharacterId` IS NOT NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Reaction_firstPartyAuthor_check: authorBotId and authorCharacterId cannot both be set';
  END IF;
END;
