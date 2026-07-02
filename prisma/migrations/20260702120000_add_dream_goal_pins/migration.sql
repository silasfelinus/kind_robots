-- Project Dreams gain a concrete definition of done (`goal`) and a
-- lightweight roadmap (`pins`: pipe-delimited step strings, "✓ " prefix = done).

ALTER TABLE `Dream`
  ADD COLUMN `goal` TEXT NULL,
  ADD COLUMN `pins` TEXT NULL;
