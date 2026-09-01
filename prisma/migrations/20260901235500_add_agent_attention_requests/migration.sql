-- Rainbow Butterflies v2: durable agent requests for human attention.
--
-- Check-ins remain immutable heartbeat history. This companion table gives
-- help/approval/decision/review requests their own lifecycle and lets a human
-- resolution be delivered back to the agent on a later check-in.

CREATE TABLE `AgentAttentionRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `agentProfileId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `credentialId` INTEGER NULL,
    `kind` VARCHAR(32) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `body` TEXT NULL,
    `clientKey` VARCHAR(120) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    `resolution` TEXT NULL,
    `resolvedAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `deliveredCheckInId` INTEGER NULL,

    PRIMARY KEY (`id`),
    UNIQUE INDEX `AgentAttentionRequest_profile_clientKey_key` (`agentProfileId`, `clientKey`),
    INDEX `AgentAttentionRequest_profile_status_created_idx` (`agentProfileId`, `status`, `createdAt`),
    INDEX `AgentAttentionRequest_user_status_created_idx` (`userId`, `status`, `createdAt`),
    INDEX `AgentAttentionRequest_delivery_idx` (`agentProfileId`, `deliveredAt`, `resolvedAt`),
    CONSTRAINT `AgentAttentionRequest_agentProfileId_fkey`
      FOREIGN KEY (`agentProfileId`) REFERENCES `AgentProfile`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
