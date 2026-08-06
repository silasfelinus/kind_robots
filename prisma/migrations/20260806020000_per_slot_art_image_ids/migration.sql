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

-- AlterTable
ALTER TABLE `Bot`
  ADD COLUMN `cardArtImageId` INTEGER NULL,
  ADD COLUMN `heroArtImageId` INTEGER NULL,
  ADD COLUMN `iconArtImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Character`
  ADD COLUMN `cardArtImageId` INTEGER NULL,
  ADD COLUMN `heroArtImageId` INTEGER NULL,
  ADD COLUMN `iconArtImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Scenario`
  ADD COLUMN `cardArtImageId` INTEGER NULL,
  ADD COLUMN `heroArtImageId` INTEGER NULL,
  ADD COLUMN `iconArtImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Reward`
  ADD COLUMN `cardArtImageId` INTEGER NULL,
  ADD COLUMN `heroArtImageId` INTEGER NULL,
  ADD COLUMN `iconArtImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Facet`
  ADD COLUMN `cardArtImageId` INTEGER NULL,
  ADD COLUMN `heroArtImageId` INTEGER NULL,
  ADD COLUMN `iconArtImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Project`
  ADD COLUMN `cardArtImageId` INTEGER NULL,
  ADD COLUMN `heroArtImageId` INTEGER NULL,
  ADD COLUMN `iconArtImageId` INTEGER NULL;

-- Backfill from the only place the ids currently live: the API URLs already in
-- the path columns. `/api/art/images/1234/file?v=...` -> 1234. Rows whose path
-- is empty, or already a static file, simply stay NULL.
UPDATE `Bot` SET
  `cardArtImageId` = CAST(REGEXP_SUBSTR(`cardPath`, '(?<=/api/art/images/)[0-9]+') AS UNSIGNED),
  `heroArtImageId` = CAST(REGEXP_SUBSTR(`heroPath`, '(?<=/api/art/images/)[0-9]+') AS UNSIGNED),
  `iconArtImageId` = CAST(REGEXP_SUBSTR(`iconPath`, '(?<=/api/art/images/)[0-9]+') AS UNSIGNED);

UPDATE `Character` SET
  `cardArtImageId` = CAST(REGEXP_SUBSTR(`cardPath`, '(?<=/api/art/images/)[0-9]+') AS UNSIGNED),
  `heroArtImageId` = CAST(REGEXP_SUBSTR(`heroPath`, '(?<=/api/art/images/)[0-9]+') AS UNSIGNED),
  `iconArtImageId` = CAST(REGEXP_SUBSTR(`iconPath`, '(?<=/api/art/images/)[0-9]+') AS UNSIGNED);

UPDATE `Scenario` SET
  `cardArtImageId` = CAST(REGEXP_SUBSTR(`cardPath`, '(?<=/api/art/images/)[0-9]+') AS UNSIGNED),
  `heroArtImageId` = CAST(REGEXP_SUBSTR(`heroPath`, '(?<=/api/art/images/)[0-9]+') AS UNSIGNED),
  `iconArtImageId` = CAST(REGEXP_SUBSTR(`iconPath`, '(?<=/api/art/images/)[0-9]+') AS UNSIGNED);

UPDATE `Reward` SET
  `cardArtImageId` = CAST(REGEXP_SUBSTR(`cardPath`, '(?<=/api/art/images/)[0-9]+') AS UNSIGNED),
  `heroArtImageId` = CAST(REGEXP_SUBSTR(`heroPath`, '(?<=/api/art/images/)[0-9]+') AS UNSIGNED),
  `iconArtImageId` = CAST(REGEXP_SUBSTR(`iconPath`, '(?<=/api/art/images/)[0-9]+') AS UNSIGNED);

UPDATE `Facet` SET
  `cardArtImageId` = CAST(REGEXP_SUBSTR(`cardPath`, '(?<=/api/art/images/)[0-9]+') AS UNSIGNED),
  `heroArtImageId` = CAST(REGEXP_SUBSTR(`heroPath`, '(?<=/api/art/images/)[0-9]+') AS UNSIGNED),
  `iconArtImageId` = CAST(REGEXP_SUBSTR(`iconPath`, '(?<=/api/art/images/)[0-9]+') AS UNSIGNED);

UPDATE `Project` SET
  `cardArtImageId` = CAST(REGEXP_SUBSTR(`cardPath`, '(?<=/api/art/images/)[0-9]+') AS UNSIGNED),
  `heroArtImageId` = CAST(REGEXP_SUBSTR(`heroPath`, '(?<=/api/art/images/)[0-9]+') AS UNSIGNED),
  `iconArtImageId` = CAST(REGEXP_SUBSTR(`iconPath`, '(?<=/api/art/images/)[0-9]+') AS UNSIGNED);
