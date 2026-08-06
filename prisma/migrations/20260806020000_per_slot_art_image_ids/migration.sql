-- Give each secondary art slot its own ArtImage id.
--
-- Silas, 2026-08-06, approving this: entity art fields should point at the
-- real file on the media share (/images/{context}/{slug}/{slug}-card-1.webp)
-- rather than at /api/art/images/<id>/file?v=<ts>.
--
-- THE COUPLING THIS BREAKS. Today that API URL does double duty: it renders
-- the image AND encodes which ArtImage the slot holds, which entityArt.ts
-- reads back out with imageIdFromPath(). Only the PRIMARY slot has a real
-- column (artImageId); cardPath, heroPath and iconPath have nowhere else to
-- keep it. So replacing those URLs with static paths would make
-- currentArtImageId() fall through to the record's primary artImageId, and the
-- next overwrite of a card would archive the portrait instead of the card.
--
-- Three nullable columns per model give each slot somewhere to put its id, so
-- the path field goes back to being just a path.
--
-- SAFETY: purely additive. Eighteen nullable columns; no existing table,
-- column, or row is touched. Until the backfill runs they are all NULL, and
-- currentArtImageId() falls back to parsing the path exactly as it does today
-- -- so this migration alone changes no behaviour.
--
-- Deliberately NOT foreign keys. These are provenance pointers, and a deleted
-- ArtImage should leave a dangling id that history resolution can report as
-- missing, rather than cascade-nulling the record of what used to be there or
-- blocking the delete. The primary artImageId is a real relation because it is
-- the record's live image; these are not.
--
-- Achievement is absent on purpose: it has only a primary imagePath, no
-- secondary slots.
--
-- 2026-08-06, second attempt. The first failed at the Facet backfill with
-- error 1292, "Truncated incorrect INTEGER value: ''".
--
-- TWO REAL BUGS, both mine:
--
-- 1. MariaDB's REGEXP_SUBSTR returns an EMPTY STRING when nothing matches;
--    MySQL returns NULL. CAST('' AS UNSIGNED) is a hard error under strict
--    mode, so any row whose path column held a non-empty value that was not an
--    API URL killed the statement. Bot, Character, Scenario and Reward survived
--    only because their paths happened to be NULL or all real API URLs.
--
-- 2. Nothing guarded the extraction, so a path containing something other than
--    digits after /api/art/images/ would have failed the same way.
--
-- Both are gone: no regex extraction at all (nested SUBSTRING_INDEX works
-- identically on MariaDB and MySQL), and every UPDATE is gated on RLIKE so it
-- only touches rows that genuinely carry a numeric ArtImage id.
--
-- The ALTERs use IF NOT EXISTS because the first attempt applied all eighteen
-- columns before dying on the backfill -- DDL is not transactional here, so a
-- failed migration leaves real changes behind. Re-running must be a no-op on
-- what already landed.


-- AlterTable
ALTER TABLE `Bot`
  ADD COLUMN IF NOT EXISTS `cardArtImageId` INTEGER NULL,
  ADD COLUMN IF NOT EXISTS `heroArtImageId` INTEGER NULL,
  ADD COLUMN IF NOT EXISTS `iconArtImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Character`
  ADD COLUMN IF NOT EXISTS `cardArtImageId` INTEGER NULL,
  ADD COLUMN IF NOT EXISTS `heroArtImageId` INTEGER NULL,
  ADD COLUMN IF NOT EXISTS `iconArtImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Scenario`
  ADD COLUMN IF NOT EXISTS `cardArtImageId` INTEGER NULL,
  ADD COLUMN IF NOT EXISTS `heroArtImageId` INTEGER NULL,
  ADD COLUMN IF NOT EXISTS `iconArtImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Reward`
  ADD COLUMN IF NOT EXISTS `cardArtImageId` INTEGER NULL,
  ADD COLUMN IF NOT EXISTS `heroArtImageId` INTEGER NULL,
  ADD COLUMN IF NOT EXISTS `iconArtImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Facet`
  ADD COLUMN IF NOT EXISTS `cardArtImageId` INTEGER NULL,
  ADD COLUMN IF NOT EXISTS `heroArtImageId` INTEGER NULL,
  ADD COLUMN IF NOT EXISTS `iconArtImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Project`
  ADD COLUMN IF NOT EXISTS `cardArtImageId` INTEGER NULL,
  ADD COLUMN IF NOT EXISTS `heroArtImageId` INTEGER NULL,
  ADD COLUMN IF NOT EXISTS `iconArtImageId` INTEGER NULL;

-- Backfill from the only place these ids currently live: the API URLs
-- already sitting in the path columns. /api/art/images/1234/file?v=... ->
-- 1234. The RLIKE gate means a row without one is simply left NULL rather
-- than cast from a non-numeric fragment.

UPDATE `Bot` SET `cardArtImageId` = CAST(
    SUBSTRING_INDEX(SUBSTRING_INDEX(`cardPath`, '/api/art/images/', -1), '/', 1)
  AS UNSIGNED)
  WHERE `cardPath` RLIKE '/api/art/images/[0-9]+/';

UPDATE `Bot` SET `heroArtImageId` = CAST(
    SUBSTRING_INDEX(SUBSTRING_INDEX(`heroPath`, '/api/art/images/', -1), '/', 1)
  AS UNSIGNED)
  WHERE `heroPath` RLIKE '/api/art/images/[0-9]+/';

UPDATE `Bot` SET `iconArtImageId` = CAST(
    SUBSTRING_INDEX(SUBSTRING_INDEX(`iconPath`, '/api/art/images/', -1), '/', 1)
  AS UNSIGNED)
  WHERE `iconPath` RLIKE '/api/art/images/[0-9]+/';

UPDATE `Character` SET `cardArtImageId` = CAST(
    SUBSTRING_INDEX(SUBSTRING_INDEX(`cardPath`, '/api/art/images/', -1), '/', 1)
  AS UNSIGNED)
  WHERE `cardPath` RLIKE '/api/art/images/[0-9]+/';

UPDATE `Character` SET `heroArtImageId` = CAST(
    SUBSTRING_INDEX(SUBSTRING_INDEX(`heroPath`, '/api/art/images/', -1), '/', 1)
  AS UNSIGNED)
  WHERE `heroPath` RLIKE '/api/art/images/[0-9]+/';

UPDATE `Character` SET `iconArtImageId` = CAST(
    SUBSTRING_INDEX(SUBSTRING_INDEX(`iconPath`, '/api/art/images/', -1), '/', 1)
  AS UNSIGNED)
  WHERE `iconPath` RLIKE '/api/art/images/[0-9]+/';

UPDATE `Scenario` SET `cardArtImageId` = CAST(
    SUBSTRING_INDEX(SUBSTRING_INDEX(`cardPath`, '/api/art/images/', -1), '/', 1)
  AS UNSIGNED)
  WHERE `cardPath` RLIKE '/api/art/images/[0-9]+/';

UPDATE `Scenario` SET `heroArtImageId` = CAST(
    SUBSTRING_INDEX(SUBSTRING_INDEX(`heroPath`, '/api/art/images/', -1), '/', 1)
  AS UNSIGNED)
  WHERE `heroPath` RLIKE '/api/art/images/[0-9]+/';

UPDATE `Scenario` SET `iconArtImageId` = CAST(
    SUBSTRING_INDEX(SUBSTRING_INDEX(`iconPath`, '/api/art/images/', -1), '/', 1)
  AS UNSIGNED)
  WHERE `iconPath` RLIKE '/api/art/images/[0-9]+/';

UPDATE `Reward` SET `cardArtImageId` = CAST(
    SUBSTRING_INDEX(SUBSTRING_INDEX(`cardPath`, '/api/art/images/', -1), '/', 1)
  AS UNSIGNED)
  WHERE `cardPath` RLIKE '/api/art/images/[0-9]+/';

UPDATE `Reward` SET `heroArtImageId` = CAST(
    SUBSTRING_INDEX(SUBSTRING_INDEX(`heroPath`, '/api/art/images/', -1), '/', 1)
  AS UNSIGNED)
  WHERE `heroPath` RLIKE '/api/art/images/[0-9]+/';

UPDATE `Reward` SET `iconArtImageId` = CAST(
    SUBSTRING_INDEX(SUBSTRING_INDEX(`iconPath`, '/api/art/images/', -1), '/', 1)
  AS UNSIGNED)
  WHERE `iconPath` RLIKE '/api/art/images/[0-9]+/';

UPDATE `Facet` SET `cardArtImageId` = CAST(
    SUBSTRING_INDEX(SUBSTRING_INDEX(`cardPath`, '/api/art/images/', -1), '/', 1)
  AS UNSIGNED)
  WHERE `cardPath` RLIKE '/api/art/images/[0-9]+/';

UPDATE `Facet` SET `heroArtImageId` = CAST(
    SUBSTRING_INDEX(SUBSTRING_INDEX(`heroPath`, '/api/art/images/', -1), '/', 1)
  AS UNSIGNED)
  WHERE `heroPath` RLIKE '/api/art/images/[0-9]+/';

UPDATE `Facet` SET `iconArtImageId` = CAST(
    SUBSTRING_INDEX(SUBSTRING_INDEX(`iconPath`, '/api/art/images/', -1), '/', 1)
  AS UNSIGNED)
  WHERE `iconPath` RLIKE '/api/art/images/[0-9]+/';

UPDATE `Project` SET `cardArtImageId` = CAST(
    SUBSTRING_INDEX(SUBSTRING_INDEX(`cardPath`, '/api/art/images/', -1), '/', 1)
  AS UNSIGNED)
  WHERE `cardPath` RLIKE '/api/art/images/[0-9]+/';

UPDATE `Project` SET `heroArtImageId` = CAST(
    SUBSTRING_INDEX(SUBSTRING_INDEX(`heroPath`, '/api/art/images/', -1), '/', 1)
  AS UNSIGNED)
  WHERE `heroPath` RLIKE '/api/art/images/[0-9]+/';

UPDATE `Project` SET `iconArtImageId` = CAST(
    SUBSTRING_INDEX(SUBSTRING_INDEX(`iconPath`, '/api/art/images/', -1), '/', 1)
  AS UNSIGNED)
  WHERE `iconPath` RLIKE '/api/art/images/[0-9]+/';
