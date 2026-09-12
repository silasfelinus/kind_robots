-- Per-image Scene Animator motion direction.
--
-- Keyed by the source image's SHA-256 so an override survives a rename or a
-- move between folders, matching the identity the render dedupe already uses.
CREATE TABLE `SceneAnimatorPrompt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `sourceHash` VARCHAR(64) NOT NULL,
    `sourceFolder` VARCHAR(512) NOT NULL DEFAULT '',
    `sourceFile` VARCHAR(512) NOT NULL DEFAULT '',
    `prompt` TEXT NOT NULL,
    `negativePrompt` TEXT NULL,
    `userId` INTEGER NULL,

    -- No (sourceFolder, sourceFile) index: two utf8mb4 VARCHAR(512) columns are
    -- 4096 bytes of key against InnoDB's 3072-byte limit, and every read is by
    -- sourceHash anyway.
    UNIQUE INDEX `SceneAnimatorPrompt_sourceHash_key`(`sourceHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
