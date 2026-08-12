-- WonderLab/Component is retired. The 39 checked-in voice-corpus JSON files
-- are the canonical migration source and do not depend on these database rows.

-- ReviewDraft.componentId is NOT NULL with a RESTRICT FK to Component, so the
-- draft table must disappear before Component can be dropped.
DROP TABLE IF EXISTS `ReviewDraft`;

-- Component reactions are historical museum reviews. Their useful prose survives
-- in config/wonderlab-voice-polish-batch-001.json through -039.json.
DELETE FROM `Reaction`
WHERE `componentId` IS NOT NULL
   OR `reactionCategory` = 'COMPONENT';

ALTER TABLE `Reaction`
  DROP FOREIGN KEY `Reaction_componentId_fkey`;

ALTER TABLE `Reaction`
  DROP INDEX `Reaction_componentId_fkey`,
  DROP COLUMN `componentId`;

DROP TABLE `Component`;
