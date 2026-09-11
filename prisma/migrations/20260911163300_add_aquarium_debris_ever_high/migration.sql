-- cthulhuquarium/t-074: sticky "has debris ever reached the
-- first_spotless_tank threshold" flag, additive only.
ALTER TABLE `Aquarium` ADD COLUMN `debrisEverHigh` BOOLEAN NOT NULL DEFAULT false;
