-- Repair the transition from the additive Storybook ending-deck expansion to
-- the required LifeEnding.deckId contract.
--
-- 20260912120000_add_ending_deck_and_story_run_columns intentionally created
-- LifeEnding.deckId as nullable while the old application was still serving,
-- and its foreign key used ON DELETE SET NULL to match that nullable shape.
-- 20260912123000_scope_life_ending_outcome_key_to_its_deck then makes deckId
-- NOT NULL. MariaDB cannot make a SET NULL foreign-key column NOT NULL, so the
-- relation must become the required-relation shape first.
--
-- This is deliberately a NEW migration rather than an edit to either existing
-- migration. Production may already have applied 20260912120000 and may have a
-- failed/partially-applied 20260912123000 record.

ALTER TABLE `LifeEnding` DROP FOREIGN KEY `LifeEnding_deckId_fkey`;

ALTER TABLE `LifeEnding`
    ADD CONSTRAINT `LifeEnding_deckId_fkey`
    FOREIGN KEY (`deckId`) REFERENCES `EndingDeck`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
