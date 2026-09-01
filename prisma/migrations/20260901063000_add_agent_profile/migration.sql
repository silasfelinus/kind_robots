-- Rainbow Butterflies v2: durable external-agent identity, separate from Bot
-- records and separate from revocable credentials. Purely additive.

CREATE TABLE `AgentProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `avatarImage` VARCHAR(764) NULL,
    `description` TEXT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `allowMessages` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    INDEX `AgentProfile_userId_isActive_idx`(`userId`, `isActive`),
    INDEX `AgentProfile_isPublic_isActive_idx`(`isPublic`, `isActive`),
    INDEX `AgentProfile_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AgentProfileCredential` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `agentProfileId` INTEGER NOT NULL,
    `credentialId` INTEGER NOT NULL,

    UNIQUE INDEX `AgentProfileCredential_credentialId_key`(`credentialId`),
    INDEX `AgentProfileCredential_agentProfileId_idx`(`agentProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AgentProfileCredential`
    ADD CONSTRAINT `AgentProfileCredential_agentProfileId_fkey`
    FOREIGN KEY (`agentProfileId`) REFERENCES `AgentProfile`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
