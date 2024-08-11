-- AlterTable
ALTER TABLE `Art` MODIFY `isOrphan` BOOLEAN NULL DEFAULT false,
    MODIFY `isPublic` BOOLEAN NULL DEFAULT false,
    MODIFY `isMature` BOOLEAN NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Bot` MODIFY `isPublic` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `underConstruction` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `canDelete` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `ChatExchange` MODIFY `liked` BOOLEAN NULL DEFAULT false,
    MODIFY `hated` BOOLEAN NULL DEFAULT false,
    MODIFY `loved` BOOLEAN NULL DEFAULT false,
    MODIFY `flagged` BOOLEAN NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Gallery` MODIFY `isMature` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Milestone` MODIFY `isRepeatable` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `isActive` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Pitch` MODIFY `isPublic` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `isOrphan` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `isMature` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Post` MODIFY `isFavorite` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Resource` MODIFY `isMature` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Tag` MODIFY `isPublic` BOOLEAN NULL DEFAULT false,
    MODIFY `isMature` BOOLEAN NOT NULL DEFAULT false;
