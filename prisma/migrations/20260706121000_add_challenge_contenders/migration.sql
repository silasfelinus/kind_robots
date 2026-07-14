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

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Contender_slug_key`
ON `Contender`(`slug`);

-- CreateIndex
CREATE INDEX `Contender_kind_idx`
ON `Contender`(`kind`);

-- CreateIndex
CREATE INDEX `Contender_provider_idx`
ON `Contender`(`provider`);

-- CreateIndex
CREATE INDEX `Contender_model_idx`
ON `Contender`(`model`);

-- CreateIndex
CREATE INDEX `Contender_generator_idx`
ON `Contender`(`generator`);

-- CreateIndex
CREATE INDEX `Contender_isActive_idx`
ON `Contender`(`isActive`);

-- CreateIndex
CREATE INDEX `Contender_avatarImageId_fkey`
ON `Contender`(`avatarImageId`);

-- AlterTable
ALTER TABLE `ChallengeSubmission`
    ADD COLUMN `contenderId` INTEGER NULL,
    ADD COLUMN `variantKey` VARCHAR(128) NOT NULL DEFAULT 'default',
    ADD COLUMN `promptUsed` TEXT NULL,
    ADD COLUMN `settings` JSON NULL,
    ADD COLUMN `randomSelections` JSON NULL,
    MODIFY `botId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ChallengeSubmission_challengeId_contenderId_variantKey_key`
ON `ChallengeSubmission`(`challengeId`, `contenderId`, `variantKey`);

-- CreateIndex
CREATE INDEX `ChallengeSubmission_contenderId_fkey`
ON `ChallengeSubmission`(`contenderId`);

-- DropIndex
DROP INDEX `ChallengeSubmission_challengeId_botId_key`
ON `ChallengeSubmission`;

-- AddForeignKey
ALTER TABLE `Contender`
ADD CONSTRAINT `Contender_avatarImageId_fkey`
FOREIGN KEY (`avatarImageId`)
REFERENCES `ArtImage`(`id`)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChallengeSubmission`
ADD CONSTRAINT `ChallengeSubmission_contenderId_fkey`
FOREIGN KEY (`contenderId`)
REFERENCES `Contender`(`id`)
ON DELETE SET NULL
ON UPDATE CASCADE;
