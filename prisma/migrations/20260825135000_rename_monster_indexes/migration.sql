-- Finish the Creature -> Monster rename: the INDEXES kept the old name.
--
-- 20260825130000_rename_creature_to_monster used `RENAME TABLE Creature TO
-- Monster`, which renames the table and nothing else. Every index and the
-- unique key came along still called `Creature_*`, so Prisma's model now
-- expects `Monster_slug_key` and the database has `Creature_slug_key`.
--
-- That is real schema drift, not cosmetics. It shows up in every future
-- `prisma migrate diff` as eight RedefineIndex statements, which is exactly the
-- kind of standing noise that hides a genuine difference in the next person's
-- diff output. Found 2026-08-25 by applying the full 68-migration history to a
-- throwaway MariaDB and diffing the result against schema.prisma -- static
-- review of the rename migration would never have surfaced it, because the SQL
-- is correct and does precisely what it says.
--
-- RENAME INDEX rather than Prisma's own suggested drop-and-recreate: it is
-- atomic, it does not rebuild the index, and on a table this size the
-- difference is irrelevant but the intent is clearer. MariaDB has supported it
-- since 10.5; production is 11.4.
--
-- THE FOREIGN KEYS DRIFT TOO. An earlier draft of this file claimed constraint
-- names are not part of Prisma's model and left them alone; that was wrong, and
-- the diff said so -- Prisma expects `Monster_userId_fkey` and finds
-- `Creature_userId_fkey`, four times. MariaDB has no RENAME FOREIGN KEY, so
-- they are dropped and re-added, which re-validates existing rows. Monster is
-- empty in production (nothing has seeded it yet -- cthulhuquarium/t-008), and
-- re-adding an identical constraint is safe with data anyway.
--
-- Safe regardless of data: none of this changes a single row.

ALTER TABLE `Monster` RENAME INDEX `Creature_slug_key` TO `Monster_slug_key`;
ALTER TABLE `Monster` RENAME INDEX `Creature_slug_idx` TO `Monster_slug_idx`;
ALTER TABLE `Monster` RENAME INDEX `Creature_tier_idx` TO `Monster_tier_idx`;
ALTER TABLE `Monster` RENAME INDEX `Creature_evolvesToId_idx` TO `Monster_evolvesToId_idx`;
ALTER TABLE `Monster` RENAME INDEX `Creature_userId_idx` TO `Monster_userId_idx`;
ALTER TABLE `Monster` RENAME INDEX `Creature_packId_idx` TO `Monster_packId_idx`;
ALTER TABLE `Monster` RENAME INDEX `Creature_isPublic_idx` TO `Monster_isPublic_idx`;
ALTER TABLE `Monster` RENAME INDEX `Creature_isActive_idx` TO `Monster_isActive_idx`;

-- Foreign keys: drop and re-add under the correct name.
ALTER TABLE `Monster` DROP FOREIGN KEY `Creature_evolvesToId_fkey`;
ALTER TABLE `Monster` DROP FOREIGN KEY `Creature_artImageId_fkey`;
ALTER TABLE `Monster` DROP FOREIGN KEY `Creature_userId_fkey`;
ALTER TABLE `Monster` DROP FOREIGN KEY `Creature_packId_fkey`;

ALTER TABLE `Monster` ADD CONSTRAINT `Monster_evolvesToId_fkey` FOREIGN KEY (`evolvesToId`) REFERENCES `Monster`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Monster` ADD CONSTRAINT `Monster_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Monster` ADD CONSTRAINT `Monster_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Monster` ADD CONSTRAINT `Monster_packId_fkey` FOREIGN KEY (`packId`) REFERENCES `Pack`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
