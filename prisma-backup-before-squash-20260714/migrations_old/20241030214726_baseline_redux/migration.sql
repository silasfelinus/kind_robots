/*
  Warnings:

  - You are about to drop the column `hasArtImage` on the `Art` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Art` DROP COLUMN `hasArtImage`;

-- AlterTable
ALTER TABLE `ArtImage` ADD COLUMN `botId` INTEGER NULL,
    ADD COLUMN `channelId` INTEGER NULL,
    ADD COLUMN `chatExchangeId` INTEGER NULL,
    ADD COLUMN `componentId` INTEGER NULL,
    ADD COLUMN `messageId` INTEGER NULL,
    ADD COLUMN `milestoneId` INTEGER NULL,
    ADD COLUMN `pitchId` INTEGER NULL,
    ADD COLUMN `postId` INTEGER NULL,
    ADD COLUMN `promptId` INTEGER NULL,
    ADD COLUMN `reactionId` INTEGER NULL,
    ADD COLUMN `resourceId` INTEGER NULL,
    ADD COLUMN `rewardId` INTEGER NULL,
    ADD COLUMN `tagId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Bot` ADD COLUMN `artImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Channel` ADD COLUMN `artImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `ChatExchange` ADD COLUMN `artImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Component` ADD COLUMN `artImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Message` ADD COLUMN `artImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Milestone` ADD COLUMN `artImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Pitch` ADD COLUMN `artImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Post` ADD COLUMN `artImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Prompt` ADD COLUMN `artImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Reaction` ADD COLUMN `artImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Resource` ADD COLUMN `artImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Reward` ADD COLUMN `artImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Tag` ADD COLUMN `artImageId` INTEGER NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `artImageId` INTEGER NULL;
