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
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Reaction_firstPartyAuthor_check`
    CHECK (`authorBotId` IS NULL OR `authorCharacterId` IS NULL);
