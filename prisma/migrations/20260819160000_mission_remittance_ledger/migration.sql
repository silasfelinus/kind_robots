-- kind-economy/t-010: admin-only, append-only log of REAL-WORLD remittance
-- events -- Silas manually recording that he already sent money to the
-- mission-share destination OUTSIDE this app. Does not move any money
-- itself and touches no payment processor; pure bookkeeping so the
-- accrued/remitted/outstanding figures on the mission-share dashboard are
-- computable at all. Rows are never edited or deleted.
--
-- Purely additive: a brand-new table plus its indexes and one foreign key.
-- No DROP/ALTER of RevenueSplit, User, or anything else pre-existing -- the
-- back-reference field added to the User model in prisma/schema.prisma is a
-- virtual Prisma relation field only (no column, nothing to migrate on that
-- side); the real FK lives on this new table.

-- CreateTable
CREATE TABLE `MissionRemittance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `amountCents` INTEGER NOT NULL,
    `remittedById` INTEGER NOT NULL,
    `note` TEXT NOT NULL,
    `reference` VARCHAR(255) NULL,

    INDEX `MissionRemittance_remittedById_idx`(`remittedById`),
    INDEX `MissionRemittance_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MissionRemittance` ADD CONSTRAINT `MissionRemittance_remittedById_fkey` FOREIGN KEY (`remittedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
