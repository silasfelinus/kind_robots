-- kind-economy/t-008: the immutable RevenueSplit ledger. One append-only
-- row per paid (TOKENS-funded) spend, recording the gross USD-cent value,
-- the off-the-top payment-processing fee and provider (model/GPU) cost, and
-- the resulting three-way net split (platform / mission / creator). Rows
-- are never edited or deleted -- a correction is a NEW row referencing the
-- original via reversedById, exactly like ManaTransaction.reversedById.
--
-- Purely additive: a brand-new table plus its indexes and one foreign key.
-- No DROP/ALTER of ManaTransaction or anything else pre-existing -- the
-- back-reference field added to the ManaTransaction model in
-- prisma/schema.prisma is a virtual Prisma relation field only (no column,
-- nothing to migrate on that side); the real FK lives on this new table.

-- CreateTable
CREATE TABLE `RevenueSplit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `manaTransactionId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `creatorUserId` INTEGER NULL,
    `isSelfAttribution` BOOLEAN NOT NULL DEFAULT false,
    `grossCents` INTEGER NOT NULL,
    `paymentProcessingFeeCents` INTEGER NOT NULL,
    `providerCostCents` INTEGER NOT NULL,
    `platformShareCents` INTEGER NOT NULL,
    `missionShareCents` INTEGER NOT NULL,
    `creatorShareCents` INTEGER NOT NULL,
    `roundingRemainderCents` INTEGER NOT NULL DEFAULT 0,
    `reversedById` INTEGER NULL,
    `note` TEXT NULL,

    UNIQUE INDEX `RevenueSplit_manaTransactionId_key`(`manaTransactionId`),
    INDEX `RevenueSplit_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `RevenueSplit_creatorUserId_idx`(`creatorUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RevenueSplit` ADD CONSTRAINT `RevenueSplit_manaTransactionId_fkey` FOREIGN KEY (`manaTransactionId`) REFERENCES `ManaTransaction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
