-- CreateEnum is represented as an inline MySQL ENUM on Contender.kind.
-- This migration is intentionally additive except for the unique-index swap on ChallengeSubmission.

-- CreateTable
CREATE TABLE `Contender` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `slug` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `kind` ENUM('AGENT_STACK', 'LLM_MODEL', 'ART_GENERATOR') NOT NULL,
    `provider` VARCHAR(128) NULL,
    `model` VARCHAR(255) NULL,
    `generator` VARCHAR(128) NULL,
    `defaultSettings` JSON NULL,
    `description` TEXT NULL,
    `avatarImageId` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Contender_slug_key`(`slug`),
    INDEX `Contender_kind_idx`(`kind`),
    INDEX `Contender_provider_idx`(`provider`),
    INDEX `Contender_model_idx`(`model`),
    INDEX `Contender_generator_idx`(`generator`),
    INDEX `Contender_isActive_idx`(`isActive`),
    INDEX `Contender_avatarImageId_fkey`(`avatarImageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `ChallengeSubmission`
    ADD COLUMN `contenderId` INTEGER NULL,
    ADD COLUMN `variantKey` VARCHAR(128) NOT NULL DEFAULT 'default',
    ADD COLUMN `promptUsed` TEXT NULL,
    ADD COLUMN `settings` JSON NULL,
    ADD COLUMN `randomSelections` JSON NULL,
    MODIFY `botId` INTEGER NULL;

-- DropIndex
DROP INDEX `ChallengeSubmission_challengeId_botId_key` ON `ChallengeSubmission`;

-- CreateIndex
CREATE UNIQUE INDEX `ChallengeSubmission_challengeId_contenderId_variantKey_key` ON `ChallengeSubmission`(`challengeId`, `contenderId`, `variantKey`);

-- CreateIndex
CREATE INDEX `ChallengeSubmission_contenderId_fkey` ON `ChallengeSubmission`(`contenderId`);

-- AddForeignKey
ALTER TABLE `Contender` ADD CONSTRAINT `Contender_avatarImageId_fkey` FOREIGN KEY (`avatarImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChallengeSubmission` ADD CONSTRAINT `ChallengeSubmission_contenderId_fkey` FOREIGN KEY (`contenderId`) REFERENCES `Contender`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
