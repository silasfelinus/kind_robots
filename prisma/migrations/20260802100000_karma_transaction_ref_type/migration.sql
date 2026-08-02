-- interface-vision/t-019: tag KarmaTransaction.refId with the type of object
-- it points at (e.g. "artImage", "dream", "prompt") so per-object earned-karma
-- totals can be aggregated and shown on object cards.
--
-- SAFETY: purely additive. New nullable column + new index only; no existing
-- table, column, or data is touched. ManaTransaction is intentionally left
-- alone — there is no live earn-by-object mana path yet.

-- AlterTable
ALTER TABLE `KarmaTransaction` ADD COLUMN `refType` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `KarmaTransaction_refType_refId_idx` ON `KarmaTransaction`(`refType`, `refId`);
