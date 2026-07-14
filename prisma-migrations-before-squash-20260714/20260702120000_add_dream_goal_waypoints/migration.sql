-- Project Dreams gain a concrete definition of done (`goal`) and a lightweight
-- roadmap (`waypoints`: pipe-delimited step strings; "✓ " prefix = done,
-- "~ " prefix = in progress, plain = pending).

ALTER TABLE `Dream`
  ADD COLUMN `goal` TEXT NULL,
  ADD COLUMN `waypoints` TEXT NULL;
