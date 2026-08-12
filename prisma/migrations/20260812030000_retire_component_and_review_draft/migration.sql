-- Retire the WonderLab Component/ReviewDraft storage after the comment corpus
-- moved to checked-in config/wonderlab-voice-polish-batch-*.json evidence.
--
-- Order matters: ReviewDraft.componentId is NOT NULL with ON DELETE RESTRICT,
-- and Reaction.componentId also references Component. Remove those dependents
-- before dropping Component itself.

DROP TABLE IF EXISTS `ReviewDraft`;

-- Component reactions were museum reviews. They are intentionally retired with
-- the museum rather than converted into targetless Reaction rows.
DELETE FROM `Reaction`
WHERE `componentId` IS NOT NULL
   OR `reactionCategory` = 'COMPONENT';

ALTER TABLE `Reaction`
  DROP FOREIGN KEY `Reaction_componentId_fkey`;

ALTER TABLE `Reaction`
  DROP COLUMN `componentId`;

DROP TABLE `Component`;
