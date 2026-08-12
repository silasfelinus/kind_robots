-- Reviews on by default, and reviewable Resources.
--
-- `allowReviews` shipped as `Boolean @default(false)` on all seven models that
-- carry it, and every create route wrote that default. The result: the flag is
-- literally `false` on all 257 Rewards, 226 Characters and 69 Bots in
-- production, every `#reviews` slot in the galleries is guarded by
-- `allowReviews !== false`, and the review UI has therefore never rendered for
-- anyone. The feature was built and switched off by a column default.
--
-- Silas, 2026-08-11: reviews default on, owners opt out.
--
-- The backfill touches public rows only. It cannot distinguish "an owner
-- deliberately turned reviews off" from "nobody ever touched this column",
-- because the two are identical in the data -- but since no review affordance
-- has ever been visible, there was nothing for an owner to turn off. Private
-- rows are left alone regardless.

-- 1. Resource joins the reviewable models. It is the one comment target with no
--    such column, so a Resource could never opt out of anything.
ALTER TABLE `Resource`
  ADD COLUMN `allowReviews` BOOLEAN NOT NULL DEFAULT true;

-- 2. New rows default to reviews on.
ALTER TABLE `Bot`       ALTER COLUMN `allowReviews` SET DEFAULT true;
ALTER TABLE `Character` ALTER COLUMN `allowReviews` SET DEFAULT true;
ALTER TABLE `Dream`     ALTER COLUMN `allowReviews` SET DEFAULT true;
ALTER TABLE `Project`   ALTER COLUMN `allowReviews` SET DEFAULT true;
ALTER TABLE `Facet`     ALTER COLUMN `allowReviews` SET DEFAULT true;
ALTER TABLE `Reward`    ALTER COLUMN `allowReviews` SET DEFAULT true;
ALTER TABLE `Scenario`  ALTER COLUMN `allowReviews` SET DEFAULT true;

-- 3. Existing public rows catch up with the new default.
UPDATE `Bot`       SET `allowReviews` = true WHERE `isPublic` = true AND `allowReviews` = false;
UPDATE `Character` SET `allowReviews` = true WHERE `isPublic` = true AND `allowReviews` = false;
UPDATE `Dream`     SET `allowReviews` = true WHERE `isPublic` = true AND `allowReviews` = false;
UPDATE `Project`   SET `allowReviews` = true WHERE `isPublic` = true AND `allowReviews` = false;
UPDATE `Facet`     SET `allowReviews` = true WHERE `isPublic` = true AND `allowReviews` = false;
UPDATE `Reward`    SET `allowReviews` = true WHERE `isPublic` = true AND `allowReviews` = false;
UPDATE `Scenario`  SET `allowReviews` = true WHERE `isPublic` = true AND `allowReviews` = false;
