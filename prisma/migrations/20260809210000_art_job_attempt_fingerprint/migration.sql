-- Give ArtJob's enqueue dedup an index to use.
--
-- POST /api/art/queue deduplicates by attempt fingerprint, and did it with
--   payload: { contains: '"attemptFingerprint":"…"' }
-- which compiles to `payload LIKE '%…%'` over a LongText column. No index can
-- serve that. The `userId` index narrowed to one user; MariaDB then read every
-- LongText payload that user had ever produced -- inside an interactive
-- transaction holding one of only two pool connections per lambda.
--
-- Two things made it degrade rather than merely be slow: the status filter
-- includes DONE, so the scan covered all history and grew monotonically, and
-- GET_LOCK(name, 3) sat in front of it. Production on 2026-08-09 logged
-- "The timeout for this transaction was 10000 ms, however 16096 ms passed
-- since the start of the transaction", alongside pool errors reading
-- `active=2 idle=0 limit=2` on roughly two dozen API routes.
--
-- SAFETY: additive. One nullable column and one index; no existing column or
-- row shape changes. The backfill below only writes rows where the column is
-- still NULL.
--
-- IF NOT EXISTS on both DDL statements because DDL is not transactional here:
-- the per-slot-art-image-ids migration on 2026-08-06 died in its backfill after
-- its ALTERs had already landed, so a re-run has to be a no-op on whatever
-- applied before the failure.

-- AlterTable
ALTER TABLE `ArtJob`
  ADD COLUMN IF NOT EXISTS `attemptFingerprint` VARCHAR(64) NULL;

-- CreateIndex
ALTER TABLE `ArtJob`
  ADD INDEX IF NOT EXISTS `ArtJob_userId_attemptFingerprint_idx` (`userId`, `attemptFingerprint`);

-- Backfill from the only place the value currently lives: the payload JSON.
--
-- String extraction, NOT REGEXP_SUBSTR or JSON_EXTRACT. The 2026-08-06
-- migration learned this the hard way -- MariaDB's REGEXP_SUBSTR returns an
-- empty string where MySQL returns NULL, which then blows up under strict mode.
-- Nested SUBSTRING_INDEX behaves identically on both, and the LIKE gate means a
-- payload without a fingerprint is left NULL rather than assigned a garbage
-- fragment of itself.
--
-- ONE-TIME COST: this is a full scan of ArtJob, i.e. exactly the work being
-- removed from the request path, paid once at deploy instead of on every
-- enqueue. On a large table expect it to take a while.
--
-- Rows left NULL simply do not participate in dedup, which is the same outcome
-- as a payload that never carried a fingerprint.

UPDATE `ArtJob`
  SET `attemptFingerprint` = SUBSTRING_INDEX(
    SUBSTRING_INDEX(`payload`, '"attemptFingerprint":"', -1), '"', 1
  )
  WHERE `attemptFingerprint` IS NULL
    AND `payload` LIKE '%"attemptFingerprint":"%';
