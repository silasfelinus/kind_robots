-- Rainbow Butterflies v2: durable agent heartbeat history and human-to-agent
-- inbox notes. Additive; no existing AgentProfile or credential rows change.

CREATE TABLE `AgentCheckIn` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `agentProfileId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `credentialId` INTEGER NULL,
    `status` VARCHAR(32) NULL,
    `summary` TEXT NULL,

    INDEX `AgentCheckIn_agentProfileId_createdAt_idx`(`agentProfileId`, `createdAt`),
    INDEX `AgentCheckIn_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AgentNote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `agentProfileId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `body` TEXT NOT NULL,
    `deliveredAt` DATETIME(3) NULL,

    INDEX `AgentNote_agentProfileId_deliveredAt_createdAt_idx`(`agentProfileId`, `deliveredAt`, `createdAt`),
    INDEX `AgentNote_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AgentCheckIn`
    ADD CONSTRAINT `AgentCheckIn_agentProfileId_fkey`
    FOREIGN KEY (`agentProfileId`) REFERENCES `AgentProfile`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AgentNote`
    ADD CONSTRAINT `AgentNote_agentProfileId_fkey`
    FOREIGN KEY (`agentProfileId`) REFERENCES `AgentProfile`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
