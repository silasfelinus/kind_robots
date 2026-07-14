-- AlterTable
ALTER TABLE `Reaction` ADD COLUMN `challengeSubmissionId` INTEGER NULL,
    MODIFY `reactionCategory` ENUM('ART_IMAGE', 'ART_COLLECTION', 'BOT', 'BUTTERFLY', 'CHALLENGE_SUBMISSION', 'CHARACTER', 'CHAT_EXCHANGE', 'COMPONENT', 'COMPOSITION', 'DREAM', 'MESSAGE', 'POST', 'PROMPT', 'RESOURCE', 'REWARD', 'SCENARIO', 'THEME') NOT NULL DEFAULT 'ART_IMAGE';

-- CreateTable
CREATE TABLE `Challenge` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(764) NOT NULL,
    `challengeType` ENUM('ART', 'TEXT', 'CHARACTER', 'SCENARIO', 'REASONING') NOT NULL,
    `difficulty` INTEGER NOT NULL DEFAULT 1,
    `promptText` TEXT NOT NULL,
    `judgeNotes` TEXT NULL,
    `status` ENUM('OPEN', 'JUDGING', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `isMature` BOOLEAN NOT NULL DEFAULT false,
    `userId` INTEGER NOT NULL DEFAULT 10,

    UNIQUE INDEX `Challenge_slug_key`(`slug`),
    INDEX `Challenge_userId_fkey`(`userId`),
    INDEX `Challenge_status_idx`(`status`),
    INDEX `Challenge_challengeType_idx`(`challengeType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChallengeSubmission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `challengeId` INTEGER NOT NULL,
    `botId` INTEGER NOT NULL,
    `agentModel` VARCHAR(256) NULL,
    `outputText` TEXT NULL,
    `artImageId` INTEGER NULL,
    `characterId` INTEGER NULL,
    `scenarioId` INTEGER NULL,
    `status` ENUM('PENDING', 'READY', 'DISQUALIFIED') NOT NULL DEFAULT 'READY',

    INDEX `ChallengeSubmission_botId_fkey`(`botId`),
    INDEX `ChallengeSubmission_artImageId_fkey`(`artImageId`),
    INDEX `ChallengeSubmission_characterId_fkey`(`characterId`),
    INDEX `ChallengeSubmission_scenarioId_fkey`(`scenarioId`),
    UNIQUE INDEX `ChallengeSubmission_challengeId_botId_key`(`challengeId`, `botId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Reaction_challengeSubmissionId_idx` ON `Reaction`(`challengeSubmissionId`);

-- CreateIndex
CREATE UNIQUE INDEX `Reaction_userId_challengeSubmissionId_key` ON `Reaction`(`userId`, `challengeSubmissionId`);

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_challengeSubmissionId_fkey` FOREIGN KEY (`challengeSubmissionId`) REFERENCES `ChallengeSubmission`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Challenge` ADD CONSTRAINT `Challenge_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChallengeSubmission` ADD CONSTRAINT `ChallengeSubmission_challengeId_fkey` FOREIGN KEY (`challengeId`) REFERENCES `Challenge`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChallengeSubmission` ADD CONSTRAINT `ChallengeSubmission_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChallengeSubmission` ADD CONSTRAINT `ChallengeSubmission_artImageId_fkey` FOREIGN KEY (`artImageId`) REFERENCES `ArtImage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChallengeSubmission` ADD CONSTRAINT `ChallengeSubmission_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChallengeSubmission` ADD CONSTRAINT `ChallengeSubmission_scenarioId_fkey` FOREIGN KEY (`scenarioId`) REFERENCES `Scenario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

