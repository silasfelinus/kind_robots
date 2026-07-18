-- Expand Component with canonical WonderLab status and source metadata.
-- This is intentionally additive: legacy status booleans and componentName
-- uniqueness remain in place until every runtime caller has migrated.

ALTER TABLE `Component`
  ADD COLUMN `slug` VARCHAR(255) NULL,
  ADD COLUMN `sourcePath` VARCHAR(764) NULL,
  ADD COLUMN `sourceKey` VARCHAR(764) NULL,
  ADD COLUMN `sourceHash` VARCHAR(64) NULL,
  ADD COLUMN `status` ENUM(
    'UNREVIEWED',
    'WORKING',
    'NEEDS_CONTEXT',
    'UNDER_CONSTRUCTION',
    'BROKEN',
    'RETIRED',
    'PREVIEW_UNSUPPORTED'
  ) NOT NULL DEFAULT 'UNREVIEWED',
  ADD COLUMN `statusReason` TEXT NULL,
  ADD COLUMN `description` TEXT NULL,
  ADD COLUMN `category` VARCHAR(255) NULL,
  ADD COLUMN `tags` JSON NULL,
  ADD COLUMN `previewMode` VARCHAR(64) NULL,
  ADD COLUMN `previewConfig` JSON NULL,
  ADD COLUMN `lastSeenAt` DATETIME(3) NULL,
  ADD COLUMN `isDiscovered` BOOLEAN NOT NULL DEFAULT false;

-- Deterministic compatibility backfill. Contradictory legacy rows follow the
-- documented precedence: broken > under construction > working > unreviewed.
UPDATE `Component`
SET `status` = CASE
  WHEN `isBroken` = true THEN 'BROKEN'
  WHEN `underConstruction` = true THEN 'UNDER_CONSTRUCTION'
  WHEN `isWorking` = true THEN 'WORKING'
  ELSE 'UNREVIEWED'
END;

CREATE UNIQUE INDEX `Component_slug_key` ON `Component`(`slug`);
CREATE UNIQUE INDEX `Component_sourceKey_key` ON `Component`(`sourceKey`);
CREATE INDEX `Component_status_idx` ON `Component`(`status`);
CREATE INDEX `Component_sourcePath_idx` ON `Component`(`sourcePath`);
CREATE INDEX `Component_lastSeenAt_idx` ON `Component`(`lastSeenAt`);
CREATE INDEX `Component_isDiscovered_idx` ON `Component`(`isDiscovered`);
