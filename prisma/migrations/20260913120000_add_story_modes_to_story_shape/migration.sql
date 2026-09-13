-- storybook/t-039 + t-040 + t-041: the four story SHAPES become the four story
-- MODES.
--
-- Silas, 2026-09-12: "Stories should be able to be selected as open-ended
-- (endless mode), episodic (scenario based), structured (da Vinci mode), and
-- taskmaster." Length stops being an identity in the same breath: a short tale
-- and a chaptered one are one open-ended story with a different budget on the
-- dial, so both collapse into OPEN_ENDED.
--
-- EXPAND ONLY. The value set widens and existing rows are rewritten to their
-- new spelling; nothing is dropped. The build running during the deploy
-- handoff keeps working because:
--
--   * every legacy value it might write -- SHORT_STORY, CHAPTERED, EPISODIC,
--     LIFE -- is still accepted by the column after this migration;
--   * the DEFAULT moves LIFE -> STRUCTURED, which is the same meaning under the
--     new taxonomy, so an insert from the old build that omits `shape` (every
--     insert the old build makes: createLifeRun never sets it) still lands
--     correct rather than on a value the new code would read as a beat shape;
--   * the new build maps the legacy values defensively on read
--     (ENUM_TO_MODE in server/utils/storybookRuns.ts), so a row written by the
--     old build between this migration and the deploy is understood, and an
--     in-flight run never changes mode under the reader.
--
-- Dropping SHORT_STORY / CHAPTERED / LIFE is a separate, later migration, once
-- no deployed build emits them. That drop is the non-additive half and it is
-- deliberately not here.
--
-- Hand-authored to match `prisma migrate diff`'s emission for this schema (this
-- sandbox has no MIGRATION_DATABASE_URL / shadow database -- see
-- docs/runbooks/migration-credential-boundary.md). The value order below is
-- schema.prisma's order, which is what Prisma renders.

-- AlterTable: widen the value set and move the default.
ALTER TABLE `LifeRun`
    MODIFY `shape` ENUM('SHORT_STORY', 'CHAPTERED', 'EPISODIC', 'LIFE', 'OPEN_ENDED', 'STRUCTURED', 'TASKMASTER') NOT NULL DEFAULT 'STRUCTURED';

-- Backfill. Runs on the widened column, so every target value already exists.
-- EPISODIC keeps its spelling and is deliberately untouched.
UPDATE `LifeRun` SET `shape` = 'STRUCTURED' WHERE `shape` = 'LIFE';
UPDATE `LifeRun` SET `shape` = 'OPEN_ENDED' WHERE `shape` IN ('SHORT_STORY', 'CHAPTERED');
