-- AlterTable
ALTER TABLE `MusicVideo` ADD COLUMN `isPublic` BOOLEAN NOT NULL DEFAULT true;

-- Videos made before the Play gallery were admin-only, so none of them was
-- ever chosen for public view: they start private and the owner flips each one.
UPDATE `MusicVideo` SET `isPublic` = false;

-- CreateIndex
CREATE INDEX `MusicVideo_isPublic_updatedAt_idx` ON `MusicVideo`(`isPublic`, `updatedAt`);
