-- CreateTable
CREATE TABLE `_CharacterToDream` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_CharacterToDream_AB_unique`(`A`, `B`),
    INDEX `_CharacterToDream_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_DreamToReward` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_DreamToReward_AB_unique`(`A`, `B`),
    INDEX `_DreamToReward_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_CharacterToDream` ADD CONSTRAINT `_CharacterToDream_A_fkey` FOREIGN KEY (`A`) REFERENCES `Character`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CharacterToDream` ADD CONSTRAINT `_CharacterToDream_B_fkey` FOREIGN KEY (`B`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToReward` ADD CONSTRAINT `_DreamToReward_A_fkey` FOREIGN KEY (`A`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DreamToReward` ADD CONSTRAINT `_DreamToReward_B_fkey` FOREIGN KEY (`B`) REFERENCES `Reward`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
