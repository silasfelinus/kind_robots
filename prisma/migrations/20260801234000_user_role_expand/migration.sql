-- Multi-role users: the expand half of an expand/soak/contract.
--
-- Silas, 2026-08-01: "our Role system is too restrictive, as we only allow one
-- Role, and this means that I can't make say, a Child and Admin, or Family an
-- Admin, etc."
--
-- `User.Role` is a single non-null enum and the ONLY field in the schema typed
-- Role. The enum mixes three unrelated axes -- actor kind (SYSTEM, USER,
-- ASSISTANT, BOT), permission (ADMIN, DESIGNER), and account type (GUEST,
-- CHILD, FAMILY) -- which is precisely why one slot cannot hold "Child AND
-- Admin": those answer different questions. Splitting the axes is deliberately
-- NOT part of this change; only the cardinality changes.
--
-- MariaDB has no Prisma scalar lists, so multi-role has to be an explicit join
-- model. That is already the house pattern -- see UserRelation, whose docstring
-- states "explicit join model, not implicit M2M".
--
-- SAFETY: purely additive. One CREATE TABLE, one ADD FOREIGN KEY. Zero DROP,
-- zero MODIFY, no column removed or retyped, nothing on `User` touched. The
-- `User.Role` column stays and keeps being written as the primary/display role,
-- so every existing reader -- including the 49 inline `user.Role === 'ADMIN'`
-- comparisons still live in server/ -- keeps working unchanged. Older clients
-- and older code paths are unaffected.
--
-- The backfill gives every existing user a UserRole row matching their current
-- Role, so the join table is COMPLETE on its own from the moment this applies.
-- A reader can consult it without also reading the column. It is idempotent via
-- ON DUPLICATE KEY UPDATE (a no-op self-assignment), so re-running this
-- migration -- or applying it to a database where some rows already exist --
-- cannot fail or duplicate. Prisma will not normally re-run it; the guard is
-- there for hand-applied and restored-from-snapshot databases.
--
-- Precedence when two roles disagree: RESTRICTIVE WINS. CHILD + ADMIN is still
-- maturity-restricted. Admin grants capability; it does not lift a safety
-- restriction. That rule is enforced in application code (contentAccess.ts),
-- not here -- this migration only creates the storage.

-- CreateTable
CREATE TABLE `UserRole` (
    `userId` INTEGER NOT NULL,
    `role` ENUM('SYSTEM', 'USER', 'ASSISTANT', 'ADMIN', 'GUEST', 'BOT', 'DESIGNER', 'CHILD', 'FAMILY') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserRole_role_idx`(`role`),
    PRIMARY KEY (`userId`, `role`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserRole` ADD CONSTRAINT `UserRole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every user's existing primary Role becomes their first UserRole.
-- Idempotent -- the ON DUPLICATE clause assigns userId to itself, which MariaDB
-- treats as a no-op rather than an error.
INSERT INTO `UserRole` (`userId`, `role`, `createdAt`)
    SELECT `id`, `Role`, NOW(3) FROM `User`
    ON DUPLICATE KEY UPDATE `userId` = `userId`;
