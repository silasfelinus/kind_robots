/*
  Warnings:

  - The primary key for the `_ArtToTag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_ArtToTag` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `_ArtToTag` DROP PRIMARY KEY;

-- CreateIndex
CREATE UNIQUE INDEX `_ArtToTag_AB_unique` ON `_ArtToTag`(`A`, `B`);

-- AddForeignKey
ALTER TABLE `_ArtToTag` ADD CONSTRAINT `_ArtToTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `Art`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ArtToTag` ADD CONSTRAINT `_ArtToTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
