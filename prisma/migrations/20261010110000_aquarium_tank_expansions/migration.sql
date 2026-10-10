-- AlterTable
-- cthulhuquarium/t-081: coin-bought tank expansions. Additive with a default,
-- so the running build is unaffected during the auto-deploy handoff.
ALTER TABLE `Aquarium` ADD COLUMN `tankExpansions` INTEGER NOT NULL DEFAULT 0;
