-- kind-robots/t-075, step 3 of the contract-then-migration rollout.
--
-- Production precondition confirmed by Silas on 2026-08-27 after Force Update:
-- GET /api/characters/200 returned successfully with the deployed Prisma client
-- that no longer contains Character.size.
--
-- The application contract has therefore moved off this column. This migration
-- performs only the final destructive database cleanup.
ALTER TABLE `Character` DROP COLUMN `size`;
