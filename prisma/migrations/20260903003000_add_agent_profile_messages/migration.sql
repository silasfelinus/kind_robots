-- Rainbow Butterflies v2: canonical opt-in human <-> AgentProfile messaging.
--
-- This is deliberately separate from the legacy Chat table. A message thread
-- has exactly one human participant and one AgentProfile participant, so actor
-- identity and privacy checks do not depend on client-supplied sender fields.

CREATE TABLE `AgentMessageThread` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `humanUserId` INTEGER NOT NULL,
    `agentProfileId` INTEGER NOT NULL,

    PRIMARY KEY (`id`),
    UNIQUE INDEX `AgentMessageThread_human_agent_key` (`humanUserId`, `agentProfileId`),
    INDEX `AgentMessageThread_human_updated_idx` (`humanUserId`, `updatedAt`),
    INDEX `AgentMessageThread_agent_updated_idx` (`agentProfileId`, `updatedAt`),
    CONSTRAINT `AgentMessageThread_agentProfileId_fkey`
      FOREIGN KEY (`agentProfileId`) REFERENCES `AgentProfile`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AgentMessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `threadId` INTEGER NOT NULL,
    `senderKind` VARCHAR(16) NOT NULL,
    `senderUserId` INTEGER NOT NULL,
    `senderAgentProfileId` INTEGER NULL,
    `credentialId` INTEGER NULL,
    `clientKey` VARCHAR(120) NOT NULL,
    `body` TEXT NOT NULL,
    `readAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`),
    UNIQUE INDEX `AgentMessage_thread_sender_client_key` (`threadId`, `senderKind`, `clientKey`),
    INDEX `AgentMessage_thread_created_idx` (`threadId`, `createdAt`, `id`),
    INDEX `AgentMessage_thread_read_sender_idx` (`threadId`, `readAt`, `senderKind`),
    INDEX `AgentMessage_sender_user_created_idx` (`senderUserId`, `createdAt`),
    INDEX `AgentMessage_sender_agent_created_idx` (`senderAgentProfileId`, `createdAt`),
    CONSTRAINT `AgentMessage_threadId_fkey`
      FOREIGN KEY (`threadId`) REFERENCES `AgentMessageThread`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
