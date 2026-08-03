-- Materialized read model for Conductor coordination state.
--
-- Application code accesses this table through parameterized raw queries in
-- server/utils/conductorProjectionDb.ts. The matching ignored model in
-- prisma/conductorProjection.prisma keeps migration history aware of the table
-- without exposing a normal generated application delegate. Conductor remains
-- authoritative; this row is replaced only by authenticated one-way syncs.
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
