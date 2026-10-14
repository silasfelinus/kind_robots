-- Additive Zuzu World Studio production usage (kind_robots #3388): how a
-- project uses a shared ArtImage. All columns are nullable so the running
-- build keeps reading and writing ProjectArtImage unchanged; a NULL role is a
-- general project reference, exactly what every existing row already means.
-- AlterTable
ALTER TABLE `ProjectArtImage` ADD COLUMN `pinnedVersion` VARCHAR(64) NULL,
    ADD COLUMN `role` VARCHAR(32) NULL,
    ADD COLUMN `slot` VARCHAR(120) NULL;
