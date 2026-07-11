-- Preserve the Project Intent/Pitch field when Project-shaped Dreams are retired.
ALTER TABLE `Project`
  ADD COLUMN `pitch` TEXT NULL AFTER `description`;

-- Existing Project rows were backfilled from PROJECT Dreams before this column
-- existed. Copy the legacy intent additively; do not modify or remove the Dream.
UPDATE `Project` AS project
INNER JOIN `Dream` AS dream
  ON dream.`slug` = project.`slug`
  AND dream.`dreamType` = 'PROJECT'
SET project.`pitch` = dream.`pitch`
WHERE project.`pitch` IS NULL
  AND dream.`pitch` IS NOT NULL;
