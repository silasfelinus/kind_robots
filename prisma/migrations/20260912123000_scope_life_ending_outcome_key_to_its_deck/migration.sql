-- storybook/t-030: an ending's outcomeKey is unique WITHIN its deck, not
-- globally.
--
-- Every three-axis genre deck produces '000'..'111', so Mystery's '101' and
-- Heist's '101' are different endings that both need to exist. The global
-- unique index on LifeEnding.outcomeKey made a second genre deck impossible
-- to seed: the importer's upsert would find the first deck's row and
-- overwrite it.
--
-- THIS IS THE ONE NON-ADDITIVE STEP of the ending-deck work, deliberately
-- separated from 20260912120000 (which created EndingDeck, added every new
-- column, seeded the life deck, and backfilled LifeEnding.deckId). It is safe
-- to apply in the same deploy as that migration and the deck-aware resolver,
-- and it must not be applied ahead of them:
--
--   * ORDER. deckId is made NOT NULL here, which requires the backfill in
--     20260912120000 to have run. Prisma applies migrations in name order, so
--     this file's later timestamp is load-bearing.
--   * THE OLD BUILD keeps working through the handoff window. It looks an
--     ending up with findUnique({ where: { outcomeKey } }), which Prisma emits
--     as a plain `WHERE outcomeKey = ? LIMIT 1`; dropping the unique index
--     costs that query an index, not its correctness, and the composite
--     (deckId, outcomeKey) index added in 20260912120000 still covers it while
--     only the life deck's 1,024 rows exist.
--   * NOTHING IN THE RUNNING BUILD INSERTS LifeEnding rows -- only the seed
--     importers do, and they are run by hand -- so the NOT NULL cannot reject
--     a write from the container being replaced.

-- DropIndex
ALTER TABLE `LifeEnding` DROP INDEX `LifeEnding_outcomeKey_key`;

-- AlterTable
ALTER TABLE `LifeEnding` MODIFY `deckId` INTEGER NOT NULL;
