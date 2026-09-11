-- cthulhuquarium/t-077: sticky "has an active rivalry ever been observed"
-- flag backing the first_rivalry_resolved milestone, additive only.
ALTER TABLE `Aquarium` ADD COLUMN `rivalryObserved` BOOLEAN NOT NULL DEFAULT false;
