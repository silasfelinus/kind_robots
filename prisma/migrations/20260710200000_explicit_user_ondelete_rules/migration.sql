-- DropForeignKey
ALTER TABLE `ArtCollection` DROP FOREIGN KEY `ArtCollection_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Character` DROP FOREIGN KEY `Character_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Code` DROP FOREIGN KEY `Code_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Dream` DROP FOREIGN KEY `Dream_userId_fkey`;

-- DropForeignKey
ALTER TABLE `ManaTransaction` DROP FOREIGN KEY `ManaTransaction_userId_fkey`;

-- DropForeignKey
ALTER TABLE `MilestoneRecord` DROP FOREIGN KEY `MilestoneRecord_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Reaction` DROP FOREIGN KEY `Reaction_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Scenario` DROP FOREIGN KEY `Scenario_userId_fkey`;

-- DropForeignKey
ALTER TABLE `SocialPost` DROP FOREIGN KEY `SocialPost_userId_fkey`;

-- DropForeignKey
ALTER TABLE `KarmaTransaction` DROP FOREIGN KEY `KarmaTransaction_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Referral` DROP FOREIGN KEY `Referral_referrerId_fkey`;

-- DropForeignKey
ALTER TABLE `Referral` DROP FOREIGN KEY `Referral_referredId_fkey`;

-- DropForeignKey
ALTER TABLE `UserRelation` DROP FOREIGN KEY `UserRelation_userId_fkey`;

-- DropForeignKey
ALTER TABLE `UserRelation` DROP FOREIGN KEY `UserRelation_relatedUserId_fkey`;

-- DropForeignKey
ALTER TABLE `Challenge` DROP FOREIGN KEY `Challenge_userId_fkey`;

-- AlterTable
ALTER TABLE `ArtCollection` MODIFY `userId` INTEGER NULL DEFAULT 10;

-- AlterTable
ALTER TABLE `Character` MODIFY `userId` INTEGER NULL DEFAULT 10;

-- AlterTable
ALTER TABLE `Code` MODIFY `userId` INTEGER NULL DEFAULT 10;

-- AlterTable
ALTER TABLE `Dream` MODIFY `userId` INTEGER NULL DEFAULT 10;

-- AlterTable
ALTER TABLE `Scenario` MODIFY `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `SocialPost` MODIFY `userId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Challenge` MODIFY `userId` INTEGER NULL DEFAULT 10;

-- AddForeignKey
ALTER TABLE `ArtCollection` ADD CONSTRAINT `ArtCollection_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Character` ADD CONSTRAINT `Character_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Code` ADD CONSTRAINT `Code_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dream` ADD CONSTRAINT `Dream_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ManaTransaction` ADD CONSTRAINT `ManaTransaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MilestoneRecord` ADD CONSTRAINT `MilestoneRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reaction` ADD CONSTRAINT `Reaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Scenario` ADD CONSTRAINT `Scenario_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SocialPost` ADD CONSTRAINT `SocialPost_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KarmaTransaction` ADD CONSTRAINT `KarmaTransaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_referrerId_fkey` FOREIGN KEY (`referrerId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_referredId_fkey` FOREIGN KEY (`referredId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRelation` ADD CONSTRAINT `UserRelation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserRelation` ADD CONSTRAINT `UserRelation_relatedUserId_fkey` FOREIGN KEY (`relatedUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Challenge` ADD CONSTRAINT `Challenge_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

