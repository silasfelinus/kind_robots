/*
  Warnings:

  - You are about to alter the column `dreamType` on the `Dream` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(6))` to `Enum(EnumId(7))`.

*/
-- AlterTable
ALTER TABLE `Dream` MODIFY `dreamType` ENUM('ART', 'BRAINSTORM', 'PROMPTBOT', 'NARRATOR', 'CHARACTER', 'REWARD', 'SCENARIO', 'LOCATION', 'PITCH', 'GENRE') NOT NULL DEFAULT 'PITCH';

-- CreateTable
CREATE TABLE `DreamRelation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fromDreamId` INTEGER NOT NULL,
    `toDreamId` INTEGER NOT NULL,
    `relationType` ENUM('IS_A', 'APPEARS_IN', 'CONTAINS', 'RELATED', 'INSPIRED_BY') NOT NULL DEFAULT 'RELATED',
    `note` VARCHAR(512) NULL,

    INDEX `DreamRelation_fromDreamId_idx`(`fromDreamId`),
    INDEX `DreamRelation_toDreamId_idx`(`toDreamId`),
    INDEX `DreamRelation_relationType_idx`(`relationType`),
    UNIQUE INDEX `DreamRelation_fromDreamId_toDreamId_relationType_key`(`fromDreamId`, `toDreamId`, `relationType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DreamRelation` ADD CONSTRAINT `DreamRelation_fromDreamId_fkey` FOREIGN KEY (`fromDreamId`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DreamRelation` ADD CONSTRAINT `DreamRelation_toDreamId_fkey` FOREIGN KEY (`toDreamId`) REFERENCES `Dream`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
