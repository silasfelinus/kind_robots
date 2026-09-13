-- storybook/t-044 + t-045: Taskmaster becomes the fourth MODE of Storybook.
--
-- Silas, 2026-09-12: "we should work taskmaster into this project as well,
-- removing the taskmaster route when done." stores/taskmasterStore.ts kept its
-- session, checkpoint plan and write-back proposals in the reader's browser;
-- this is where that state lives now.
--
-- PURELY ADDITIVE. One nullable column and one widened enum value set; no DROP,
-- no MODIFY of an existing column's meaning, no edit to a prior migration. The
-- build running during the deploy handoff never selects LifeRun.questLedger and
-- never writes EndingDeck.ownerKind = 'TASKMASTER', so both are invisible to it.
--
-- Why questLedger is its own column rather than a corner of an existing one:
-- LifeRun.bible is an immutable snapshot of the board the reader assembled, and
-- LifeRun.inventory means cards. A quest's objective, its checkpoints and its
-- proposals change every turn and are neither of those things.
--
-- SAFETY, the half that matters (storybook/t-045): a proposal stored here has
-- NOT been applied. Nothing that writes this column touches a real Todo or
-- Project; only POST /api/storybook/runs/:id/proposals/:id/apply does, and
-- Conductor roadmap YAML is never written by a story answer at all.
--
-- Hand-authored to match `prisma migrate diff`'s emission for this schema (this
-- sandbox has no MIGRATION_DATABASE_URL / shadow database -- see
-- docs/runbooks/migration-credential-boundary.md). Enum value order below is
-- schema.prisma's order, which is what Prisma renders.

-- AlterTable: the quest ledger.
ALTER TABLE `LifeRun` ADD COLUMN `questLedger` LONGTEXT NULL;

-- AlterTable: a deck may now belong to Taskmaster.
ALTER TABLE `EndingDeck`
    MODIFY `ownerKind` ENUM('LIFE', 'GENRE_FACET', 'SCENARIO', 'TASKMASTER') NOT NULL DEFAULT 'GENRE_FACET';
