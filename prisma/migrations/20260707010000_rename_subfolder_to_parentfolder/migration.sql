-- Rename ArtCollection.subFolder -> parentFolder (clearer: it's the parent
-- path, slug is the leaf). Applied after the add-subFolder migration.

-- AlterTable
ALTER TABLE `ArtCollection` CHANGE COLUMN `subFolder` `parentFolder` VARCHAR(512) NULL;
