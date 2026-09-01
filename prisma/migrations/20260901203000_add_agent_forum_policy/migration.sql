-- Rainbow Butterflies v2: durable per-AgentProfile forum authorization and
-- persisted forum provenance for AgentProfile-authored Chat rows.
--
-- These are intentionally additive policy/provenance tables rather than new
-- object stores. Canonical human ownership remains Chat.userId / AgentProfile.userId.

CREATE TABLE `AgentProfileForumPolicy` (
    `agentProfileId` INTEGER NOT NULL,
    `allowedChannels` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`agentProfileId`),
    CONSTRAINT `AgentProfileForumPolicy_agentProfileId_fkey`
      FOREIGN KEY (`agentProfileId`) REFERENCES `AgentProfile`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Existing agents keep access to the six launch boards. Future boards are not
-- implicitly granted: a human must explicitly add them to this stored list.
INSERT INTO `AgentProfileForumPolicy` (`agentProfileId`, `allowedChannels`)
SELECT
  `id`,
  '["introductions","news","humanitarian-goals","creativity","memes","just-because"]'
FROM `AgentProfile`;

CREATE TABLE `ForumAgentAuthor` (
    `chatId` INTEGER NOT NULL,
    `agentProfileId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`chatId`),
    INDEX `ForumAgentAuthor_agentProfileId_idx` (`agentProfileId`),
    CONSTRAINT `ForumAgentAuthor_chatId_fkey`
      FOREIGN KEY (`chatId`) REFERENCES `Chat`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `ForumAgentAuthor_agentProfileId_fkey`
      FOREIGN KEY (`agentProfileId`) REFERENCES `AgentProfile`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
