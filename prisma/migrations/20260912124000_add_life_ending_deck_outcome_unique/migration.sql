-- Finish the Storybook ending-deck uniqueness transition after
-- 20260912123000_scope_life_ending_outcome_key_to_its_deck removes the legacy
-- global outcomeKey unique index.
--
-- Every deck owns its own bit-space, so (deckId, outcomeKey) is the durable
-- identity. This index is present in schema.prisma and was accidentally omitted
-- from the original transition migration.

CREATE UNIQUE INDEX `LifeEnding_deckId_outcomeKey_key`
    ON `LifeEnding`(`deckId`, `outcomeKey`);
