-- First-party SSO authorization codes are intentionally a short-lived server-only
-- exchange primitive. They are accessed with parameterized raw Prisma queries so
-- the public Prisma application model does not grow a reusable token surface.
CREATE TABLE `FirstPartyAuthorizationCode` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `codeHash` CHAR(64) NOT NULL,
    `userId` INTEGER NOT NULL,
    `clientId` VARCHAR(128) NOT NULL,
    `redirectUri` VARCHAR(1024) NOT NULL,
    `codeChallenge` VARCHAR(128) NOT NULL,
    `codeChallengeMethod` VARCHAR(16) NOT NULL DEFAULT 'S256',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,
    `consumedAt` DATETIME(3) NULL,

    UNIQUE INDEX `FirstPartyAuthorizationCode_codeHash_key`(`codeHash`),
    INDEX `FirstPartyAuthorizationCode_clientId_expiresAt_idx`(`clientId`, `expiresAt`),
    INDEX `FirstPartyAuthorizationCode_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `FirstPartyAuthorizationCode`
    ADD CONSTRAINT `FirstPartyAuthorizationCode_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
