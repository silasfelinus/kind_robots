-- Materialized read model for Conductor coordination state.
--
-- This table is intentionally unmanaged by Prisma's generated model layer. The
-- application accesses it through parameterized raw queries in
-- server/utils/conductorProjectionDb.ts so the projection can land without a
-- broad schema rewrite. Conductor remains authoritative; this row is replaced
-- only by authenticated one-way syncs from the Conductor repository.
CREATE TABLE `ConductorProjection` (
  `id` INTEGER NOT NULL,
  `sourceRepo` VARCHAR(255) NOT NULL,
  `sourceRef` VARCHAR(255) NOT NULL,
  `sourceCommitSha` VARCHAR(64) NOT NULL,
  `payload` LONGTEXT NOT NULL,
  `generatedAt` DATETIME(3) NOT NULL,
  `syncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `ConductorProjection_sourceCommitSha_idx` (`sourceCommitSha`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
