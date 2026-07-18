-- Dream-owned reactions should disappear with the Dream.
-- Chat, Todo, LifeRun, Composition, and other optional references already use
-- ON DELETE SET NULL in the live baseline and remain preserved.
ALTER TABLE `Reaction` DROP FOREIGN KEY `Reaction_dreamId_fkey`;
ALTER TABLE `Reaction`
  ADD CONSTRAINT `Reaction_dreamId_fkey`
  FOREIGN KEY (`dreamId`) REFERENCES `Dream`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
