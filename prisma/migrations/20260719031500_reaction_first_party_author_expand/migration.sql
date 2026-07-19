-- Expand-only migration for first-party Bot/Character review authorship.
-- Reaction.userId remains the authenticated publisher/accountability identity.
-- Existing human and target-relation fields are unchanged.

ALTER TABLE `Reaction`
  ADD COLUMN `authorBotId` INTEGER NULL,
  ADD COLUMN `authorCharacterId` INTEGER NULL;

CREATE INDEX `Reaction_authorBotId_idx` ON `Reaction`(`authorBotId`);
CREATE INDEX `Reaction_authorCharacterId_idx` ON `Reaction`(`authorCharacterId`);

-- NOTE: no CHECK constraint here. MariaDB rejects (error 1901,
-- ER_CHECK_CONSTRAINT_FUNCTION_IS_NOT_ALLOWED) a CHECK constraint that
-- references a column which also carries an ON DELETE SET NULL or ON UPDATE
-- CASCADE foreign-key action, which both `authorBotId` and
-- `authorCharacterId` have below. Mutual exclusivity (at most one of the
-- two set) is enforced in application code instead by
-- assertSingleFirstPartyReactionAuthor() in
-- utils/reactions/firstPartyReactionAuthor.ts.
ALTER TABLE `Reaction`
  ADD CONSTRAINT `Reaction_authorBotId_fkey`
    FOREIGN KEY (`authorBotId`) REFERENCES `Bot`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Reaction_authorCharacterId_fkey`
    FOREIGN KEY (`authorCharacterId`) REFERENCES `Character`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
