-- rainbow-butterflies/t-015: first-class scoped per-agent credentials.
-- Purely additive -- CREATE TABLE only, no DROP, no ALTER of any existing
-- table, no edits to prior migrations. See
-- projects/rainbow-butterflies/roadmap.yaml t-015 in conductor.

-- CreateTable: one issued agent credential. `hashedSecret` stores a bcrypt
-- hash only -- the plaintext secret is shown once at creation and never
-- persisted. `keyPrefix` is the public, non-secret lookup half. `scopes`
-- is a JSON array of scope strings.
CREATE TABLE `AgentCredential` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `botId` INTEGER NULL,
    `label` VARCHAR(255) NOT NULL,
    `keyPrefix` VARCHAR(16) NOT NULL,
    `hashedSecret` VARCHAR(255) NOT NULL,
    `scopes` JSON NOT NULL,
    `expiresAt` DATETIME(3) NULL,
    `lastUsedAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,

    UNIQUE INDEX `AgentCredential_keyPrefix_key`(`keyPrefix`),
    INDEX `AgentCredential_userId_idx`(`userId`),
    INDEX `AgentCredential_botId_idx`(`botId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AgentCredential` ADD CONSTRAINT `AgentCredential_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentCredential` ADD CONSTRAINT `AgentCredential_botId_fkey`
    FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
