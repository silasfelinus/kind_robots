-- Optional slugs for cross-system identity (tier 1):
-- ArtCollection, Scenario, and Resource get a nullable unique `slug`;
-- Milestone's existing `triggerCode` is formalized as its unique key.

ALTER TABLE `ArtCollection`
  ADD COLUMN `slug` VARCHAR(255) NULL;

CREATE UNIQUE INDEX `ArtCollection_slug_key` ON `ArtCollection`(`slug`);

ALTER TABLE `Scenario`
  ADD COLUMN `slug` VARCHAR(255) NULL;

CREATE UNIQUE INDEX `Scenario_slug_key` ON `Scenario`(`slug`);

ALTER TABLE `Resource`
  ADD COLUMN `slug` VARCHAR(255) NULL;

CREATE UNIQUE INDEX `Resource_slug_key` ON `Resource`(`slug`);

-- Milestone.triggerCode becomes the canonical trigger key.
-- Backfill missing codes from the label, then de-duplicate before indexing.

UPDATE `Milestone`
SET `triggerCode` = TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(TRIM(`label`)), '[^a-z0-9]+', '-'))
WHERE `triggerCode` IS NULL OR TRIM(`triggerCode`) = '';

UPDATE `Milestone` `m`
JOIN (
  SELECT `triggerCode`, MIN(`id`) AS `keep_id`
  FROM `Milestone`
  WHERE `triggerCode` IS NOT NULL
  GROUP BY `triggerCode`
  HAVING COUNT(*) > 1
) `dupes`
  ON `m`.`triggerCode` = `dupes`.`triggerCode`
 AND `m`.`id` <> `dupes`.`keep_id`
SET `m`.`triggerCode` = CONCAT(`m`.`triggerCode`, '-', `m`.`id`);

CREATE UNIQUE INDEX `Milestone_triggerCode_key` ON `Milestone`(`triggerCode`(255));
