-- DropForeignKey
ALTER TABLE `Player` DROP FOREIGN KEY `Player_gameId_fkey`;

-- AlterTable
ALTER TABLE `ArtPrompt` ADD COLUMN `playerId` INTEGER NULL,
    MODIFY `userId` INTEGER NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Player` ADD COLUMN `artId` INTEGER NULL,
    ADD COLUMN `avatarImage` VARCHAR(191) NULL,
    MODIFY `gameId` INTEGER NULL;

-- CreateTable
CREATE TABLE `_ArtToPlayer` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArtToPlayer_AB_unique`(`A`, `B`),
    INDEX `_ArtToPlayer_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ArtPrompt` ADD CONSTRAINT `ArtPrompt_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Player` ADD CONSTRAINT `Player_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `Game`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtToPlayer` ADD CONSTRAINT `_ArtToPlayer_A_fkey` FOREIGN KEY (`A`) REFERENCES `Art`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtToPlayer` ADD CONSTRAINT `_ArtToPlayer_B_fkey` FOREIGN KEY (`B`) REFERENCES `Player`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
