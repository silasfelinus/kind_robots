/*
  Warnings:

  - You are about to drop the column `creatorId` on the `Pitch` table. All the data in the column will be lost.
  - You are about to drop the column `designer` on the `Pitch` table. All the data in the column will be lost.
  - You are about to drop the column `isOrphan` on the `Pitch` table. All the data in the column will be lost.
  - You are about to alter the column `title` on the `Pitch` table. The data in that column could be lost. The data in that column will be cast from `VarChar(764)` to `VarChar(256)`.

*/
-- AlterTable
ALTER TABLE `Pitch` DROP COLUMN `creatorId`,
    DROP COLUMN `designer`,
    DROP COLUMN `isOrphan`,
    ADD COLUMN `creator` VARCHAR(256) NULL,
    ADD COLUMN `playerId` INTEGER NULL DEFAULT 0,
    MODIFY `title` VARCHAR(256) NOT NULL,
    MODIFY `userId` INTEGER NULL DEFAULT 0,
    MODIFY `highlightImage` VARCHAR(256) NULL;

-- AddForeignKey
ALTER TABLE `Pitch` ADD CONSTRAINT `Pitch_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pitch` ADD CONSTRAINT `Pitch_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
