/*
  Warnings:

  - You are about to drop the column `commands` on the `Blueprint` table. All the data in the column will be lost.
  - Added the required column `steps` to the `Blueprint` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Blueprint` DROP COLUMN `commands`,
    ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `isMature` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isPublic` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `steps` JSON NOT NULL;

-- CreateTable
CREATE TABLE `_BlueprintToTag` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_BlueprintToTag_AB_unique`(`A`, `B`),
    INDEX `_BlueprintToTag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_BlueprintToTag` ADD CONSTRAINT `_BlueprintToTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `Blueprint`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BlueprintToTag` ADD CONSTRAINT `_BlueprintToTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
