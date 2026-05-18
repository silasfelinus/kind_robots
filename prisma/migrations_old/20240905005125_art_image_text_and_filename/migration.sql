-- AlterTable
ALTER TABLE `ArtImage` ADD COLUMN `fileName` VARCHAR(764) NULL,
    MODIFY `imageData` TEXT NOT NULL;
