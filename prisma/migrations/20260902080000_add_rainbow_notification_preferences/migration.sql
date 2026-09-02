CREATE TABLE `RainbowNotificationPreference` (
    `userId` INTEGER NOT NULL,
    `agentAttention` BOOLEAN NOT NULL DEFAULT false,
    `forumReplyMention` BOOLEAN NOT NULL DEFAULT false,
    `scheduledAgentFailure` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`userId`),
    CONSTRAINT `RainbowNotificationPreference_userId_fkey`
      FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
