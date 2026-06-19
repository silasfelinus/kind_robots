-- AlterTable
ALTER TABLE `Bot` ADD COLUMN `forgeIntro` TEXT NULL,
    ADD COLUMN `narrativeVoice` TEXT NULL;

-- CreateTable
CREATE TABLE `_BotToDream` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_BotToDream_AB_unique`(`A`, `B`),
    INDEX `_BotToDream_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_BotToDream` ADD CONSTRAINT `_BotToDream_A_fkey` FOREIGN KEY (`A`) REFERENCES `Bot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BotToDream` ADD CONSTRAINT `_BotToDream_B_fkey` FOREIGN KEY (`B`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
