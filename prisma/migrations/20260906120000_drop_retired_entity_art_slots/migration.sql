-- Entity art slot collapse: drop the retired card/hero/icon columns.
--
-- Every object now carries ONE primary render, cropped per frame at display
-- time, plus an inspiration gallery (EntityArtImage). The four-slots-per-object
-- model cost four renders each for no display benefit -- the frames differ, but
-- the picture does not need to.
--
-- SAFE TO RUN because the data migration already completed and was verified
-- against production on 2026-09-06:
--   * 1,820 card/hero/icon renders were linked into EntityArtImage, so every
--     one of them remains reachable as an inspiration entry. No ArtImage row is
--     touched by this migration -- only the entity columns that pointed at them.
--   * each of those images was retagged from `entity:<type>:<id>:current:<field>`
--     to `entity:<type>:<id>:history:<field>:<timestamp>` BEFORE its column was
--     cleared, so none can fall to the unfiled landing zone that the container
--     triage pass deletes, and the field it used to serve is still recorded.
--   * all 917 objects were confirmed to hold a primary render, so none can go
--     blank as a result of this drop.
--   * every column below was then verified empty in production.
--
-- ONE EXCEPTION, deliberately accepted: Facet 16 ("Circus") holds a bare
-- `cardPath` string with no ArtImage row behind it, so the fail-closed clearing
-- guard refused to touch it -- there was no id to link or verify. Dropping the
-- column discards that one path string. The image it points at is not deleted;
-- it simply stops being referenced from the Facet row.
--
-- These columns carry no foreign-key constraints (plain nullable Int/Text in
-- schema.prisma, no @relation), so no constraint has to be dropped first.

ALTER TABLE `Character`
    DROP COLUMN `cardPath`,
    DROP COLUMN `heroPath`,
    DROP COLUMN `iconPath`,
    DROP COLUMN `cardArtImageId`,
    DROP COLUMN `heroArtImageId`,
    DROP COLUMN `iconArtImageId`;

ALTER TABLE `Bot`
    DROP COLUMN `cardPath`,
    DROP COLUMN `heroPath`,
    DROP COLUMN `iconPath`,
    DROP COLUMN `cardArtImageId`,
    DROP COLUMN `heroArtImageId`,
    DROP COLUMN `iconArtImageId`;

ALTER TABLE `Scenario`
    DROP COLUMN `cardPath`,
    DROP COLUMN `heroPath`,
    DROP COLUMN `iconPath`,
    DROP COLUMN `cardArtImageId`,
    DROP COLUMN `heroArtImageId`,
    DROP COLUMN `iconArtImageId`;

ALTER TABLE `Reward`
    DROP COLUMN `cardPath`,
    DROP COLUMN `heroPath`,
    DROP COLUMN `iconPath`,
    DROP COLUMN `cardArtImageId`,
    DROP COLUMN `heroArtImageId`,
    DROP COLUMN `iconArtImageId`;

ALTER TABLE `Facet`
    DROP COLUMN `cardPath`,
    DROP COLUMN `heroPath`,
    DROP COLUMN `iconPath`,
    DROP COLUMN `cardArtImageId`,
    DROP COLUMN `heroArtImageId`,
    DROP COLUMN `iconArtImageId`;

-- Dream never carried per-slot ArtImage foreign keys, only the three paths,
-- and the live census found all three empty across every Dream.
ALTER TABLE `Dream`
    DROP COLUMN `cardPath`,
    DROP COLUMN `heroPath`,
    DROP COLUMN `iconPath`;

-- Project is intentionally NOT included. It keeps its own art flow and its own
-- ProjectArtImage gallery, and its columns were never part of this collapse.
