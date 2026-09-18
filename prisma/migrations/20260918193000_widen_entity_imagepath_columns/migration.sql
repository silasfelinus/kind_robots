-- kind-robots/t-110: widen ArtImage.imagePath, Resource.imagePath, and
-- Scenario.imagePath from the Prisma-default VARCHAR(191) to VARCHAR(764),
-- matching every other entity's imagePath column (Bot, Character, Dream,
-- Project, Reward, Facet, Achievement, ...).
--
-- kind_robots#2814 (2026-09-18) changed applyEntityArtImage (server/utils/
-- entityArt.ts) to prefer writing the raw static `/images/...` file path
-- plus a `?v=<ISO timestamp>` cache-busting query string into imagePath,
-- instead of the much shorter `/api/art/images/:id/file` pointer. Every
-- entity type routes through the same shared write path, but only these
-- three tables were left at the original unwidened VARCHAR(191) -- every
-- sibling entity had already been bumped to VarChar(764)/Text in an earlier
-- migration. First seen as a proxysql "Data too long for column 'imagePath'"
-- truncation warning in Alexandria's container-log triage (2026-09-16/17,
-- filed as this task); by 2026-09-18 the ArtJob queue was hard-failing
-- writes outright ("Invalid `prisma.resource.update()` invocation: The
-- provided value for the column is too long for the column's type. Column:
-- imagePath"), 7 times in a single day.
--
-- SAFETY: purely a capacity increase on three existing nullable String
-- columns, matching a type already used by 13 sibling imagePath columns in
-- this same schema. No table, column, index, or constraint is dropped; no
-- existing row is rewritten or can lose data -- VARCHAR(191) -> VARCHAR(764)
-- only ever accepts values every VARCHAR(191) value already satisfied.
-- Hand-authored to match `prisma migrate diff`'s emission for this schema
-- change (this sandbox has no MIGRATION_DATABASE_URL / local shadow
-- database -- see docs/runbooks/migration-credential-boundary.md).

-- AlterTable
ALTER TABLE `ArtImage` MODIFY `imagePath` VARCHAR(764) NULL;

-- AlterTable
ALTER TABLE `Resource` MODIFY `imagePath` VARCHAR(764) NULL;

-- AlterTable
ALTER TABLE `Scenario` MODIFY `imagePath` VARCHAR(764) NULL;
