-- cthulhuquarium/t-038: point the aquarium tables at Monster instead of Character.
--
-- t-035 created the Monster table as a pure CREATE TABLE and deliberately left
-- AquariumStock.characterId and AquariumCodexEntry.characterId alone, so that
-- migration stayed safe to apply regardless of the t-071 outage's state. t-071
-- is resolved and production is healthy, so the repoint lands here.
--
-- WHAT THIS ASSUMES, stated plainly because it is the whole risk: BOTH TABLES
-- ARE EMPTY. The aquarium feature has never shipped -- t-009 built the server
-- API but t-011 (the play loop) is still `waiting`, and t-010's prototype is
-- client-only localStorage that never calls these endpoints. Nothing has had a
-- reason to write a row.
--
-- If that assumption is wrong, this migration FAILS LOUDLY rather than
-- corrupting anything: existing characterId values point at Character ids,
-- Monster is empty until t-008 seeds it, and MariaDB verifies every row against
-- the new foreign key before accepting it. A stranded row cannot survive this
-- silently. Pre-flight if you want certainty:
--
--   SELECT (SELECT COUNT(*) FROM `AquariumStock`) AS stock,
--          (SELECT COUNT(*) FROM `AquariumCodexEntry`) AS codex;
--
-- Both should be 0. If they are not, stop and reconcile before deploying --
-- those rows name species that are no longer in the bestiary table at all.
--
-- `Character.size` IS DELIBERATELY NOT DROPPED HERE, even though this change
-- makes it dead weight. A DROP needs the REVERSE deploy order from an ADD: the
-- container currently serving production runs a Prisma client that still
-- selects `size`, so dropping the column before that image is replaced
-- reproduces kind-robots/t-071 exactly, in reverse. Deploy a client that has
-- stopped selecting it FIRST, then drop. Filed as its own follow-up.

-- DropForeignKey
ALTER TABLE `AquariumStock` DROP FOREIGN KEY `AquariumStock_characterId_fkey`;
ALTER TABLE `AquariumCodexEntry` DROP FOREIGN KEY `AquariumCodexEntry_characterId_fkey`;

-- DropIndex
DROP INDEX `AquariumStock_characterId_idx` ON `AquariumStock`;
DROP INDEX `AquariumCodexEntry_characterId_idx` ON `AquariumCodexEntry`;
DROP INDEX `AquariumCodexEntry_userId_characterId_key` ON `AquariumCodexEntry`;

-- AlterTable: rename the column rather than add/copy/drop, so any row that does
-- exist keeps its value and is caught by the foreign key below instead of being
-- silently zeroed.
ALTER TABLE `AquariumStock` CHANGE `characterId` `monsterId` INTEGER NOT NULL;
ALTER TABLE `AquariumCodexEntry` CHANGE `characterId` `monsterId` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `AquariumStock_monsterId_idx` ON `AquariumStock`(`monsterId`);
CREATE INDEX `AquariumCodexEntry_monsterId_idx` ON `AquariumCodexEntry`(`monsterId`);
CREATE UNIQUE INDEX `AquariumCodexEntry_userId_monsterId_key` ON `AquariumCodexEntry`(`userId`, `monsterId`);

-- AddForeignKey
ALTER TABLE `AquariumStock` ADD CONSTRAINT `AquariumStock_monsterId_fkey` FOREIGN KEY (`monsterId`) REFERENCES `Monster`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `AquariumCodexEntry` ADD CONSTRAINT `AquariumCodexEntry_monsterId_fkey` FOREIGN KEY (`monsterId`) REFERENCES `Monster`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
