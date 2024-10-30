/*
  Warnings:

  - A unique constraint covering the columns `[botId]` on the table `ArtImage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[channelId]` on the table `ArtImage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[chatExchangeId]` on the table `ArtImage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[componentId]` on the table `ArtImage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[messageId]` on the table `ArtImage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[milestoneId]` on the table `ArtImage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pitchId]` on the table `ArtImage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[postId]` on the table `ArtImage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[promptId]` on the table `ArtImage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reactionId]` on the table `ArtImage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resourceId]` on the table `ArtImage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[rewardId]` on the table `ArtImage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tagId]` on the table `ArtImage` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `ArtImage` MODIFY `userId` INTEGER NULL DEFAULT 10;

-- CreateIndex
CREATE UNIQUE INDEX `ArtImage_botId_key` ON `ArtImage`(`botId`);

-- CreateIndex
CREATE UNIQUE INDEX `ArtImage_channelId_key` ON `ArtImage`(`channelId`);

-- CreateIndex
CREATE UNIQUE INDEX `ArtImage_chatExchangeId_key` ON `ArtImage`(`chatExchangeId`);

-- CreateIndex
CREATE UNIQUE INDEX `ArtImage_componentId_key` ON `ArtImage`(`componentId`);

-- CreateIndex
CREATE UNIQUE INDEX `ArtImage_messageId_key` ON `ArtImage`(`messageId`);

-- CreateIndex
CREATE UNIQUE INDEX `ArtImage_milestoneId_key` ON `ArtImage`(`milestoneId`);

-- CreateIndex
CREATE UNIQUE INDEX `ArtImage_pitchId_key` ON `ArtImage`(`pitchId`);

-- CreateIndex
CREATE UNIQUE INDEX `ArtImage_postId_key` ON `ArtImage`(`postId`);

-- CreateIndex
CREATE UNIQUE INDEX `ArtImage_promptId_key` ON `ArtImage`(`promptId`);

-- CreateIndex
CREATE UNIQUE INDEX `ArtImage_reactionId_key` ON `ArtImage`(`reactionId`);

-- CreateIndex
CREATE UNIQUE INDEX `ArtImage_resourceId_key` ON `ArtImage`(`resourceId`);

-- CreateIndex
CREATE UNIQUE INDEX `ArtImage_rewardId_key` ON `ArtImage`(`rewardId`);

-- CreateIndex
CREATE UNIQUE INDEX `ArtImage_tagId_key` ON `ArtImage`(`tagId`);

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_botId_fkey` FOREIGN KEY (`botId`) REFERENCES `Bot`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_chatExchangeId_fkey` FOREIGN KEY (`chatExchangeId`) REFERENCES `ChatExchange`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `Component`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `Message`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_milestoneId_fkey` FOREIGN KEY (`milestoneId`) REFERENCES `Milestone`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_pitchId_fkey` FOREIGN KEY (`pitchId`) REFERENCES `Pitch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_promptId_fkey` FOREIGN KEY (`promptId`) REFERENCES `Prompt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_reactionId_fkey` FOREIGN KEY (`reactionId`) REFERENCES `Reaction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `Resource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_rewardId_fkey` FOREIGN KEY (`rewardId`) REFERENCES `Reward`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtImage` ADD CONSTRAINT `ArtImage_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
