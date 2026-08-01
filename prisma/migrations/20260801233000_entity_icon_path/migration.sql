-- Entity iconPath: a real logo image slot, distinct from the icon NAME.
--
-- conductor interface-vision/t-007, follow-up. Silas, 2026-08-01:
-- "there is a strong difference between icon and iconPath. An icon is a simple
-- string meant to name an existing simple icon, preferably in our kind robots
-- system. An iconPath is a string but it leads to an actual path that points to
-- a fully developed logo."
--
-- The previous migration added `icon` (the NAME) to these models, which was
-- right but incomplete: there was nowhere to put a generated logo. Today only
-- ArtImage has an iconPath, and entities overload `imagePath` for the job --
-- see server/api/conductor/project-art-complete.post.ts, which maps the entity
-- field `imagePath` onto the ArtImage variant `iconPath` for exactly this
-- reason. That conflation is why a Bot's 1024x1024 avatar also has to serve as
-- its small icon.
--
-- SAFETY: purely additive. 4 ADD COLUMN, zero DROP, zero MODIFY, no data
-- movement, no backfill. Nullable, defaults to NULL, older clients unaffected.

-- AlterTable
ALTER TABLE `Bot` ADD COLUMN `iconPath` TEXT NULL;

-- AlterTable
ALTER TABLE `Character` ADD COLUMN `iconPath` TEXT NULL;

-- AlterTable
ALTER TABLE `Reward` ADD COLUMN `iconPath` TEXT NULL;

-- AlterTable
ALTER TABLE `Scenario` ADD COLUMN `iconPath` TEXT NULL;

