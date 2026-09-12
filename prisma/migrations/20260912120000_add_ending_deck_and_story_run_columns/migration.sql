-- storybook/t-029 + t-030: generalize the Life engine into Storybook's
-- ending-deck engine, so every shape (short story, chaptered tale, episodic
-- serial, and the life shape) is a server-side run that resolves into one of a
-- predetermined ending set.
--
-- PURELY ADDITIVE. CREATE TABLE and ADD COLUMN only; no DROP, no MODIFY of an
-- existing column, no edit to a prior migration. Every added column is NULL or
-- carries a DEFAULT, so the build running during the deploy handoff keeps
-- working unchanged: it never selects these columns and never writes them.
--
-- Deliberately NOT in this migration: dropping the global unique index on
-- LifeEnding.outcomeKey in favour of (deckId, outcomeKey), and making deckId
-- NOT NULL. Two three-axis genre decks both produce '101', so that drop is
-- required before a second deck can be seeded -- but it is the one
-- non-additive step, and the currently-running build looks endings up by
-- outcomeKey alone. It ships in its own migration with the first genre decks,
-- after the deck-aware resolver is deployed. See conductor
-- projects/storybook/roadmap.yaml t-030.
--
-- Hand-authored to match `prisma migrate diff`'s emission for this schema
-- (this sandbox has no MIGRATION_DATABASE_URL / local shadow database -- see
-- docs/runbooks/migration-credential-boundary.md); cross-checked
-- column-for-column against schema.prisma and against the squashed baseline's
-- rendering of the same ENUM / LONGTEXT / nullable-FK shapes used by the
-- neighbouring Life* tables.

-- CreateTable
CREATE TABLE `EndingDeck` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `key` VARCHAR(64) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `ownerKind` ENUM('LIFE', 'GENRE_FACET', 'SCENARIO') NOT NULL DEFAULT 'GENRE_FACET',
    `facetId` INTEGER NULL,
    `scenarioId` INTEGER NULL,
    `axes` LONGTEXT NOT NULL,
    `passValue` INTEGER NOT NULL DEFAULT 1,
    `turnBudget` INTEGER NOT NULL DEFAULT 8,
    `turnBudgetByShape` LONGTEXT NULL,
    `minTurnsBeforeResolve` INTEGER NULL,
    `unlockAchievementId` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `EndingDeck_key_key`(`key`),
    INDEX `EndingDeck_ownerKind_idx`(`ownerKind`),
    INDEX `EndingDeck_facetId_idx`(`facetId`),
    INDEX `EndingDeck_scenarioId_idx`(`scenarioId`),
    INDEX `EndingDeck_unlockAchievementId_idx`(`unlockAchievementId`),
    INDEX `EndingDeck_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `LifeRun`
    ADD COLUMN `shape` ENUM('SHORT_STORY', 'CHAPTERED', 'EPISODIC', 'LIFE') NOT NULL DEFAULT 'LIFE',
    ADD COLUMN `deckId` INTEGER NULL,
    ADD COLUMN `turnBudget` INTEGER NULL,
    ADD COLUMN `narratorStyle` VARCHAR(32) NULL,
    ADD COLUMN `premise` TEXT NULL,
    ADD COLUMN `scenarioId` INTEGER NULL,
    ADD COLUMN `bible` LONGTEXT NULL,
    ADD COLUMN `inventory` LONGTEXT NULL,
    ADD COLUMN `pendingTurn` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `LifeChoice`
    ADD COLUMN `source` ENUM('OPTION', 'CUSTOM', 'SHEET') NOT NULL DEFAULT 'OPTION',
    ADD COLUMN `optionId` VARCHAR(8) NULL,
    ADD COLUMN `rewardId` INTEGER NULL,
    ADD COLUMN `stateDelta` LONGTEXT NULL,
    ADD COLUMN `artPrompt` TEXT NULL;

-- AlterTable
ALTER TABLE `LifeEnding` ADD COLUMN `deckId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `LifeRun_deckId_idx` ON `LifeRun`(`deckId`);
CREATE INDEX `LifeRun_shape_idx` ON `LifeRun`(`shape`);
CREATE INDEX `LifeRun_scenarioId_idx` ON `LifeRun`(`scenarioId`);
CREATE INDEX `LifeChoice_rewardId_idx` ON `LifeChoice`(`rewardId`);
CREATE INDEX `LifeChoice_source_idx` ON `LifeChoice`(`source`);
CREATE INDEX `LifeEnding_deckId_idx` ON `LifeEnding`(`deckId`);

-- AddForeignKey
ALTER TABLE `EndingDeck` ADD CONSTRAINT `EndingDeck_facetId_fkey`
    FOREIGN KEY (`facetId`) REFERENCES `Facet`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `EndingDeck` ADD CONSTRAINT `EndingDeck_scenarioId_fkey`
    FOREIGN KEY (`scenarioId`) REFERENCES `Scenario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `EndingDeck` ADD CONSTRAINT `EndingDeck_unlockAchievementId_fkey`
    FOREIGN KEY (`unlockAchievementId`) REFERENCES `Achievement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `LifeRun` ADD CONSTRAINT `LifeRun_deckId_fkey`
    FOREIGN KEY (`deckId`) REFERENCES `EndingDeck`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `LifeRun` ADD CONSTRAINT `LifeRun_scenarioId_fkey`
    FOREIGN KEY (`scenarioId`) REFERENCES `Scenario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `LifeChoice` ADD CONSTRAINT `LifeChoice_rewardId_fkey`
    FOREIGN KEY (`rewardId`) REFERENCES `Reward`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `LifeEnding` ADD CONSTRAINT `LifeEnding_deckId_fkey`
    FOREIGN KEY (`deckId`) REFERENCES `EndingDeck`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the life deck and adopt the 1,024 endings that already exist.
--
-- The axes below are the ten Da Vinci dimensions in the bit order fixed by
-- conductor projects/davinci/data/ending-dimensions.yaml, which is the order
-- scripts/generate_davinci_endings.py used to name every seeded outcomeKey.
-- server/utils/endingDeckMath.ts's LIFE_DECK is the same list, and
-- utils/scripts/verifyEndingDeckMath.ts asserts the resolver still produces
-- exactly the keys the old one did. Do not reorder either copy.
--
-- Nothing in the running build inserts LifeEnding rows (only the seed script
-- does), so this backfill cannot race the old container during the handoff.
INSERT INTO `EndingDeck`
    (`key`, `title`, `description`, `ownerKind`, `axes`, `passValue`, `turnBudget`, `minTurnsBeforeResolve`, `isActive`)
VALUES
    ('life', 'A whole life',
     'One life told in chapters, weighed across ten dimensions, and resolved into one of 1,024 endings.',
     'LIFE',
     '[{"key":"legacy","label":"Legacy","description":"What the life leaves behind once it is over.","passLabel":"remembered","failLabel":"forgotten"},{"key":"wealth","label":"Wealth","description":"Whether material needs are met and resources can be directed.","passLabel":"prosperous","failLabel":"wanting"},{"key":"love","label":"Love","description":"Bonds of affection, trust, and chosen family.","passLabel":"beloved","failLabel":"alone"},{"key":"wisdom","label":"Wisdom","description":"Whether experience turns into discernment rather than certainty.","passLabel":"wise","failLabel":"foolish"},{"key":"health","label":"Health","description":"What the body and mind can still carry.","passLabel":"vital","failLabel":"diminished"},{"key":"freedom","label":"Freedom","description":"How much of the path the protagonist still chooses.","passLabel":"free","failLabel":"bound"},{"key":"fame","label":"Fame","description":"How widely the name, work, or myth is known.","passLabel":"renowned","failLabel":"obscure"},{"key":"creation","label":"Creation","description":"What the protagonist actually made and finished.","passLabel":"creator","failLabel":"barren"},{"key":"community","label":"Community","description":"Belonging to a shared place, practice, movement, or network.","passLabel":"rooted","failLabel":"exiled"},{"key":"mystery","label":"Mystery","description":"Contact with the strange, sacred, uncanny, or unknowable.","passLabel":"awakened","failLabel":"mundane"}]',
     1, 12, 6, true);

UPDATE `LifeEnding`
    SET `deckId` = (SELECT `id` FROM `EndingDeck` WHERE `key` = 'life')
    WHERE `deckId` IS NULL;
