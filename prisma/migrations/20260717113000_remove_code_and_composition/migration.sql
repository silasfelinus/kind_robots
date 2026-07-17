-- DropForeignKey
ALTER TABLE `Reaction` DROP FOREIGN KEY `Reaction_compositionId_fkey`;

-- DropIndex
DROP INDEX `Reaction_compositionId_idx` ON `Reaction`;

-- AlterTable
ALTER TABLE `Reaction` DROP COLUMN `compositionId`,
    MODIFY `reactionCategory` ENUM('ART_IMAGE', 'ART_COLLECTION', 'BOT', 'BUTTERFLY', 'CHALLENGE_SUBMISSION', 'CHARACTER', 'CHAT_EXCHANGE', 'COMPONENT', 'DREAM', 'FACET', 'PROJECT', 'MESSAGE', 'POST', 'PROMPT', 'RESOURCE', 'REWARD', 'SCENARIO', 'THEME') NOT NULL DEFAULT 'ART_IMAGE';

-- DropTable
DROP TABLE `Composition`;

-- DropTable
DROP TABLE `Code`;
