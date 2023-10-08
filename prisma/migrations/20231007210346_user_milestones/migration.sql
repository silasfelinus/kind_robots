-- AlterTable
ALTER TABLE `User` MODIFY `mana` INTEGER NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `_MilestoneToUser` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_MilestoneToUser_AB_unique`(`A`, `B`),
    INDEX `_MilestoneToUser_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_MilestoneToUser` ADD CONSTRAINT `_MilestoneToUser_A_fkey` FOREIGN KEY (`A`) REFERENCES `Milestone`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_MilestoneToUser` ADD CONSTRAINT `_MilestoneToUser_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
