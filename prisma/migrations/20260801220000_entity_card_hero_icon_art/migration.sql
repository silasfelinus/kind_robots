-- Entity art parity: card / hero / icon for Bot, Character, Reward, Scenario.
--
-- conductor interface-vision/t-007. Silas authorized this directly on 2026-08-01.
--
-- WHY: Project, Dream and Facet each carry imagePath + cardPath + heroPath + icon,
-- which is why the Project gallery can offer four image-rich view modes. Bot,
-- Character, Reward and Scenario carried exactly ONE image field each, so their
-- galleries were data-starved rather than merely badly styled. No amount of CSS
-- fixes a missing column.
--
-- Also adds artPrompt to Project (the only main object that lacked it -- its
-- prompts were being synthesized server-side in server/utils/conductorArtPrompt.ts)
-- and allowReviews to the five objects lacking it, so review gating is uniform
-- across all seven core objects instead of existing only on Dream and Project.
--
-- SAFETY: purely additive. 18 ADD COLUMN, zero DROP, zero MODIFY, no data
-- movement, no backfill. Every new nullable column defaults to NULL and every
-- new boolean defaults to false, so existing rows and older clients are
-- unaffected. Reversible by dropping the columns.

-- AlterTable
ALTER TABLE `Bot` ADD COLUMN `allowReviews` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `cardPath` TEXT NULL,
    ADD COLUMN `heroPath` TEXT NULL,
    ADD COLUMN `icon` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Character` ADD COLUMN `allowReviews` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `cardPath` TEXT NULL,
    ADD COLUMN `heroPath` TEXT NULL,
    ADD COLUMN `icon` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Project` ADD COLUMN `artPrompt` TEXT NULL;

-- AlterTable
ALTER TABLE `Facet` ADD COLUMN `allowReviews` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Reward` ADD COLUMN `allowReviews` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `cardPath` TEXT NULL,
    ADD COLUMN `heroPath` TEXT NULL;

-- AlterTable
ALTER TABLE `Scenario` ADD COLUMN `allowReviews` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `cardPath` TEXT NULL,
    ADD COLUMN `heroPath` TEXT NULL,
    ADD COLUMN `icon` VARCHAR(191) NULL;

