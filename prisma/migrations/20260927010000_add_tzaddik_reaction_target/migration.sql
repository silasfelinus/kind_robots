-- Adds TzaddikCandidate as a reaction target, ahead of t-005 (detail view) and
-- t-006 (submission workflow) both needing to attach reactions to a
-- TzaddikCandidate. Same expand-only shape as
-- 20260719031500_reaction_first_party_author_expand: add the column, index
-- it, then add the foreign key.

ALTER TABLE `Reaction`
  ADD COLUMN `tzaddikCandidateId` INTEGER NULL;

CREATE INDEX `Reaction_tzaddikCandidateId_fkey` ON `Reaction`(`tzaddikCandidateId`);

ALTER TABLE `Reaction`
  ADD CONSTRAINT `Reaction_tzaddikCandidateId_fkey`
    FOREIGN KEY (`tzaddikCandidateId`) REFERENCES `TzaddikCandidate`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Restates the full live enum (including the pre-existing dead COMPONENT/
-- COMPOSITION/POST values documented in
-- 20260821230000_retire_butterfly_reaction_target -- out of scope here, left
-- for that migration's own named follow-up) plus the new TZADDIK value.
-- MariaDB has no ADD VALUE for an enum, so narrowing or widening it means
-- restating the whole list.
ALTER TABLE `Reaction`
  MODIFY COLUMN `reactionCategory` ENUM(
    'ART_IMAGE',
    'ART_COLLECTION',
    'BOT',
    'CHALLENGE_SUBMISSION',
    'CHARACTER',
    'CHAT_EXCHANGE',
    'COMPONENT',
    'COMPOSITION',
    'DREAM',
    'FACET',
    'PROJECT',
    'MESSAGE',
    'POST',
    'PROMPT',
    'RESOURCE',
    'REWARD',
    'SCENARIO',
    'THEME',
    'TZADDIK'
  ) NOT NULL DEFAULT 'ART_IMAGE';
