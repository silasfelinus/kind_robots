-- cthulhuquarium/t-071: click-for-coins collect anchor plus the food and
-- drop-speed upgrade levels. Additive only, defaults keep existing tanks at
-- level 0 with a full first bank of scales.
ALTER TABLE `Aquarium` ADD COLUMN `collectAnchorAt` DATETIME(3) NULL,
    ADD COLUMN `foodLevel` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `dropSpeedLevel` INTEGER NOT NULL DEFAULT 0;
