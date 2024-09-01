/*
  Warnings:

  - You are about to drop the column `isOrphan` on the `Art` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Art` DROP COLUMN `isOrphan`,
    MODIFY `galleryId` INTEGER NULL DEFAULT 1,
    ALTER COLUMN `artPromptId` DROP DEFAULT,
    ALTER COLUMN `userId` DROP DEFAULT,
    ALTER COLUMN `pitchId` DROP DEFAULT,
    MODIFY `channelId` INTEGER NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `Pitch` MODIFY `userId` INTEGER NULL DEFAULT 1,
    MODIFY `channelId` INTEGER NULL DEFAULT 1,
    ALTER COLUMN `playerId` DROP DEFAULT;

-- CreateTable
CREATE TABLE `_ArtToUser` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ArtToUser_AB_unique`(`A`, `B`),
    INDEX `_ArtToUser_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_ArtToUser` ADD CONSTRAINT `_ArtToUser_A_fkey` FOREIGN KEY (`A`) REFERENCES `Art`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtToUser` ADD CONSTRAINT `_ArtToUser_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
