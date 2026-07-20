-- Remove redundant Component status booleans after canonical production verification.
-- Component.status is NOT NULL and was backfilled before this contract migration.

ALTER TABLE `Component`
  DROP COLUMN `isWorking`,
  DROP COLUMN `underConstruction`,
  DROP COLUMN `isBroken`;
