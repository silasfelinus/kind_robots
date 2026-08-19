-- kind-economy/t-025: the labelled-AI social content pipeline, v1 (draft-only).
-- One brand-new table, purely additive -- no DROP/ALTER of any existing
-- table, column, or index. Two structural guarantees this migration bakes
-- in at the schema level (see the model doc in prisma/schema.prisma for the
-- full rationale):
--
--   1. `disclosureLabel` is NOT NULL -- every row must carry an AI
--      disclosure. AMI posts AS AMI, never as an unlabelled human persona.
--   2. `status` is an ENUM with exactly three values (DRAFT, APPROVED,
--      REJECTED) -- there is no POSTED (or any other "went live") value.
--      Nothing in this migration, or any code this task adds, can set a
--      draft to a "posted" state.
--
-- `platform` is also an ENUM, deliberately limited to the v1 starting pair
-- (BLUESKY, INSTAGRAM) -- see SocialPlatform's doc in schema.prisma for why
-- Mastodon/X/TikTok are not on it yet.
--
-- The unique index on (platform, sourceType, sourceId) is the DB-level
-- backstop for the pure eligibility check's "isn't already queued" rule.

-- CreateTable
CREATE TABLE `SocialPostDraft` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `platform` ENUM('BLUESKY', 'INSTAGRAM') NOT NULL,
    `sourceType` ENUM('BOT', 'CHARACTER', 'FACET', 'SCENARIO', 'PITCH', 'ART', 'PACK', 'REWARD', 'DREAM') NOT NULL,
    `sourceId` INTEGER NOT NULL,
    `bodyText` TEXT NOT NULL,
    `disclosureLabel` VARCHAR(512) NOT NULL,
    `mediaUrl` TEXT NULL,
    `status` ENUM('DRAFT', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
    `reviewedBy` INTEGER NULL,
    `reviewedAt` DATETIME(3) NULL,

    INDEX `SocialPostDraft_status_platform_idx`(`status`, `platform`),
    INDEX `SocialPostDraft_sourceType_sourceId_idx`(`sourceType`, `sourceId`),
    UNIQUE INDEX `SocialPostDraft_platform_sourceType_sourceId_key`(`platform`, `sourceType`, `sourceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
