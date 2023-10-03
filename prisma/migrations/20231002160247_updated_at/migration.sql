-- AlterTable
ALTER TABLE `Art` ADD COLUMN `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `ArtPrompt` MODIFY `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `ArtReaction` MODIFY `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Bot` MODIFY `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Channel` MODIFY `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Gallery` MODIFY `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Game` MODIFY `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Media` MODIFY `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Message` MODIFY `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Milestone` MODIFY `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `MilestoneRecord` MODIFY `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Model` MODIFY `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Project` MODIFY `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Reaction` MODIFY `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Resource` MODIFY `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Reward` MODIFY `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Tag` MODIFY `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Todo` ADD COLUMN `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `TrainingData` MODIFY `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `updatedAt` DATETIME(3) NULL;
